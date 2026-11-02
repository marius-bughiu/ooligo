-- Run once in your own PostgreSQL database, then bind the n8n credential to it.
BEGIN;
CREATE SCHEMA IF NOT EXISTS hfa;
CREATE TABLE IF NOT EXISTS hfa.snapshots (
  as_of date PRIMARY KEY,
  payload jsonb NOT NULL,
  loaded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS hfa.alerts (
  alert_key text PRIMARY KEY,
  as_of date NOT NULL REFERENCES hfa.snapshots(as_of),
  payload jsonb NOT NULL,
  route text NOT NULL CHECK (route IN ('stage','leadership')),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','leased','sending','delivered','failed','uncertain')),
  attempts integer NOT NULL DEFAULT 0,
  lease_token text, lease_until timestamptz, slack_channel text, slack_ts text, last_error text
);

CREATE OR REPLACE FUNCTION hfa.store_snapshot(p jsonb) RETURNS date LANGUAGE plpgsql AS $$
DECLARE d date := (p->>'as_of')::date;
BEGIN
  IF d IS NULL OR p->>'version' IS DISTINCT FROM '1' OR jsonb_typeof(p->'roles') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p->'roles')=0 THEN RAISE EXCEPTION 'Invalid snapshot'; END IF;
  INSERT INTO hfa.snapshots(as_of,payload) VALUES(d,p) ON CONFLICT DO NOTHING;
  IF (SELECT payload FROM hfa.snapshots WHERE as_of=d) IS DISTINCT FROM p THEN
    RAISE EXCEPTION 'A different snapshot already exists for %; review before changing recorded evidence', d;
  END IF;
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION hfa.require_snapshot(d date) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE p jsonb;
BEGIN
  SELECT payload INTO p FROM hfa.snapshots WHERE as_of=d;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing complete UTC snapshot for %',d; END IF;
  RETURN p;
END $$;

CREATE OR REPLACE FUNCTION hfa.enqueue(d date,r jsonb,s jsonb,kind text,reading numeric,reference numeric,unit text,n integer,channel_kind text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE inserted integer;
BEGIN
  INSERT INTO hfa.alerts(alert_key,as_of,payload,route) VALUES(
    jsonb_build_array(d,r->>'job_id',s->>'stage_id',kind)::text,d,
    jsonb_build_object('as_of',d,'role',r->>'label','stage',s->>'label','kind',kind,
                       'observed',reading,'reference',reference,'unit',unit,'sample_size',n),channel_kind)
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END $$;

CREATE OR REPLACE FUNCTION hfa.detect_stages(d date) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE r jsonb; s jsonb; n integer; rate numeric; total integer := 0;
BEGIN
  FOR r IN SELECT value FROM jsonb_array_elements(hfa.require_snapshot(d)->'roles') LOOP
    IF d-(r->>'monitor_since')::date >= 7 AND (r->>'weekly_movement_events')::int=0 THEN
      total := total + hfa.enqueue(d,r,NULL,'role_no_movement',0,NULL,'movement events in 7 days',
                                   (r->>'applications_scanned')::int,'leadership');
    END IF;
    FOR s IN SELECT value FROM jsonb_array_elements(r->'stages') LOOP
      n := (s->>'exits')::int;
      IF n < (s->>'min_daily_exits')::int THEN CONTINUE; END IF;
      rate := (s->>'advanced')::numeric/n;
      IF (s->>'reference_days')::int >= 20 AND (s->>'reference_sd')::numeric > 0 AND
         rate <= (s->>'reference_mean')::numeric - 2*(s->>'reference_sd')::numeric THEN
        total := total + hfa.enqueue(d,r,s,'stage_conversion_drop',rate,(s->>'reference_mean')::numeric,'fraction',n,'stage');
      END IF;
      IF (s->>'median_dwell_hours')::numeric > 1.5*(s->>'dwell_limit_hours')::numeric THEN
        total := total + hfa.enqueue(d,r,s,'completed_stage_dwell', (s->>'median_dwell_hours')::numeric,
                                     (s->>'dwell_limit_hours')::numeric,'hours',n,'stage');
      END IF;
    END LOOP;
  END LOOP;
  RETURN total;
END $$;

CREATE OR REPLACE FUNCTION hfa.detect_tth(d date) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE r jsonb; total integer := 0;
BEGIN
  FOR r IN SELECT value FROM jsonb_array_elements(hfa.require_snapshot(d)->'roles') LOOP
    IF (r->>'hires')::int >= (r->>'min_weekly_hires')::int AND
       (r->>'mean_hire_days')::numeric > (r->>'tth_limit_days')::numeric THEN
      total := total + hfa.enqueue(d,r,NULL,'time_to_hire_trend', (r->>'mean_hire_days')::numeric,
                                   (r->>'tth_limit_days')::numeric,'days',(r->>'hires')::int,'leadership');
    END IF;
  END LOOP;
  RETURN total;
END $$;

CREATE OR REPLACE FUNCTION hfa.claim_pending(token text) RETURNS SETOF hfa.alerts LANGUAGE plpgsql AS $$
BEGIN
  IF NULLIF(token,'') IS NULL THEN RAISE EXCEPTION 'Missing execution token'; END IF;
  -- A Slack request could already have been accepted. Never automatically repost it.
  UPDATE hfa.alerts SET state='uncertain',last_error='No definitive Slack response recorded'
    WHERE state='sending' AND lease_until <= clock_timestamp();
  UPDATE hfa.alerts SET state='failed',last_error='Three pre-send leases expired; inspect before retrying'
    WHERE state='leased' AND attempts>=3 AND lease_until<=clock_timestamp();
  RETURN QUERY WITH picked AS (
    SELECT a.alert_key FROM hfa.alerts a WHERE a.state='pending' OR (a.state='leased' AND a.lease_until<=clock_timestamp())
    ORDER BY a.as_of,a.alert_key LIMIT 1 FOR UPDATE SKIP LOCKED
  ) UPDATE hfa.alerts a SET state='leased',lease_token=token,lease_until=clock_timestamp()+interval '15 minutes',
      attempts=a.attempts+1 FROM picked WHERE a.alert_key=picked.alert_key RETURNING a.*;
END $$;

CREATE OR REPLACE FUNCTION hfa.begin_send(k text,token text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  UPDATE hfa.alerts SET state='sending',lease_until=clock_timestamp()+interval '15 minutes'
    WHERE alert_key=k AND state='leased' AND lease_token=token AND lease_until>clock_timestamp();
  IF NOT FOUND THEN RAISE EXCEPTION 'Alert lease expired or was superseded'; END IF;
  RETURN k;
END $$;

CREATE OR REPLACE FUNCTION hfa.finish_send(k text,token text,response jsonb) RETURNS text LANGUAGE plpgsql AS $$
DECLARE outcome text;
BEGIN
  outcome := CASE WHEN response->'ok'='true'::jsonb AND NULLIF(response->>'ts','') IS NOT NULL
                    AND NULLIF(response->>'channel','') IS NOT NULL THEN 'delivered'
                  WHEN response->'ok'='false'::jsonb AND response->>'error' IN
                       ('channel_not_found','not_in_channel','invalid_auth','missing_scope','no_text','msg_too_long') THEN 'failed'
                  ELSE 'uncertain' END;
  UPDATE hfa.alerts SET state=outcome,slack_ts=response->>'ts',slack_channel=response->>'channel',
    last_error=CASE WHEN outcome='delivered' THEN NULL ELSE coalesce(response->>'error','Unrecognized Slack response') END
    WHERE alert_key=k AND state IN ('sending','uncertain') AND lease_token=token;
  IF NOT FOUND THEN RAISE EXCEPTION 'No matching send attempt'; END IF;
  RETURN outcome;
END $$;
COMMIT;
