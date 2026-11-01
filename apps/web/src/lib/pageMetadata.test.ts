import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import matter from "gray-matter";
import { openingParagraph, pageDescription, toolPageTitle } from "./pageMetadata";

test("authored metadata takes precedence without changing product identity", () => {
  const tool = { name: "Clay", title: " Clay: enrichment costs and workflow fit ", locale: "en" };
  assert.equal(toolPageTitle(tool), "Clay: enrichment costs and workflow fit");
  assert.equal(tool.name, "Clay");
  assert.equal(pageDescription({ ...tool, description: " Authored summary. ", body: "Unrelated text." }), "Authored summary.");
});

test("tool title fallbacks use each locale", () => {
  const endings = { en: "pricing and features", es: "precios y funciones", "pt-BR": "preços e recursos", de: "Preise und Funktionen", fr: "tarifs et fonctionnalités", ja: "の料金と機能" };
  for (const [locale, ending] of Object.entries(endings)) {
    assert.ok(toolPageTitle({ name: "Example", locale }).endsWith(ending));
  }
});

test("descriptions select prose, skipping frontmatter, imports, notes, tables, lists and fences", () => {
  const body = '---\ntitle: Hidden\n---\n\nimport Card from "./Card.astro";\n\n# Heading\n\n> Editorial note that must never become a search description.\n\n| Name | Value |\n| --- | --- |\n\n- A list item that is not opening prose.\n\n```js\nconst secret = "Code must not become a description";\n````\n\n<Callout>Component content must not become metadata.</Callout>\n\n**Clay** checks [company data](https://example.com/docs_(company)) and keeps `crm_id` alongside _source evidence_ &amp; review decisions.\n\nAnother paragraph.';
  assert.equal(openingParagraph(body), "Clay checks company data and keeps crm_id alongside source evidence & review decisions.");
});

test("unclosed fences and MDX expressions never become metadata", () => {
  assert.equal(openingParagraph('~~~js\nCode without a closing fence should never become a description.'), undefined);
  assert.equal(openingParagraph('{dangerousExpression}\n\n<Widget />'), undefined);
  assert.equal(pageDescription({ body: "# A heading only", title: "CRM-Daten", locale: "de" }), "Informationen zu CRM-Daten auf ooligo.");
});

test("excerpts are bounded without cutting Latin words or Unicode characters", () => {
  const english = pageDescription({ body: "Evidence-based classification and review. ".repeat(12), title: "Example", locale: "en" });
  assert.ok(Array.from(english).length <= 160);
  assert.ok(english.endsWith("…"));
  assert.ok(!english.endsWith("classific…"));
  const japanese = pageDescription({ body: "根拠を確認してからデータを更新します。😀".repeat(12), title: "例", locale: "ja" });
  assert.equal(Array.from(japanese).length, 160);
  assert.doesNotMatch(japanese, /\p{Surrogate}/u);
});

test("real non-English pages retain their own opening prose and pilot descriptions", () => {
  const root = fileURLToPath(new URL("../../../..", import.meta.url));
  for (const locale of ["es", "pt-BR", "de", "fr", "ja"]) {
    const raw = readFileSync(`${root}/content/tools/${locale}/hubspot.mdx`, "utf8");
    const { data, content } = matter(raw);
    const description = pageDescription({ title: data.name, locale, body: content });
    assert.ok(openingParagraph(content)?.startsWith(description.replace(/…$/, "")));
    assert.ok(!description.includes("AI-native: yes"));
    const pilot = matter(readFileSync(`${root}/content/workflows/${locale}/lead-enrichment-clay-claude.mdx`, "utf8"));
    assert.equal(pageDescription({ title: pilot.data.title, locale, body: pilot.content, description: pilot.data.description }), pilot.data.description);
    const stack = matter(readFileSync(`${root}/content/stacks/${locale}/ai-sdr-stack.mdx`, "utf8"));
    const stackDescription = pageDescription({ ...stack.data, title: stack.data.title, locale, body: stack.content });
    assert.ok(openingParagraph(stack.content)?.startsWith(stackDescription.replace(/…$/, "")));
    assert.notEqual(stackDescription, stack.data.use_case);
  }
});

test("real Japanese inline emphasis is removed without losing literal asterisks", () => {
  const root = fileURLToPath(new URL("../../../..", import.meta.url));
  for (const path of ["tools/ja/influ2", "comparisons/ja/canny-vs-productboard", "learn/ja/ats-vs-recruiting-crm", "workflows/ja/interview-debrief-summary-skill"]) {
    const { data, content } = matter(readFileSync(`${root}/content/${path}.mdx`, "utf8"));
    const description = pageDescription({ title: data.title ?? data.name, locale: "ja", body: content });
    assert.doesNotMatch(description, /\*/);
  }
  const cargo = matter(readFileSync(`${root}/content/tools/de/cargo.mdx`, "utf8"));
  assert.match(openingParagraph(cargo.content) ?? "", /define\*-Aufruf/);
  const hiring = matter(readFileSync(`${root}/content/comparisons/de/hackerrank-vs-codesignal.mdx`, "utf8"));
  assert.match(openingParagraph(hiring.content) ?? "", /Ingenieur\*innen/);
});
