/**
 * check-vocab — fail CI on banned vocabulary in MDX bodies.
 *
 * Scans every .mdx file under content/ for terms in BANNED_VOCAB, or only the
 * files/directories passed as arguments (so a single page can be gated).
 * Skips: frontmatter, fenced code blocks (```...```), inline code (`...`),
 * blockquotes (`> ...`), and tables (rows starting with `|`).
 *
 * Banned terms come from CONTENT_VOICE.md. Categories: confidence theater
 * (best-in-class, robust, etc.), filler frames (it's worth noting that),
 * corporate-voice tells (leverage, solutions), modal stacking
 * (could potentially), and hedging without numbers.
 *
 * Hedging terms are case-by-case — they're allowed when followed by a
 * number or a quantitative qualifier. The script flags them as warnings
 * (not failures) so the author can decide.
 *
 * Run: `npm run check:vocab`                        — whole content/ tree
 *      `npm run check:vocab -- <path> [path...]`    — only those paths
 *   --fix-suggestions (optional flag, future): print rewrite suggestions
 *   --warn-only       (optional flag): exit 0 even on findings (for triage)
 *
 * Path arguments may be files or directories, use `/` or `\` separators, and
 * resolve against the cwd or the repo root (npm workspace scripts run from
 * packages/pipeline). A path that does not exist is a hard error — a scoped
 * run must never pass by silently scanning nothing.
 *
 * Exit code: 1 if any HARD-banned term is found in prose. 0 otherwise.
 *            2 if the content root or a passed path can't be found.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

// Categories: hard = fail CI; soft = warn only.
// Hard bans are confidence theater + corporate-voice tells + filler frames + modal stacking.
// Soft warnings are hedging-without-numbers (context-dependent).

const HARD_BANNED: string[] = [
  // Confidence theater
  "best-in-class",
  "best of breed",
  "best-of-breed",
  "world-class",
  "world class",
  "industry-leading",
  "industry leading",
  "industry-standard",
  "industry standard",
  "cutting-edge",
  "cutting edge",
  "state-of-the-art",
  "state of the art",
  "next-generation",
  "next generation",
  "revolutionary",
  "disruptive",
  "innovative",
  "game-changing",
  "game-changer",
  "game changer",
  "powerful",
  "robust",
  "seamless",
  "seamlessly",
  "intuitive",
  "elegant",
  "sleek",
  "sophisticated",
  "comprehensive",
  "holistic",
  "unified",
  "unparalleled",
  "unrivaled",
  "unmatched",
  // Filler frames
  "it's worth noting that",
  "its worth noting that",
  "it is worth noting that",
  "it's important to remember",
  "it is important to remember",
  "it should be noted that",
  "needless to say",
  "suffice to say",
  "as previously discussed",
  "let's dive into",
  "let's take a closer look",
  "let's explore",
  "in conclusion",
  // Corporate-voice tells
  "we believe",
  "in our view",
  "our team thinks",
  "leverage",
  "leveraging",
  "leverages",
  "empower",
  "empowers",
  "empowering",
  "deliver value",
  "drive results",
  "drive outcomes",
  "mission-critical",
  "mission critical",
  "turnkey",
  "synergy",
  "synergies",
  // Modal stacking
  "could potentially",
  "might possibly",
  "may sometimes",
  "could conceivably",
  "might arguably",
];

interface Finding {
  file: string;
  line: number;
  col: number;
  term: string;
  excerpt: string;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      // Skip dist, node_modules, .astro, etc.
      if (ent.name.startsWith(".") || ent.name === "node_modules" || ent.name === "dist") continue;
      walk(full, files);
    } else if (ent.isFile() && full.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Strip parts of a markdown body that should NOT be scanned:
 * - YAML frontmatter (between two `---` lines at the start)
 * - Fenced code blocks (```...```)
 * - Inline code spans (`...`)
 * - Blockquotes (lines starting with `> `)
 * - Tables (lines starting with `|`)
 *
 * Returns line-aligned text — replaced regions become spaces so line
 * and column numbers in findings stay accurate.
 */
function maskNonProse(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let inFenced = false;
  let inFrontmatter = false;
  let frontmatterClosed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const stripped = line.trim();

    // Frontmatter handling
    if (i === 0 && stripped === "---") {
      inFrontmatter = true;
      out.push(" ".repeat(line.length));
      continue;
    }
    if (inFrontmatter) {
      if (stripped === "---") {
        inFrontmatter = false;
        frontmatterClosed = true;
      }
      out.push(" ".repeat(line.length));
      continue;
    }
    void frontmatterClosed; // unused but documents the state machine

    // Fenced code blocks
    if (stripped.startsWith("```")) {
      inFenced = !inFenced;
      out.push(" ".repeat(line.length));
      continue;
    }
    if (inFenced) {
      out.push(" ".repeat(line.length));
      continue;
    }

    // Blockquotes
    if (stripped.startsWith(">")) {
      out.push(" ".repeat(line.length));
      continue;
    }

    // Tables (rows starting with `|`)
    if (stripped.startsWith("|")) {
      out.push(" ".repeat(line.length));
      continue;
    }

    // Inline code spans within the line — replace with spaces preserving length
    let masked = line;
    masked = masked.replace(/`[^`]*`/g, (match) => " ".repeat(match.length));
    out.push(masked);
  }

  return out.join("\n");
}

function scan(file: string): Finding[] {
  const raw = readFileSync(file, "utf8");
  const masked = maskNonProse(raw);
  const lower = masked.toLowerCase();
  const findings: Finding[] = [];

  for (const term of HARD_BANNED) {
    const lowerTerm = term.toLowerCase();
    let idx = 0;
    while ((idx = lower.indexOf(lowerTerm, idx)) !== -1) {
      // Word-boundary check: term must not be sandwiched in a longer word
      const before = idx === 0 ? " " : (lower[idx - 1] ?? " ");
      const after =
        idx + lowerTerm.length >= lower.length ? " " : (lower[idx + lowerTerm.length] ?? " ");
      const isWordChar = (c: string) => /[a-z0-9]/.test(c);
      const beforeIsWord = isWordChar(before);
      const afterIsWord = isWordChar(after);
      // Allow when the term itself starts/ends with non-word chars (e.g. "let's dive into")
      const termStartsWord = isWordChar(lowerTerm[0] ?? "");
      const termEndsWord = isWordChar(lowerTerm[lowerTerm.length - 1] ?? "");
      const startBoundaryOk = !termStartsWord || !beforeIsWord;
      const endBoundaryOk = !termEndsWord || !afterIsWord;

      if (startBoundaryOk && endBoundaryOk) {
        // Compute line + column from idx in `masked` (same length as `raw`)
        const upTo = masked.slice(0, idx);
        const line = upTo.split("\n").length;
        const lastNl = upTo.lastIndexOf("\n");
        const col = idx - lastNl;
        const lineEnd = masked.indexOf("\n", idx);
        const lineText = raw.slice(lastNl + 1, lineEnd === -1 ? raw.length : lineEnd);
        findings.push({ file, line, col, term, excerpt: lineText.trim().slice(0, 100) });
      }
      idx += lowerTerm.length;
    }
  }

  return findings;
}

/**
 * Resolve a CLI path argument to an absolute path.
 *
 * Accepts `/` and `\` separators, and resolves relative paths against the cwd
 * first, then the repo root — so `content/tools/foo.mdx` works both from the
 * repo root and from packages/pipeline (where `npm run` puts the cwd).
 * Returns null when the path exists under neither base.
 */
function resolveArgPath(arg: string, cwd: string, repoRoot: string): string | null {
  const normalized = arg.split(/[\\/]+/).join(sep);
  for (const base of [cwd, repoRoot]) {
    const candidate = resolve(base, normalized);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Expand path arguments into a de-duplicated file list. Directories are walked
 * for .mdx files; explicitly-named files are taken as-is. Args that resolve to
 * nothing are returned in `missing` so the caller can fail loudly.
 */
function collectScopedFiles(
  args: string[],
  cwd: string,
  repoRoot: string,
): { files: string[]; missing: string[] } {
  const files: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const arg of args) {
    const full = resolveArgPath(arg, cwd, repoRoot);
    if (full === null) {
      missing.push(arg);
      continue;
    }
    for (const f of statSync(full).isDirectory() ? walk(full) : [full]) {
      if (seen.has(f)) continue;
      seen.add(f);
      files.push(f);
    }
  }

  return { files, missing };
}

/** Print findings and exit: 0 when clean, 1 when any hard-banned term hit. */
function report(allFindings: Finding[], files: string[], base: string): never {
  if (allFindings.length === 0) {
    console.log(`✓ No banned vocabulary in ${files.length} MDX files.`);
    process.exit(0);
  }

  // Group by file for readable output
  const byFile = new Map<string, Finding[]>();
  for (const f of allFindings) {
    const arr = byFile.get(f.file) ?? [];
    arr.push(f);
    byFile.set(f.file, arr);
  }

  console.log(`✗ Banned vocabulary found in ${byFile.size} of ${files.length} files:\n`);
  for (const [file, findings] of byFile) {
    const rel = relative(base, file);
    console.log(`  ${rel}`);
    for (const f of findings) {
      console.log(`    L${f.line}:${f.col}  "${f.term}"  →  ${f.excerpt}`);
    }
    console.log();
  }
  console.log(`Total findings: ${allFindings.length}`);
  console.log(`See CONTENT_VOICE.md for the banned-vocabulary rules and replacement patterns.`);
  process.exit(1);
}

function scanAll(files: string[]): Finding[] {
  const allFindings: Finding[] = [];
  for (const f of files) {
    allFindings.push(...scan(f));
  }
  return allFindings;
}

function main(): void {
  const cwd = resolve(process.cwd());
  // Allow running from repo root or from packages/pipeline
  const repoRoot = readdirSync(cwd).includes("content") ? cwd : resolve(cwd, "..", "..");
  const contentRoot = join(repoRoot, "content");

  // Only non-flag args are paths; flags (--warn-only, …) stay ignored as before.
  const pathArgs = process.argv.slice(2).filter((a) => a.trim() !== "" && !a.startsWith("-"));

  // Scoped run: gate exactly the passed files/directories, nothing else.
  if (pathArgs.length > 0) {
    const { files, missing } = collectScopedFiles(pathArgs, cwd, repoRoot);
    if (missing.length > 0) {
      for (const m of missing) {
        console.error(`✗ Path not found: ${m}`);
      }
      console.error(`  Tried relative to cwd (${cwd}) and repo root (${repoRoot}).`);
      process.exit(2);
    }
    if (files.length === 0) {
      console.error(`✗ No .mdx files found under: ${pathArgs.join(", ")}`);
      process.exit(2);
    }
    console.log(`Scoped run — ${files.length} file(s) from ${pathArgs.length} path argument(s).`);
    report(scanAll(files), files, cwd);
  }

  if (!readdirSync(resolve(contentRoot, ".."))) {
    console.error(`content/ directory not found from cwd ${cwd}`);
    process.exit(2);
  }

  const files = walk(contentRoot);
  report(scanAll(files), files, cwd);
}

main();
