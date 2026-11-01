# Sitemaps

`https://ooligo.com/sitemap-index.xml` remains the discovery/submission URL in
`robots.txt`. The official `@astrojs/sitemap` writer creates a separate sitemap
for each nonempty language and content collection, for example
`sitemap-en-tools-0.xml`, `sitemap-es-comparisons-0.xml`, and
`sitemap-pt-BR-pages-0.xml`. Collections are `tools`, `comparisons`, `workflows`,
`learn`, and `stacks`; `pages` contains homepages, indexes, vertical hubs, and
other static pages. The writer retains its normal file-size/URL-count limits.
This grouping makes Search Console/Bing reporting easier to compare; it does
not itself guarantee crawling or indexing.

## Canonical membership and translations

The manifest starts from pages actually emitted by the current Astro build,
not a historical list of URLs or files left in an output directory. It includes
only the configured site's host, supported locale prefixes, and trailing-slash
page URLs. The root locale redirect, legacy `/comparisons/` paths, design,
Open Graph assets, 404/500 pages, and explicit source `robots` noindex meta tags
are excluded. Source/frontmatter route mismatches fail preparation.

Each content cluster uses its collection and `canonical_slug` to link only
translations present in that build. Every member includes itself; English, when
present, is also `x-default`. Static-page clusters use their locale-free path.
Duplicate language entries in a cluster are rejected. A targeted `build:page`
therefore describes only its selected content and actual emitted static pages;
its partial sitemap must never be deployed as the full production site.

Astro creates a clean output for production builds; `build:page` uses a new
isolated cache directory per run. Only the newly generated index and nonempty
groups belong to that deployment, so deleted/renamed URLs and now-empty groups
do not survive through a previous output manifest. Cloudflare publishes that
complete output atomically.

## What `lastmod` means

`apps/web/scripts/sitemap-dates.mjs` finds the newest meaningful revision on the
published first-parent Git history. It compares source content, not checkout
mtime, build time, or the newest unrelated commit. MDX verification/provenance
fields (`last_updated`, `en_verified`, `pricing_checked`, `material_change_at`,
`translated_from`, `translated_at`, `translation_model`, `source_sha256`) alone
do not constitute a substantive change for sitemap dates. Trailing whitespace,
MDX comments, JSON key order, and direct Astro style/client-script blocks are
also ignored. Actual copy, links, editorial metadata, pricing facts, and
server-rendered template content count as meaningful revisions.

A detail page takes the newest confirmed date among its article, direct page
template, relevant metadata/title/link helpers, directly referenced tool
profiles supplying tables, and its downloadable workflow bundle where present.
The enrichment example also includes its shared fixture/copy modules and
quickstart/example components. Trust pages include their own legal-copy module
and shared legal-page renderer. Removing a source file from a workflow bundle
also updates that workflow's date, even if its remaining files are unchanged.
This is
a source-revision signal, not an HTML byte-difference detector: related source
edits can date a page even if a particular conditional block is not visible.
Global layout/chrome, styles, and arbitrary related-content sidebar changes do
not independently refresh every article.

Homepages, collection indexes, and vertical hubs include relevant current
member revisions and removals, plus their direct template/configuration dates.
Removing or renaming an article updates its former index/hub without keeping
the removed URL in the sitemap. Git dates retain timestamp precision; authored
date-only fallbacks retain date-only precision. Invalid or future dates are
omitted.

Production and CI builds must use `actions/checkout` with `fetch-depth: 0`.
Shallow or unavailable Git history logs a warning and uses only a valid authored
`last_updated` for articles, propagating those dates to hubs; it never treats a
shallow boundary commit as creation time. Static pages without a trustworthy
date omit `lastmod`. With full history, uncommitted/untracked source changes do
not receive an invented date; confirmed unchanged dependencies can still supply
their dates. The committed deployment resolves the final revision dates.

## Validation

Run the fast, source-only suite:

```sh
node --test apps/web/scripts/sitemap.test.mjs
```

Tests create temporary local Git histories and exercise the official XML writer
without running Astro. They cover meaningful revisions, unrelated commits,
dirty sources, shallow history, deletions/renames, route exclusions, noindex,
fallbacks, dependencies, grouping, translation identity, and fresh manifests.
Use the existing targeted `npm run build:page -- ...` command to check integration
output locally. Never run the full Astro build locally or read/delete
`apps/web/dist`; production generation belongs to CI.

References: [Astro sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
and [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
