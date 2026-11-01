# Historical URL redirects

`scripts/legacy-redirects.json` maps known obsolete paths to equivalent current pages. These paths were found in the repaired article links and historical URL reports. They are an explicit list, not wildcard rules that manufacture destinations for arbitrary URLs.

The comparison aliases retain their supported locale and change `/comparisons/` to `/vs/`. Known paths without a locale resolve to the matching English page, consistent with the site's default language. Other narrow aliases cover the old legal-ops stack path, punctuation-suffixed Gong links and `/en/Index`.

`node scripts/legacy-redirects.mjs --write` generates `apps/web/public/_redirects`. Both slash forms go directly to the canonical destination with HTTP 301. The existing root `/` to `/en/` redirect remains HTTP 302. The host-level www-to-apex rule remains in Cloudflare.

The generator validates targets against frontmatter routes, rejects existing-page overrides, external destinations, wildcard/query rules, loops and chains, and enforces Cloudflare's 2,000 static-rule limit. `node --test scripts/legacy-redirects.test.mjs` runs in CI and before deployment, including a comparison between the committed generated file and the manifest.

To add an alias, establish an equivalent destination first, add the exact source without a trailing slash, regenerate, and verify the live status, Location header and query preservation after publication. A remaining 404 is correct when no equivalent page exists. Unsupported-language URLs, Clearbit product URLs without a current product page, `/bots`, and the ambiguous `/en/r/cs/` path have not been redirected to unrelated content.
