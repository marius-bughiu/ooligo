/**
 * /og/[locale]/learn/[slug].svg — per-learn OG image.
 */

import { getCollection } from "astro:content";
import { renderLearnOg } from "~/lib/og";

export async function getStaticPaths() {
  const entries = await getCollection("learn");
  return entries.map((entry) => ({
    params: { locale: entry.data.locale, slug: entry.data.slug },
    props: { entry },
  }));
}

export async function GET({
  props,
}: {
  props: {
    entry: Awaited<ReturnType<typeof getCollection<"learn">>>[number];
  };
}): Promise<Response> {
  const data = props.entry.data;

  const svg = renderLearnOg({
    title: data.title,
    type: data.type,
    question: data.target_questions[0],
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
