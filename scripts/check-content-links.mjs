#!/usr/bin/env node
/**
 * Check authored page links without Astro, generated output, or network calls.
 * Uses the same frontmatter routes as build:page, but checks the entire catalog
 * and does not exempt previously broken links. Scope: Markdown links/references,
 * autolinks and literal HTML/MDX hrefs to content, vertical and static pages.
 * Assets, dynamic JSX URLs and fragment IDs still need their own/build checks.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://ooligo.com";
const SECTIONS = { tools: "tools", comparisons: "vs", workflows: "workflows", learn: "learn", stacks: "stacks" };
const PAGE_SECTIONS = new Set([...Object.values(SECTIONS), "comparisons", "r"]);
const blank = (s) => s.replace(/[^\r\n]/g, " ");
const normalizeLabel = (s) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** Keep offsets/line numbers while hiding examples that do not render as links. */
function linkSource(body) {
  let fence;
  const lines = body.split(/(?<=\n)/).map((line) => {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = undefined;
      return blank(line);
    }
    if (match) { fence = match[1]; return blank(line); }
    return line;
  });
  return lines.join("")
    .replace(/<!--[\s\S]*?-->|\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/(`+)([\s\S]*?)\1(?!`)/g, blank);
}

function decodeHref(value) {
  return value.replace(/\\([\\()[\]<>])/g, "$1")
    .replace(/&(?:amp|quot|apos|lt|gt);/g, (entity) => ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" })[entity]);
}

// A Markdown destination can contain balanced parentheses or be <angle-wrapped>.
function destination(source, start) {
  let i = start;
  while (/\s/.test(source[i] ?? "") && i < source.length) i++;
  if (source[i] === "<") {
    const end = source.indexOf(">", i + 1);
    if (end < 0 || /\n/.test(source.slice(i, end))) return undefined;
    return { href: source.slice(i + 1, end), end: end + 1 };
  }
  const begin = i;
  let depth = 0;
  for (; i < source.length; i++) {
    if (source[i] === "\\") { i++; continue; }
    if (/\s/.test(source[i])) break;
    if (source[i] === "(") depth++;
    if (source[i] === ")") { if (depth === 0) break; depth--; }
  }
  return i > begin ? { href: source.slice(begin, i), end: i } : undefined;
}

export function extractLinks(body) {
  let source = linkSource(body);
  const links = [];
  const add = (href, offset) => links.push({ href: decodeHref(href), line: source.slice(0, offset).split("\n").length });
  const definitions = new Map();
  const definitionPattern = /^ {0,3}\[([^\]\n]+)\]:[ \t]*/gm;
  const spans = [];
  for (const match of source.matchAll(definitionPattern)) {
    const dest = destination(source, match.index + match[0].length);
    if (dest) definitions.set(normalizeLabel(match[1]), dest.href);
    const end = source.indexOf("\n", match.index);
    spans.push([match.index, end < 0 ? source.length : end]);
  }
  for (const [start, end] of spans.reverse()) source = source.slice(0, start) + blank(source.slice(start, end)) + source.slice(end);

  const inline = /(?<!!)\[(?:\\.|[^\]\\])*\]\([ \t\n]*/g;
  for (const match of source.matchAll(inline)) {
    const dest = destination(source, match.index + match[0].length);
    if (dest) add(dest.href, match.index);
  }
  // Full [label][id], collapsed [id][] and shortcut [id] references.
  for (const match of source.matchAll(/(?<!!)\[([^\]\n]+)\](?:\[([^\]\n]*)\])?/g)) {
    if (source[match.index + match[0].length] === "(") continue;
    const href = definitions.get(normalizeLabel(match[2] || match[1]));
    if (href) add(href, match.index);
  }
  for (const match of source.matchAll(/<[A-Za-z][\w.-]*\b[^>]*>/g)) {
    const href = /\bhref\s*=\s*(?:\{\s*)?(?:"([^"]*)"|'([^']*)')/.exec(match[0]);
    if (href) add(href[1] ?? href[2], match.index);
  }
  for (const match of source.matchAll(/<(https?:\/\/[^\s<>]+)>/g)) add(match[1], match.index);
  return links;
}

export function createRouteIndex(documents, locales, verticals, staticPaths = []) {
  const routes = new Map();
  const problems = [];
  for (const doc of documents) {
    const parts = doc.file.replace(/\\/g, "/").split("/");
    const [collection, directoryLocale, filename] = parts.slice(-3);
    const { slug, locale } = doc.data;
    if (!SECTIONS[collection] || !locales.includes(locale) || directoryLocale !== locale || filename !== `${slug}.mdx` || !/^[a-z0-9-]+$/.test(slug ?? "")) {
      problems.push({ file: doc.file, line: 1, reason: "frontmatter route does not match its collection, supported locale and filename" });
      continue;
    }
    const url = `/${locale}/${SECTIONS[collection]}/${slug}/`;
    if (routes.has(url)) problems.push({ file: doc.file, line: 1, reason: `duplicate route ${url} (also ${routes.get(url)})` });
    routes.set(url, doc.file);
  }
  for (const locale of locales) {
    routes.set(`/${locale}/`, "locale homepage");
    for (const section of Object.values(SECTIONS)) routes.set(`/${locale}/${section}/`, "collection index");
    for (const vertical of verticals) routes.set(`/${locale}/r/${vertical}/`, "vertical page");
  }
  for (const url of staticPaths) routes.set(url, "static page");
  return { routes, locales, problems };
}

export function linkProblem(href, pageUrl, index) {
  if (!href || href.startsWith("#")) return undefined;
  let target;
  try { target = new URL(href, ORIGIN + pageUrl); } catch { return "invalid link URL"; }
  if (!["http:", "https:"].includes(target.protocol) || !["ooligo.com", "www.ooligo.com"].includes(target.hostname)) return undefined;
  let pathname;
  try { pathname = decodeURIComponent(target.pathname); } catch { return "invalid URL encoding"; }
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  if (normalized === "/" || index.routes.has(normalized)) return null;
  const parts = pathname.split("/").filter(Boolean);
  // Check content and locale page routes; assets/API endpoints are outside scope.
  const firstIsSection = PAGE_SECTIONS.has(parts[0]?.toLowerCase());
  const secondIsSection = PAGE_SECTIONS.has(parts[1]?.toLowerCase());
  const firstIsLocale = index.locales.some((locale) => locale.toLowerCase() === parts[0]?.toLowerCase());
  if (!firstIsSection && !secondIsSection && !firstIsLocale) return undefined;
  if (firstIsSection) return "missing locale prefix";
  if (!index.locales.includes(parts[0])) return `unsupported locale or wrong letter case: ${parts[0]}`;
  if (parts[1] === "comparisons") return "comparison pages use /vs/, not /comparisons/";
  const correctCase = [...index.routes.keys()].find((url) => url.toLowerCase() === normalized.toLowerCase());
  if (correctCase) return `wrong letter case; use ${correctCase}`;
  return `no page at ${normalized}`;
}

export function checkDocuments(documents, { locales, verticals, staticPaths = [] }) {
  const index = createRouteIndex(documents, locales, verticals, staticPaths);
  const problems = [...index.problems];
  let checked = 0;
  for (const doc of documents) {
    const section = SECTIONS[doc.file.replace(/\\/g, "/").split("/").at(-3)];
    const pageUrl = `/${doc.data.locale}/${section}/${doc.data.slug}/`;
    for (const link of extractLinks(doc.body)) {
      const reason = linkProblem(link.href, pageUrl, index);
      if (reason !== undefined) checked++;
      if (reason) problems.push({ file: doc.file, line: link.line + (doc.lineOffset ?? 0), href: link.href, reason });
    }
  }
  return { checked, problems };
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? filesUnder(join(directory, entry.name)) : [join(directory, entry.name)]);
}

export function staticPageUrls(file, locales) {
  const path = ("/" + file.replace(/\\/g, "/")).replace(/(?:\/index)?\.astro$/, "");
  const expanded = path.includes("[locale]") ? locales.map((locale) => path.replace("[locale]", locale)) : [path];
  return expanded.filter((url) => !url.includes("[")).map((url) => url.replace(/\/$/, "") + "/");
}

export function checkRepository(root = ROOT) {
  const locales = JSON.parse(readFileSync(join(root, "content/locales.json"), "utf8")).locales.map((l) => l.code);
  const verticals = JSON.parse(readFileSync(join(root, "content/verticals.json"), "utf8")).verticals.map((v) => v.slug);
  const documents = Object.keys(SECTIONS).flatMap((collection) => filesUnder(join(root, "content", collection)))
    .filter((file) => file.endsWith(".mdx")).map((file) => {
      const raw = readFileSync(file, "utf8");
      const parsed = matter(raw);
      return { file: relative(root, file), data: parsed.data, body: parsed.content, lineOffset: raw.slice(0, raw.length - parsed.content.length).split("\n").length - 1 };
    });
  const pagesRoot = join(root, "apps/web/src/pages");
  const staticPaths = filesUnder(pagesRoot).filter((file) => file.endsWith(".astro"))
    .flatMap((file) => staticPageUrls(relative(pagesRoot, file), locales));
  return { files: documents.length, ...checkDocuments(documents, { locales, verticals, staticPaths }) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = checkRepository();
    for (const problem of result.problems) console.error(`${problem.file}:${problem.line}: ${problem.reason}${problem.href ? ` (${problem.href})` : ""}`);
    console.log(`[content-links] ${result.files} files, ${result.checked} internal page links, ${result.problems.length} problems`);
    if (result.problems.length) process.exitCode = 1;
  } catch (error) {
    console.error(`[content-links] ${error.message}`);
    process.exitCode = 1;
  }
}
