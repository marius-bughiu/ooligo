"""Capture one private fixed-cohort snapshot from Google's read-only Search Console APIs."""
import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta
from http.client import HTTPException, HTTPSConnection
from pathlib import Path

from gsc_cohort import PACIFIC, UTC, index_rows, snapshot

SEARCH = "/webmasters/v3/sites/sc-domain%3Aooligo.com/searchAnalytics/query"
INSPECT = "/v1/urlInspection/index:inspect"


def post(host, path, payload):
    connection = HTTPSConnection(host, timeout=30)
    try:
        connection.request("POST", path, json.dumps(payload), {
            "Authorization": "Bearer " + os.environ["OOLIGO_GSC_ACCESS_TOKEN"],
            "Content-Type": "application/json",
        })
        response = connection.getresponse()
        if response.status != 200:
            raise ValueError(f"HTTP {response.status} from {host}")
        return json.load(response)
    finally:
        connection.close()


def capture(cohort, start, end, observed):
    if len(cohort) != 30 or not start <= end < observed.astimezone(PACIFIC).date():
        raise ValueError("expected 30 URLs and a closed date range before today in Pacific time")
    errors, inspections, counts = [], [], []
    latest = observed.astimezone(PACIFIC).date() - timedelta(days=1)
    # A successful exact-page query can omit provisional days. Check the property
    # has final data on or after the last requested date before interpreting zeros.
    try:
        days = post("www.googleapis.com", SEARCH, {
            "type": "web", "dataState": "final", "dimensions": ["date"],
            "startDate": end.isoformat(), "endDate": latest.isoformat(), "rowLimit": 1,
        })
        finalized = bool(days.get("rows"))
        if not finalized:
            errors.append({"source": "performance", "error": "could not establish final Web data through end date"})
    except (ValueError, OSError, HTTPException) as exc:
        finalized = False
        errors.append({"source": "performance", "error": str(exc)})
    for url in cohort:
        try:
            response = post("searchconsole.googleapis.com", INSPECT, {
                "siteUrl": "sc-domain:ooligo.com", "inspectionUrl": url, "languageCode": "en-US",
            })
            result = response["inspectionResult"]["indexStatusResult"]
            status = {"PASS": "indexed", "NEUTRAL": "not-indexed", "FAIL": "not-indexed"}
            inspections.append({"url": url, "indexing": status.get(result.get("verdict"), "unknown"),
                                "lastCrawl": result.get("lastCrawlTime"), "canonical": result.get("googleCanonical"),
                                "coverage": result.get("coverageState")})
        except (KeyError, TypeError, ValueError, OSError, HTTPException) as exc:
            errors.append({"source": "inspection", "url": url, "error": str(exc)})
        if not finalized:
            continue
        try:
            response = post("www.googleapis.com", SEARCH, {
                "type": "web", "dataState": "final", "aggregationType": "byPage",
                "startDate": start.isoformat(), "endDate": end.isoformat(),
                "dimensionFilterGroups": [{"filters": [{"dimension": "page", "operator": "equals", "expression": url}]}],
            })
            rows = response.get("rows", [])
            if len(rows) > 1:
                raise ValueError("expected at most one aggregate row")
            counts_row = {"url": url}
            for key in ("clicks", "impressions"):
                value = rows[0][key] if rows else 0
                if isinstance(value, bool) or not isinstance(value, (float, int)) or value != int(value) or value < 0:
                    raise ValueError(f"invalid count for {key}")
                counts_row[key] = int(value)
            counts.append(counts_row)
        except (KeyError, TypeError, ValueError, OSError, HTTPException) as exc:
            errors.append({"source": "performance", "url": url, "error": str(exc)})
    result = {"observedAt": observed.isoformat(), "inspections": inspections, "errors": errors,
              "performance": {"type": "web", "start": start.isoformat(), "end": end.isoformat(), "rows": counts}}
    snapshot(result, cohort)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cohort", type=Path)
    parser.add_argument("start", type=date.fromisoformat)
    parser.add_argument("end", type=date.fromisoformat)
    parser.add_argument("output", type=Path, help="new private JSON file")
    args = parser.parse_args()
    if not os.environ.get("OOLIGO_GSC_ACCESS_TOKEN"):
        parser.error("set OOLIGO_GSC_ACCESS_TOKEN to a short-lived webmasters.readonly access token")
    if args.output.exists():
        parser.error("choose a new snapshot path to preserve the existing capture")
    try:
        cohort = index_rows(json.loads(args.cohort.read_text())["rows"])
        result = capture(cohort, args.start, args.end, datetime.now(UTC))
        contents = json.dumps(result, indent=2) + "\n"
        descriptor = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as output:
            output.write(contents)
    except (OSError, KeyError, ValueError, TypeError) as exc:
        parser.exit(2, f"gsc-capture: {exc}\n")
    if result["errors"]:
        print(f"Saved partial observations; {len(result['errors'])} collection errors.", file=sys.stderr)
        parser.exit(1)


if __name__ == "__main__":
    main()
