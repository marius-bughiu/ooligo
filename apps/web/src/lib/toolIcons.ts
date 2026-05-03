/**
 * toolIcons — slug → local favicon path lookup.
 *
 * Icons live at apps/web/public/tool-icons/<slug>.<ext>, populated by
 * scripts/sync-tool-icons.mjs. We scan the directory once at module
 * load (server/build time) and cache the slug→ext map so render-time
 * lookups are pure object access.
 *
 * Slugs without a file fall back to the typographic monogram in
 * ToolIcon.astro.
 */
import { readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICON_DIR = resolve(__dirname, "..", "..", "public", "tool-icons");

const SUPPORTED = new Set(["svg", "png", "ico", "jpg", "jpeg", "webp"]);

function buildMap(): Record<string, string> {
  if (!existsSync(ICON_DIR)) return {};
  const out: Record<string, string> = {};
  for (const file of readdirSync(ICON_DIR)) {
    const dot = file.lastIndexOf(".");
    if (dot < 1) continue;
    const slug = file.slice(0, dot);
    const ext = file.slice(dot + 1).toLowerCase();
    if (!SUPPORTED.has(ext)) continue;
    out[slug] = `/tool-icons/${file}`;
  }
  return out;
}

const ICON_MAP: Record<string, string> = buildMap();

export function getToolIconPath(slug: string): string | null {
  return ICON_MAP[slug] ?? null;
}
