import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ENRICHMENT_WORKFLOW = "lead-enrichment-clay-claude";
export const ENRICHMENT_COMMAND = "python3 pipeline.py demo";

type Extraction = {
  row_id: string;
  industry: string | null;
  headcount: number | null;
  region: string | null;
  evidence: { headcount: { quote: string } | null };
};

type Result = {
  row_id: string;
  domain: string;
  status: string;
  icp_fit_score: number | null;
  review_required: boolean;
  mode: string;
};

type Lead = {
  row_id: string;
  sources: { text: string }[];
};

function readExample<T>(filename: string): T[] {
  const path = join(process.cwd(), "public", "artifacts", ENRICHMENT_WORKFLOW, "examples", filename);
  return readFileSync(path, "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line) as T);
}

// Read the downloadable fixtures at build time: the UI never invents live results.
export function getEnrichmentExample() {
  const extractions = readExample<Extraction>("extractions.jsonl");
  const results = readExample<Result>("expected-output.jsonl");
  const leads = readExample<Lead>("leads.jsonl");
  const cases = ["demo-01", "demo-10", "demo-18"].map((id) => {
    const extraction = extractions.find((row) => row.row_id === id);
    const result = results.find((row) => row.row_id === id);
    const lead = leads.find((row) => row.row_id === id);
    if (!extraction || !result || !lead || result.mode !== "offline_demo" || !result.review_required) {
      throw new Error(`Missing or changed synthetic enrichment example: ${id}`);
    }
    return { extraction, result, sourceText: lead.sources[0]?.text ?? "" };
  });
  return { rowCount: results.length, cases };
}
