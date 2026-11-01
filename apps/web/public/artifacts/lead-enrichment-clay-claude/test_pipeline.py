"""Contract and gate tests; no model or network calls."""
import copy
from datetime import date
import json
import unittest

from pipeline import ROOT, load_jsonl, run


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.leads = load_jsonl(ROOT / 'examples/leads.jsonl')
        self.extractions = load_jsonl(ROOT / 'examples/extractions.jsonl')
        self.rubric = json.loads((ROOT / 'rubric.example.json').read_text())
        self.today = date(2026, 11, 1)

    def one(self, lead=None, extraction=None, rubric=None):
        return run([lead or self.leads[0]], [extraction or self.extractions[0]], rubric or self.rubric, self.today)[0]

    def test_fixture_output(self):
        actual = run(self.leads, self.extractions, self.rubric, self.today, 'offline_demo')
        self.assertEqual(actual, load_jsonl(ROOT / 'examples/expected-output.jsonl'))
        self.assertEqual(len(actual), 20)
        self.assertTrue(all(r['review_required'] for r in actual))

    def test_threshold_is_inclusive(self):
        row = self.one(self.leads[1], self.extractions[1])
        self.assertEqual(row['icp_fit_score'], 7)
        self.assertEqual(row['status'], 'ready_for_review')
        self.rubric['threshold'] = 8
        row = self.one(self.leads[1], self.extractions[1])
        self.assertEqual(row['status'], 'below_threshold')
        self.assertIsNone(row['opener_draft'])

    def test_missing_field_never_scores(self):
        row = self.one(self.leads[8], self.extractions[8])
        self.assertEqual(row['status'], 'needs_review')
        self.assertIsNone(row['icp_fit_score'])

    def test_quote_does_not_certify_different_numeric_value(self):
        ext = copy.deepcopy(self.extractions[0]); ext['headcount'] = 12
        self.assertEqual(self.one(extraction=ext)['status'], 'invalid_evidence')

    def test_boolean_is_not_a_headcount(self):
        ext = copy.deepcopy(self.extractions[0]); ext['headcount'] = True
        self.assertEqual(self.one(extraction=ext)['status'], 'invalid_evidence')

    def test_decimal_or_range_is_not_an_exact_headcount(self):
        for quote, value in [('We have 12.5 employees.', 12), ('We have 50–100 employees.', 50), ('We have 50 to 100 employees.', 100)]:
            lead = copy.deepcopy(self.leads[0]); ext = copy.deepcopy(self.extractions[0])
            lead['sources'][0]['text'] += ' ' + quote
            ext['headcount'] = value; ext['evidence']['headcount']['quote'] = quote
            self.assertEqual(self.one(lead, ext)['status'], 'invalid_evidence')

    def test_region_substring_does_not_count_as_country_evidence(self):
        lead = copy.deepcopy(self.leads[0]); ext = copy.deepcopy(self.extractions[0])
        lead['sources'][0]['text'] += ' Our business is growing.'
        ext['evidence']['region']['quote'] = 'Our business is growing.'
        self.assertEqual(self.one(lead, ext)['status'], 'invalid_evidence')

    def test_nonnull_fact_requires_evidence(self):
        ext = copy.deepcopy(self.extractions[0]); ext['evidence']['industry'] = None
        self.assertEqual(self.one(extraction=ext)['status'], 'invalid_evidence')

    def test_unknown_source_is_rejected(self):
        ext = copy.deepcopy(self.extractions[0]); ext['evidence']['region']['source_id'] = 'invented'
        self.assertEqual(self.one(extraction=ext)['status'], 'invalid_evidence')

    def test_stale_source_goes_to_review(self):
        lead = copy.deepcopy(self.leads[0]); lead['sources'][0]['checked_at'] = '2026-09-01'
        row = self.one(lead=lead)
        self.assertEqual(row['status'], 'needs_review')
        self.assertIsNone(row['icp_fit_score'])

    def test_future_source_date_is_invalid_input(self):
        lead = copy.deepcopy(self.leads[0]); lead['sources'][0]['checked_at'] = '2026-11-02'
        with self.assertRaises(ValueError): self.one(lead=lead)

    def test_duplicate_and_unknown_row_ids_fail(self):
        with self.assertRaises(ValueError): run(self.leads + [self.leads[0]], self.extractions, self.rubric, self.today)
        extra = copy.deepcopy(self.extractions[0]); extra['row_id'] = 'not-in-leads'
        with self.assertRaises(ValueError): run(self.leads, [extra], self.rubric, self.today)

    def test_unconfigured_rubric_fails(self):
        self.rubric['configured'] = False
        with self.assertRaises(ValueError): self.one()

    def test_overlong_source_quote_is_not_truncated_into_a_draft(self):
        lead = copy.deepcopy(self.leads[0]); ext = copy.deepcopy(self.extractions[0])
        text = ' '.join(['workflow'] * 51)
        lead['sources'][0]['text'] += ' ' + text
        ext['value_prop'] = text; ext['evidence']['value_prop']['quote'] = text
        row = self.one(lead, ext)
        self.assertEqual(row['status'], 'needs_review')
        self.assertIsNone(row['opener_draft'])

    def test_unreachable_does_not_require_extraction(self):
        row = run([self.leads[12]], [], self.rubric, self.today)[0]
        self.assertEqual(row['status'], 'unreachable')
        self.assertIsNone(row['icp_fit_score'])


if __name__ == '__main__':
    unittest.main()
