# IndexNow publication notifications

The production deployment runs `scripts/indexnow.mjs submit` after Cloudflare Pages reports success. It verifies the configured key at the live apex host, then sends changed canonical URLs to the global IndexNow endpoint. It does not request indexing for every URL on each deployment.

The protocol permits additions, updates and deletions, with up to 10,000 URLs per POST. HTTP 200 means received; HTTP 202 means received with key validation pending. Neither proves crawling or indexing. The implementation follows [IndexNow's documentation](https://www.indexnow.org/documentation) and [submission guidance](https://www.indexnow.org/faq), checked 2026-11-01.

## Files

- `scripts/indexnow.config.json`: production site, allowed branch, initial baseline SHA and public verification key.
- `apps/web/public/<key>.txt`: UTF-8 verification file, copied to the site root by the normal build. Its contents and filename match the configured key. It is intentionally public and is not a GitHub secret.
- `scripts/indexnow.mjs`: URL planning, verification and submission.
- `scripts/indexnow.test.mjs`: offline tests with injected network responses.
- `.github/workflows/deploy.yml`: full-history checkout, production guard, post-publication notification and receipt cache.

The script uses Node 22 and the repository's existing `gray-matter` dependency. No new dependency, token permission or user secret is required.

## What gets notified

The planner compares Git content at two commits. For changed MDX in tools, comparisons, workflows, learn and stacks, it derives URLs from the entry's locale and slug; comparisons map to `/vs/`. It validates locales against each commit's locale configuration. Changed/deleted old URLs and new URLs are retained and deduplicated. A filename-only rename with unchanged canonical URL and content does not trigger a notification.

It ignores trailing whitespace, frontmatter key ordering, and verification/provenance-only updates that do not constitute a substantive content change for notification purposes: `en_verified`, `pricing_checked`, `material_change_at`, translation provenance and hashes. Fields such as `title`, `description`, prices and `last_updated` remain significant.

Changed artifact source files notify their existing localized workflow pages because those files appear in the page's artifact viewer. Cache files are excluded. Raw artifacts and ZIP URLs are not submitted.

Shared template, component, locale/vertical configuration and redirect changes are reported in the log without expanding them into thousands of notifications. Indexes, hubs and other pages affected indirectly by those changes remain discoverable through sitemaps and links. A deliberate sitewide content migration needs its own reviewed notification plan; a stylesheet or common template edit must not silently trigger one here.

## Receipt and cancellation handling

The starting point is the last accepted notification receipt in a branch-scoped Actions cache. It stores the site, branch, commit SHA, response statuses, URL count and receipt time. The cached SHA must be reachable, an ancestor of the published commit, and no older than the integration baseline.

The baseline in the committed configuration is `f5b750db814dfb7aa338a63b930e258a84162bd4`, the commit before this integration. An absent, invalid, foreign-branch or unreachable cached receipt falls back to that fixed commit. It never falls back to only the previous commit, which would drop changes when deployment runs are cancelled.

The receipt advances only after every POST returns 200 or 202. Partial batch failures, key-verification errors, outages and rate limits leave the prior receipt unchanged. Runs with no changed URLs make no network calls and do not create a new receipt. The cache is saved only after a successful notification step that produced a receipt.

Actions caches are not permanent storage. Cache eviction or a cache-save failure can cause the next run to resend the net changes since the fixed baseline. That is a bounded replay of changes, not a complete unchanged-site submission. Logs identify whether the baseline came from a receipt or the fallback. After a deliberate history rewrite that removes the baseline, notifications fail visibly rather than selecting an arbitrary new baseline; review and update the configuration deliberately.

A cancelled run between an accepted POST and saving its receipt can also cause a replay. Repeated submissions are avoided during normal successful runs, but exactly-once delivery is not claimed.

## Failures and verification

Submission requires GitHub Actions, `refs/heads/main`, the production origin, a matching `GITHUB_SHA`, a push/manual event, and a successful deploy step. A manual workflow launched against another branch is blocked at the job level as well.

Before the first POST, the script fetches the production key with redirects disabled and checks the exact trimmed response. It retries temporary propagation failures up to five times. POST requests retry network errors, 429s and server errors at most three times. A `Retry-After` longer than 60 seconds defers processing to a later run rather than ignoring the server's requested pause. Other client errors fail immediately.

Notification and receipt-cache failures are separate from publication success. The Actions job summary reports both the deployment and IndexNow outcome. A failed notification does not undo a published site or claim the deployment failed. Inspect failed notification logs and rerun the workflow after resolving the cause; a rerun republishes the same commit before retrying the outstanding changes.

After the first deployment, check the verification-file response, the IndexNow step's counts/statuses and the cache-save result. Use Bing Webmaster Tools to check receipt separately. A successful notification is not a ranking or indexation guarantee.

## Local checks

```sh
node --test scripts/indexnow.test.mjs
node scripts/indexnow.mjs plan
```

The plan command reads committed Git snapshots, never `apps/web/dist`, and performs no HTTP requests. Uncommitted edits are not included. The tests use fake network responses; running them makes no paid or external API calls. Do not run a full local site build for this integration.

## Host normalization

The `www.ooligo.com` to apex rule is managed in Cloudflare as a Single Redirect, not in the repository's Pages `_redirects` file. It sends both HTTP and HTTPS requests to `https://ooligo.com` with the same path, using 308 and preserving query strings. The root `/` to `/en/` remains the existing 302 locale entry redirect. IndexNow always submits apex, locale-prefixed detail URLs; it does not submit www duplicates.
