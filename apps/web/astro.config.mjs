import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { groupedSitemap } from "./scripts/sitemap.mjs";
import tailwindcss from "@tailwindcss/vite";
import { generateAllZips } from "./scripts/generate-artifact-zips.mjs";

// Generate per-bundle ZIP archives for every workflow artifact dir
// under public/artifacts/. Runs at config-load (before Astro reads
// public/), so zips ship as static assets via the normal pipeline.
// No-op when zips are already up-to-date — cheap to run on every dev/build/preview.
generateAllZips();

// https://astro.build/config
// site URL is overridable per-environment so the deploy workflow can target
// the *.pages.dev URL until the custom domain is wired up.
const siteUrl = process.env.PUBLIC_SITE_URL ?? "https://ooligo.com";

export default defineConfig({
  site: siteUrl,
  output: "static",
  integrations: [mdx(), groupedSitemap({ site: siteUrl })],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt-BR", "ja", "fr", "de"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  // Cloudflare Pages serves /path/index.html at /path/ (with trailing slash)
  // and 308-redirects /path → /path/. Keep "always" so canonical, hreflang,
  // and internal hrefs all match the served URL with trailing slash.
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
