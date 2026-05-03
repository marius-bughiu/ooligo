/**
 * sync-tool-icons.mjs
 *
 * Incremental fetch of vendor favicons for the tools collection. Reads
 * content/tools/en/*.mdx, extracts each website, and stores the icon at
 * apps/web/public/tool-icons/<slug>.<ext>. Skips slugs that already have
 * a file — re-running is cheap. Production builds make zero network calls.
 *
 * Strategy per slug:
 *   1. Fetch the site, parse <link rel="...icon..."> tags, pick the
 *      best (prefer SVG, then highest declared sizes attr).
 *   2. Fall back to Google s2 favicons (sz=128 PNG).
 *   3. Last resort: DuckDuckGo ip3 (.ico).
 *
 * Flags:
 *   --all     Refresh every icon (vendor rebrand sweep).
 *   --slug=x  Refresh just one slug.
 *
 * Run from anywhere; paths are resolved relative to repo root.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const TOOLS_DIR = join(REPO_ROOT, "content", "tools", "en");
const OUT_DIR = join(REPO_ROOT, "apps", "web", "public", "tool-icons");

const ARGS = new Set(process.argv.slice(2));
const FORCE_ALL = ARGS.has("--all");
const SLUG_ONLY = [...ARGS]
  .find((a) => a.startsWith("--slug="))
  ?.slice("--slug=".length);

const FETCH_TIMEOUT_MS = 7000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; OoligoIconSync/1.0; +https://ooligo.com)";

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

function readTools() {
  const files = readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".mdx"));
  const tools = [];
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    if (slug === "default") continue;
    if (SLUG_ONLY && slug !== SLUG_ONLY) continue;
    const text = readFileSync(join(TOOLS_DIR, file), "utf8");
    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;
    const websiteMatch = fmMatch[1].match(/^website:\s*["']?(.+?)["']?\s*$/m);
    if (!websiteMatch) continue;
    tools.push({ slug, website: websiteMatch[1].trim() });
  }
  return tools.sort((a, b) => a.slug.localeCompare(b.slug));
}

function existingIcon(slug) {
  const exts = ["svg", "png", "ico", "jpg", "jpeg", "webp"];
  for (const ext of exts) {
    const p = join(OUT_DIR, `${slug}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: { "user-agent": USER_AGENT, ...(opts.headers || {}) },
      redirect: "follow",
    });
  } finally {
    clearTimeout(t);
  }
}

function parseLinkIcons(html, baseUrl) {
  const links = [];
  const linkTagRe = /<link\b[^>]*>/gi;
  for (const m of html.matchAll(linkTagRe)) {
    const tag = m[0];
    const rel = (tag.match(/\brel\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    if (!/icon/i.test(rel)) continue;
    const href = (tag.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    const sizes = (tag.match(/\bsizes\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    const type = (tag.match(/\btype\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    let absolute;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    const isSvg = /svg/i.test(type) || /\.svg(\?|#|$)/i.test(absolute);
    const isIco =
      /icon/i.test(type) ||
      /\.ico(\?|#|$)/i.test(absolute) ||
      /vnd\.microsoft\.icon/i.test(type);
    const isPng = /png/i.test(type) || /\.png(\?|#|$)/i.test(absolute);
    // Format rank: SVG (vector) > PNG > everything else > ICO (multi-size legacy,
    // browsers scale poorly to 22-28px). Within a rank, larger declared size wins.
    const formatRank = isSvg ? 3 : isPng ? 2 : isIco ? 0 : 1;
    const sizeNum = (() => {
      if (sizes === "any") return 9999;
      const n = parseInt(sizes, 10);
      return Number.isFinite(n) ? n : 0;
    })();
    // Apple-touch-icon is always a high-quality PNG (≥120px). Boost it.
    const isAppleTouch = /apple-touch-icon/i.test(rel);
    links.push({
      url: absolute,
      formatRank,
      sizeNum: isAppleTouch ? Math.max(sizeNum, 180) : sizeNum,
    });
  }
  links.sort((a, b) => {
    if (a.formatRank !== b.formatRank) return b.formatRank - a.formatRank;
    return b.sizeNum - a.sizeNum;
  });
  return links;
}

function extFromContentType(ct, fallback = "png") {
  if (!ct) return fallback;
  ct = ct.toLowerCase();
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("x-icon") || ct.includes("vnd.microsoft.icon")) return "ico";
  return fallback;
}

function extFromUrl(url) {
  const m = url.match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i);
  if (!m) return null;
  const e = m[1].toLowerCase();
  if (["svg", "png", "ico", "jpg", "jpeg", "webp"].includes(e)) return e;
  return null;
}

async function downloadIcon(url) {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/html")) throw new Error("served HTML, not an image");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 64) throw new Error(`too small (${buf.length}B)`);
  const ext = extFromUrl(url) || extFromContentType(ct);
  return { buf, ext };
}

async function tryViaLinkTags(website) {
  const res = await fetchWithTimeout(website);
  if (!res.ok) throw new Error(`site HTTP ${res.status}`);
  const html = await res.text();
  const links = parseLinkIcons(html, res.url || website);
  // Skip raw .ico — they're typically 16×16 single-variant and look pixelated
  // upscaled. Fall through to google-s2 which always returns PNG.
  const goodLinks = links.filter((l) => l.formatRank > 0);
  for (const link of goodLinks) {
    try {
      return await downloadIcon(link.url);
    } catch {
      // try next candidate
    }
  }
  throw new Error("no usable <link rel=icon>");
}

async function tryGoogleS2(host) {
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  return downloadIcon(url);
}

async function tryDuckDuckGo(host) {
  const url = `https://icons.duckduckgo.com/ip3/${host}.ico`;
  return downloadIcon(url);
}

async function syncOne(tool) {
  if (!FORCE_ALL) {
    const existing = existingIcon(tool.slug);
    if (existing) return { slug: tool.slug, status: "skip" };
  }
  let host;
  try {
    host = new URL(tool.website).host;
  } catch {
    return { slug: tool.slug, status: "fail", reason: "bad website url" };
  }

  const strategies = [
    { name: "link-tags", run: () => tryViaLinkTags(tool.website) },
    { name: "google-s2", run: () => tryGoogleS2(host) },
    { name: "duckduckgo", run: () => tryDuckDuckGo(host) },
  ];

  const errors = [];
  for (const s of strategies) {
    try {
      const { buf, ext } = await s.run();
      const out = join(OUT_DIR, `${tool.slug}.${ext}`);
      writeFileSync(out, buf);
      return { slug: tool.slug, status: "ok", source: s.name, ext, bytes: buf.length };
    } catch (e) {
      errors.push(`${s.name}: ${e.message || e}`);
    }
  }
  return { slug: tool.slug, status: "fail", reason: errors.join(" | ") };
}

async function main() {
  const tools = readTools();
  if (tools.length === 0) {
    console.log("no tools found");
    return;
  }

  const limit = 6;
  let i = 0;
  const results = [];
  async function worker() {
    while (i < tools.length) {
      const idx = i++;
      const t = tools[idx];
      const r = await syncOne(t);
      results.push(r);
      const tag =
        r.status === "ok"
          ? `OK   (${r.source}, ${r.ext}, ${r.bytes}B)`
          : r.status === "skip"
            ? "skip (already exists)"
            : `FAIL ${r.reason}`;
      console.log(`${tag.padEnd(40)} ${r.slug}`);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));

  const ok = results.filter((r) => r.status === "ok").length;
  const skip = results.filter((r) => r.status === "skip").length;
  const fail = results.filter((r) => r.status === "fail");
  console.log("");
  console.log(`done — ${ok} fetched, ${skip} skipped, ${fail.length} failed`);
  if (fail.length > 0) {
    console.log("failed slugs (will fall back to monogram):");
    for (const f of fail) console.log(`  - ${f.slug}: ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
