# Measuring the 30 audited URLs

Keep the original selection, including URLs that receive no impressions. This private report follows individual pages from publication through recrawl, indexing and search performance. It uses the domain property `sc-domain:ooligo.com`. The separate page-2 candidate harvest still selects promising queries at positions 8–25.

## Save private inputs

Use `.tmp/gsc-cohort/`, which Git ignores. Keep a dated copy of each snapshot and the raw evidence outside the public site. The report runs offline with Python 3.9 or newer and needs no credentials.

1. Copy the original audit selection into `cohort.json`. Its `rows` array contains exactly the same 30 canonical URLs in audit order. For each URL with an editorial fix, record `publishedAt` from the successful production deployment. Keep the previous manifest with each report if a later release updates the timestamp.
2. Save two observations in the format below. For each exact URL obtain the Google index result from **URL Inspection**. Record the indexing status (`indexed`, `not-indexed` or `unknown`), last crawl and Google-selected canonical. Supply timestamps with an explicit offset. If the UI's timezone is unknown, use only the displayed ISO calendar date. Omit fields Google does not supply. Omit the entire row when inspection is unavailable. The URL Inspection API exposes the indexed version and its UTC crawl timestamp. [Google URL Inspection](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
3. For performance, use **Web** search and one exact Page filter at a time, with a closed, final date range. Record clicks and impressions even when both are zero. An explicitly zero chart or successful exact-page query returning no data represents zero *reported* search activity for that page in that period. A missing page in an exporter’s top-page table, a failed request or a property-wide total cannot supply that zero. Omit unavailable rows. Never sum query rows to infer page totals. Use two equal, non-overlapping periods, such as consecutive 28-day windows, with the same scope and filters. Search Console dates use Pacific time. [Google Search Analytics](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
4. To assess response to a fix, compare a pre-publication period with a full period **after the observed recrawl**. Keep the full previous and current inspection dates and performance windows visible. Google can index a URL before it receives any impressions.

```json
{
  "rows": [
    {"url": "https://ooligo.com/en/learn/example/", "publishedAt": "2026-11-01T21:49:07Z"}
  ]
}
```

The manifest example shows one row. In the real manifest, leave `publishedAt` absent for a page without a recorded editorial release.

```json
{
  "observedAt": "2026-11-01",
  "inspections": [
    {"url": "https://ooligo.com/en/learn/example/", "indexing": "not-indexed", "lastCrawl": "2026-10-23", "canonical": "https://ooligo.com/en/learn/example/"}
  ],
  "performance": {
    "start": "2026-10-01",
    "end": "2026-10-28",
    "rows": [
      {"url": "https://ooligo.com/en/learn/example/", "clicks": 0, "impressions": 0}
    ]
  }
}
```

## Capture from the API

With an existing short-lived Google access token scoped to `webmasters.readonly` for the verified domain, supply it through the `OOLIGO_GSC_ACCESS_TOKEN` environment variable. The collector sends it only to Google's Search Console API endpoints and creates a new private file. For example, these dates select the 28-day period ending October 31.

```sh
python3 scripts/gsc_capture.py .tmp/gsc-cohort/cohort.json \
  2026-10-04 2026-10-31 .tmp/gsc-cohort/snapshot-2026-11-02.json
```

The collector verifies that Google has final property data through the end date, then requests the indexed version and Web totals for each exact page. A failed request leaves its observation unavailable. The command returns a nonzero status and saves any successful observations alongside the errors. Use a new dated output path for a retry. The manual input format above works without API access.

## Generate the private report

```sh
python3 scripts/gsc_cohort.py .tmp/gsc-cohort/cohort.json \
  .tmp/gsc-cohort/previous.json .tmp/gsc-cohort/current.json \
  > .tmp/gsc-cohort/report.md
```

Read the current crawl against the production timestamp before interpreting changes in indexing or impressions. A date-only crawl close to the publication time can be ambiguous. Both tables retain all 30 URLs, mark unavailable observations, and show changes in clicks and impressions only for comparable windows with counts on both sides. Keep the output and input snapshots private. The monthly public retro can record whether the private report was available.
