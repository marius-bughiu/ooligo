/**
 * /og/[locale]/tools/[slug].svg — per-tool OG image.
 *
 * Generated for every tool entry at build time. The corresponding
 * tool detail page passes its OG path via BaseLayout's ogImagePath
 * prop so social cards link directly here.
 */

import { getCollection } from "astro:content";
import { renderToolOg } from "~/lib/og";

export async function getStaticPaths() {
  const tools = await getCollection("tools");
  return tools.map((entry) => ({
    params: { locale: entry.data.locale, slug: entry.data.slug },
    props: { entry },
  }));
}

export async function GET({
  props,
}: {
  props: { entry: Awaited<ReturnType<typeof getCollection<"tools">>>[number] };
}): Promise<Response> {
  const data = props.entry.data;

  const pricingLabel =
    data.pricing_model === "free"
      ? "free"
      : data.pricing_starts_at != null
        ? `$${data.pricing_starts_at}/mo · ${data.pricing_model}`
        : data.pricing_model;

  const svg = renderToolOg({
    name: data.name,
    category: data.category,
    ooligo_score: data.ooligo_score ?? null,
    ai_native: data.ai_native,
    pricing_label: pricingLabel,
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
