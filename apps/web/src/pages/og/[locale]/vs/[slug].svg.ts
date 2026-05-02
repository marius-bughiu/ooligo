/**
 * /og/[locale]/vs/[slug].svg — per-comparison OG image.
 *
 * Resolves tool names for the locale so pairwise titles read
 * "Clay vs Apollo" not "clay-vs-apollo".
 */

import { getCollection } from "astro:content";
import { renderComparisonOg } from "~/lib/og";

export async function getStaticPaths() {
  const comparisons = await getCollection("comparisons");
  const tools = await getCollection("tools");

  // Build a per-locale name lookup once.
  const nameByLocaleSlug = new Map<string, string>();
  for (const t of tools) {
    nameByLocaleSlug.set(`${t.data.locale}:${t.data.slug}`, t.data.name);
  }

  return comparisons.map((entry) => {
    const data = entry.data;
    const resolve = (slug: string): string =>
      nameByLocaleSlug.get(`${data.locale}:${slug}`) ?? slug;

    let pageTitle: string;
    if (data.type === "pairwise" && data.tool_a && data.tool_b) {
      pageTitle = `${resolve(data.tool_a)} vs ${resolve(data.tool_b)}`;
    } else if (data.type === "alternatives" && data.tools && data.tools[0]) {
      pageTitle = `Alternatives to ${resolve(data.tools[0])}`;
    } else if (data.type === "roundup") {
      pageTitle = `Best ${data.verticals[0]} tools`;
    } else {
      pageTitle = data.slug.replace(/-/g, " ");
    }

    return {
      params: { locale: data.locale, slug: data.slug },
      props: {
        type: data.type,
        pageTitle,
        contextLabel: `${data.verticals.join(" · ")} · updated ${data.last_updated}`,
      },
    };
  });
}

export async function GET({
  props,
}: {
  props: {
    type: "pairwise" | "roundup" | "alternatives";
    pageTitle: string;
    contextLabel: string;
  };
}): Promise<Response> {
  const svg = renderComparisonOg({
    type: props.type,
    pageTitle: props.pageTitle,
    contextLabel: props.contextLabel,
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
