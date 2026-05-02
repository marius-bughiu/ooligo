/**
 * /og/[locale]/workflows/[slug].svg — per-workflow OG image.
 */

import { getCollection } from "astro:content";
import { renderWorkflowOg } from "~/lib/og";

export async function getStaticPaths() {
  const workflows = await getCollection("workflows");
  return workflows.map((entry) => ({
    params: { locale: entry.data.locale, slug: entry.data.slug },
    props: { entry },
  }));
}

export async function GET({
  props,
}: {
  props: {
    entry: Awaited<ReturnType<typeof getCollection<"workflows">>>[number];
  };
}): Promise<Response> {
  const data = props.entry.data;

  const svg = renderWorkflowOg({
    title: data.title,
    artifact_type: data.artifact_type,
    difficulty: data.difficulty,
    time_to_setup: data.time_to_setup,
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
