# External link-rot check

Walk all MDX bodies for `https?://` URLs, HEAD-check them, log failures. Scheduled weekly (Sunday 02:00 local). The goal is to catch sunset products, vendor URL changes, and 404s before readers do.

## Step 1 — Enumerate external URLs

Walk `content/**/*.mdx` across all 6 locales. For each file:

1. Read the body (everything after the second `---`).
2. Extract URLs matching `https?://[^\s)"'>]+` from:
   - Markdown link targets `[text](url)`
   - Plain `<a href="url">`
   - Bare URLs in prose
   - Fenced code blocks if they look like a callable URL (skip if it's example/placeholder syntax)
3. Drop:
   - `ooligo.com` self-links (internal)
   - `localhost`, `127.0.0.1`
   - Obvious placeholders (`example.com`, `<your-url>`)

Dedupe by URL. A URL appearing in 100 pages still counts as 1 URL to check.

## Step 2 — HEAD-check

For each unique URL, send an HTTP HEAD request with a 5-second timeout. Use a realistic User-Agent string (don't claim to be a browser; identify as a checker like `ooligo-link-rot/1.0`).

Classify the response:

- **OK** — 2xx, 3xx (follow up to 5 redirects; if the final URL is on a different domain, log as `redirect-domain-change` with both URLs but don't flag yet — many vendors do this legitimately)
- **DEAD** — 404, 410, 451
- **FLAKY** — 5xx, connection timeout, DNS failure
- **AUTH** — 401, 403 (might be auth-walled, not necessarily dead)

If HEAD returns 405 (Method Not Allowed), retry with GET — some servers don't implement HEAD.

## Step 3 — Update the log

Append to [link-rot.log](link-rot.log):

```
YYYY-MM-DD <status> <url>
```

One line per check. Sorted by status (DEAD first, then FLAKY, then AUTH, then redirect-domain-change). OK results are NOT logged — the log is for failures only.

## Step 4 — Flag persistent failures

A URL is "persistent failure" if it has been logged as DEAD or FLAKY in **3 consecutive** weekly runs (i.e. the most recent 3 dated lines for that URL all show DEAD or FLAKY).

For each persistent failure:

1. Grep `content/**/*.mdx` for the URL — list all 6-locale-multiplied files that contain it.
2. Open a GitHub issue via `gh issue create`:

```
gh issue create \
  --title "link-rot: <url>" \
  --label "link-rot" \
  --body "<URL>
Status: <DEAD|FLAKY> in last 3 weekly checks
Affected pages:
- <list of file paths>

Action: replace with vendor's current URL, archive.org snapshot, or remove if vendor has sunset.
"
```

One issue per URL, not one per affected page. If the issue already exists (search by title), skip creation.

## Step 5 — Commit

If [link-rot.log](link-rot.log) gained any failure entries, commit:

```
chore: link-rot sweep YYYY-MM-DD — N dead, M flaky, P persistent

Persistent (issue opened): <count>
```

Include the `Co-Authored-By` trailer. Push to `origin main`.

If everything was OK, log `link-rot: all clean` and exit cleanly without a commit.

## Guardrails

- **Don't auto-edit MDX files in this routine.** Removing a broken link from running content needs editorial judgment (replace? remove? rephrase the surrounding sentence?). That's an authoring decision, surfaced via the GitHub issue.
- Don't retry failing URLs more than once per run. The persistence check (3-week window) handles transient failures.
- Respect rate limits — pace HEAD requests at no more than 5 req/sec to any single domain.
- If the routine takes more than 30 minutes, log a warning and commit partial results. Long runs are a signal that the dedup pass is missing or the URL set has grown beyond what HEAD-checking is the right tool for; the user will see the warning and may want to tighten scope.

## Autonomous mode

Run end-to-end. The log and the GitHub issues are the durable record.
