import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { hashEnBody } from "./queue-build.js";

function main(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: hash-en <path-to-en-mdx>");
    process.exit(2);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "..", "..", "..", "..");
  const filePath = resolve(repoRoot, arg);
  const parsed = matter(readFileSync(filePath, "utf8"));
  process.stdout.write(hashEnBody(parsed.content) + "\n");
}

const isDirectInvocation =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectInvocation) {
  main();
}
