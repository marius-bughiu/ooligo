/**
 * Chrome i18n strings.
 *
 * Page bodies localize via the Claude translation pipeline against MDX
 * content; chrome strings are short, stable, and shipped in-repo so the
 * header/footer don't have to round-trip through that pipeline.
 *
 * Add keys here as new chrome surfaces ship; verify ES/PT-BR with the
 * translation glossary before merging.
 */

import type { LocaleCode } from "./config";

export type ChromeStrings = {
  nav: {
    tools: string;
    comparisons: string;
    workflows: string;
    learn: string;
    verticals: string;
  };
  cta: {
    subscribe: string;
    open_menu: string;
    close_menu: string;
    locale: string;
    github: string;
  };
  footer: {
    catalog: string;
    verticals: string;
    build: string;
    subscribe_heading: string;
    subscribe_blurb: string;
    subscribe_placeholder: string;
    roadmap: string;
    architecture: string;
    public_metrics: string;
    repo: string;
    status: string;
    rights: string;
    brand_tagline: string;
  };
  meta: {
    skip_to_content: string;
    home: string;
  };
};

const en: ChromeStrings = {
  nav: {
    tools: "Tools",
    comparisons: "Comparisons",
    workflows: "Workflows",
    learn: "Learn",
    verticals: "Verticals",
  },
  cta: {
    subscribe: "Subscribe",
    open_menu: "Menu",
    close_menu: "Close",
    locale: "Language",
    github: "GitHub",
  },
  footer: {
    catalog: "Catalog",
    verticals: "Verticals",
    build: "Build",
    subscribe_heading: "Get the briefing",
    subscribe_blurb:
      "New tools, comparisons, and workflows for ops leaders. Free, weekly, vertical-tagged.",
    subscribe_placeholder: "you@company.com",
    roadmap: "Roadmap",
    architecture: "Architecture",
    public_metrics: "Public metrics",
    repo: "Repository",
    status: "Status",
    rights: "All rights reserved.",
    brand_tagline: "The AI workflow marketplace for ops leaders.",
  },
  meta: {
    skip_to_content: "Skip to content",
    home: "ooligo, home",
  },
};

const es: ChromeStrings = {
  nav: {
    tools: "Herramientas",
    comparisons: "Comparaciones",
    workflows: "Workflows",
    learn: "Aprender",
    verticals: "Verticales",
  },
  cta: {
    subscribe: "Suscribirse",
    open_menu: "Menú",
    close_menu: "Cerrar",
    locale: "Idioma",
    github: "GitHub",
  },
  footer: {
    catalog: "Catálogo",
    verticals: "Verticales",
    build: "Construcción",
    subscribe_heading: "Recibe el briefing",
    subscribe_blurb:
      "Nuevas herramientas, comparaciones y workflows para líderes de operaciones. Gratis, semanal, etiquetado por vertical.",
    subscribe_placeholder: "tu@empresa.com",
    roadmap: "Hoja de ruta",
    architecture: "Arquitectura",
    public_metrics: "Métricas públicas",
    repo: "Repositorio",
    status: "Estado",
    rights: "Todos los derechos reservados.",
    brand_tagline: "El marketplace de workflows de IA para líderes de operaciones.",
  },
  meta: {
    skip_to_content: "Saltar al contenido",
    home: "ooligo, inicio",
  },
};

const ptBR: ChromeStrings = {
  nav: {
    tools: "Ferramentas",
    comparisons: "Comparações",
    workflows: "Workflows",
    learn: "Aprender",
    verticals: "Verticais",
  },
  cta: {
    subscribe: "Assinar",
    open_menu: "Menu",
    close_menu: "Fechar",
    locale: "Idioma",
    github: "GitHub",
  },
  footer: {
    catalog: "Catálogo",
    verticals: "Verticais",
    build: "Construção",
    subscribe_heading: "Receba o briefing",
    subscribe_blurb:
      "Novas ferramentas, comparações e workflows para líderes de operações. Grátis, semanal, com tag por vertical.",
    subscribe_placeholder: "voce@empresa.com",
    roadmap: "Roadmap",
    architecture: "Arquitetura",
    public_metrics: "Métricas públicas",
    repo: "Repositório",
    status: "Status",
    rights: "Todos os direitos reservados.",
    brand_tagline: "O marketplace de workflows de IA para líderes de operações.",
  },
  meta: {
    skip_to_content: "Pular para o conteúdo",
    home: "ooligo, início",
  },
};

const STRINGS: Record<LocaleCode, ChromeStrings> = {
  en,
  es,
  "pt-BR": ptBR,
};

export function chromeStrings(locale: LocaleCode): ChromeStrings {
  return STRINGS[locale];
}
