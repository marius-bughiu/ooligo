// One-shot: cross-tag existing CS-relevant content into the customer-success vertical.
// Adds `customer-success` to the frontmatter `verticals: [...]` array across all 6 locales.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "content");
const LOCALES = ["en", "es", "pt-BR", "ja", "fr", "de"];
const VERTICAL = "customer-success";

const targets = {
  tools: [
    "gainsight", "churnzero", "catalyst", "vitally", "pendo", "intercom",
    "gong", "hubspot", "salesforce", "slack", "calendly", "common-room",
    "claude", "glean",
  ],
  learn: ["activation", "nrr-vs-grr"],
  comparisons: ["gainsight-vs-churnzero", "gainsight-vs-vitally", "catalyst-vs-vitally"],
  stacks: ["customer-success-expansion-stack"],
  workflows: [
    "churn-analysis-skill", "churn-risk-summarizer-claude", "cs-renewal-playbook-skill",
    "expansion-signal-detection-claude", "customer-health-score-n8n", "qbr-prep-skill",
    "mcp-server-vitally-cs", "mcp-server-hubspot-cs",
  ],
};

let edited = 0, skipped = 0, missing = 0;
const report = [];

for (const [type, slugs] of Object.entries(targets)) {
  for (const slug of slugs) {
    for (const loc of LOCALES) {
      const fp = join(ROOT, type, loc, `${slug}.mdx`);
      if (!existsSync(fp)) { missing++; report.push(`MISSING ${type}/${loc}/${slug}`); continue; }
      const src = readFileSync(fp, "utf8");
      // Only touch frontmatter (between first two --- lines).
      const m = src.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) { report.push(`NO-FRONTMATTER ${type}/${loc}/${slug}`); continue; }
      const fm = m[1];
      const vm = fm.match(/^verticals:\s*\[([^\]]*)\]\s*$/m);
      if (!vm) { report.push(`NO-VERTICALS-LINE ${type}/${loc}/${slug}`); continue; }
      const items = vm[1].split(",").map((s) => s.trim()).filter(Boolean);
      if (items.includes(VERTICAL)) { skipped++; continue; }
      items.push(VERTICAL);
      const newLine = `verticals: [${items.join(", ")}]`;
      const newFm = fm.replace(/^verticals:\s*\[[^\]]*\]\s*$/m, newLine);
      const out = src.replace(m[1], newFm);
      writeFileSync(fp, out, "utf8");
      edited++;
    }
  }
}

console.log(`edited=${edited} skipped(already)=${skipped} missing=${missing}`);
if (report.length) console.log(report.join("\n"));
