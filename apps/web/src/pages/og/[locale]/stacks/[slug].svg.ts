/**
 * /og/[locale]/stacks/[slug].svg — per-stack OG image.
 */

import { getCollection } from "astro:content";
import { renderStackOg } from "~/lib/og";

export async function getStaticPaths() {
  const stacks = await getCollection("stacks");
  return stacks.map((entry) => ({
    params: { locale: entry.data.locale, slug: entry.data.slug },
    props: { entry },
  }));
}

export async function GET({
  props,
}: {
  props: {
    entry: Awaited<ReturnType<typeof getCollection<"stacks">>>[number];
  };
}): Promise<Response> {
  const data = props.entry.data;

  const svg = renderStackOg({
    title: data.title,
    use_case: data.use_case,
    difficulty: data.difficulty,
    toolCount: data.tools.length,
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
