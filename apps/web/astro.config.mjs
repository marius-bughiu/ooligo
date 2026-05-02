import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
// site URL is overridable per-environment so the deploy workflow can target
// the *.pages.dev URL until the custom domain is wired up.
const siteUrl = process.env.PUBLIC_SITE_URL ?? "https://ooligo.com";

export default defineConfig({
  site: siteUrl,
  output: "static",
  integrations: [mdx(), sitemap({
    i18n: {
      defaultLocale: "en",
      locales: {
        en: "en",
        es: "es",
        "pt-BR": "pt-BR",
      },
    },
  })],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt-BR"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  trailingSlash: "never",
  build: {
    format: "directory",
  },
});
