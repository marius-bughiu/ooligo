"""Compare private Search Console snapshots against the original 30 audited URLs."""
import argparse
import json
import re
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

UTC = timezone.utc
DAY = timedelta(days=1)
PACIFIC = ZoneInfo("America/Los_Angeles")


def interval(value):
    """UTC bounds when the UI only supplies a calendar day without a time zone."""
    if len(value) == 10:
        midnight = datetime.combine(date.fromisoformat(value), time(), UTC)
        return midnight - timedelta(hours=14), midnight + DAY + timedelta(hours=12)
    value = re.sub(r"(T\d{2}:\d{2}:\d{2})\.(\d+)", lambda m: m[1] + "." + m[2][:6].ljust(6, "0"), value)
    instant = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if instant.tzinfo is None:
        raise ValueError(f"timestamp needs an explicit offset: {value}")
    return instant, instant


def index_rows(rows, cohort=None):
    result = {}
    for row in rows:
        url = row["url"]
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.netloc != "ooligo.com" or parsed.query or parsed.fragment or not parsed.path.endswith("/"):
            raise ValueError(f"expected an exact canonical Ooligo URL: {url}")
        if url in result or (cohort is not None and url not in cohort):
            raise ValueError(f"duplicate URL or URL outside the fixed cohort: {url}")
        result[url] = row
    return result


def snapshot(source, cohort):
    observed_end = interval(source["observedAt"])[1]
    inspections = index_rows(source.get("inspections", []), cohort)
    for row in inspections.values():
        if row.get("indexing") not in ("indexed", "not-indexed", "unknown"):
            raise ValueError(f"invalid stored indexing status for {row['url']}")
        if row.get("lastCrawl"):
            interval(row["lastCrawl"])
    performance = source.get("performance")
    metrics, window = {}, None
    if performance is not None:
        if performance.get("type", "web") != "web":
            raise ValueError("use Web Search for both performance snapshots")
        window = (date.fromisoformat(performance["start"]), date.fromisoformat(performance["end"]))
        if window[1] < window[0] or window[1] > observed_end.astimezone(PACIFIC).date():
            raise ValueError("performance dates are reversed or end after collection")
        metrics = index_rows(performance["rows"], cohort)
        for url, row in metrics.items():
            if "query" in row:
                raise ValueError(f"expected page totals, received a query row for {url}")
            if any(type(row.get(key)) is not int or row[key] < 0 for key in ("clicks", "impressions")):
                raise ValueError(f"expected nonnegative integer page counts for {url}")
    return source["observedAt"], inspections, window, metrics


def crawl_status(published, last_crawl, observed_at):
    if not published:
        return "no recorded fix"
    published_at = interval(published)[0]
    if interval(observed_at)[1] < published_at:
        return "observation predates fix"
    if not last_crawl:
        return "crawl unavailable"
    earliest, latest = interval(last_crawl)
    if latest < published_at:
        return "before fix"
    if earliest >= published_at:
        return "after fix"
    return "date too imprecise"


def window_context(published, crawl, observed, window):
    if not window:
        return "window unavailable"
    if not published:
        return "no recorded fix"
    start = datetime.combine(window[0], time(), PACIFIC)
    end = datetime.combine(window[1] + DAY, time(), PACIFIC)
    if end <= interval(published)[0]:
        return "before publication"
    if crawl_status(published, crawl, observed) != "after fix":
        return "no verified post-fix crawl"
    earliest, latest = interval(crawl)
    if start >= latest:
        return "fully after observed crawl"
    if end <= earliest:
        return "before observed crawl"
    return "overlaps observed crawl date"


def canonical_label(row, url):
    value = row.get("canonical")
    return "self" if value == url else value or "unavailable"


def window_label(window):
    return f"{window[0]} through {window[1]}" if window else "unavailable"


def metric_label(row):
    return f"{row['clicks']} / {row['impressions']}" if row is not None else "unavailable"


def render(manifest, previous_source, current_source):
    cohort = index_rows(manifest["rows"])
    if len(cohort) != 30:
        raise ValueError("the fixed audit cohort must contain exactly 30 distinct URLs")
    before_time, before, before_window, before_metrics = snapshot(previous_source, cohort)
    now_time, now, now_window, now_metrics = snapshot(current_source, cohort)
    if interval(now_time)[1] < interval(before_time)[0]:
        raise ValueError("current snapshot predates the previous snapshot")
    comparable = (before_window and now_window and before_window[1] < now_window[0]
                  and before_window[1] - before_window[0] == now_window[1] - now_window[0])
    lines = [
        "# Private SEO audit follow-up", "",
        f"Previous observation {before_time}. Current observation {now_time}.",
        f"Stored inspections available for {len(before)}/30 previously and {len(now)}/30 currently. "
        f"Exact-page metrics available for {len(before_metrics)}/30 previously and {len(now_metrics)}/30 currently.",
        "", "## Indexed version in Search Console", "",
        "| URL | Fix published (UTC) | Previous crawl | Current crawl | Current crawl vs. fix | Indexed status, previous → current | Google-selected canonical, previous → current |",
        "|---|---|---|---|---|---|---|",
    ]
    for url, entry in cohort.items():
        published = entry.get("publishedAt")
        if published:
            if len(published) == 10:
                raise ValueError("publishedAt needs the production timestamp including offset")
            published = interval(published)[0].astimezone(UTC).isoformat().replace("+00:00", "Z")
        prev, curr = before.get(url, {}), now.get(url, {})
        status = crawl_status(published, curr.get("lastCrawl"), now_time)
        cells = (url, published or "—", prev.get("lastCrawl"), curr.get("lastCrawl"), status,
                 f"{prev.get('indexing', 'unavailable')} → {curr.get('indexing', 'unavailable')}",
                 f"{canonical_label(prev, url)} → {canonical_label(curr, url)}")
        lines.append("| " + " | ".join(str(cell or "unavailable").replace("|", "\\|") for cell in cells) + " |")
    lines.extend([
        "", "## Web Search performance", "",
        f"Previous period {window_label(before_window)}. Current period {window_label(now_window)}. "
        "Dates use Search Console's Pacific time.",
        "Deltas compare equal-length, non-overlapping windows." if comparable else
        "Deltas withheld because the windows are unavailable, overlap, have different lengths, or run out of order.",
        "An unavailable row has no exact-page observation. Zero is a reported count. "
        "Compare post-fix performance after Google has recrawled the page and a full reporting period has elapsed.",
        "", "| URL | Previous clicks / impressions | Current clicks / impressions | Change in clicks / impressions | Current period vs. fix |",
        "|---|---|---|---|---|",
    ])
    for url in cohort:
        prior, current = before_metrics.get(url), now_metrics.get(url)
        delta = "—"
        if comparable and prior is not None and current is not None:
            delta = " / ".join(f"{current[key] - prior[key]:+d}" for key in ("clicks", "impressions"))
        context = window_context(cohort[url].get("publishedAt"), now.get(url, {}).get("lastCrawl"), now_time, now_window)
        lines.append(f"| {url} | {metric_label(prior)} | {metric_label(current)} | {delta} | {context} |")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("cohort", "previous", "current"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    try:
        print(render(*(json.loads(path.read_text()) for path in (args.cohort, args.previous, args.current))), end="")
    except (OSError, ValueError, TypeError, KeyError, AttributeError) as exc:
        parser.exit(2, f"gsc-cohort: {exc}\n")


if __name__ == "__main__":
    main()
