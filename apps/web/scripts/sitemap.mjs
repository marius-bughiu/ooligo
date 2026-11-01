import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import matter from "gray-matter";
import { revisionDates, validDate } from "./sitemap-dates.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const COLLECTIONS = { tools: "tools", vs: "comparisons", workflows: "workflows", learn: "learn", stacks: "stacks" };
const IGNORED_ARTIFACTS = /(?:^|\/)(?:__pycache__|node_modules|\.git|\.venv|__MACOSX)(?:\/|$)|\.(?:zip|pyc|pyo|swp|swo)$|(?:^|\/)(?:\.DS_Store|Thumbs\.db)$/;
const ENRICHMENT_SOURCES = ["apps/web/src/lib/enrichmentExampleData.ts", "apps/web/src/lib/enrichmentExampleCopy.ts", "apps/web/src/components/EnrichmentExample.astro"];
const maxDate = (dates) => dates.filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0];

export function sitemapRoute(url, site, locales) {
  let parsed;
  try { parsed = new URL(url); } catch { return undefined; }
  if (parsed.origin !== new URL(site).origin || parsed.search || parsed.hash || !parsed.pathname.endsWith("/")) return undefined;
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (!parts.length || !locales.includes(parts[0]) || ["design", "og", "404", "500", "comparisons"].includes(parts[1]) || parts.at(-1)?.includes(".")) return undefined;
  const [locale, section, slug] = parts;
  const collection = parts.length === 3 ? COLLECTIONS[section] : undefined;
  const type = collection ? "detail" : parts.length === 2 && COLLECTIONS[section] ? "index" : section === "r" && parts.length === 3 ? "vertical" : parts.length === 1 ? "home" : "static";
  return { url: parsed.href, locale, section, slug, collection, type, group: `${locale}-${collection ?? "pages"}` };
}

function sourceFor(route) {
  if (route.type === "detail") return `content/${route.collection}/${route.locale}/${route.slug}.mdx`;
  if (route.type === "home") return "apps/web/src/pages/[locale]/index.astro";
  if (route.type === "index") return `apps/web/src/pages/[locale]/${route.section}/index.astro`;
  if (route.type === "vertical") return "apps/web/src/pages/[locale]/r/[vertical].astro";
  return `apps/web/src/pages/[locale]/${route.section}.astro`;
}

export function hasNoindex(source) {
  return [...source.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<meta\b[^>]*>/gi)].some(([tag]) =>
    /\bname\s*=\s*["']robots["']/i.test(tag) && /\bcontent\s*=\s*["'][^"']*\bnoindex\b/i.test(tag));
}

function artifactFiles(root, directory) {
  const absolute = join(root, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const file = directory + "/" + entry.name;
    if (IGNORED_ARTIFACTS.test(file)) return [];
    return entry.isDirectory() ? artifactFiles(root, file) : [file];
  });
}

/** Source dates for the emitted pages only; never inspect generated HTML/output. */
export function prepareSitemap({ root = ROOT, site, pageUrls, now = new Date(), readDates = revisionDates, warn = () => {} }) {
  const localeConfig = JSON.parse(readFileSync(join(root, "content/locales.json"), "utf8"));
  const locales = localeConfig.locales.map((locale) => locale.code);
  const records = new Map();
  const sources = new Map();
  const read = (file) => {
    if (!sources.has(file) && existsSync(join(root, file))) sources.set(file, readFileSync(join(root, file), "utf8"));
    return sources.get(file);
  };
  for (const url of [...new Set(pageUrls)].sort()) {
    const route = sitemapRoute(url, site, locales);
    if (!route) continue;
    route.source = sourceFor(route);
    const source = read(route.source);
    // A route with an unknown source has no trustworthy date, but can still be
    // emitted by Astro. Explicit source noindex directives remain excluded.
    if (source && hasNoindex(source)) continue;
    route.dependencies = [route.source];
    if (route.type === "detail") {
      if (source == null) throw new Error(`Missing sitemap content source: ${route.source}`);
      route.data = matter(source).data;
      if (route.data.slug !== route.slug || route.data.locale !== route.locale) throw new Error(`Sitemap route mismatch: ${url}`);
      route.dependencies.push(`apps/web/src/pages/[locale]/${route.section}/[slug].astro`, "apps/web/src/lib/pageMetadata.ts");
      if (["vs", "tools"].includes(route.section)) route.dependencies.push("apps/web/src/lib/comparisonTitle.ts");
      // These profiles supply the visible comparison/specification tables.
      const toolSlugs = route.section === "vs" ? [route.data.tool_a, route.data.tool_b, ...(route.data.tools ?? [])] : route.section === "stacks" ? route.data.tools ?? [] : route.section === "workflows" ? route.data.tools_used ?? [] : [];
      route.dependencies.push(...toolSlugs.filter(Boolean).map((slug) => `content/tools/${route.locale}/${slug}.mdx`));
      if (route.section === "workflows") route.dependencies.push("apps/web/src/components/ArtifactBrowser.astro", ...artifactFiles(root, `apps/web/public/artifacts/${route.slug}`));
      if (route.section === "workflows" && route.slug === "lead-enrichment-clay-claude") route.dependencies.push(...ENRICHMENT_SOURCES, "apps/web/src/components/EnrichmentQuickstart.astro", "apps/web/src/components/SampleFeedback.astro");
    }
    if (route.section === "tools" || route.type === "vertical") route.dependencies.push("apps/web/src/lib/relatedLinks.ts");
    if (route.type === "vertical" || route.type === "home") route.dependencies.push("content/verticals.json");
    if (route.type === "home") route.dependencies.push(...ENRICHMENT_SOURCES);
    if (route.type === "static" && ["about", "contact", "privacy", "terms"].includes(route.section)) route.dependencies.push("apps/web/src/lib/legalStrings.ts", `apps/web/src/lib/legal/${route.section}.ts`, "apps/web/src/components/LegalPageView.astro");
    for (const file of route.dependencies) read(file);
    records.set(url, route);
  }
  const history = readDates(root, sources, { now, warn });
  for (const record of records.values()) {
    const bundleRemovals = record.section === "workflows" && record.type === "detail" ? history.deleted.filter((deleted) => deleted.file.startsWith(`apps/web/public/artifacts/${record.slug}/`) && !IGNORED_ARTIFACTS.test(deleted.file)).map((deleted) => deleted.date) : [];
    record.lastmod = maxDate([...record.dependencies.map((file) => history.dates.get(file)), ...bundleRemovals]);
    // Authored body dates are a conservative fallback, never the shallow
    // boundary, checkout mtime, build time, or unrelated HEAD commit date.
    if (!history.complete && record.data) record.lastmod = validDate(record.data.last_updated, now);
  }
  const details = [...records.values()].filter((record) => record.type === "detail");
  for (const record of records.values()) {
    if (!["index", "home", "vertical"].includes(record.type)) continue;
    const relevant = (data, collection, locale) => locale === record.locale && (
      record.type === "home" ||
      record.type === "index" && collection === COLLECTIONS[record.section] ||
      record.type === "vertical" && collection !== "stacks" && (data?.verticals ?? []).includes(record.slug)
    );
    const memberDates = details.filter((member) => relevant(member.data, member.collection, member.locale)).map((member) => member.lastmod);
    const deletionDates = history.deleted.filter((deleted) => {
      if (!deleted.file.startsWith("content/")) return false;
      const [, collection, locale] = deleted.file.split("/");
      return relevant(deleted.data, collection, locale);
    }).map((deleted) => deleted.date);
    record.lastmod = maxDate([record.lastmod, ...memberDates, ...deletionDates]);
  }
  // Only emitted, indexable translations are alternates. Content identity is
  // canonical_slug, not an assumption that translated slugs never change.
  const clusters = new Map();
  for (const record of records.values()) {
    const key = record.type === "detail" ? `${record.collection}:${record.data.canonical_slug ?? record.slug}` : new URL(record.url).pathname.replace(`/${record.locale}/`, "/");
    if (!clusters.has(key)) clusters.set(key, []);
    record.links = clusters.get(key);
    const hreflang = localeConfig.locales.find((locale) => locale.code === record.locale).hreflang;
    if (record.links.some((link) => link.lang === hreflang)) throw new Error(`Duplicate sitemap translation: ${key} (${hreflang})`);
    record.links.push({ url: record.url, lang: hreflang });
  }
  return { records, locales: localeConfig.locales, defaultLocale: localeConfig.default_locale };
}

/** Keep the official sitemap writer and its escaping/limits; change its inputs. */
export function groupedSitemap({ root = ROOT, site, readDates = revisionDates } = {}) {
  const localeConfig = JSON.parse(readFileSync(join(root, "content/locales.json"), "utf8"));
  let state;
  const chunks = Object.fromEntries(localeConfig.locales.flatMap(({ code }) =>
    [...Object.values(COLLECTIONS), "pages"].map((collection) => [`${code}-${collection}`, (item) => state?.records.get(item.url)?.group === `${code}-${collection}` ? item : undefined])));
  const integration = sitemap({
    filenameBase: "sitemap",
    filter: (url) => Boolean(state?.records.has(url)),
    i18n: { defaultLocale: localeConfig.default_locale, locales: Object.fromEntries(localeConfig.locales.map((locale) => [locale.code, locale.hreflang])) },
    serialize: (item) => {
      const record = state.records.get(item.url);
      if (!record) return undefined;
      const links = record.links;
      const defaultLink = links.find((link) => link.lang === state.locales.find((locale) => locale.code === state.defaultLocale).hreflang);
      return { ...item, lastmod: record.lastmod, links: defaultLink ? [...links, { url: defaultLink.url, lang: "x-default" }] : links };
    },
    chunks,
  });
  const buildDone = integration.hooks["astro:build:done"];
  integration.hooks["astro:build:done"] = async (options) => {
    // Prepare before the official writer's catch-and-log serialization block:
    // invalid source metadata must fail the build, not silently omit a sitemap.
    state = prepareSitemap({ root, site, readDates, pageUrls: options.pages.map(({ pathname }) => new URL(pathname, site).href), warn: (message) => options.logger.warn(message) });
    await buildDone(options);
  };
  return integration;
}
