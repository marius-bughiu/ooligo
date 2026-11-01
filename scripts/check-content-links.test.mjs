import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkDocuments, checkRepository, createRouteIndex, extractLinks, linkProblem, staticPageUrls } from "./check-content-links.mjs";

const config = { locales: ["en", "es", "pt-BR"], verticals: ["revops", "customer-success"], staticPaths: ["/en/about/"] };
const doc = (collection, locale, slug, body = "") => ({ file: `content/${collection}/${locale}/${slug}.mdx`, data: { locale, slug }, body });
const documents = [doc("tools", "en", "clay"), doc("tools", "es", "clay"), doc("tools", "pt-BR", "clay"), doc("comparisons", "en", "clay-vs-apollo")];
const index = createRouteIndex(documents, config.locales, config.verticals, config.staticPaths);

test("valid frontmatter routes retain locale, map comparisons to vs and accept query/fragment variants", () => {
  for (const href of ["/en/tools/clay/", "/en/tools/clay?ref=guide#pricing", "/es/tools/clay/", "/pt-BR/tools/clay/", "/en/vs/clay-vs-apollo/", "/en/tools/", "/en/r/customer-success/", "/en/about/"]) {
    assert.equal(linkProblem(href, "/en/learn/guide/", index), null, href);
  }
});

test("every reported legacy defect fails without grandfathering", () => {
  for (const href of ["/tools/clay", "/en/tools/gong.", "/en/r/cs/", "/en/stacks/legal-ops/", "/en/comparisons/clay-vs-apollo/"]) {
    assert.equal(typeof linkProblem(href, "/en/tools/clay/", index), "string", href);
  }
});

test("unsupported locale and case differences fail even on case-insensitive filesystems", () => {
  for (const href of ["/ro/tools/clay/", "/pt-br/tools/clay/", "/EN/tools/clay/", "/en/Tools/clay/", "/en/tools/Clay/"]) {
    assert.equal(typeof linkProblem(href, "/en/tools/clay/", index), "string", href);
  }
});

test("absolute apex/www and relative links are checked, unrelated origins and assets are excluded", () => {
  assert.equal(linkProblem("https://www.ooligo.com/en/tools/clay/", "/en/learn/guide/", index), null);
  assert.equal(linkProblem("http://ooligo.com/en/tools/missing/", "/en/learn/guide/", index), "no page at /en/tools/missing/");
  assert.equal(linkProblem("../clay/", "/en/tools/apollo/", index), null);
  for (const href of ["https://example.com/en/tools/missing/", "https://ooligo.com.example.org/en/tools/missing/", "mailto:hello@ooligo.com", "#missing-heading", "/artifacts/demo.zip", "/api/signup"]) {
    assert.equal(linkProblem(href, "/en/tools/clay/", index), undefined, href);
  }
});

test("broken encoded links and localized missing entries are not mistaken for assets", () => {
  assert.equal(linkProblem("/en/tools/%63lay/", "/en/learn/guide/", index), null);
  assert.match(linkProblem("/en/tools/%QQ/", "/en/learn/guide/", index), /encoding/);
  assert.match(linkProblem("/es/vs/clay-vs-apollo/", "/es/tools/clay/", index), /no page/);
  assert.match(linkProblem("/en/tools/missing.html", "/en/tools/clay/", index), /no page/);
});

test("Markdown links support angle destinations, link titles, escaped and balanced parentheses", () => {
  const links = extractLinks('[Clay](/en/tools/clay/ "Tool")\n[Guide](</en/learn/guide/>)\n[URL](https://example.com/a_(b))\n[Escaped](/en/learn/a\\(b\\)/)');
  assert.deepEqual(links, [
    { href: "/en/tools/clay/", line: 1 }, { href: "/en/learn/guide/", line: 2 },
    { href: "https://example.com/a_(b)", line: 3 }, { href: "/en/learn/a(b)/", line: 4 },
  ]);
});

test("reference links resolve full, collapsed and shortcut uses; unused definitions do not become links", () => {
  const links = extractLinks('[Product][CLAY]\n[clay][]\n[clay]\n![clay]\n\n[clay]: /en/tools/clay/ "Title"\n[unused]: /en/tools/missing/');
  assert.deepEqual(links, [1, 2, 3].map((line) => ({ href: "/en/tools/clay/", line })));
});

test("literal HTML/MDX hrefs and autolinks are checked without evaluating JSX", () => {
  const body = '<a href="/en/tools/clay/?x=1&amp;y=2">Clay</a>\n<Link href={"/es/tools/clay/"} />\n<a href={makeUrl()}>Dynamic</a>\n<https://ooligo.com/en/tools/clay/>';
  assert.deepEqual(extractLinks(body), [
    { href: "/en/tools/clay/?x=1&y=2", line: 1 }, { href: "/es/tools/clay/", line: 2 }, { href: "https://ooligo.com/en/tools/clay/", line: 4 },
  ]);
});

test("code examples, comments and images do not create page-link errors; source line numbers survive", () => {
  const body = '```md\n[Example](/tools/missing)\n````\n\n~~~md\n<a href="/tools/missing">Example</a>\n~~~\n\n`[Inline](/tools/missing)`\n<!-- [Hidden](/tools/missing) -->\n{/* <a href="/tools/missing" /> */}\n![Image](/tools/missing)\n[Real](/en/tools/clay/)';
  assert.deepEqual(extractLinks(body), [{ href: "/en/tools/clay/", line: 13 }]);
  assert.deepEqual(extractLinks('```md\n[Unclosed code](/tools/missing)'), []);
});

test("route identity mismatches and duplicate published URLs fail", () => {
  const mismatch = { ...doc("tools", "en", "clay"), data: { locale: "es", slug: "clay" } };
  const slugMismatch = { ...doc("tools", "en", "clay"), data: { locale: "en", slug: "apollo" } };
  assert.equal(createRouteIndex([mismatch, slugMismatch], config.locales, []).problems.length, 2);
  assert.equal(createRouteIndex([documents[0], documents[0]], config.locales, []).problems.length, 1);
});

test("deleting or renaming a destination breaks inbound links; adding its locale restores them", () => {
  const referring = doc("learn", "en", "guide", "[Clay](/es/tools/clay/)");
  assert.equal(checkDocuments([...documents, referring], config).problems.length, 0);
  assert.equal(checkDocuments([documents[0], referring], config).problems.length, 1);
  assert.equal(checkDocuments([documents[0], doc("tools", "es", "new-name"), referring], config).problems.length, 1);
  const result = checkDocuments([{ ...referring, lineOffset: 8 }], config);
  assert.equal(result.problems[0].line, 9);
});

test("repository scan reads source routes/static pages without generated output", () => {
  const root = mkdtempSync(join(tmpdir(), "ooligo-links-"));
  const put = (file, text) => { mkdirSync(join(root, file, ".."), { recursive: true }); writeFileSync(join(root, file), text); };
  try {
    put("content/locales.json", JSON.stringify({ locales: [{ code: "en" }] }));
    put("content/verticals.json", JSON.stringify({ verticals: [{ slug: "revops" }] }));
    for (const collection of ["tools", "comparisons", "learn", "workflows", "stacks"]) mkdirSync(join(root, "content", collection), { recursive: true });
    put("apps/web/src/pages/[locale]/about.astro", "");
    put("apps/web/src/pages/[locale]/index.astro", "");
    put("content/tools/en/clay.mdx", '---\nslug: clay\nlocale: en\n---\n[About](/en/about/)\n[Home](/en/)\n[Missing](/tools/gone/)\n');
    const result = checkRepository(root);
    assert.equal(result.files, 1);
    assert.equal(result.checked, 3);
    assert.deepEqual(result.problems, [{ file: "content/tools/en/clay.mdx", line: 7, href: "/tools/gone/", reason: "missing locale prefix" }]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("static index files map to directory URLs, never /index/ pages", () => {
  assert.deepEqual(staticPageUrls("index.astro", config.locales), ["/"]);
  assert.deepEqual(staticPageUrls("[locale]/index.astro", config.locales), ["/en/", "/es/", "/pt-BR/"]);
  assert.deepEqual(staticPageUrls("[locale]/tools/index.astro", ["en"]), ["/en/tools/"]);
  assert.deepEqual(staticPageUrls("[locale]/tools/[slug].astro", ["en"]), []);
  const routes = createRouteIndex(documents, config.locales, [], staticPageUrls("[locale]/index.astro", config.locales));
  for (const href of ["/en/index/", "/en/tools/index/", "/en/Index/"]) assert.match(linkProblem(href, "/en/tools/clay/", routes), /no page/);
});
