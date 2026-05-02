/**
 * /og/[locale]/r/[vertical].svg — per-vertical landing OG image.
 */

import {
  locales,
  verticals,
  localizedName,
  localizedTagline,
  type LocaleCode,
} from "~/lib/config";
import { renderVerticalOg } from "~/lib/og";

export function getStaticPaths() {
  const paths: Array<{
    params: { locale: string; vertical: string };
    props: { name: string; tagline: string; isFlagship: boolean };
  }> = [];

  for (const l of locales) {
    for (const v of verticals) {
      paths.push({
        params: { locale: l.code, vertical: v.slug },
        props: {
          name: localizedName(v, l.code as LocaleCode),
          tagline: localizedTagline(v, l.code as LocaleCode),
          isFlagship: v.is_flagship,
        },
      });
    }
  }

  return paths;
}

export async function GET({
  props,
}: {
  props: { name: string; tagline: string; isFlagship: boolean };
}): Promise<Response> {
  const svg = renderVerticalOg({
    name: props.name,
    tagline: props.tagline,
    isFlagship: props.isFlagship,
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
