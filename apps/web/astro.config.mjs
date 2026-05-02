import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// site URL is overridable per-environment so the deploy workflow can target
// the *.pages.dev URL until the custom domain is wired up.
const siteUrl = process.env.PUBLIC_SITE_URL ?? "https://ooligo.com";

export default defineConfig({
  site: siteUrl,
  output: "static",
  integrations: [mdx(), sitemap({
    // Keep these out of the public sitemap:
    //   - /design/  internal design-system gallery
    //   - /og/      per-entity OG images (asset endpoints, not pages)
    //   - /og.svg   default OG image
    //   - /404      error page
    filter: (page) =>
      !page.includes("/design/") &&
      !page.includes("/og/") &&
      !page.endsWith("/og.svg") &&
      !page.includes("/404"),
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
