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

const ru: ChromeStrings = {
  nav: {
    tools: "Инструменты",
    comparisons: "Сравнения",
    workflows: "Workflow",
    learn: "Обучение",
    stacks: "Stack-и",
    verticals: "Вертикали",
  },
  cta: {
    subscribe: "Подписаться",
    open_menu: "Меню",
    close_menu: "Закрыть",
    locale: "Язык",
    github: "GitHub",
  },
  footer: {
    catalog: "Каталог",
    verticals: "Вертикали",
    build: "Разработка",
    subscribe_heading: "Получайте брифинг",
    subscribe_blurb:
      "Новые инструменты, сравнения и workflow для руководителей операций. Бесплатно, еженедельно, с тегами по вертикалям.",
    subscribe_placeholder: "you@company.com",
    roadmap: "Roadmap",
    architecture: "Архитектура",
    public_metrics: "Публичные метрики",
    repo: "Репозиторий",
    status: "Статус",
    rights: "Все права защищены.",
    brand_tagline: "Marketplace AI-workflow для руководителей операций.",
  },
  meta: {
    skip_to_content: "Перейти к содержимому",
    home: "ooligo, главная",
  },
  difficulty: {
    beginner: "начальный",
    intermediate: "средний",
    advanced: "продвинутый",
  },
  contribute: {
    edit_page: "Редактировать эту страницу на GitHub",
    add_tool: "Не хватает инструмента? Добавьте на GitHub",
    add_learn: "Не хватает темы? Добавьте запись на GitHub",
    add_comparison: "Не хватает сравнения? Добавьте на GitHub",
    add_workflow: "Не хватает workflow? Добавьте на GitHub",
    add_stack: "Не хватает stack-а? Добавьте на GitHub",
  },
};

const ro: ChromeStrings = {
  nav: {
    tools: "Unelte",
    comparisons: "Comparații",
    workflows: "Workflow-uri",
    learn: "Învață",
    stacks: "Stack-uri",
    verticals: "Verticale",
  },
  cta: {
    subscribe: "Abonează-te",
    open_menu: "Meniu",
    close_menu: "Închide",
    locale: "Limbă",
    github: "GitHub",
  },
  footer: {
    catalog: "Catalog",
    verticals: "Verticale",
    build: "Construcție",
    subscribe_heading: "Primește briefing-ul",
    subscribe_blurb:
      "Unelte, comparații și workflow-uri noi pentru lideri de ops. Gratis, săptămânal, etichetat pe verticală.",
    subscribe_placeholder: "tu@companie.com",
    roadmap: "Roadmap",
    architecture: "Arhitectură",
    public_metrics: "Metrici publice",
    repo: "Repository",
    status: "Status",
    rights: "Toate drepturile rezervate.",
    brand_tagline: "Marketplace-ul de workflow-uri AI pentru lideri de ops.",
  },
  meta: {
    skip_to_content: "Sari la conținut",
    home: "ooligo, acasă",
  },
  difficulty: {
    beginner: "începător",
    intermediate: "intermediar",
    advanced: "avansat",
  },
  contribute: {
    edit_page: "Editează pagina pe GitHub",
    add_tool: "Lipsește o unealtă? Adaug-o pe GitHub",
    add_learn: "Lipsește un subiect? Adaugă o intrare pe GitHub",
    add_comparison: "Lipsește o comparație? Adaug-o pe GitHub",
    add_workflow: "Lipsește un workflow? Adaug-l pe GitHub",
    add_stack: "Lipsește un stack? Adaug-l pe GitHub",
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

const zhCN: ChromeStrings = {
  nav: {
    tools: "工具",
    comparisons: "对比",
    workflows: "工作流",
    learn: "学习",
    stacks: "组合",
    verticals: "垂直领域",
  },
  cta: {
    subscribe: "订阅",
    open_menu: "菜单",
    close_menu: "关闭",
    locale: "语言",
    github: "GitHub",
  },
  footer: {
    catalog: "目录",
    verticals: "垂直领域",
    build: "构建",
    subscribe_heading: "订阅简报",
    subscribe_blurb:
      "面向运营负责人的全新工具、对比与工作流。免费、每周一封，按垂直领域打标签。",
    subscribe_placeholder: "you@company.com",
    roadmap: "路线图",
    architecture: "架构",
    public_metrics: "公开指标",
    repo: "代码仓库",
    status: "状态",
    rights: "保留所有权利。",
    brand_tagline: "面向运营负责人的 AI 工作流市场。",
  },
  meta: {
    skip_to_content: "跳到正文",
    home: "ooligo，首页",
  },
  difficulty: {
    beginner: "入门",
    intermediate: "进阶",
    advanced: "高级",
  },
  contribute: {
    edit_page: "在 GitHub 上编辑此页",
    add_tool: "缺少工具？去 GitHub 添加",
    add_learn: "缺少主题？去 GitHub 添加条目",
    add_comparison: "缺少对比？去 GitHub 添加",
    add_workflow: "缺少工作流？去 GitHub 添加",
    add_stack: "缺少组合？去 GitHub 添加",
  },
};

const ko: ChromeStrings = {
  nav: {
    tools: "도구",
    comparisons: "비교",
    workflows: "워크플로우",
    learn: "학습",
    stacks: "스택",
    verticals: "버티컬",
  },
  cta: {
    subscribe: "구독하기",
    open_menu: "메뉴",
    close_menu: "닫기",
    locale: "언어",
    github: "GitHub",
  },
  footer: {
    catalog: "카탈로그",
    verticals: "버티컬",
    build: "빌드",
    subscribe_heading: "브리핑 받기",
    subscribe_blurb:
      "Ops 리더를 위한 새로운 도구, 비교, 워크플로우. 무료, 주간, 버티컬별 태그.",
    subscribe_placeholder: "you@company.com",
    roadmap: "로드맵",
    architecture: "아키텍처",
    public_metrics: "공개 지표",
    repo: "리포지토리",
    status: "상태",
    rights: "All rights reserved.",
    brand_tagline: "Ops 리더를 위한 AI 워크플로우 마켓플레이스.",
  },
  meta: {
    skip_to_content: "본문으로 건너뛰기",
    home: "ooligo, 홈",
  },
  difficulty: {
    beginner: "입문",
    intermediate: "중급",
    advanced: "고급",
  },
  contribute: {
    edit_page: "GitHub에서 이 페이지 편집",
    add_tool: "도구가 없나요? GitHub에서 추가하세요",
    add_learn: "주제가 없나요? GitHub에서 항목을 추가하세요",
    add_comparison: "비교가 없나요? GitHub에서 추가하세요",
    add_workflow: "워크플로우가 없나요? GitHub에서 추가하세요",
    add_stack: "스택이 없나요? GitHub에서 추가하세요",
  },
};

const ar: ChromeStrings = {
  nav: {
    tools: "أدوات",
    comparisons: "مقارنات",
    workflows: "سير العمل",
    learn: "تعلَّم",
    stacks: "حزم",
    verticals: "قطاعات",
  },
  cta: {
    subscribe: "اشترك",
    open_menu: "القائمة",
    close_menu: "إغلاق",
    locale: "اللغة",
    github: "GitHub",
  },
  footer: {
    catalog: "الكتالوج",
    verticals: "القطاعات",
    build: "البناء",
    subscribe_heading: "احصل على الموجز",
    subscribe_blurb:
      "أدوات ومقارنات وسير عمل جديدة لقادة العمليات. مجانًا، أسبوعيًا، مع تصنيف حسب القطاع.",
    subscribe_placeholder: "you@company.com",
    roadmap: "خارطة الطريق",
    architecture: "البنية",
    public_metrics: "مقاييس علنية",
    repo: "المستودع",
    status: "الحالة",
    rights: "جميع الحقوق محفوظة.",
    brand_tagline: "سوق سير عمل الذكاء الاصطناعي لقادة العمليات.",
  },
  meta: {
    skip_to_content: "تخطَّ إلى المحتوى",
    home: "ooligo، الصفحة الرئيسية",
  },
  difficulty: {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  },
  contribute: {
    edit_page: "حرِّر هذه الصفحة على GitHub",
    add_tool: "أداة مفقودة؟ أضِفها على GitHub",
    add_learn: "موضوع مفقود؟ أضِف مدخلاً على GitHub",
    add_comparison: "مقارنة مفقودة؟ أضِفها على GitHub",
    add_workflow: "سير عمل مفقود؟ أضِفه على GitHub",
    add_stack: "حزمة مفقودة؟ أضِفها على GitHub",
  },
};

const STRINGS: Partial<Record<LocaleCode, ChromeStrings>> & {
  en: ChromeStrings;
} = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  ru,
  ro,
  fr,
  de,
  "zh-CN": zhCN,
  ko,
  ar,
};

export function chromeStrings(locale: LocaleCode): ChromeStrings {
  return STRINGS[locale] ?? STRINGS.en;
}
