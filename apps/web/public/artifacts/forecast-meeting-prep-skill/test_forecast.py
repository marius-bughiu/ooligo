"""Offline regression checks for the downloadable forecast example."""

import csv
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from forecast import EXAMPLES, FIELDS, briefing, read_snapshot


class ForecastChecks(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.prior = ['2026-10-16', 'REP-F01', 'D-101', 'Pine Mill', 'best_case', '8.51', 'USD', '2026-11-06']
        self.current = ['2026-10-23', 'REP-F01', 'D-101', 'Pine Mill', 'commit', '9.63', 'USD', '2026-11-20']

    def snapshot(self, rows, header=FIELDS):
        path = Path(self.temp.name) / 'input.csv'
        with path.open('w', encoding='utf-8', newline='') as output:
            writer = csv.writer(output)
            writer.writerow(header)
            writer.writerows(rows)
        return read_snapshot(path)

    def test_entire_fictional_briefing_matches_expected_file(self):
        result = briefing(read_snapshot(EXAMPLES / 'pipeline-2026-10-16.csv'), read_snapshot(EXAMPLES / 'pipeline-2026-10-23.csv'))
        self.assertEqual(result, (EXAMPLES / 'expected-briefing.md').read_text(encoding='utf-8'))

    def test_exact_cents_and_category_transfer(self):
        result = briefing(self.snapshot([self.prior]), self.snapshot([self.current]))
        self.assertIn('| commit | $0 | $9.63 | +$9.63 |', result)
        self.assertIn('| best_case | $8.51 | $0 | -$8.51 |', result)
        self.assertIn('amount $8.51 → $9.63', result)

    def test_reordered_columns_and_rows_produce_same_briefing(self):
        rows = [self.prior, self.prior[:2] + ['D-102'] + self.prior[3:]]
        a = self.snapshot(rows)
        b = self.snapshot([list(reversed(row)) for row in reversed(rows)], list(reversed(FIELDS)))
        current = self.snapshot([self.current])
        self.assertEqual(briefing(a, current), briefing(b, current))

    def test_schema_drift_rejected(self):
        for header in [FIELDS[:-1], FIELDS + ('unreviewed_field',), FIELDS[:-1] + ('amount',)]:
            with self.subTest(header=header), self.assertRaisesRegex(ValueError, 'exactly these CSV columns'):
                self.snapshot([], header)

    def test_invalid_rows_rejected(self):
        for index, value in [(0, '2026-02-30'), (2, ''), (3, 'bad\nlabel'), (4, 'won'), (5, '-1'), (5, '1.234'), (5, 'NaN'), (6, 'EUR'), (7, '')]:
            row = self.prior.copy()
            row[index] = value
            with self.subTest(index=index, value=value), self.assertRaises(ValueError):
                self.snapshot([row])

    def test_missing_empty_or_duplicate_rows_rejected(self):
        for rows in [[], [self.prior[:-1]], [self.prior, self.prior]]:
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                self.snapshot(rows)

    def test_mixed_dates_or_reps_within_snapshot_rejected(self):
        for index, value in [(0, '2026-10-17'), (1, 'REP-F02')]:
            row = self.prior.copy()
            row[index], row[2] = value, 'D-102'
            with self.subTest(index=index), self.assertRaisesRegex(ValueError, 'one date and one rep'):
                self.snapshot([self.prior, row])

    def test_reversed_stale_or_mismatched_snapshot_pair_rejected(self):
        for index, value in [(0, '2026-10-15'), (0, '2026-10-16'), (0, '2026-10-27'), (1, 'REP-F02')]:
            row = self.current.copy()
            row[index] = value
            with self.subTest(index=index, value=value), self.assertRaises(ValueError):
                briefing(self.snapshot([self.prior]), self.snapshot([row]))

    def test_unchanged_rows_do_not_generate_questions(self):
        row = self.prior.copy()
        row[0] = self.current[0]
        result = briefing(self.snapshot([self.prior]), self.snapshot([row]))
        self.assertIn('1 unchanged opportunity.', result)
        self.assertIn('No movement questions', result)

    def test_account_label_escaped_in_markdown(self):
        row = self.current.copy()
        row[3] = '[linked](url) <HTML>'
        result = briefing(self.snapshot([self.prior]), self.snapshot([row]))
        self.assertIn('\\[linked\\](url) &lt;HTML&gt;', result)


if __name__ == '__main__':
    unittest.main()
