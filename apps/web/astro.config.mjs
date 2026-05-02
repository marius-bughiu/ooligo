import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://ooligo.com",
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
