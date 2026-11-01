import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import matter from "gray-matter";

// Updating a verification/provenance clock does not refresh the article itself.
const CLOCKS = new Set(["last_updated", "en_verified", "pricing_checked", "material_change_at", "translated_from", "translated_at", "translation_model", "source_sha256"]);
const ZERO = /^0+$/;
const SHA = /^[a-f0-9]{40}$/;
const normalize = (text) => text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).join("\n").trim();
function ordered(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(ordered);
  return value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])])) : value;
}

export function meaningfulSignature(file, text) {
  if (text == null) return undefined;
  let meaningful = text;
  if (file.endsWith(".mdx")) {
    const { data, content } = matter(text);
    const fields = Object.fromEntries(Object.entries(data).filter(([key]) => !CLOCKS.has(key)));
    meaningful = JSON.stringify(ordered(fields)) + "\n" + normalize(content.replace(/<!--[\s\S]*?-->|\{\/\*[\s\S]*?\*\/\}/g, ""));
  } else if (file.endsWith(".astro")) {
    // Presentation, client scripts and HTML comments do not date page copy.
    meaningful = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi, "");
  } else if (file.endsWith(".json")) {
    meaningful = JSON.stringify(ordered(JSON.parse(text)));
  }
  return createHash("sha256").update(normalize(meaningful)).digest("hex");
}

export function validDate(value, now = new Date()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return undefined;
  // Date.parse normalizes impossible calendar dates such as February 30.
  const calendar = new Date(value.slice(0, 10) + "T00:00:00Z");
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || (value.length === 10 && date.toISOString().slice(0, 10) !== value)) return undefined;
  // A validation bound only: the current time is never emitted as lastmod.
  if (date.getTime() > now.getTime()) return undefined;
  return value.length === 10 ? value : date.toISOString();
}

export function parseHistory(raw) {
  const events = [];
  let date;
  const tokens = raw.split("\0");
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (token.startsWith("\x1e")) { date = token.slice(1); continue; }
    const match = /^:\d+ \d+ ([a-f0-9]{40}) ([a-f0-9]{40}) ([AMD])$/.exec(token);
    if (match && date) events.push({ file: tokens[++i], date, before: match[1], after: match[2], status: match[3] });
  }
  return events;
}

function git(root, args, options = {}) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"], ...options });
}

/** Bulk object reads avoid thousands of git subprocesses during a full build. */
function readBlobs(root, hashes) {
  const result = new Map();
  const wanted = [...new Set(hashes.filter((hash) => SHA.test(hash) && !ZERO.test(hash)))];
  for (let start = 0; start < wanted.length; start += 256) {
    const batch = wanted.slice(start, start + 256);
    const buffer = git(root, ["cat-file", "--batch"], { encoding: null, input: batch.join("\n") + "\n" });
    let offset = 0;
    for (const hash of batch) {
      const end = buffer.indexOf(10, offset);
      const header = buffer.subarray(offset, end).toString("utf8");
      const match = /^([a-f0-9]{40}) blob (\d+)$/.exec(header);
      if (!match || match[1] !== hash) throw new Error(`Cannot read sitemap source object ${hash}`);
      const length = Number(match[2]);
      offset = end + 1;
      result.set(hash, buffer.subarray(offset, offset + length).toString("utf8"));
      offset += length + 1;
    }
  }
  return result;
}

/**
 * Resolve the newest meaningful revision on the published first-parent history.
 * Shallow checkouts never use the boundary commit as a fake creation date.
 * Dirty/untracked sources have no confirmed Git date until committed.
 */
export function revisionDates(root, sources, { now = new Date(), warn = () => {} } = {}) {
  let history;
  try {
    if (git(root, ["rev-parse", "--is-shallow-repository"]).trim() !== "false") {
      warn("Sitemap dates: shallow Git history; using authored dates only. Fetch full history for revision dates.");
      return { dates: new Map(), deleted: [], complete: false };
    }
    history = parseHistory(git(root, ["log", "--format=%x1e%cI", "--raw", "--no-abbrev", "--no-renames", "--root", "--first-parent", "--diff-merges=first-parent", "-z", "--", "content", "apps/web/src/pages", "apps/web/src/lib", "apps/web/src/components", "apps/web/public/artifacts"]));
  } catch (error) {
    warn(`Sitemap dates: Git history unavailable; using authored dates only (${error.message.split("\n")[0]}).`);
    return { dates: new Map(), deleted: [], complete: false };
  }
  const eventsByFile = new Map();
  for (const event of history) {
    if (!eventsByFile.has(event.file)) eventsByFile.set(event.file, []);
    eventsByFile.get(event.file).push(event);
  }
  const dates = new Map();
  const signatures = new Map();
  const signature = (file, hash, blobs) => {
    if (ZERO.test(hash)) return undefined;
    const kind = file.endsWith(".mdx") ? "mdx" : file.endsWith(".astro") ? "astro" : file.endsWith(".json") ? "json" : "text";
    const key = kind + ":" + hash;
    if (!signatures.has(key)) signatures.set(key, meaningfulSignature(file, blobs.get(hash)));
    return signatures.get(key);
  };
  let pending = [...sources].flatMap(([file, source]) => {
    const events = eventsByFile.get(file);
    return events?.[0]?.status !== "D" && events?.length ? [{ file, source, events, position: 0, checkedHead: false }] : [];
  });
  while (pending.length) {
    const hashes = pending.flatMap(({ events, position }) => [events[position].before, events[position].after, events[0].after]);
    const blobs = readBlobs(root, hashes);
    const next = [];
    for (const work of pending) {
      const { file, source, events, position } = work;
      if (!work.checkedHead && meaningfulSignature(file, source) !== signature(file, events[0].after, blobs)) continue;
      work.checkedHead = true;
      const event = events[position];
      if (signature(file, event.before, blobs) !== signature(file, event.after, blobs)) {
        const date = validDate(event.date, now);
        if (date) dates.set(file, date);
      } else if (position + 1 < events.length) {
        work.position++;
        next.push(work);
      }
    }
    pending = next;
  }
  // Removed entries change former indexes; removed bundle files change the
  // workflow even when no remaining source file changed in that commit.
  const isContent = (file) => /^content\/(?:tools|comparisons|workflows|learn|stacks)\/.+\.mdx$/.test(file);
  const removals = history.filter((e) => e.status === "D" && (isContent(e.file) || e.file.startsWith("apps/web/public/artifacts/")));
  const removedBlobs = readBlobs(root, removals.filter((e) => isContent(e.file)).map((e) => e.before));
  const deleted = removals.flatMap((event) => {
    const date = validDate(event.date, now);
    if (!date) return [];
    if (!isContent(event.file)) return [{ file: event.file, date }];
    try { return [{ file: event.file, date, data: matter(removedBlobs.get(event.before)).data }]; } catch { return []; }
  });
  return { dates, deleted, complete: true };
}
