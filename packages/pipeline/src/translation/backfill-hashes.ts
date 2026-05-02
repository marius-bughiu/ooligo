import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { hashEnBody } from "./queue-build.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..");
const contentDir = resolve(repoRoot, "content");

const COLLECTIONS = ["tools", "comparisons", "workflows", "learn"] as const;
type Collection = (typeof COLLECTIONS)[number];

type LocaleEntry = { code: string; is_canonical: boolean };
type LocalesFile = { locales: LocaleEntry[] };

function nonCanonicalLocales(): string[] {
  const f = JSON.parse(
    readFileSync(resolve(contentDir, "locales.json"), "utf8")
  ) as LocalesFile;
  return f.locales.filter((l) => !l.is_canonical).map((l) => l.code);
}

function listMdx(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => resolve(dir, f))
    .sort();
}

/**
 * Surgical injection: find the closing `---` of the YAML frontmatter and
 * insert (or replace) a `source_sha256: "<hash>"` line directly above it.
 * Preserves all other formatting in the file.
 */
function upsertSourceHash(fileText: string, hash: string): string | null {
  if (!fileText.startsWith("---\n") && !fileText.startsWith("---\r\n")) return null;
  const newline = fileText.startsWith("---\r\n") ? "\r\n" : "\n";
  const afterFirstFence = fileText.indexOf(newline) + newline.length;
  const closingIdx = fileText.indexOf(`${newline}---${newline}`, afterFirstFence);
  if (closingIdx === -1) return null;

  const fmBlock = fileText.slice(afterFirstFence, closingIdx);
  const fmLines = fmBlock.split(newline);
  const existingIdx = fmLines.findIndex((l) => /^source_sha256\s*:/.test(l));
  const newLine = `source_sha256: "${hash}"`;
  if (existingIdx >= 0) {
    fmLines[existingIdx] = newLine;
  } else {
    fmLines.push(newLine);
  }
  const newFmBlock = fmLines.join(newline);
  return (
    fileText.slice(0, afterFirstFence) +
    newFmBlock +
    fileText.slice(closingIdx)
  );
}

type Result = { updated: number; skipped: number; missingEn: string[] };

function backfillCollection(collection: Collection, locale: string): Result {
  const result: Result = { updated: 0, skipped: 0, missingEn: [] };
  const targetDir = resolve(contentDir, collection, locale);
  for (const targetFile of listMdx(targetDir)) {
    const targetText = readFileSync(targetFile, "utf8");
    const targetParsed = matter(targetText);
    const canonical =
      typeof targetParsed.data.canonical_slug === "string"
        ? targetParsed.data.canonical_slug
        : basename(targetFile, ".mdx");
    const enFile = resolve(contentDir, collection, "en", `${canonical}.mdx`);
    if (!existsSync(enFile)) {
      result.missingEn.push(`${collection}/${locale}/${canonical}`);
      continue;
    }
    const enParsed = matter(readFileSync(enFile, "utf8"));
    const hash = hashEnBody(enParsed.content);
    if (targetParsed.data.source_sha256 === hash) {
      result.skipped += 1;
      continue;
    }
    const next = upsertSourceHash(targetText, hash);
    if (next === null) {
      console.error(`! Could not parse frontmatter fences in ${targetFile}`);
      continue;
    }
    writeFileSync(targetFile, next, "utf8");
    result.updated += 1;
  }
  return result;
}

function main(): void {
  const totals = { updated: 0, skipped: 0, missingEn: [] as string[] };
  for (const locale of nonCanonicalLocales()) {
    for (const collection of COLLECTIONS) {
      const r = backfillCollection(collection, locale);
      totals.updated += r.updated;
      totals.skipped += r.skipped;
      totals.missingEn.push(...r.missingEn);
      if (r.updated || r.missingEn.length) {
        console.log(
          `${locale}/${collection}: +${r.updated} updated, ${r.skipped} already current` +
            (r.missingEn.length ? `, ${r.missingEn.length} orphan` : "")
        );
      }
    }
  }
  console.log(
    `\nDone. ${totals.updated} files updated, ${totals.skipped} already current.`
  );
  if (totals.missingEn.length > 0) {
    console.warn(
      `\n${totals.missingEn.length} translated file(s) have no EN sibling (orphan):`
    );
    for (const o of totals.missingEn) console.warn(`  - ${o}`);
  }
}

const isDirectInvocation =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectInvocation) {
  main();
}
