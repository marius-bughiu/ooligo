"""Regression checks for interpreting incomplete Search Console data."""
import unittest
from datetime import date, datetime, timezone
from unittest.mock import patch

import gsc_capture
import gsc_cohort

URLS = [f"https://ooligo.com/en/learn/example-{i}/" for i in range(30)]
COHORT = {"rows": [{"url": url} for url in URLS]}


def observation(start, end, clicks=0, impressions=0):
    return {
        "observedAt": "2026-11-02T12:30:00Z",
        "performance": {"start": start, "end": end, "rows": [
            {"url": URLS[0], "clicks": clicks, "impressions": impressions}
        ]},
    }


class CohortReportTest(unittest.TestCase):
    def test_explicit_zero_missing_and_deltas(self):
        before = observation("2026-09-01", "2026-09-28", impressions=2)
        now = observation("2026-09-29", "2026-10-26")
        rendered = gsc_cohort.render(COHORT, before, now)
        self.assertIn(f"| {URLS[0]} | 0 / 2 | 0 / 0 | +0 / -2 |", rendered)
        self.assertIn(f"| {URLS[1]} | unavailable | unavailable | — |", rendered)
        self.assertEqual(rendered.count("| https://ooligo.com/"), 60)
        now["performance"]["start"] = "2026-09-28"
        now["performance"]["end"] = "2026-10-25"
        self.assertIn(f"| {URLS[0]} | 0 / 2 | 0 / 0 | — |", gsc_cohort.render(COHORT, before, now))

    def test_nearby_dates_and_pacific_reporting_days(self):
        published = "2026-11-01T08:00:00Z"
        observed = "2026-11-03T08:00:00Z"
        status = gsc_cohort.crawl_status
        self.assertEqual(status(published, "2026-11-01", observed), "date too imprecise")
        self.assertEqual(status(published, "2026-10-01", observed), "before fix")
        self.assertEqual(status(published, "2026-11-01T11:00:00+02:00", observed), "after fix")
        self.assertEqual(status(published, None, observed), "crawl unavailable")
        self.assertEqual(status(published, None, "2026-10-29T08:00:00Z"), "observation predates fix")
        # Nov 2 at 07:30 UTC is still Nov 1 in Pacific time.
        context = gsc_cohort.window_context
        crawl = "2026-11-02T07:30:00Z"
        self.assertEqual(context(published, crawl, observed, (date(2026, 11, 2), date(2026, 11, 2))),
                         "fully after observed crawl")
        self.assertEqual(context(published, crawl, observed, (date(2026, 11, 1), date(2026, 11, 1))),
                         "overlaps observed crawl date")

    def test_capture_only_records_successful_exact_page_results(self):
        start, end = date(2026, 10, 4), date(2026, 10, 31)
        when = datetime(2026, 11, 2, 12, 30, tzinfo=timezone.utc)

        def reply(host, path, body):
            if body.get("dimensions") == ["date"]:
                return {"rows": [{"keys": ["2026-10-31"], "clicks": 1, "impressions": 8}]}
            if path == gsc_capture.INSPECT:
                return {"inspectionResult": {"indexStatusResult": {"verdict": "NEUTRAL",
                        "lastCrawlTime": "2026-10-30T20:00:00.123456789Z"}}}
            self.assertEqual(body["dataState"], "final")
            exact = body["dimensionFilterGroups"][0]["filters"][0]
            self.assertEqual((exact["dimension"], exact["operator"]), ("page", "equals"))
            if exact["expression"] == URLS[0]:
                raise ValueError("mock API error")
            return {"responseAggregationType": "byPage"}

        with patch.object(gsc_capture, "post", side_effect=reply):
            capture = gsc_capture.capture(URLS, start, end, when)
        self.assertEqual(len(capture["inspections"]), 30)
        self.assertEqual(capture["inspections"][0]["indexing"], "not-indexed")
        self.assertEqual(len(capture["performance"]["rows"]), 29)
        self.assertEqual(capture["errors"][0]["url"], URLS[0])
        self.assertEqual(capture["performance"]["rows"][0]["impressions"], 0)

        def no_final_days(host, path, body):
            return {} if path == gsc_capture.SEARCH else reply(host, path, body)
        with patch.object(gsc_capture, "post", side_effect=no_final_days):
            capture = gsc_capture.capture(URLS, start, end, when)
        self.assertEqual(len(capture["inspections"]), 30)
        self.assertEqual(capture["performance"]["rows"], [])
        self.assertIn("could not establish final", capture["errors"][0]["error"])

    def test_refuse_duplicate_urls_and_query_rows(self):
        before = observation("2026-09-01", "2026-09-28")
        now = observation("2026-10-01", "2026-10-28")
        now["performance"]["rows"] *= 2
        with self.assertRaisesRegex(ValueError, "duplicate URL"):
            gsc_cohort.render(COHORT, before, now)
        now["performance"]["rows"].pop()
        now["performance"]["rows"][0]["query"] = "example query"
        with self.assertRaisesRegex(ValueError, "received a query row"):
            gsc_cohort.render(COHORT, before, now)


if __name__ == "__main__":
    unittest.main()
