#!/usr/bin/env python3
"""Make one complete UTC recruiting snapshot from Ashby or the bundled synthetic pages."""
import argparse
import base64
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
import json
import math
import os
from pathlib import Path
from statistics import median
import subprocess
import sys
from urllib import error, request
from uuid import UUID

HERE = Path(__file__).resolve().parent
UTC = timezone.utc


def require(condition, message):
    if not condition:
        raise ValueError(message)


def stamp(value):
    require(isinstance(value, str), 'Timestamp must be a string')
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    require(result.utcoffset() is not None, 'Timestamp requires a UTC offset')
    return result.astimezone(UTC)


def number(row, key, low, high=None):
    value = row[key]
    require(type(value) in (int, float) and math.isfinite(value) and value >= low and
            (high is None or value <= high), f'Invalid {key}')


def count(row, key, minimum):
    # These values are read as PostgreSQL integer by both scheduled detectors.
    require(type(row[key]) is int and minimum <= row[key] <= 2147483647, f'Invalid integer {key}')


def validate_config(config, day):
    roles = config['roles']
    require(isinstance(roles, list) and roles, 'Configure at least one watched role')
    require(len({r['job_id'] for r in roles}) == len(roles), 'Duplicate watched role')
    for role in roles:
        UUID(role['job_id']); UUID(role['hire_stage_id'])
        require(isinstance(role['label'], str) and role['label'].strip(), 'Missing role label')
        require(date.fromisoformat(role['monitor_since']) <= day, 'Role monitoring starts in the future')
        age = (day - date.fromisoformat(role['reference_updated_on'])).days
        require(0 <= age <= 35, 'Refresh reference metrics before collecting this date (35-day limit)')
        number(role, 'tth_limit_days', 0.01)
        count(role, 'min_weekly_hires', 1)
        rules = role['stages']
        require(isinstance(rules, list) and rules, 'Configure at least one stage')
        require(len({s['stage_id'] for s in rules}) == len(rules), 'Duplicate watched stage')
        for rule in rules:
            UUID(rule['stage_id'])
            require(isinstance(rule['advance_to'], list) and rule['advance_to'], 'Specify advancing successor stages')
            for stage in rule['advance_to']:
                UUID(stage)
            require(isinstance(rule['label'], str) and rule['label'].strip(), 'Missing stage label')
            number(rule, 'reference_mean', 0, 1); number(rule, 'reference_sd', 0, 1)
            count(rule, 'reference_days', 0); count(rule, 'min_daily_exits', 1)
            number(rule, 'dwell_limit_hours', 0.01)


class Ashby:
    def __init__(self, key):
        require(bool(key), 'Set ASHBY_API_KEY or select --fixture')
        self.auth = 'Basic ' + base64.b64encode((key + ':').encode()).decode()

    def __call__(self, endpoint, body):
        req = request.Request('https://api.ashbyhq.com/' + endpoint, method='POST',
                              data=json.dumps(body).encode(), headers={
                                  'Authorization': self.auth, 'Content-Type': 'application/json',
                                  'Ashby-Version': '2026-01-01'})
        try:
            with request.urlopen(req, timeout=30) as response:
                return json.load(response)
        except error.HTTPError as exc:
            raise ValueError(f'Ashby {endpoint} returned HTTP {exc.code}; snapshot aborted') from None


class Fixture:
    def __init__(self, pages):
        self.pages = pages

    def __call__(self, endpoint, body):
        owner = body.get('jobId') or body.get('applicationId')
        return self.pages[endpoint][owner][body['cursor']]


def paginate(fetch, endpoint, filters):
    cursor = 'start'
    cursors = set()
    while True:
        require(cursor not in cursors and len(cursors) < 100, 'Missing/repeated cursor or page limit reached')
        cursors.add(cursor)
        page = fetch(endpoint, dict(filters, cursor=cursor, limit=100))
        require(page.get('success') is True and isinstance(page.get('results'), list) and
                type(page.get('moreDataAvailable')) is bool, f'Incomplete {endpoint} response')
        yield from page['results']
        if not page['moreDataAvailable']:
            return
        cursor = page.get('nextCursor')
        require(isinstance(cursor, str) and cursor, f'Missing nextCursor in {endpoint}')


def role_snapshot(fetch, rule, end):
    day_start = end - timedelta(days=1)
    week_start = end - timedelta(days=7)
    counts = defaultdict(lambda: {'exits': 0, 'advanced': 0, 'hours': []})
    weekly_moves = 0
    hire_days = []
    seen_apps = set()
    filters = {'jobId': rule['job_id'], 'createdBefore': int(end.timestamp()*1000)-1}
    for app in paginate(fetch, 'application.list', filters):
        app_id = app['id']
        require(app['job']['id'] == rule['job_id'], 'Application returned for a different watched job')
        require(app_id not in seen_apps and len(seen_apps) < 5000, 'Duplicate application or per-role limit reached')
        seen_apps.add(app_id)
        created = stamp(app['createdAt'])
        require(created < end, 'Application falls outside snapshot cutoff')
        history = sorted(paginate(fetch, 'application.listHistory', {'applicationId': app_id}),
                         key=lambda e: e['stageNumber'])
        require(len({e['id'] for e in history}) == len(history), 'Duplicate history event')
        positions = [e['stageNumber'] for e in history]
        require(all(type(n) is int and n >= 0 for n in positions) and len(set(positions)) == len(positions),
                'Invalid or duplicate history order')
        first_hire = None
        complete_prefix = True
        previous_entered = None
        for position, event in enumerate(history):
            complete_prefix = complete_prefix and event['stageNumber'] == position
            stage = event['stageId']
            entered = stamp(event['enteredStageAt'])
            left = stamp(event['leftStageAt']) if event.get('leftStageAt') else None
            require(previous_entered is None or entered >= previous_entered, 'Out-of-order stage history')
            require(left is None or left >= entered, 'Negative stage duration')
            previous_entered = entered
            if entered >= end:
                continue
            if week_start <= entered or (left and week_start <= left < end):
                weekly_moves += 1
            if complete_prefix and stage == rule['hire_stage_id'] and first_hire is None:
                first_hire = entered
            if left and day_start <= left < end and position + 1 < len(history):
                successor = history[position+1]
                successor_entered = stamp(successor['enteredStageAt'])
                require(left <= successor_entered, 'Overlapping stage history')
                # A numbering gap does not establish which stage followed this exit.
                if successor['stageNumber'] != event['stageNumber'] + 1 or successor_entered >= end:
                    continue
                for s in rule['stages']:
                    if s['stage_id'] == stage:
                        count = counts[stage]
                        count['exits'] += 1
                        count['advanced'] += int(successor['stageId'] in s['advance_to'])
                        count['hours'].append((left-entered).total_seconds()/3600)
        if first_hire is not None and week_start <= first_hire < end:
            require(first_hire >= created, 'Hire stage precedes application creation')
            hire_days.append((first_hire-created).total_seconds()/86400)
    stages = []
    for s in rule['stages']:
        c = counts[s['stage_id']]
        stages.append(dict(s, exits=c['exits'], advanced=c['advanced'],
                           median_dwell_hours=median(c['hours']) if c['hours'] else None))
    return dict(job_id=rule['job_id'], label=rule['label'], monitor_since=rule['monitor_since'],
                weekly_movement_events=weekly_moves, applications_scanned=len(seen_apps), stages=stages,
                hires=len(hire_days), mean_hire_days=sum(hire_days)/len(hire_days) if hire_days else None,
                tth_limit_days=rule['tth_limit_days'], min_weekly_hires=rule['min_weekly_hires'])


def collect(config, day, fetch):
    validate_config(config, day)
    end = datetime.combine(day, datetime.min.time(), UTC)
    return {'version': 1, 'as_of': day.isoformat(),
            'roles': [role_snapshot(fetch, role, end) for role in config['roles']]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--as-of', type=date.fromisoformat, required=True, help='UTC midnight ending the completed window')
    parser.add_argument('--fixture', type=Path, help='Read synthetic API response pages instead of making requests')
    parser.add_argument('--persist', action='store_true', help='Store aggregate snapshot using psql and its PG* environment')
    args = parser.parse_args()
    require(args.as_of <= datetime.now(UTC).date(), 'Select a completed UTC window')
    fetch = Fixture(json.loads(args.fixture.read_text())) if args.fixture else Ashby(os.environ.get('ASHBY_API_KEY'))
    snapshot = collect(json.loads(args.config.read_text()), args.as_of, fetch)
    result = json.dumps(snapshot, sort_keys=True, allow_nan=False, ensure_ascii=False)
    if args.persist:
        # A psql variable quoted by :'snapshot' is a SQL literal, never executable input.
        subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-v', 'snapshot='+result],
                       input="SELECT hfa.store_snapshot(:'snapshot'::jsonb);\n", text=True, check=True)
    else:
        print(json.dumps(snapshot, indent=2, allow_nan=False, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.SubprocessError) as exc:
        sys.exit(f'Collection failed: {exc}')
