import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import matter from "gray-matter";
import { prioritizeLinks, selectToolLinks, selectVerticalLinks, TOOL_LINKS, VERTICAL_LINKS } from "./relatedLinks";

type Data = Parameters<typeof selectToolLinks>[1] & { ooligo_score?: number | null };
type Entry = { data: Data };
const root = fileURLToPath(new URL("../../../..", import.meta.url));
const locales = ["en", "es", "pt-BR", "de", "fr", "ja"];
const kinds = ["tools", "workflows", "comparisons", "learn"] as const;
const catalog = Object.fromEntries(kinds.map(kind => [kind, locales.flatMap(locale => {
  return readdirSync(`${root}/content/${kind}/${locale}`).filter(file => file.endsWith(".mdx")).map(file => ({
    data: matter(readFileSync(`${root}/content/${kind}/${locale}/${file}`, "utf8")).data as Data,
  }));
})])) as Record<typeof kinds[number], Entry[]>;
const verticals: { slug: string; starter_tools: string[] }[] = JSON.parse(readFileSync(`${root}/content/verticals.json`, "utf8")).verticals;
const slugs = (entries: readonly Entry[]) => entries.map(entry => entry.data.slug);
const reversed = Object.fromEntries(kinds.map(kind => [kind, [...catalog[kind]].reverse()])) as typeof catalog;

test("all four verticals have intentional, existing selections in each destination locale", () => {
  assert.deepEqual(Object.keys(VERTICAL_LINKS).sort(), verticals.map(vertical => vertical.slug).sort());
  for (const locale of locales) for (const vertical of verticals) {
    const selected = selectVerticalLinks(catalog, locale, vertical.slug, vertical.starter_tools);
    const expectedCounts = { tools: 6, workflows: 6, comparisons: 4, learn: 4 };
    for (const kind of kinds) {
      assert.equal(selected[kind].length, expectedCounts[kind]);
      assert.equal(new Set(slugs(selected[kind])).size, selected[kind].length);
      for (const entry of selected[kind]) {
        assert.equal(entry.data.locale, locale);
        assert.ok(entry.data.verticals?.includes(vertical.slug), `${vertical.slug}: ${entry.data.slug}`);
      }
      // Curated references must not silently disappear due to a typo or missing translation.
      for (const slug of VERTICAL_LINKS[vertical.slug]![kind]) assert.ok(selected[kind].some(entry => entry.data.slug === slug), `${locale}/${kind}/${slug}`);
    }
    for (const entry of selected.workflows) assert.ok(existsSync(`${root}/apps/web/public/artifacts/${entry.data.slug}`));
    assert.deepEqual(selected, selectVerticalLinks(reversed, locale, vertical.slug, vertical.starter_tools));
  }
});

test("unscored enrichment tools and their next-step guides appear on all RevOps hubs", () => {
  const unscored = { ...catalog, tools: catalog.tools.map(entry => ["clay", "apollo", "claude"].includes(entry.data.slug)
    ? { ...entry, data: { ...entry.data, ooligo_score: undefined } } : entry) };
  for (const locale of locales) {
    const selected = selectVerticalLinks(unscored, locale, "revops", []);
    for (const slug of ["clay", "apollo", "claude"]) {
      const tool = selected.tools.find(entry => entry.data.slug === slug);
      assert.ok(tool, `${locale}: ${slug}`);
      assert.equal(tool.data.ooligo_score == null, true);
    }
    assert.equal(selected.workflows[0]?.data.slug, "lead-enrichment-clay-claude");
    assert.equal(selected.comparisons[0]?.data.slug, "clay-vs-apollo");
    assert.equal(selected.learn[0]?.data.slug, "data-enrichment-strategies");
  }
});

test("Clay, Apollo and Claude preserve the enrichment path and only link translated targets", () => {
  for (const locale of locales) for (const slug of Object.keys(TOOL_LINKS)) {
    const tool = catalog.tools.find(entry => entry.data.locale === locale && entry.data.slug === slug)!;
    const selected = selectToolLinks(catalog, tool.data);
    assert.equal(selected.workflows[0]?.data.slug, "lead-enrichment-clay-claude");
    assert.equal(selected.learn[0]?.data.slug, "data-enrichment-strategies");
    for (const [kind, entries] of Object.entries(selected)) {
      assert.ok(entries.every(entry => entry.data.locale === locale));
      for (const preferred of TOOL_LINKS[slug]![kind as keyof typeof selected]) assert.ok(entries.some(entry => entry.data.slug === preferred), `${locale}/${slug}: ${preferred}`);
    }
    assert.ok(!selected.alternatives.some(entry => entry.data.slug === slug));
    assert.deepEqual(selected, selectToolLinks(reversed, tool.data));
  }
});

test("a missing curated translation is replaced within the same locale and vertical", () => {
  const fewer = { ...catalog, workflows: catalog.workflows.filter(entry => !(entry.data.locale === "ja" && entry.data.slug === "lead-enrichment-clay-claude")) };
  const selected = selectVerticalLinks(fewer, "ja", "revops", []);
  assert.equal(selected.workflows.length, 6);
  assert.ok(selected.workflows.every(entry => entry.data.locale === "ja" && entry.data.verticals?.includes("revops")));
  assert.ok(!selected.workflows.some(entry => entry.data.slug === "lead-enrichment-clay-claude"));
});

test("fallbacks prefer real relationships over alphabetical order and ignore quality scores", () => {
  const entry = (slug: string, extra: Partial<Data> = {}): Entry => ({ data: { slug, locale: "en", verticals: ["revops"], ...extra } });
  const tool = entry("target", { category: "crm" });
  const input = {
    tools: [tool, entry("a-unrelated", { category: "crm", ooligo_score: 10 }), entry("z-compared", { category: "crm" })],
    workflows: [entry("a-unrelated"), entry("use-target", { tools_used: ["target"] }), entry("foreign", { locale: "es", tools_used: ["target"] })],
    comparisons: [entry("direct", { type: "pairwise", tool_a: "target", tool_b: "z-compared" })],
    learn: [entry("a-related-tool", { related_tools: ["target"] }), entry("z-workflow-guide", { related_tools: ["target"], related_workflows: ["use-target"] }), entry("unrelated")],
  };
  const selected = selectToolLinks(input, tool.data);
  assert.equal(selected.alternatives[0]?.data.slug, "z-compared");
  assert.deepEqual(slugs(selected.workflows), ["use-target"]);
  assert.deepEqual(slugs(selected.learn), ["z-workflow-guide", "a-related-tool"]);
  assert.deepEqual(slugs(input.tools), ["target", "a-unrelated", "z-compared"]);
  assert.deepEqual(slugs(prioritizeLinks([entry("z"), entry("a"), entry("a")], { locale: "en", limit: 3 })), ["a", "z"]);
});

test("automatic tool clusters retain distinct identities and all detail rails stay locale-safe", () => {
  for (const tool of catalog.tools) {
    const selected = selectToolLinks(catalog, tool.data);
    for (const entries of Object.values(selected)) {
      assert.ok(entries.every(entry => entry.data.locale === tool.data.locale));
      assert.equal(new Set(slugs(entries)).size, entries.length);
    }
    assert.ok(!selected.alternatives.some(entry => entry.data.slug === tool.data.slug));
  }
  for (const locale of locales) {
    const tool = catalog.tools.find(entry => entry.data.slug === "claude-for-legal" && entry.data.locale === locale)!;
    assert.ok(selectToolLinks(catalog, tool.data).comparisons.some(entry => entry.data.slug === "claude-for-legal-vs-harvey"));
    const general = catalog.tools.find(entry => entry.data.slug === "claude" && entry.data.locale === locale)!;
    assert.ok(!selectToolLinks(catalog, general.data).comparisons.some(entry => entry.data.slug === "claude-for-legal-vs-harvey"));
  }
});
