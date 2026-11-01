import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { meaningfulSignature, revisionDates, validDate } from "./sitemap-dates.mjs";
import { groupedSitemap, hasNoindex, prepareSitemap, sitemapRoute } from "./sitemap.mjs";

const SITE = "https://ooligo.com";
const NOW = new Date("2026-11-01T12:00:00Z");
const LOCALES = { default_locale: "en", locales: [{ code: "en", hreflang: "en" }, { code: "es", hreflang: "es" }, { code: "pt-BR", hreflang: "pt-BR" }] };
const write = (root, file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "ooligo-sitemap-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "content/locales.json", JSON.stringify(LOCALES));
  return root;
}
const mdx = (slug = "alpha", locale = "en", extra = "", body = "# Useful guide\n\nAn original example.") => `---\nslug: ${slug}\ncanonical_slug: alpha\nlocale: ${locale}\nlast_updated: '2026-01-01'\nverticals: [revops]\n${extra}---\n${body}\n`;
const git = (root, args, env = {}) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...env } }).trim();
function commit(root, date, message = "fixture") {
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Sitemap Test", "-c", "user.email=sitemap@example.invalid", "commit", "--allow-empty", "-m", message], { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
}
const noHistory = () => ({ complete: false, dates: new Map(), deleted: [] });
const history = (dates = {}, deleted = []) => () => ({ complete: true, dates: new Map(Object.entries(dates)), deleted });

test("lastmod rejects invalid/future clocks and preserves date-only authored precision", () => {
  assert.equal(validDate("2026-02-28", NOW), "2026-02-28");
  assert.equal(validDate("2026-02-30", NOW), undefined);
  assert.equal(validDate("2026-02-30T12:00:00Z", NOW), undefined);
  assert.equal(validDate("2027-01-01", NOW), undefined);
  assert.equal(validDate("2026-10-01T12:30:00+02:00", NOW), "2026-10-01T10:30:00.000Z");
  for (const value of [undefined, new Date(), "yesterday", "2026-1-1", "2026-01-01T10:00:00", ""]) assert.equal(validDate(value, NOW), undefined);
});

test("meaningful content excludes clock/provenance, trailing whitespace and comments, but includes links, metadata and copy", () => {
  const source = mdx();
  const signature = meaningfulSignature("example.mdx", source);
  assert.equal(meaningfulSignature("example.mdx", source.replace("2026-01-01", "2026-10-01").replace("---\n#", "pricing_checked: '2026-10-01'\nsource_sha256: anything\n---\n#") + "\n<!-- editor only -->\n"), signature);
  assert.equal(meaningfulSignature("example.mdx", source.replace("An original example.", "An original example.   ")), signature);
  assert.notEqual(meaningfulSignature("example.mdx", mdx("alpha", "en", "title: Useful new title\n")), signature);
  assert.notEqual(meaningfulSignature("example.mdx", source.replace("An original example.", "[An original example.](/en/learn/new/)")), signature);
  assert.equal(meaningfulSignature("example.json", '{"a":1,"b":2}'), meaningfulSignature("example.json", '{\n "b":2, "a":1\n}'));
  assert.equal(meaningfulSignature("example.astro", "<h1>Guide</h1><style>old</style><script>old</script>"), meaningfulSignature("example.astro", "<h1>Guide</h1><style>new</style><script>new</script>"));
  assert.notEqual(meaningfulSignature("example.astro", "<h1>Guide</h1>"), meaningfulSignature("example.astro", "<h1>New guide</h1>"));
});

test("canonical route filter excludes redirects, nonlocales, hosts, assets and error/design pages", () => {
  const locales = LOCALES.locales.map((l) => l.code);
  for (const path of ["/", "/design/", "/en/design/", "/en/404/", "/en/500/", "/en/og/", "/en/comparisons/alpha/", "/ro/tools/alpha/", "/en/tools/alpha", "/en/og.svg/", "/en/?sort=name", "/en/#test"]) assert.equal(sitemapRoute(SITE + path, SITE, locales), undefined, path);
  assert.equal(sitemapRoute("https://www.ooligo.com/en/", SITE, locales), undefined);
  assert.equal(sitemapRoute(SITE + "/pt-BR/vs/alpha/", SITE, locales).group, "pt-BR-comparisons");
  assert.equal(sitemapRoute(SITE + "/en/tools/", SITE, locales).group, "en-pages");
  assert.equal(sitemapRoute(SITE + "/en/tools/design/", SITE, locales).group, "en-tools");
});

test("Git dates follow meaningful file revisions, not verification commits or unrelated HEAD", (t) => {
  const root = fixture(t), file = "content/tools/en/alpha.mdx", helper = "apps/web/src/lib/pageMetadata.ts";
  git(root, ["init", "--initial-branch=main"]);
  write(root, file, mdx()); write(root, helper, "export const title = 'original';\n");
  commit(root, "2026-01-01T10:00:00Z");
  const changed = mdx("alpha", "en", "description: Specific new evidence\n");
  write(root, file, changed); commit(root, "2026-02-01T10:00:00Z");
  write(root, file, changed.replace("2026-01-01", "2026-03-01") + "\n<!-- reviewed -->\n"); commit(root, "2026-03-01T10:00:00Z");
  write(root, "README.md", "An unrelated deployment\n"); commit(root, "2026-04-01T10:00:00Z");
  const sources = new Map([[file, readFileSync(join(root, file), "utf8")], [helper, readFileSync(join(root, helper), "utf8")]]);
  const result = revisionDates(root, sources, { now: NOW });
  assert.equal(result.complete, true);
  assert.equal(result.dates.get(file), "2026-02-01T10:00:00.000Z");
  assert.equal(result.dates.get(helper), "2026-01-01T10:00:00.000Z");
  sources.set(file, changed + "\nAn uncommitted fact.\n");
  sources.set("content/tools/en/untracked.mdx", mdx("untracked"));
  const dirty = revisionDates(root, sources, { now: NOW });
  assert.equal(dirty.dates.has(file), false);
  assert.equal(dirty.dates.has("content/tools/en/untracked.mdx"), false);
});

test("rename records date the new URL and record the old URL removal for hubs", (t) => {
  const root = fixture(t), oldFile = "content/tools/en/alpha.mdx", newFile = "content/tools/en/beta.mdx";
  git(root, ["init", "--initial-branch=main"]);
  write(root, oldFile, mdx()); commit(root, "2026-01-01T10:00:00Z");
  renameSync(join(root, oldFile), join(root, newFile)); write(root, newFile, mdx("beta")); commit(root, "2026-02-01T10:00:00Z");
  const result = revisionDates(root, new Map([[newFile, mdx("beta")]]), { now: NOW });
  assert.equal(result.dates.get(newFile), "2026-02-01T10:00:00.000Z");
  assert.deepEqual(result.deleted.map(({ file, date, data }) => ({ file, date, slug: data.slug })), [{ file: oldFile, date: "2026-02-01T10:00:00.000Z", slug: "alpha" }]);
});

test("deletion-only artifact changes update their workflow and index without bumping unrelated workflows", (t) => {
  const root = fixture(t), artifact = "apps/web/public/artifacts/alpha/old-example.py";
  git(root, ["init", "--initial-branch=main"]);
  write(root, "content/workflows/en/alpha.mdx", mdx());
  write(root, "content/workflows/en/beta.mdx", mdx("beta").replace("canonical_slug: alpha", "canonical_slug: beta"));
  write(root, artifact, "print('example')\n"); commit(root, "2026-01-01T10:00:00Z");
  rmSync(join(root, artifact)); commit(root, "2026-02-01T10:00:00Z");
  const paths = ["/en/workflows/alpha/", "/en/workflows/beta/", "/en/workflows/"];
  const { records } = prepareSitemap({ root, site: SITE, pageUrls: paths.map((p) => SITE + p), now: NOW });
  assert.equal(records.get(SITE + paths[0]).lastmod, "2026-02-01T10:00:00.000Z");
  assert.equal(records.get(SITE + paths[1]).lastmod, "2026-01-01T10:00:00.000Z");
  assert.equal(records.get(SITE + paths[2]).lastmod, "2026-02-01T10:00:00.000Z");
});

test("page-specific legal copy and enrichment components date only their dependent pages", (t) => {
  const root = fixture(t);
  git(root, ["init", "--initial-branch=main"]);
  write(root, "apps/web/src/lib/legal/privacy.ts", "export const privacy = 'original';\n");
  write(root, "apps/web/src/lib/legal/contact.ts", "export const contact = 'original';\n");
  write(root, "apps/web/src/lib/enrichmentExampleCopy.ts", "export const copy = 'original';\n");
  write(root, "apps/web/src/components/EnrichmentQuickstart.astro", "<p>Original quickstart.</p>\n");
  write(root, "content/workflows/en/lead-enrichment-clay-claude.mdx", mdx("lead-enrichment-clay-claude"));
  commit(root, "2026-01-01T10:00:00Z");
  write(root, "apps/web/src/lib/legal/privacy.ts", "export const privacy = 'new privacy policy';\n");
  write(root, "apps/web/src/lib/enrichmentExampleCopy.ts", "export const copy = 'new example explanation';\n");
  commit(root, "2026-02-01T10:00:00Z");
  write(root, "apps/web/src/components/EnrichmentQuickstart.astro", "<p>New quickstart command.</p>\n");
  commit(root, "2026-03-01T10:00:00Z");
  const paths = ["/en/privacy/", "/en/contact/", "/en/", "/en/workflows/lead-enrichment-clay-claude/"];
  const { records } = prepareSitemap({ root, site: SITE, pageUrls: paths.map((p) => SITE + p), now: NOW });
  assert.equal(records.get(SITE + paths[0]).lastmod, "2026-02-01T10:00:00.000Z");
  assert.equal(records.get(SITE + paths[1]).lastmod, "2026-01-01T10:00:00.000Z");
  // The homepage also reflects the linked pilot's content revision.
  assert.equal(records.get(SITE + paths[2]).lastmod, "2026-03-01T10:00:00.000Z");
  assert.equal(records.get(SITE + paths[3]).lastmod, "2026-03-01T10:00:00.000Z");
  const homeOnly = prepareSitemap({ root, site: SITE, pageUrls: [SITE + "/en/"], now: NOW });
  assert.equal(homeOnly.records.get(SITE + "/en/").lastmod, "2026-02-01T10:00:00.000Z");
});

test("shallow history warns and never fabricates a boundary commit date", (t) => {
  const root = fixture(t), file = "content/tools/en/alpha.mdx";
  git(root, ["init", "--initial-branch=main"]); write(root, file, mdx()); commit(root, "2026-01-01T10:00:00Z");
  commit(root, "2026-04-01T10:00:00Z");
  const clone = join(root, "shallow");
  git(root, ["clone", "--depth=1", pathToFileURL(root).href, clone]);
  const warnings = [];
  const result = revisionDates(clone, new Map([[file, mdx()]]), { now: NOW, warn: (message) => warnings.push(message) });
  assert.equal(result.complete, false);
  assert.equal(result.dates.size, 0);
  assert.match(warnings[0], /shallow Git history/);
});

test("unavailable Git falls back to valid authored dates; undated static and dirty sources stay undated", (t) => {
  const root = fixture(t), file = "content/tools/en/alpha.mdx";
  write(root, file, mdx());
  const pages = [SITE + "/en/tools/alpha/", SITE + "/en/about/"];
  let result = prepareSitemap({ root, site: SITE, pageUrls: pages, now: NOW, readDates: noHistory });
  assert.equal(result.records.get(pages[0]).lastmod, "2026-01-01");
  assert.equal(result.records.get(pages[1]).lastmod, undefined);
  result = prepareSitemap({ root, site: SITE, pageUrls: pages, now: NOW, readDates: history() });
  assert.equal(result.records.get(pages[0]).lastmod, undefined);
});

test("detail dates include direct rendering helpers and workflow bundle revisions; hubs include removals", (t) => {
  const root = fixture(t);
  write(root, "content/tools/en/alpha.mdx", mdx());
  write(root, "content/workflows/en/alpha.mdx", mdx());
  write(root, "apps/web/public/artifacts/alpha/demo.py", "print('demo')\n");
  const removed = [{ file: "content/tools/en/removed.mdx", date: "2026-06-01", data: { verticals: ["revops"] } }];
  const dates = {
    "content/tools/en/alpha.mdx": "2026-01-01",
    "content/workflows/en/alpha.mdx": "2026-01-01",
    "apps/web/src/lib/pageMetadata.ts": "2026-02-01",
    "apps/web/public/artifacts/alpha/demo.py": "2026-03-01",
  };
  const pages = ["/en/tools/alpha/", "/en/workflows/alpha/", "/en/tools/", "/en/", "/en/r/revops/", "/en/r/legal-ops/"].map((path) => SITE + path);
  const { records } = prepareSitemap({ root, site: SITE, pageUrls: pages, readDates: history(dates, removed) });
  assert.equal(records.get(pages[0]).lastmod, "2026-02-01");
  assert.equal(records.get(pages[1]).lastmod, "2026-03-01");
  for (const page of pages.slice(2, 5)) assert.equal(records.get(page).lastmod, "2026-06-01");
  assert.equal(records.get(pages[5]).lastmod, undefined);
});

test("explicit noindex source is omitted and incorrect locale/slug source fails loudly", (t) => {
  const root = fixture(t);
  write(root, "apps/web/src/pages/[locale]/private.astro", '<meta content="noindex, follow" name="robots" />');
  assert.equal(hasNoindex('<!-- <meta name="robots" content="noindex"> -->'), false);
  assert.equal(prepareSitemap({ root, site: SITE, pageUrls: [SITE + "/en/private/"], readDates: history() }).records.size, 0);
  write(root, "content/tools/en/alpha.mdx", mdx("wrong"));
  assert.throws(() => prepareSitemap({ root, site: SITE, pageUrls: [SITE + "/en/tools/alpha/"], readDates: history() }), /route mismatch/);
});

test("two URLs cannot claim the same language in a translation cluster", (t) => {
  const root = fixture(t);
  write(root, "content/tools/en/alpha.mdx", mdx());
  write(root, "content/tools/en/beta.mdx", mdx("beta"));
  assert.throws(() => prepareSitemap({ root, site: SITE, pageUrls: [SITE + "/en/tools/alpha/", SITE + "/en/tools/beta/"], readDates: history() }), /Duplicate sitemap translation/);
});

async function emit(root, paths, directory = "output") {
  const output = join(root, directory);
  mkdirSync(output);
  const integration = groupedSitemap({ root, site: SITE, readDates: history({ "content/tools/en/alpha.mdx": "2026-02-01", "content/tools/es/alfa.mdx": "2026-03-01" }) });
  const messages = [];
  const logger = Object.fromEntries(["warn", "error", "info"].map((level) => [level, (message) => messages.push({ level, message })]));
  await integration.hooks["astro:config:done"]({ config: { site: SITE, base: "/", trailingSlash: "always", build: { format: "directory" } } });
  integration.hooks["astro:routes:resolved"]({ routes: [] });
  await integration.hooks["astro:build:done"]({ dir: pathToFileURL(output + "/"), pages: paths.map((pathname) => ({ pathname })), logger });
  assert.deepEqual(messages.filter((item) => item.level === "error"), []);
  return new Map(readdirSync(output).map((file) => [file, readFileSync(join(output, file), "utf8")]));
}

test("official writer emits index plus nonempty locale/type groups with reciprocal canonical hreflang", async (t) => {
  const root = fixture(t);
  write(root, "content/tools/en/alpha.mdx", mdx());
  write(root, "content/tools/es/alfa.mdx", mdx("alfa", "es"));
  write(root, "content/learn/en/guide.mdx", mdx("guide"));
  const output = await emit(root, ["", "en/", "es/", "en/tools/", "en/tools/alpha/", "es/tools/alfa/", "en/learn/guide/", "en/design/", "en/404/"]);
  assert.deepEqual([...output.keys()].sort(), ["sitemap-en-learn-0.xml", "sitemap-en-pages-0.xml", "sitemap-en-tools-0.xml", "sitemap-es-pages-0.xml", "sitemap-es-tools-0.xml", "sitemap-index.xml"]);
  const index = output.get("sitemap-index.xml");
  for (const file of output.keys()) if (file !== "sitemap-index.xml") assert.ok(index.includes(`<loc>${SITE}/${file}</loc>`));
  assert.equal((index.match(/<loc>/g) ?? []).length, 5);
  for (const file of ["sitemap-en-tools-0.xml", "sitemap-es-tools-0.xml"]) {
    const xml = output.get(file);
    assert.match(xml, /xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
    for (const [lang, path] of [["en", "/en/tools/alpha/"], ["es", "/es/tools/alfa/"], ["x-default", "/en/tools/alpha/"]]) assert.ok(xml.includes(`hreflang="${lang}" href="${SITE}${path}"`), xml);
    assert.equal((xml.match(/<loc>/g) ?? []).length, 1);
    assert.match(xml, /<lastmod>2026-0[23]-01/);
  }
  assert.ok(![...output.values()].join("").includes(`${SITE}/en/design/`));
  assert.ok(![...output.values()].join("").includes(`<loc>${SITE}/</loc>`));
  assert.ok(![...output.values()].join("").includes('hreflang="pt-BR"'));
});

test("fresh deployment manifests contain only emitted URLs and never stale groups or translations", async (t) => {
  const root = fixture(t);
  write(root, "content/tools/en/alpha.mdx", mdx());
  write(root, "content/tools/es/alfa.mdx", mdx("alfa", "es"));
  await emit(root, ["en/tools/alpha/", "es/tools/alfa/"], "first-output");
  const output = await emit(root, ["en/tools/alpha/"], "next-output");
  assert.deepEqual([...output.keys()].sort(), ["sitemap-en-tools-0.xml", "sitemap-index.xml"]);
  assert.ok(![...output.values()].join("").includes("es/tools/alfa"));
  assert.ok(!output.get("sitemap-index.xml").includes("sitemap-es-tools"));
  assert.equal((output.get("sitemap-en-tools-0.xml").match(/hreflang=/g) ?? []).length, 2);
});
