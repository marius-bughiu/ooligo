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
    stacks: string;
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
  difficulty: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  contribute: {
    edit_page: string;
    add_tool: string;
    add_learn: string;
    add_comparison: string;
    add_workflow: string;
    add_stack: string;
  };
};

const en: ChromeStrings = {
  nav: {
    tools: "Tools",
    comparisons: "Comparisons",
    workflows: "Workflows",
    learn: "Learn",
    stacks: "Stacks",
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
  difficulty: {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  },
  contribute: {
    edit_page: "Edit this page on GitHub",
    add_tool: "Tool missing? Add it on GitHub",
    add_learn: "Topic missing? Add an entry on GitHub",
    add_comparison: "Comparison missing? Add it on GitHub",
    add_workflow: "Workflow missing? Add it on GitHub",
    add_stack: "Stack missing? Add it on GitHub",
  },
};

const es: ChromeStrings = {
  nav: {
    tools: "Herramientas",
    comparisons: "Comparaciones",
    workflows: "Workflows",
    learn: "Aprender",
    stacks: "Stacks",
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
  difficulty: {
    beginner: "principiante",
    intermediate: "intermedio",
    advanced: "avanzado",
  },
  contribute: {
    edit_page: "Editar esta página en GitHub",
    add_tool: "¿Falta una herramienta? Añádela en GitHub",
    add_learn: "¿Falta un tema? Añade una entrada en GitHub",
    add_comparison: "¿Falta una comparación? Añádela en GitHub",
    add_workflow: "¿Falta un workflow? Añádelo en GitHub",
    add_stack: "¿Falta un stack? Añádelo en GitHub",
  },
};

const ptBR: ChromeStrings = {
  nav: {
    tools: "Ferramentas",
    comparisons: "Comparações",
    workflows: "Workflows",
    learn: "Aprender",
    stacks: "Stacks",
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
  difficulty: {
    beginner: "iniciante",
    intermediate: "intermediário",
    advanced: "avançado",
  },
  contribute: {
    edit_page: "Editar esta página no GitHub",
    add_tool: "Falta uma ferramenta? Adicione no GitHub",
    add_learn: "Falta um tópico? Adicione uma entrada no GitHub",
    add_comparison: "Falta uma comparação? Adicione no GitHub",
    add_workflow: "Falta um workflow? Adicione no GitHub",
    add_stack: "Falta uma stack? Adicione no GitHub",
  },
};

const ja: ChromeStrings = {
  nav: {
    tools: "ツール",
    comparisons: "比較",
    workflows: "ワークフロー",
    learn: "学ぶ",
    stacks: "スタック",
    verticals: "業種",
  },
  cta: {
    subscribe: "購読する",
    open_menu: "メニュー",
    close_menu: "閉じる",
    locale: "言語",
    github: "GitHub",
  },
  footer: {
    catalog: "カタログ",
    verticals: "業種",
    build: "開発",
    subscribe_heading: "ブリーフィングを受け取る",
    subscribe_blurb:
      "オペレーションリーダー向けの新しいツール、比較、ワークフロー。無料、毎週、業種別タグ付き。",
    subscribe_placeholder: "you@company.com",
    roadmap: "ロードマップ",
    architecture: "アーキテクチャ",
    public_metrics: "公開メトリクス",
    repo: "リポジトリ",
    status: "ステータス",
    rights: "All rights reserved.",
    brand_tagline: "オペレーションリーダーのためのAIワークフローマーケットプレイス。",
  },
  meta: {
    skip_to_content: "コンテンツへスキップ",
    home: "ooligo、ホーム",
  },
  difficulty: {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級",
  },
  contribute: {
    edit_page: "GitHubでこのページを編集",
    add_tool: "ツールが見つからない場合はGitHubで追加",
    add_learn: "トピックがない場合はGitHubでエントリを追加",
    add_comparison: "比較がない場合はGitHubで追加",
    add_workflow: "ワークフローがない場合はGitHubで追加",
    add_stack: "スタックがない場合はGitHubで追加",
  },
};

const fr: ChromeStrings = {
  nav: {
    tools: "Outils",
    comparisons: "Comparaisons",
    workflows: "Workflows",
    learn: "Apprendre",
    stacks: "Stacks",
    verticals: "Secteurs",
  },
  cta: {
    subscribe: "S'abonner",
    open_menu: "Menu",
    close_menu: "Fermer",
    locale: "Langue",
    github: "GitHub",
  },
  footer: {
    catalog: "Catalogue",
    verticals: "Secteurs",
    build: "Construction",
    subscribe_heading: "Recevez le briefing",
    subscribe_blurb:
      "Nouveaux outils, comparaisons et workflows pour les responsables ops. Gratuit, hebdomadaire, balisé par secteur.",
    subscribe_placeholder: "vous@entreprise.com",
    roadmap: "Roadmap",
    architecture: "Architecture",
    public_metrics: "Métriques publiques",
    repo: "Dépôt",
    status: "Statut",
    rights: "Tous droits réservés.",
    brand_tagline: "La marketplace de workflows IA pour les responsables ops.",
  },
  meta: {
    skip_to_content: "Aller au contenu",
    home: "ooligo, accueil",
  },
  difficulty: {
    beginner: "débutant",
    intermediate: "intermédiaire",
    advanced: "avancé",
  },
  contribute: {
    edit_page: "Modifier cette page sur GitHub",
    add_tool: "Outil manquant ? Ajoutez-le sur GitHub",
    add_learn: "Sujet manquant ? Ajoutez une entrée sur GitHub",
    add_comparison: "Comparaison manquante ? Ajoutez-la sur GitHub",
    add_workflow: "Workflow manquant ? Ajoutez-le sur GitHub",
    add_stack: "Stack manquant ? Ajoutez-le sur GitHub",
  },
};

const de: ChromeStrings = {
  nav: {
    tools: "Tools",
    comparisons: "Vergleiche",
    workflows: "Workflows",
    learn: "Lernen",
    stacks: "Stacks",
    verticals: "Branchen",
  },
  cta: {
    subscribe: "Abonnieren",
    open_menu: "Menü",
    close_menu: "Schließen",
    locale: "Sprache",
    github: "GitHub",
  },
  footer: {
    catalog: "Katalog",
    verticals: "Branchen",
    build: "Aufbau",
    subscribe_heading: "Briefing abonnieren",
    subscribe_blurb:
      "Neue Tools, Vergleiche und Workflows für Ops-Verantwortliche. Kostenlos, wöchentlich, branchenspezifisch getaggt.",
    subscribe_placeholder: "sie@firma.com",
    roadmap: "Roadmap",
    architecture: "Architektur",
    public_metrics: "Öffentliche Metriken",
    repo: "Repository",
    status: "Status",
    rights: "Alle Rechte vorbehalten.",
    brand_tagline: "Der KI-Workflow-Marketplace für Ops-Verantwortliche.",
  },
  meta: {
    skip_to_content: "Zum Inhalt springen",
    home: "ooligo, Startseite",
  },
  difficulty: {
    beginner: "Anfänger",
    intermediate: "Fortgeschritten",
    advanced: "Profi",
  },
  contribute: {
    edit_page: "Diese Seite auf GitHub bearbeiten",
    add_tool: "Tool fehlt? Auf GitHub hinzufügen",
    add_learn: "Thema fehlt? Eintrag auf GitHub hinzufügen",
    add_comparison: "Vergleich fehlt? Auf GitHub hinzufügen",
    add_workflow: "Workflow fehlt? Auf GitHub hinzufügen",
    add_stack: "Stack fehlt? Auf GitHub hinzufügen",
  },
};

const STRINGS: Partial<Record<LocaleCode, ChromeStrings>> & {
  en: ChromeStrings;
} = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  fr,
  de,
};

export function chromeStrings(locale: LocaleCode): ChromeStrings {
  return STRINGS[locale] ?? STRINGS.en;
}
