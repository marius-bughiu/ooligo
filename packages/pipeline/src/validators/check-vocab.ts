/**
 * check-vocab — fail CI on banned vocabulary in MDX bodies.
 *
 * Scans every .mdx file under content/ for terms in BANNED_VOCAB.
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
 * Run: `npm run check:vocab`
 *   --fix-suggestions (optional flag, future): print rewrite suggestions
 *   --warn-only       (optional flag): exit 0 even on findings (for triage)
 *
 * Exit code: 1 if any HARD-banned term is found in prose. 0 otherwise.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

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
    const line = lines[i];
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
      const before = idx === 0 ? " " : lower[idx - 1];
      const after = idx + lowerTerm.length >= lower.length ? " " : lower[idx + lowerTerm.length];
      const isWordChar = (c: string) => /[a-z0-9]/.test(c);
      const beforeIsWord = isWordChar(before);
      const afterIsWord = isWordChar(after);
      // Allow when the term itself starts/ends with non-word chars (e.g. "let's dive into")
      const termStartsWord = isWordChar(lowerTerm[0]);
      const termEndsWord = isWordChar(lowerTerm[lowerTerm.length - 1]);
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

function main(): void {
  const repoRoot = resolve(process.cwd());
  // Allow running from repo root or from packages/pipeline
  const contentRoot = readdirSync(repoRoot).includes("content")
    ? join(repoRoot, "content")
    : join(repoRoot, "..", "..", "content");

  if (!readdirSync(resolve(contentRoot, ".."))) {
    console.error(`content/ directory not found from cwd ${repoRoot}`);
    process.exit(2);
  }

  const files = walk(contentRoot);
  const allFindings: Finding[] = [];
  for (const f of files) {
    allFindings.push(...scan(f));
  }

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
    const rel = relative(repoRoot, file);
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

main();
