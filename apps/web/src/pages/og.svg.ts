/**
 * /og.svg — default brand OG image.
 *
 * Served at https://ooligo.com/og.svg and referenced by BaseLayout
 * whenever a page doesn't set its own per-entity OG image.
 *
 * Per-entity OGs live under /og/[locale]/[entity]/[slug].svg.
 */

import { renderDefaultOg } from "~/lib/og";

export async function GET(): Promise<Response> {
  return new Response(renderDefaultOg(), {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
