# Engagement measurement

GA4 measurement ID: `G-W6BZJ1Q021`. The production build initializes it only on the exact `https://ooligo.com` origin. Local builds and Cloudflare preview domains do not load gtag or send events. Blocking analytics does not block copy, downloads, newsletter signup or feedback controls.

Custom event parameters are allowlisted in `apps/web/src/lib/engagement.ts`. They contain no email, input values, artifact contents, clipboard contents, arbitrary URLs or free-text feedback. GA4 retains its standard page and attribution parameters. The `analytics_debug` query parameter is removed from `page_location`; campaign parameters and attribution IDs are preserved.

| Event | Trigger | Parameters beyond GA4 defaults |
| --- | --- | --- |
| `workflow_cta_click` | Homepage link to the worked example is clicked | `workflow_slug`, `locale`, `placement` (`home_hero` or `home_example`) |
| `sample_command_copy` | Clipboard confirms copying the local demo command | `workflow_slug`, `locale`, `placement: sample` |
| `sample_feedback` | Reader explicitly reports how their local demo went | `workflow_slug`, `locale`, `placement: sample`, `response` (`worked` or `got_stuck`) |
| `artifact_copy` | Clipboard confirms copying an artifact file | `workflow_slug`, `locale`, `artifact_type`, `placement: artifact_browser` |
| `artifact_download_click` | A file or ZIP link is clicked | `workflow_slug`, `locale`, `artifact_type`, `placement`, `download_kind` (`file` or `bundle`) |
| `newsletter_signup` | Subscription endpoint returns both an HTTP success and `ok: true` | `locale`, `signup_source` (`footer` or `vertical_page`), allowlisted `vertical` or `global` |

A download click is not a completed download. A command copy is not a run. The static sample preview does not execute anything and sends no completion event. `sample_feedback` is self-reported and allows one selection per page load; it is not proof of a live workflow run. Its UI only acknowledges the selected answer, not server receipt. Demo feedback requires no signup and no new backend endpoint.

For event-scoped GA4 reporting, `workflow_slug`, `placement`, `response` and `download_kind` distinguish the funnel. `locale` and `artifact_type` can be added where useful. Event parameters are sent regardless of whether custom definitions have been configured; custom definitions make them available in reporting.

The owner approved and registered these four event-scoped definitions on 1 November 2026: Workflow slug (`workflow_slug`), Interaction placement (`placement`), Sample feedback response (`response`), and Download kind (`download_kind`). GA4 reports need processing time before new dimensions appear; DebugView can verify receipt immediately. No traffic filter or privacy/access setting was changed.

## Explicit debug verification

Open the production page with `?analytics_debug=1` (or `&analytics_debug=1` when campaign parameters are present). This sends `debug_mode: true` for that page only. Navigate without that parameter to stop; the parameter is omitted in ordinary visits, never sent as `false`. Nothing is persisted in local storage or cookies by this debug control.

Check DebugView for the specific action, locale and workflow slug. Confirm a failed or blocked clipboard write does not produce a copy event; confirm that reading the static sample does not produce completion or feedback events. Newsletter verification must use an authorized test subscription, not a real user's email. Record any production test clicks: debug events can still enter ordinary reports when no active developer-traffic filter excludes them. This implementation does not change property settings or traffic filters.

Focused offline verification: `node --import tsx --test apps/web/src/lib/engagement.test.ts`. This checks the host/debug guards, preservation of attribution, safe event fields, clipboard outcomes and the actual newsletter/artifact handler scripts.
