#!/usr/bin/env python3
"""Offline regression checks for the actual adapter and importable graph."""
from copy import deepcopy
from datetime import date
import json
from unittest import TestCase, main
from ashby_adapter import collect, Fixture, HERE, validate_config

DAY = date(2026, 11, 2)
CONFIG = json.loads((HERE/'config.example.json').read_text())
PAGES = json.loads((HERE/'fixtures/ashby-pages.json').read_text())
JOB = CONFIG['roles'][0]['job_id']
APP = PAGES['application.list'][JOB]['start']['results'][0]['id']


class AdapterChecks(TestCase):
    def test_paginated_aggregate_and_empty_roles(self):
        calls = []
        def fetch(endpoint, body):
            calls.append((endpoint, body))
            return Fixture(PAGES)(endpoint, body)
        active, quiet, recent = collect(CONFIG, DAY, fetch)['roles']
        stage = active['stages'][0]
        self.assertEqual((active['applications_scanned'],stage['exits'],stage['advanced'],stage['median_dwell_hours']), (5,4,1,48))
        self.assertEqual((active['hires'],active['mean_hire_days']), (1,59))
        self.assertEqual([r['weekly_movement_events'] for r in (quiet,recent)], [0,0])
        self.assertTrue(any(b['cursor']=='apps-2' for _,b in calls))
        self.assertTrue(any(b['cursor']=='history-2' for _,b in calls))
        self.assertFalse(any('syncToken' in b for _,b in calls))
        self.assertEqual(len(calls), 10)

    def test_bad_page_aborts_collection(self):
        for change in [{'success':False},{'nextCursor':None},{'nextCursor':'start'},{'moreDataAvailable':'true'}]:
            pages=deepcopy(PAGES); pages['application.list'][JOB]['start'].update(change)
            with self.subTest(change=change),self.assertRaises(ValueError): collect(CONFIG,DAY,Fixture(pages))

    def test_duplicate_app_does_not_inflate_denominator(self):
        pages=deepcopy(PAGES)
        pages['application.list'][JOB]['apps-2']['results'].append(pages['application.list'][JOB]['start']['results'][0])
        with self.assertRaisesRegex(ValueError,'Duplicate application'): collect(CONFIG,DAY,Fixture(pages))

    def test_response_from_wrong_job_is_rejected(self):
        pages=deepcopy(PAGES);pages['application.list'][JOB]['start']['results'][0]['job']['id']='wrong'
        with self.assertRaisesRegex(ValueError,'different watched job'): collect(CONFIG,DAY,Fixture(pages))

    def test_conflicting_history_is_not_treated_as_no_activity(self):
        pages=deepcopy(PAGES);pages['application.listHistory'][APP]['history-2']['results'][0]['stageNumber']=0
        with self.assertRaisesRegex(ValueError,'duplicate history order'): collect(CONFIG,DAY,Fixture(pages))

    def test_nonzero_order_terminal_exit_and_numbering_gap(self):
        pages=deepcopy(PAGES)
        for name in ('start','history-2'):
            pages['application.listHistory'][APP][name]['results'][0]['stageNumber'] += 4
        stage=lambda: collect(CONFIG,DAY,Fixture(pages))['roles'][0]['stages'][0]
        self.assertEqual((stage()['exits'],stage()['advanced']),(4,1))
        pages['application.listHistory'][APP]['history-2']['results'][0]['stageNumber'] += 1
        self.assertEqual((stage()['exits'],stage()['advanced']),(3,0))
        pages['application.listHistory'][APP]['history-2']['results']=[]
        self.assertEqual((stage()['exits'],stage()['advanced']),(3,0))

    def test_right_boundary_is_exclusive(self):
        pages=deepcopy(PAGES)
        pages['application.listHistory'][APP]['start']['results'][0]['leftStageAt']='2026-11-02T00:00:00Z'
        pages['application.listHistory'][APP]['history-2']['results'][0]['enteredStageAt']='2026-11-02T00:00:00Z'
        row=collect(CONFIG,DAY,Fixture(pages))['roles'][0]['stages'][0]
        self.assertEqual((row['exits'],row['advanced']), (3,0))

    def test_first_hire_requires_complete_prefix(self):
        pages=deepcopy(PAGES)
        hire_app=pages['application.list'][JOB]['apps-2']['results'][-1]['id']
        pages['application.listHistory'][hire_app]['start']['results'][0]['stageNumber']=8
        row=collect(CONFIG,DAY,Fixture(pages))['roles'][0]
        self.assertEqual((row['hires'],row['mean_hire_days']),(0,None))

    def test_missing_or_stale_reference_fails_before_fetching(self):
        bad=deepcopy(CONFIG);bad['roles'][0]['reference_updated_on']='2026-08-01'
        with self.assertRaisesRegex(ValueError,'Refresh reference'): validate_config(bad,DAY)
        bad=deepcopy(CONFIG);bad['roles'][0]['stages'][0]['reference_sd']=float('nan')
        with self.assertRaisesRegex(ValueError,'reference_sd'):validate_config(bad,DAY)

    def test_aggregate_serialization_drops_application_and_candidate_identifiers(self):
        pages=deepcopy(PAGES)
        pages['application.list'][JOB]['start']['results'][0]['candidate']={'name':'SYNTHETIC NAME','email':'fixture@example.invalid'}
        result=json.dumps(collect(CONFIG,DAY,Fixture(pages)))
        for text in (APP,'SYNTHETIC NAME','fixture@example.invalid','candidate','enteredStageAt'):
            self.assertNotIn(text,result)

    def test_integer_counts_fail_before_snapshot_storage(self):
        for key in ['min_weekly_hires','reference_days','min_daily_exits']:
            for bad_value in (1.5, True, '3', 2147483648):
                config=deepcopy(CONFIG)
                target=config['roles'][0] if key=='min_weekly_hires' else config['roles'][0]['stages'][0]
                target[key]=bad_value
                with self.subTest(key=key,value=bad_value),self.assertRaisesRegex(ValueError,'Invalid integer'):
                    validate_config(config,DAY)

    def test_export_routes_both_schedules_through_shared_claim(self):
        flow=json.loads((HERE/'hiring-funnel-anomaly-n8n.json').read_text());nodes={n['name']:n for n in flow['nodes']}
        self.assertFalse(flow['active']);self.assertEqual(flow['settings']['timezone'],'UTC')
        def trace(name):
            edges=flow['connections'].get(name,{}).get('main',[[]])[0]
            return [name]+(trace(edges[0]['node']) if edges else [])
        for name in ['Stage detector at 02 UTC','Hire trend at 03 UTC','Drain outbox every 15 minutes']:
            path=trace(name)
            self.assertEqual(path[path.index('Claim one pending alert'):],['Claim one pending alert','Check channel configuration','Claude aggregate explanation','Prepare Slack message','Record send attempt','Post Slack message','Persist Slack acknowledgement','Check delivery state'])
        self.assertEqual(nodes['Claude aggregate explanation']['parameters']['genericAuthType'],'httpHeaderAuth')
        self.assertEqual(nodes['Post Slack message']['parameters']['url'],'https://slack.com/api/chat.postMessage')


if __name__=='__main__': main(verbosity=2)
