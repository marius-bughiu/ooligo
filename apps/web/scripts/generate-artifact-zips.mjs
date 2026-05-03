/**
 * generate-artifact-zips.mjs
 *
 * Walks `apps/web/public/artifacts/<slug>/` directories and emits
 * `apps/web/public/artifacts/<slug>.zip` for each, containing the full
 * directory contents (recursive, paths relative to the slug dir).
 *
 * Skips work when the existing zip is newer than every source file —
 * the no-op path is fast (only stat calls), so it's cheap to run on
 * every dev/build/preview invocation.
 *
 * Hand-rolled minimal ZIP writer (deflate + central directory),
 * zero deps. Sufficient for a few-dozen-files-per-bundle scale.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep, posix } from "node:path";
import { deflateRawSync } from "node:zlib";
import { Buffer } from "node:buffer";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(d) {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    (Math.floor(d.getSeconds() / 2) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

function buildZip(entries) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  const now = new Date();
  const { time, date } = dosTime(now);

  for (const e of entries) {
    const nameBuf = Buffer.from(e.path, "utf8");
    const compressed = deflateRawSync(e.data);
    const crc = crc32(e.data);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6); // bit 11 = utf-8 filename
    lh.writeUInt16LE(8, 8);      // method = deflate
    lh.writeUInt16LE(time, 10);
    lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);     // extra length
    localChunks.push(lh, nameBuf, compressed);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(time, 12);
    ch.writeUInt16LE(date, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(compressed.length, 20);
    ch.writeUInt32LE(e.data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);  // extra length
    ch.writeUInt16LE(0, 32);  // comment length
    ch.writeUInt16LE(0, 34);  // disk start
    ch.writeUInt16LE(0, 36);  // internal attrs
    ch.writeUInt32LE(0, 38);  // external attrs
    ch.writeUInt32LE(offset, 42);
    centralChunks.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + compressed.length;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralBuf, eocd]);
}

// Files/dirs that may exist in artifact source dirs but should never ship in
// bundle zips: build caches (Python bytecode, swap files), OS junk, vendored
// deps. Same list lives in src/pages/[locale]/workflows/[slug].astro for the
// on-page file viewer — keep them in sync.
const IGNORED_DIRS = new Set([
  "__pycache__",
  "node_modules",
  ".git",
  ".venv",
  "__MACOSX",
]);
const IGNORED_FILE_BASENAMES = new Set([".DS_Store", "Thumbs.db"]);
const IGNORED_FILE_EXTS = new Set([".pyc", ".pyo", ".swp", ".swo"]);

function isIgnoredFile(name) {
  if (IGNORED_FILE_BASENAMES.has(name)) return true;
  const dot = name.lastIndexOf(".");
  return dot >= 0 && IGNORED_FILE_EXTS.has(name.slice(dot));
}

function walkFiles(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (IGNORED_DIRS.has(ent.name)) continue;
      out.push(...walkFiles(join(dir, ent.name)));
    } else if (ent.isFile()) {
      if (isIgnoredFile(ent.name)) continue;
      out.push(join(dir, ent.name));
    }
  }
  return out;
}

export function generateAllZips(artifactsDir) {
  const dir =
    artifactsDir ?? join(process.cwd(), "public", "artifacts");
  if (!existsSync(dir)) return;

  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const slug = ent.name;
    const slugDir = join(dir, slug);
    const zipPath = join(dir, `${slug}.zip`);

    const files = walkFiles(slugDir);
    if (files.length === 0) continue;

    if (existsSync(zipPath)) {
      const zipMtime = statSync(zipPath).mtimeMs;
      let isStale = false;
      for (const f of files) {
        if (statSync(f).mtimeMs > zipMtime) {
          isStale = true;
          break;
        }
      }
      if (!isStale) continue;
    }

    const entries = files.map((f) => ({
      path: relative(slugDir, f).split(sep).join(posix.sep),
      data: readFileSync(f),
    }));
    writeFileSync(zipPath, buildZip(entries));
  }
}
