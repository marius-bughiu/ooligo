#!/usr/bin/env node
/**
 * build-page.mjs
 *
 * Builds a handful of entries instead of the whole site (~7,500 pages,
 * ~9 minutes, an 8 GB heap):
 *
 *   npm run build:page -- tools/clay                  every locale of one entry
 *   npm run build:page -- tools/en/clay               one locale
 *   npm run build:page -- vs/11x-vs-artisan           comparisons live under /vs/
 *   npm run build:page -- content/tools/en/clay.mdx   a file path
 *   npm run build:page -- /en/learn/what-is-revops/   a site URL
 *
 * It is the real `astro build` (MDX compilation, the zod schemas in
 * src/content.config.ts, the page templates) with every content collection
 * narrowed to the given files (BUILD_ONLY), plus the tools and workflows their
 * frontmatter references, which their pages render. So for those pages
 * it fails exactly where the full build does: a bare `<` before a digit in
 * prose, `null` in a string field, a template that throws. Output goes to a
 * throwaway directory under apps/web/node_modules/.cache/build-page/, never to
 * dist/ or the shared content cache. CI still runs the full build on push.
 *
 * Exit 1 when:
 *   - the build throws or logs an error;
 *   - a selected page is not emitted, its frontmatter `locale` or `slug`
 *     disagrees with its path, or another file publishes the same URL;
 *   - a comparison references a tool that does not exist;
 *   - a built page links to an entry or vertical that does not exist or is
 *     not committed (another lane's work in progress), leaves out the locale
 *     prefix, uses /comparisons/ instead of /vs/ or the wrong letter case, or
 *     links to a same-page #fragment with no matching id. Links that were
 *     already broken on main are listed but do not fail the run: the full
 *     build never checked links.
 *
 * Built pages match production except for their cross-link rails and, for
 * one-locale targets, hreflang/x-default and the language switcher, which list
 * only the locales that were built. Pass --verbose for Astro's per-page log.
 */
import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(WEB_DIR, "..", "..");
const CONTENT_DIR = join(REPO_ROOT, "content");
const RUNS_DIR = join(WEB_DIR, "node_modules", ".cache", "build-page");
const LOCK_DIR = join(WEB_DIR, ".astro", "build-page.lock");
const CONTENT_MODULES = join(WEB_DIR, ".astro", "content-modules.mjs");
const SITE_ORIGIN = "https://ooligo.com";
const DAY_MS = 24 * 60 * 60 * 1000;

const LOCALES = JSON.parse(readFileSync(join(CONTENT_DIR, "locales.json"), "utf8")).locales.map(
  (l) => l.code,
);
const VERTICALS = new Set(
  JSON.parse(readFileSync(join(CONTENT_DIR, "verticals.json"), "utf8")).verticals.map((v) => v.slug),
);
// URL section -> content collection. Collection names work as sections too.
const SECTIONS = { tools: "tools", vs: "comparisons", workflows: "workflows", learn: "learn", stacks: "stacks" };
const SECTION_OF = Object.fromEntries(Object.entries(SECTIONS).map(([s, c]) => [c, s]));
const COLLECTION_OF = { ...SECTIONS, comparisons: "comparisons" };

// Site paths shaped like an entry or a vertical page under an optional first
// segment, so a missing or wrong locale prefix is reported instead of skipped.
const ENTRY_PATH_RE = /^\/(?:([^/]+)\/)?(tools|vs|comparisons|workflows|learn|stacks)\/([^/]+)\/?$/i;
const VERTICAL_PATH_RE = /^\/(?:([^/]+)\/)?r\/([^/]+)\/?$/;
const LOCALE_LIKE_RE = /^[a-z]{2}(?:-[a-z]{2,4})?$/i;
const ASSET_RE = /\.[a-z0-9]+$/i;

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const targets = args.filter((a) => !a.startsWith("--"));
if (targets.length === 0) {
  console.error(
    "[build-page] Usage: npm run build:page -- <section/slug | section/locale/slug | /locale/section/slug/ | path to .mdx> ...",
  );
  process.exit(1);
}

// Where the command was typed. Then work from apps/web, as `npm run` there
// does: pages read public/artifacts relative to the cwd, and Astro writes its
// server build to <cwd>/.astro/ (and deletes it) whenever the output
// directory is outside the cwd.
const CALLER_DIR = process.env.INIT_CWD ?? process.cwd();
process.chdir(WEB_DIR);

const isInside = (dir, file) => file.startsWith(dir + sep);
const rel = (file) => relative(REPO_ROOT, file).split(sep).join("/");

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// existsSync ignores letter case on macOS; the deployed site does not.
const listings = new Map();
function listDir(dir) {
  if (!listings.has(dir)) {
    let names = [];
    try {
      names = readdirSync(dir);
    } catch {}
    listings.set(dir, new Set(names));
  }
  return listings.get(dir);
}
function existsExactly(file) {
  let dir = CONTENT_DIR;
  for (const part of relative(CONTENT_DIR, file).split(sep)) {
    if (!listDir(dir).has(part)) return false;
    dir = join(dir, part);
  }
  return true;
}

function findEntryFile(collection, locale, slug) {
  const file = join(CONTENT_DIR, collection, locale, `${slug}.mdx`);
  return existsExactly(file) ? file : null;
}

// A relative path typed from anywhere in the repo resolves.
function resolveFile(arg) {
  for (const base of [CALLER_DIR, WEB_DIR, REPO_ROOT]) {
    const file = resolve(base, arg);
    if (existsSync(file)) return file;
  }
  return null;
}

function resolveTarget(arg) {
  if (arg.endsWith(".mdx")) {
    const file = resolveFile(arg);
    if (!file) throw new Error(`no such file: ${arg}`);
    const collection = relative(CONTENT_DIR, file).split(sep)[0];
    if (!isInside(CONTENT_DIR, file) || !SECTION_OF[collection]) {
      throw new Error(`not an entry under content/<collection>/: ${arg}`);
    }
    if (!existsExactly(file)) throw new Error(`no such file (check the letter case): ${arg}`);
    return [file];
  }

  const parts = arg
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^content\//, "")
    .split("/");
  let collection, locales, slug;
  if (parts.length === 3 && LOCALES.includes(parts[0]) && SECTIONS[parts[1]]) {
    [collection, locales, slug] = [SECTIONS[parts[1]], [parts[0]], parts[2]];
  } else if (parts.length === 3 && COLLECTION_OF[parts[0]] && LOCALES.includes(parts[1])) {
    [collection, locales, slug] = [COLLECTION_OF[parts[0]], [parts[1]], parts[2]];
  } else if (parts.length === 2 && COLLECTION_OF[parts[0]]) {
    [collection, locales, slug] = [COLLECTION_OF[parts[0]], LOCALES, parts[1]];
  } else {
    throw new Error(`not an entry (section/slug, section/locale/slug, /locale/section/slug/ or .mdx path): ${arg}`);
  }
  const files = locales.map((l) => findEntryFile(collection, l, slug)).filter(Boolean);
  if (files.length === 0) throw new Error(`no ${collection} entry "${slug}" in ${locales.join(", ")}`);
  return files;
}

let selected;
try {
  selected = [...new Set(targets.flatMap(resolveTarget))];
} catch (err) {
  console.error(`[build-page] ${err.message}`);
  process.exit(1);
}
const selectedSet = new Set(selected);

function readEntry(file) {
  const collection = relative(CONTENT_DIR, file).split(sep)[0];
  try {
    return { file, collection, data: matter(readFileSync(file, "utf8")).data };
  } catch (err) {
    // The build reports frontmatter errors properly; this only needs the URL.
    return { file, collection, data: {}, error: err.message };
  }
}
const entries = selected.map(readEntry);

function git(...gitArgs) {
  try {
    return execFileSync("git", ["-C", REPO_ROOT, ...gitArgs], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

// What CI deploys: entries committed on HEAD or origin/main. Other lanes'
// unpushed files share this working tree, and a page that links to or renders
// one would break in production until that lane pushes, or for good. null
// when git is not available.
const BASE_REF = git("rev-parse", "--verify", "--quiet", "origin/main^{commit}") ? "origin/main" : "HEAD";
let committed = null;
for (const ref of new Set(["HEAD", BASE_REF])) {
  const collections = Object.keys(SECTION_OF).map((c) => rel(join(CONTENT_DIR, c)));
  const out = git("ls-tree", "-r", "-z", "--name-only", "--full-name", ref, "--", ...collections);
  if (out === null) continue;
  committed ??= new Set();
  for (const p of out.split("\0")) if (p) committed.add(p);
}
const isKnown = (file) =>
  selectedSet.has(file) || (committed ? committed.has(rel(file)) && existsSync(file) : existsExactly(file));

// Entries a page looks up by the slugs in its frontmatter, per collection.
// Loading them makes the selected pages render as they do in production; a
// comparison without its tools renders without its hero and table. Their own
// pages get built as a side effect, which is harmless.
const REFERENCES = {
  comparisons: (d) => ({ tools: d.type === "pairwise" ? [d.tool_a, d.tool_b] : d.tools }),
  workflows: (d) => ({ tools: d.tools_used }),
  stacks: (d) => ({ tools: d.tools, workflows: d.related_workflows }),
  learn: (d) => ({ tools: d.related_tools, workflows: d.related_workflows }),
};
const toLoad = new Set(selected);
const missingReferences = [];
for (const e of entries) {
  if (!e.data.locale) continue;
  for (const [collection, slugs] of Object.entries(REFERENCES[e.collection]?.(e.data) ?? {})) {
    for (const s of Array.isArray(slugs) ? slugs : []) {
      if (typeof s !== "string") continue;
      const file = join(CONTENT_DIR, collection, e.data.locale, `${s}.mdx`);
      if (isKnown(file)) toLoad.add(file);
      else missingReferences.push({ entry: e, collection, id: `${e.data.locale}/${s}`, file });
    }
  }
}

// Literal file paths, escaped so a glob metacharacter in a name stays literal.
const escapeGlob = (p) => p.replace(/[*?[\]{}()!+@\\]/g, "\\$&");
const buildOnly = {};
for (const file of toLoad) {
  const [collection, ...rest] = relative(CONTENT_DIR, file).split(sep);
  (buildOnly[collection] ??= []).push(escapeGlob(rest.join("/")));
}

// Runs older than a day are leftovers; each run gets its own directory.
mkdirSync(RUNS_DIR, { recursive: true });
for (const name of readdirSync(RUNS_DIR)) {
  const dir = join(RUNS_DIR, name);
  const stat = statSync(dir, { throwIfNoEntry: false });
  if (!stat || Date.now() - stat.mtimeMs < DAY_MS) continue;
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {} // another run is pruning it too
}
// src/lib/toolIcons.ts finds public/ next to the build output (dist/../public),
// so the run directory mirrors apps/web: dist/ plus a link to the real public/.
const runDir = join(RUNS_DIR, `${Date.now()}-${process.pid}`);
const outDir = join(runDir, "dist");
const publicDir = join(runDir, "public");
mkdirSync(runDir, { recursive: true });
symlinkSync(join(WEB_DIR, "public"), publicDir, "dir");
process.env.BUILD_ONLY = JSON.stringify(buildOnly);

const isRunning = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

// Every build in a checkout writes the list of MDX files it compiles to the
// same .astro/content-modules.mjs, so two runs at once would build each
// other's entries. Runs take turns; each takes seconds to a minute. The lock
// is a directory with an owner file, put in place by one atomic rename, and
// a run releases only a lock it still owns.
const LOCK_STALE_MS = 15 * 60 * 1000;
const lockOwner = `${process.pid} ${Date.now()} ${Math.random().toString(36).slice(2)}`;
let lockHeld = false;
function readOwner(dir) {
  try {
    return readFileSync(join(dir, "owner"), "utf8");
  } catch {
    return null;
  }
}

async function acquireLock() {
  mkdirSync(dirname(LOCK_DIR), { recursive: true });
  const fresh = `${LOCK_DIR}.${process.pid}.new`;
  for (let waited = 0; ; waited += 500) {
    rmSync(fresh, { recursive: true, force: true });
    mkdirSync(fresh);
    writeFileSync(join(fresh, "owner"), lockOwner);
    try {
      renameSync(fresh, LOCK_DIR);
      lockHeld = true;
      return;
    } catch (err) {
      rmSync(fresh, { recursive: true, force: true });
      if (err.code !== "ENOTEMPTY" && err.code !== "EEXIST") throw err;
    }
    const owner = readOwner(LOCK_DIR);
    const [pid, since] = (owner ?? "").split(" ").map(Number);
    const lockTime = owner ? since : statSync(LOCK_DIR, { throwIfNoEntry: false })?.mtimeMs;
    if (lockTime === undefined) continue; // released while we looked
    const age = Date.now() - lockTime;
    // Left by a run that was killed outright, or held far longer than any run takes.
    if ((owner ? !isRunning(pid) : age > 30_000) || age > LOCK_STALE_MS) {
      const stale = `${LOCK_DIR}.${process.pid}.stale`;
      try {
        renameSync(LOCK_DIR, stale); // one run wins this
      } catch {
        continue;
      }
      if (readOwner(stale) === owner) {
        rmSync(stale, { recursive: true, force: true });
      } else {
        // Someone took over in between: that lock is live, put it back.
        try {
          renameSync(stale, LOCK_DIR);
        } catch {
          rmSync(stale, { recursive: true, force: true });
        }
      }
      continue;
    }
    if (waited === 0) console.log(`[build-page] Waiting for another build:page run in this checkout (pid ${pid})`);
    if (waited > 10 * 60 * 1000) throw new Error(`build:page lock held for 10 minutes: ${LOCK_DIR}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

function releaseLock() {
  if (!lockHeld) return;
  lockHeld = false;
  const done = `${LOCK_DIR}.${process.pid}.done`;
  try {
    renameSync(LOCK_DIR, done);
  } catch {
    return;
  }
  if (readOwner(done) !== lockOwner) {
    // A run that judged this one stale took over: give its lock back.
    try {
      renameSync(done, LOCK_DIR);
      return;
    } catch {}
  }
  rmSync(done, { recursive: true, force: true });
}

// The build leaves the selected files' list in .astro/content-modules.mjs.
// Put back what was there, which a dev server in this checkout reads.
let savedContentModules; // undefined until the lock is held; null when there was none
function restoreContentModules() {
  if (savedContentModules === undefined) return;
  if (savedContentModules === null) rmSync(CONTENT_MODULES, { force: true });
  else writeFileSync(CONTENT_MODULES, savedContentModules);
  savedContentModules = undefined;
}

let interrupted = false;
process.on("exit", () => {
  restoreContentModules();
  releaseLock();
  rmSync(interrupted ? runDir : join(runDir, "cache"), { recursive: true, force: true });
  rmSync(join(runDir, "vite"), { recursive: true, force: true });
});
for (const [signal, code] of [
  ["SIGINT", 130],
  ["SIGTERM", 143],
  ["SIGHUP", 129],
]) {
  process.once(signal, () => {
    interrupted = true;
    process.exit(code);
  });
}

// Collections with nothing selected are empty on purpose, and so are the
// entries a page looks up with getEntry() but that were not loaded; Astro warns
// about both on every call. Missing references are reported below instead.
const emptyCollections = Object.keys(SECTION_OF).filter((c) => !buildOnly[c]);
const EMPTY_WARNING_RE = new RegExp(`^The collection "(${emptyCollections.join("|")})" does not exist`);
const NOT_FOUND_RE = /^Entry (\w+) → (\S+) was not found\.$/;
const reportedMissing = new Set(missingReferences.map((m) => `${m.collection}/${m.id}`));
const warn = console.warn;
console.warn = (...parts) => {
  const message = typeof parts[0] === "string" ? parts[0] : "";
  if (emptyCollections.length && EMPTY_WARNING_RE.test(message)) return;
  const notFound = message.match(NOT_FOUND_RE);
  if (notFound && reportedMissing.has(`${notFound[1]}/${notFound[2]}`)) return;
  if (notFound && existsSync(join(CONTENT_DIR, notFound[1], `${notFound[2]}.mdx`))) return;
  warn(...parts);
};
// A collection left out on purpose makes the glob loader warn that its
// placeholder pattern matched no files; Astro's logger writes that to stdout.
const stdoutWrite = process.stdout.write;
process.stdout.write = function (chunk, ...rest) {
  if (!String(chunk).includes("__not-selected-by-build-page__")) return stdoutWrite.call(this, chunk, ...rest);
  rest.find((a) => typeof a === "function")?.();
  return true;
};
// Errors Astro logs without throwing go to stderr as error-level lines.
let errorsLogged = 0;
const stderrWrite = process.stderr.write;
process.stderr.write = function (chunk, ...rest) {
  if (String(chunk).includes("[ERROR]")) errorsLogged++;
  return stderrWrite.call(this, chunk, ...rest);
};

console.log(`[build-page] Building ${selected.length} page(s):`);
for (const f of selected) console.log(`  ${rel(f)}`);
const extra = [...toLoad].filter((f) => !selectedSet.has(f));
if (extra.length) console.log(`  (+ ${extra.length} entries they reference, loaded so they render as in production)`);

await acquireLock();
savedContentModules = existsSync(CONTENT_MODULES) ? readFileSync(CONTENT_MODULES) : null;
const started = Date.now();
let failure;
try {
  const { build } = await import("astro");
  await build({
    root: WEB_DIR,
    outDir,
    cacheDir: join(runDir, "cache"),
    publicDir,
    logLevel: verbose ? "info" : "warn",
    vite: { cacheDir: join(runDir, "vite") },
  });
} catch (err) {
  failure = err;
} finally {
  restoreContentModules();
  releaseLock();
  console.warn = warn;
  process.stdout.write = stdoutWrite;
  process.stderr.write = stderrWrite;
  rmSync(join(runDir, "cache"), { recursive: true, force: true });
  rmSync(join(runDir, "vite"), { recursive: true, force: true });
}
if (failure) {
  console.error(`[build-page] Build failed: ${failure.stack ?? failure.message ?? failure}`);
  process.exit(1);
}
const seconds = ((Date.now() - started) / 1000).toFixed(1);

// Each entry's URL comes from its frontmatter `locale` and `slug`, which the
// routes use, not from its path. Indexed for every committed entry plus the
// ones being built, from the first few KB of each file.
function frontmatterOf(file) {
  const head = Buffer.alloc(8192);
  const fd = openSync(file, "r");
  let text;
  try {
    text = head.toString("utf8", 0, readSync(fd, head, 0, head.length, 0));
  } finally {
    closeSync(fd);
  }
  const block = /^---\r?\n([\s\S]*?)\r?\n---/;
  return (text.match(block) ?? readFileSync(file, "utf8").match(block))?.[1] ?? "";
}
const fieldOf = (frontmatter, key) =>
  frontmatter.match(new RegExp(`^${key}:[ \\t]*["']?([^"'\\s#]+)["']?[ \\t]*(?:#.*)?$`, "m"))?.[1];

const indexed = new Set(toLoad);
if (committed) {
  for (const p of committed) indexed.add(join(REPO_ROOT, p));
} else {
  for (const collection of Object.keys(SECTION_OF)) {
    for (const locale of LOCALES) {
      const dir = join(CONTENT_DIR, collection, locale);
      for (const name of listDir(dir)) if (name.endsWith(".mdx")) indexed.add(join(dir, name));
    }
  }
}
const urlIndex = new Map();
for (const file of indexed) {
  const parts = relative(CONTENT_DIR, file).split(sep);
  if (parts.length !== 3 || !SECTION_OF[parts[0]] || !parts[2].endsWith(".mdx") || !existsSync(file)) continue;
  const frontmatter = frontmatterOf(file);
  const url = `/${fieldOf(frontmatter, "locale")}/${SECTION_OF[parts[0]]}/${fieldOf(frontmatter, "slug")}/`;
  if (!urlIndex.has(url)) urlIndex.set(url, []);
  urlIndex.get(url).push(rel(file));
}
const urlByLowercase = new Map([...urlIndex.keys()].map((u) => [u.toLowerCase(), u]));

// The committed version of a page's source tells a link this change adds from
// one that was already broken.
const committedText = new Map();
function wasAlreadyThere(file, href) {
  if (!committedText.has(file)) committedText.set(file, git("show", `${BASE_REF}:${rel(file)}`));
  const text = committedText.get(file);
  return text !== null && (text.includes(href) || text.includes(safeDecode(href)));
}

// The site path a link points at, or null for other sites and non-http links.
function sitePath(href, pageUrl) {
  try {
    const target = new URL(href, SITE_ORIGIN + pageUrl);
    return target.origin === SITE_ORIGIN ? safeDecode(target.pathname) : null;
  } catch {
    return null;
  }
}

// Why a link to `target` (a site path) would 404: null when it resolves,
// undefined when it is not an entry or vertical path (indexes, static pages,
// assets).
function linkProblem(target) {
  const entry = target.match(ENTRY_PATH_RE);
  const vertical = entry ? null : target.match(VERTICAL_PATH_RE);
  if (!entry && !vertical) return undefined;
  const locale = (entry ?? vertical)[1];
  const slug = entry ? entry[3] : vertical[2];
  if ((locale && !LOCALE_LIKE_RE.test(locale)) || ASSET_RE.test(slug)) return undefined;
  if (!locale) return "no locale prefix (every page is under /<locale>/)";
  if (!LOCALES.includes(locale)) return `unknown locale "${locale}" (locales: ${LOCALES.join(", ")})`;
  if (vertical) return VERTICALS.has(slug) ? null : `no vertical "${slug}" in content/verticals.json`;
  const section = entry[2];
  if (section !== section.toLowerCase()) return `the section is /${section.toLowerCase()}/, in lowercase`;
  if (section === "comparisons") return "comparisons live under /vs/, not /comparisons/";
  const url = `/${locale}/${section}/${slug}/`;
  if (urlIndex.has(url)) return null;
  if (urlByLowercase.has(url.toLowerCase())) return `wrong letter case: the page is ${urlByLowercase.get(url.toLowerCase())}`;
  const file = findEntryFile(SECTIONS[section], locale, slug);
  if (file && !isKnown(file)) return `${rel(file)} is not committed: build and push it together with this page`;
  if (file) return `${rel(file)} publishes at another URL (check its frontmatter locale and slug)`;
  return `no ${SECTIONS[section]} entry "${locale}/${slug}"`;
}

// ids, <a name> and <a href> values of real tags. Script, style and comment
// bodies are dropped first, and text never matches: a code sample's
// `<div id="x">` is printed with its `<` escaped.
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decodeEntities = (s) =>
  s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos));/gi, (match, dec, hex, name) => {
    try {
      return name ? NAMED_ENTITIES[name.toLowerCase()] : String.fromCodePoint(dec ? Number(dec) : parseInt(hex, 16));
    } catch {
      return match;
    }
  });
function scanHtml(html) {
  const ids = new Set();
  const hrefs = [];
  const markup = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  for (const [, tag, attrText] of markup.matchAll(TAG_RE)) {
    const attrs = {};
    for (const [, name, dq, sq, bare] of attrText.matchAll(ATTR_RE)) {
      attrs[name.toLowerCase()] = decodeEntities(dq ?? sq ?? bare ?? "");
    }
    if (attrs.id) ids.add(safeDecode(attrs.id));
    if (tag.toLowerCase() === "a") {
      if (attrs.name) ids.add(safeDecode(attrs.name));
      if (attrs.href) hrefs.push(attrs.href);
    }
  }
  return { ids, hrefs };
}

const problems = [];
const alreadyBroken = [];
if (errorsLogged > 0) problems.push(`Astro logged ${errorsLogged} error(s) above; a page may be missing content`);
for (const m of missingReferences) {
  const line = `${rel(m.entry.file)}: references ${m.collection} "${m.id}", which ${existsSync(m.file) ? "is not committed" : "does not exist"}`;
  if (m.entry.collection === "comparisons") problems.push(`${line}; the comparison renders without it`);
  else console.log(`[build-page] warning: ${line}`);
}

const built = [];
let linksChecked = 0;
for (const e of entries) {
  const { locale, slug } = e.data;
  if (!locale || !slug) {
    problems.push(`${rel(e.file)}: cannot tell its URL (frontmatter ${e.error ?? "has no locale/slug"})`);
    continue;
  }
  const [collection, dirLocale, name] = relative(CONTENT_DIR, e.file).split(sep);
  const urlPath = `/${locale}/${SECTION_OF[collection]}/${slug}/`;
  if (locale !== dirLocale || `${slug}.mdx` !== name) {
    problems.push(`${rel(e.file)}: frontmatter locale "${locale}" and slug "${slug}" publish it at ${urlPath}, not at its path`);
    continue;
  }
  const owners = urlIndex.get(urlPath) ?? [];
  if (owners.length > 1) {
    problems.push(`${urlPath}: ${owners.length} files publish this URL and only one survives: ${owners.join(", ")}`);
    continue;
  }
  const htmlPath = join(outDir, locale, SECTION_OF[collection], slug, "index.html");
  if (!existsSync(htmlPath)) {
    problems.push(`${urlPath}: page was not emitted (${rel(e.file)})`);
    continue;
  }
  built.push({ urlPath, htmlPath });

  const { ids, hrefs } = scanHtml(readFileSync(htmlPath, "utf8"));
  for (const href of hrefs) {
    let problem;
    if (href.startsWith("#")) {
      const id = safeDecode(href.slice(1));
      if (!id) continue;
      linksChecked++;
      // Browsers also scroll to <a name> and treat #top as the top of the page.
      if (ids.has(id) || id.toLowerCase() === "top") continue;
      problem = "has no matching id on the page";
    } else {
      const target = sitePath(href, urlPath);
      const result = target === null ? undefined : linkProblem(target);
      if (result === undefined) continue;
      linksChecked++;
      if (result === null) continue;
      problem = `-> ${result}`;
    }
    (wasAlreadyThere(e.file, href) ? alreadyBroken : problems).push(`${urlPath}: ${href} ${problem}`);
  }
}

for (const b of built) console.log(`  ok ${b.urlPath} -> ${b.htmlPath}`);
console.log(`[build-page] ${linksChecked} entry/vertical/anchor link(s) checked in ${seconds}s build`);

if (alreadyBroken.length > 0) {
  console.log(`[build-page] ${alreadyBroken.length} link problem(s) already on ${BASE_REF}, so not failing this run:`);
  for (const p of alreadyBroken) console.log(`  ${p}`);
}
if (problems.length > 0) {
  console.error(`[build-page] ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`[build-page] OK. Output kept in ${outDir}`);
process.exit(0);
