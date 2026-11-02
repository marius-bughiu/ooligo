// Run the actual shipped SQL in a disposable in-memory PostgreSQL engine.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { PGlite } = await import(process.env.HFA_PGLITE_MODULE || '@electric-sql/pglite');
const root = fileURLToPath(new URL('.', import.meta.url));
const oneAlert = process.argv.includes('--one-alert');
const config = oneAlert ? 'fixtures/one-alert-config.json' : 'config.example.json';
const day = '2026-11-02';
const adapterOutput = execFileSync('python3', [
  '-B', 'ashby_adapter.py', '--config', config, '--fixture', 'fixtures/ashby-pages.json', '--as-of', day,
], { cwd: root, encoding: 'utf8' });
const snapshot = JSON.parse(adapterOutput);
const db = new PGlite();

async function rows(sql, params = []) {
  return (await db.query(sql, params)).rows;
}
async function scalar(sql, params = []) {
  const [row] = await rows(sql, params);
  return Object.values(row)[0];
}
async function store(data) {
  return scalar('SELECT hfa.store_snapshot($1::jsonb)', [JSON.stringify(data)]);
}
async function stage(date = day) {
  return scalar('SELECT hfa.detect_stages($1)', [date]);
}
async function hire(date = day) {
  return scalar('SELECT hfa.detect_tth($1)', [date]);
}
async function claim(token) {
  const [alert] = await rows('SELECT * FROM hfa.claim_pending($1)', [token]);
  return alert;
}
async function begin(alert, token) {
  return scalar('SELECT hfa.begin_send($1,$2)', [alert.alert_key, token]);
}
async function finish(alert, token, response) {
  return scalar('SELECT hfa.finish_send($1,$2,$3::jsonb)', [alert.alert_key, token, JSON.stringify(response)]);
}
async function expire(alert) {
  await rows("UPDATE hfa.alerts SET lease_until=clock_timestamp()-interval '1 minute' WHERE alert_key=$1", [alert.alert_key]);
}

async function checkOneAlert() {
  await store(snapshot);
  const first = { stage: await stage(), hire: await hire() };
  const replay = { stage: await stage(), hire: await hire() };
  const stored = await rows("SELECT payload->>'kind' AS kind,state FROM hfa.alerts");
  assert.deepEqual(first, { stage: 1, hire: 0 });
  assert.deepEqual(replay, { stage: 0, hire: 0 });
  assert.deepEqual(stored, [{ kind: 'role_no_movement', state: 'pending' }]);
  console.log(JSON.stringify({ first, replay, stored }, null, 2));
}

async function checkDetectors() {
  await assert.rejects(stage(), /Missing complete UTC snapshot/);
  await store(snapshot);
  await store(snapshot);
  await assert.rejects(store({ ...snapshot, roles: [] }), /Invalid snapshot/);
  await assert.rejects(store({ ...snapshot, roles: snapshot.roles.slice(0, 1) }), /different snapshot/);

  // The 03:00 branch runs first to prove it needs no stage-node results.
  assert.equal(await hire(), 1);
  assert.equal(await stage(), 3);
  assert.equal(await hire(), 0);
  assert.equal(await stage(), 0);
  const alerts = await rows("SELECT payload FROM hfa.alerts ORDER BY payload->>'kind'");
  const expected = JSON.parse(readFileSync(new URL('fixtures/expected-alerts.json', import.meta.url), 'utf8'));
  assert.deepEqual(alerts.map(row => row.payload), expected);

  const control = structuredClone(snapshot);
  control.as_of = '2026-11-03';
  control.roles = [control.roles[0]];
  control.roles[0].stages[0].reference_days = 1;
  control.roles[0].stages[0].median_dwell_hours = 36;
  control.roles[0].min_weekly_hires = 2;
  await store(control);
  assert.equal(await stage(control.as_of), 0);
  assert.equal(await hire(control.as_of), 0);
  console.log('PASS snapshot immutability, independent detectors, four exact payloads, sample gates and replay');
}

async function checkOutbox() {
  const a = await claim('execution-a');
  const b = await claim('execution-b');
  assert.notEqual(a.alert_key, b.alert_key);
  await assert.rejects(begin(a, 'wrong-owner'), /lease expired or was superseded/);

  await begin(a, 'execution-a');
  assert.equal(await finish(a, 'execution-a', { ok: true, channel: 'C000', ts: '1.25' }), 'delivered');
  await begin(b, 'execution-b');
  assert.equal(await finish(b, 'execution-b', { ok: false, error: 'channel_not_found' }), 'failed');

  // A crash before the send boundary allows a new lease; the old owner loses it.
  const c = await claim('before-crash');
  await expire(c);
  const retry = await claim('retry');
  assert.equal(retry.alert_key, c.alert_key);
  await assert.rejects(begin(c, 'before-crash'), /lease expired or was superseded/);

  // After send begins, an expired lease is uncertain and cannot be reposted automatically.
  await begin(retry, 'retry');
  await expire(retry);
  const d = await claim('execution-d');
  assert.notEqual(d.alert_key, c.alert_key);
  assert.equal(await scalar('SELECT state FROM hfa.alerts WHERE alert_key=$1', [c.alert_key]), 'uncertain');
  await begin(d, 'execution-d');
  assert.equal(await finish(d, 'execution-d', { ok: false, error: 'internal_error' }), 'uncertain');
  assert.equal(await claim('again'), undefined);

  // Slack documents partial success for fatal/internal errors. Unknown errors and malformed acks also stay held.
  const ambiguous = [{ ok: false, error: 'fatal_error' }, { ok: false, error: 'unknown_error' }, { ok: true }];
  for (const [i, response] of ambiguous.entries()) {
    const token = `ambiguous-${i}`;
    await scalar("SELECT hfa.enqueue($1,$2::jsonb,NULL,$3,0,NULL,'test',1,'stage')", [day, snapshot.roles[0], token]);
    const alert = await claim(token);
    await begin(alert, token);
    assert.equal(await finish(alert, token, response), 'uncertain');
    assert.equal(await claim('new-attempt'), undefined);
  }
  console.log('PASS exclusive claims, safe pre-send retry, confirmed Slack ack, known rejection, held uncertain outcomes');
}

try {
  await db.exec(readFileSync(new URL('schema.sql', import.meta.url), 'utf8'));
  if (oneAlert) {
    await checkOneAlert();
  } else {
    await checkDetectors();
    await checkOutbox();
  }
  console.log('PostgreSQL engine:', await scalar('SELECT version()'));
} finally {
  await db.close();
}
