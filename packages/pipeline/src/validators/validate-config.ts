import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import addFormats from "ajv-formats";

type ValidationResult = {
  ok: boolean;
  file: string;
  errors: ErrorObject[];
};

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..");
const contentDir = resolve(repoRoot, "content");
const schemaDir = resolve(contentDir, ".schema");

function loadJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function makeAjv(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

function validateOne(
  ajv: Ajv2020,
  schemaPath: string,
  dataPath: string
): ValidationResult {
  const schema = loadJson(schemaPath);
  const data = loadJson(dataPath);
  const validate = ajv.compile(schema as object);
  const ok = validate(data);
  return {
    ok: !!ok,
    file: dataPath.replace(repoRoot, "").replace(/^[/\\]/, ""),
    errors: validate.errors ?? [],
  };
}

export function validateConfig(): ValidationResult[] {
  const ajv = makeAjv();
  const targets: Array<{ schema: string; data: string }> = [
    {
      schema: resolve(schemaDir, "verticals.schema.json"),
      data: resolve(contentDir, "verticals.json"),
    },
    {
      schema: resolve(schemaDir, "locales.schema.json"),
      data: resolve(contentDir, "locales.json"),
    },
  ];
  return targets.map((t) => validateOne(ajv, t.schema, t.data));
}

function formatErrors(errors: ErrorObject[]): string {
  return errors
    .map((e) => `    ${e.instancePath || "(root)"} ${e.message ?? ""}`)
    .join("\n");
}

function main(): void {
  const results = validateConfig();
  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`✓ ${r.file}`);
    } else {
      failed += 1;
      console.error(`✗ ${r.file}`);
      console.error(formatErrors(r.errors));
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} config file(s) failed validation.`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} config file(s) valid.`);
}

const isDirectInvocation =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectInvocation) {
  main();
}
