/**
 * "About" page prose, per locale.
 *
 * Canonical = en. Other locales fall back to en via `localeText` if a
 * specific locale isn't present here yet. Keep paragraph counts equal
 * across locales so the rendered layout doesn't shift.
 */

import type { LegalPage } from "./types";
import type { LocaleCode } from "../config";

const LAST_UPDATED = "2026-05-13";

const en: LegalPage = {
  title: "About ooligo",
  description:
    "ooligo is an independent, open-source reference site for ops leaders — tools, comparisons, workflows, and stacks for RevOps, Legal Ops, and TA/Recruiting Ops.",
  heading: "About ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo is a small, independent reference site for the people who run operations inside modern companies — RevOps, Legal Ops, and TA/Recruiting Ops in particular.",
  sections: [
    {
      heading: "Who runs the site",
      body: [
        "ooligo is built and maintained by Marius Bughiu, an independent operator with a background in B2B SaaS. The site started as a personal reference — a way to keep track of which tools were actually being adopted in ops teams and how they fit together — and grew into a public catalog as more of those notes accumulated.",
        "There is no parent company, no investor backing, and no sales team. Editorial decisions are made by one person; if you disagree with one, the contact page is the right place to say so.",
      ],
    },
    {
      heading: "What's on the site",
      body: [
        "ooligo organizes ops content into a few overlapping shapes: a tools catalog (vendor profiles with category, pricing model, and integrations), comparisons (side-by-side breakdowns of tools that solve the same problem), workflows (multi-step automations and the tools that run them), stacks (the bundles of tools that work well together in a given vertical), and a learn section (definitions, frameworks, and FAQs).",
        "Everything is grouped by the three verticals the site covers — RevOps, Legal Ops, and TA/Recruiting Ops — plus a cross-cutting layer of shared concepts that show up in all three.",
      ],
    },
    {
      heading: "How content is produced",
      body: [
        "Pages are drafted from primary sources — vendor documentation, public pricing pages, the operators who use these tools day-to-day — and then reviewed before publishing. Where AI tooling is used in drafting, the output is treated as a first pass that has to be fact-checked against real sources, not as the final product.",
        "Every page records a `last_updated` date in its frontmatter so you can see how fresh the information is. When something changes meaningfully — a vendor's pricing model shifts, a new tool enters a category, a workflow gets a better automation primitive — the page gets revisited and the date bumped.",
      ],
    },
    {
      heading: "Build in public",
      body: [
        "The site's source code lives in a public GitHub repository under the MIT license. The full architecture, content schema, and roadmap are linked from the footer. Corrections are welcome as pull requests or as a note via the contact page; the goal is for the catalog to be more accurate after your visit than before it.",
        "The site is funded by display advertising (Google AdSense) and a small newsletter sponsorship pool. Neither affects which tools get covered or how they're described — pricing, integrations, and limitations are reported as they are, not as vendors would like them to be.",
      ],
    },
  ],
};

const es: LegalPage = {
  title: "Sobre ooligo",
  description:
    "ooligo es un sitio de referencia independiente y de código abierto para líderes de operaciones: herramientas, comparaciones, workflows y stacks para RevOps, Legal Ops y TA/Recruiting Ops.",
  heading: "Sobre ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo es un sitio de referencia pequeño e independiente para quienes dirigen operaciones dentro de empresas modernas — en particular RevOps, Legal Ops y TA/Recruiting Ops.",
  sections: [
    {
      heading: "Quién mantiene el sitio",
      body: [
        "ooligo lo construye y mantiene Marius Bughiu, un operador independiente con experiencia en B2B SaaS. El sitio empezó como una referencia personal — una manera de seguir qué herramientas se adoptaban realmente en los equipos de ops y cómo encajaban entre sí — y creció hasta convertirse en un catálogo público a medida que se acumulaban esas notas.",
        "No hay empresa matriz, ni inversores, ni equipo comercial. Las decisiones editoriales las toma una sola persona; si no estás de acuerdo con alguna, la página de contacto es el lugar adecuado para decirlo.",
      ],
    },
    {
      heading: "Qué hay en el sitio",
      body: [
        "ooligo organiza el contenido de ops en varias formas que se superponen: un catálogo de herramientas (perfiles de proveedores con categoría, modelo de precios e integraciones), comparaciones (análisis lado a lado de herramientas que resuelven el mismo problema), workflows (automatizaciones de varios pasos y las herramientas que las ejecutan), stacks (los conjuntos de herramientas que funcionan bien juntos en una vertical concreta) y una sección de aprendizaje (definiciones, frameworks y FAQs).",
        "Todo está agrupado por las tres verticales que cubre el sitio — RevOps, Legal Ops y TA/Recruiting Ops — más una capa transversal de conceptos compartidos que aparecen en las tres.",
      ],
    },
    {
      heading: "Cómo se produce el contenido",
      body: [
        "Las páginas se redactan a partir de fuentes primarias — documentación del proveedor, páginas de precios públicas, los operadores que usan estas herramientas a diario — y luego se revisan antes de publicarse. Cuando se usan herramientas de IA en la redacción, el resultado se trata como un primer borrador que debe contrastarse con fuentes reales, no como el producto final.",
        "Cada página registra una fecha `last_updated` en su frontmatter para que veas qué tan reciente es la información. Cuando algo cambia de forma significativa — el modelo de precios de un proveedor, una nueva herramienta en una categoría, un workflow con una mejor primitiva de automatización — la página se revisa y la fecha se actualiza.",
      ],
    },
    {
      heading: "Construir en público",
      body: [
        "El código fuente del sitio vive en un repositorio público de GitHub bajo licencia MIT. La arquitectura completa, el esquema de contenido y la hoja de ruta están enlazados desde el pie de página. Las correcciones son bienvenidas como pull requests o como nota a través de la página de contacto; el objetivo es que el catálogo sea más preciso después de tu visita que antes.",
        "El sitio se financia con publicidad gráfica (Google AdSense) y un pequeño pool de patrocinios del boletín. Ninguno de los dos afecta a qué herramientas se cubren ni cómo se describen — los precios, integraciones y limitaciones se reportan tal como son, no como a los proveedores les gustaría.",
      ],
    },
  ],
};

const ptBR: LegalPage = {
  title: "Sobre o ooligo",
  description:
    "ooligo é um site de referência independente e de código aberto para líderes de operações: ferramentas, comparações, workflows e stacks para RevOps, Legal Ops e TA/Recruiting Ops.",
  heading: "Sobre o ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo é um site de referência pequeno e independente para quem comanda operações dentro de empresas modernas — em particular RevOps, Legal Ops e TA/Recruiting Ops.",
  sections: [
    {
      heading: "Quem mantém o site",
      body: [
        "O ooligo é construído e mantido por Marius Bughiu, um operador independente com experiência em B2B SaaS. O site começou como uma referência pessoal — uma forma de acompanhar quais ferramentas estavam de fato sendo adotadas pelos times de ops e como elas se encaixavam — e cresceu como catálogo público à medida que essas anotações se acumularam.",
        "Não há empresa-mãe, investidores ou equipe comercial. As decisões editoriais são tomadas por uma única pessoa; se você discordar de alguma, a página de contato é o lugar certo para dizer isso.",
      ],
    },
    {
      heading: "O que tem no site",
      body: [
        "O ooligo organiza o conteúdo de ops em algumas formas sobrepostas: um catálogo de ferramentas (perfis de fornecedores com categoria, modelo de preço e integrações), comparações (análises lado a lado de ferramentas que resolvem o mesmo problema), workflows (automações de várias etapas e as ferramentas que as executam), stacks (os conjuntos de ferramentas que funcionam bem juntos numa vertical) e uma seção de aprendizado (definições, frameworks e FAQs).",
        "Tudo é agrupado pelas três verticais que o site cobre — RevOps, Legal Ops e TA/Recruiting Ops — mais uma camada transversal de conceitos compartilhados que aparecem nas três.",
      ],
    },
    {
      heading: "Como o conteúdo é produzido",
      body: [
        "As páginas são redigidas a partir de fontes primárias — documentação do fornecedor, páginas de preço públicas, operadores que usam essas ferramentas no dia a dia — e revisadas antes de serem publicadas. Quando ferramentas de IA são usadas no rascunho, o resultado é tratado como uma primeira passagem que precisa ser confrontada com fontes reais, não como o produto final.",
        "Cada página registra uma data `last_updated` no seu frontmatter para que você veja o quão recente é a informação. Quando algo muda de forma significativa — o modelo de preço de um fornecedor, uma nova ferramenta numa categoria, um workflow com uma primitiva de automação melhor — a página é revisitada e a data atualizada.",
      ],
    },
    {
      heading: "Construir em público",
      body: [
        "O código-fonte do site mora em um repositório público no GitHub sob licença MIT. A arquitetura completa, o schema do conteúdo e o roadmap estão linkados no rodapé. Correções são bem-vindas como pull requests ou como uma mensagem pela página de contato; a meta é que o catálogo fique mais preciso depois da sua visita do que antes.",
        "O site é financiado por publicidade gráfica (Google AdSense) e um pequeno pool de patrocínios da newsletter. Nenhum dos dois afeta quais ferramentas são cobertas ou como são descritas — preços, integrações e limitações são reportados como são, não como os fornecedores gostariam.",
      ],
    },
  ],
};

const ja: LegalPage = {
  title: "ooligoについて",
  description:
    "ooligoは、オペレーションリーダー向けの独立したオープンソースのリファレンスサイトです。RevOps、Legal Ops、TA/Recruiting Opsのツール、比較、ワークフロー、スタックを掲載しています。",
  heading: "ooligoについて",
  lastUpdated: LAST_UPDATED,
  lead: "ooligoは、現代の企業内でオペレーションを担う人々——特にRevOps、Legal Ops、TA/Recruiting Ops——のための、小規模で独立したリファレンスサイトです。",
  sections: [
    {
      heading: "サイトの運営者",
      body: [
        "ooligoは、B2B SaaSのバックグラウンドを持つ独立したオペレーターであるMarius Bughiuが構築・運営しています。このサイトは個人的なリファレンスとして始まりました——どのツールが実際にオペレーションチームに採用されているか、それらがどう組み合わさるかを記録する手段として——そしてその記録が蓄積されるにつれて、公開カタログへと成長しました。",
        "親会社、投資家の支援、営業チームはありません。編集上の判断は一人で行っています。もし同意できない判断があれば、お問い合わせページが最も適切な連絡先です。",
      ],
    },
    {
      heading: "サイトに掲載されているもの",
      body: [
        "ooligoはオペレーションのコンテンツをいくつかの重なり合う形に整理しています。ツールカタログ（ベンダープロファイル：カテゴリ、価格モデル、連携機能）、比較（同じ課題を解決するツールの並列分析）、ワークフロー（複数ステップの自動化とそれを実行するツール）、スタック（特定の業種でうまく機能するツールの組み合わせ）、そして学習セクション（定義、フレームワーク、FAQ）です。",
        "すべてのコンテンツは、本サイトが扱う3つの業種——RevOps、Legal Ops、TA/Recruiting Ops——別にグループ化されており、3つすべてに共通して登場する横断的な概念のレイヤーも備えています。",
      ],
    },
    {
      heading: "コンテンツの制作方法",
      body: [
        "各ページは一次情報——ベンダーのドキュメント、公開価格ページ、これらのツールを日常的に使うオペレーター——から下書きされ、公開前にレビューされます。下書きにAIツールを使う場合は、その出力を最終成果物ではなく、実際の情報源と突き合わせて事実確認すべき第一稿として扱います。",
        "各ページのフロントマターには `last_updated` の日付が記録されており、情報がどれだけ新しいかを確認できます。ベンダーの価格モデルが変わる、カテゴリに新しいツールが登場する、ワークフローにより良い自動化のプリミティブが導入される——そうした意味のある変化があれば、ページは見直され、日付も更新されます。",
      ],
    },
    {
      heading: "公開された場での開発",
      body: [
        "サイトのソースコードはMITライセンスのもとGitHubの公開リポジトリで管理されています。完全なアーキテクチャ、コンテンツスキーマ、ロードマップはフッターからリンクされています。修正の提案はプルリクエストやお問い合わせページからのメッセージで歓迎します。目標は、ご訪問の前よりも後のほうがカタログが正確になっていることです。",
        "本サイトはディスプレイ広告（Google AdSense）と少額のニュースレタースポンサーシップで運営されています。これらは取り上げるツールや記述内容には影響しません——価格、連携、制限はベンダーが望むかたちではなく、ありのままに報告します。",
      ],
    },
  ],
};

const fr: LegalPage = {
  title: "À propos d'ooligo",
  description:
    "ooligo est un site de référence indépendant et open source pour les responsables ops : outils, comparaisons, workflows et stacks pour RevOps, Legal Ops et TA/Recruiting Ops.",
  heading: "À propos d'ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo est un petit site de référence indépendant pour les personnes qui pilotent les opérations dans les entreprises modernes — en particulier RevOps, Legal Ops et TA/Recruiting Ops.",
  sections: [
    {
      heading: "Qui gère le site",
      body: [
        "ooligo est construit et maintenu par Marius Bughiu, un opérateur indépendant avec une expérience en B2B SaaS. Le site a commencé comme une référence personnelle — une façon de garder trace des outils réellement adoptés par les équipes ops et de la manière dont ils s'imbriquent — puis s'est transformé en catalogue public au fil de l'accumulation de ces notes.",
        "Il n'y a ni société mère, ni financement par des investisseurs, ni équipe commerciale. Les décisions éditoriales sont prises par une seule personne ; si vous en contestez une, la page de contact est le bon endroit pour le dire.",
      ],
    },
    {
      heading: "Ce que contient le site",
      body: [
        "ooligo organise le contenu ops selon plusieurs formes qui se recoupent : un catalogue d'outils (profils d'éditeurs avec catégorie, modèle tarifaire et intégrations), des comparaisons (analyses côte à côte d'outils qui résolvent le même problème), des workflows (automatisations en plusieurs étapes et les outils qui les exécutent), des stacks (les combinaisons d'outils qui fonctionnent bien ensemble dans un secteur donné) et une section apprentissage (définitions, frameworks et FAQ).",
        "Tout est regroupé selon les trois secteurs que couvre le site — RevOps, Legal Ops et TA/Recruiting Ops — plus une couche transversale de concepts partagés qui apparaissent dans les trois.",
      ],
    },
    {
      heading: "Comment le contenu est produit",
      body: [
        "Les pages sont rédigées à partir de sources primaires — documentation éditeur, pages tarifaires publiques, opérateurs qui utilisent ces outils au quotidien — puis relues avant publication. Lorsque des outils d'IA interviennent dans la rédaction, le résultat est traité comme un premier jet à confronter aux sources réelles, et non comme le produit final.",
        "Chaque page enregistre une date `last_updated` dans son frontmatter, pour que vous voyiez à quel point l'information est fraîche. Quand quelque chose change réellement — le modèle tarifaire d'un éditeur, une nouvelle entrée dans une catégorie, un workflow doté d'une meilleure primitive d'automatisation — la page est révisée et la date mise à jour.",
      ],
    },
    {
      heading: "Construction en public",
      body: [
        "Le code source du site vit dans un dépôt GitHub public sous licence MIT. L'architecture complète, le schéma de contenu et la feuille de route sont liés depuis le pied de page. Les corrections sont bienvenues sous forme de pull requests ou via la page de contact ; l'objectif est que le catalogue soit plus précis après votre visite qu'avant.",
        "Le site est financé par la publicité display (Google AdSense) et un petit pool de partenariats de newsletter. Ni l'un ni l'autre n'influence les outils couverts ou la manière dont ils sont décrits — tarifs, intégrations et limites sont rapportés tels qu'ils sont, et non tels que les éditeurs aimeraient qu'ils soient.",
      ],
    },
  ],
};

const de: LegalPage = {
  title: "Über ooligo",
  description:
    "ooligo ist eine unabhängige, quelloffene Referenzseite für Ops-Verantwortliche: Tools, Vergleiche, Workflows und Stacks für RevOps, Legal Ops und TA/Recruiting Ops.",
  heading: "Über ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo ist eine kleine, unabhängige Referenzseite für diejenigen, die den operativen Betrieb in modernen Unternehmen verantworten — insbesondere RevOps, Legal Ops und TA/Recruiting Ops.",
  sections: [
    {
      heading: "Wer die Seite betreibt",
      body: [
        "ooligo wird von Marius Bughiu betrieben — einem unabhängigen Operator mit Hintergrund in B2B-SaaS. Die Seite ist ursprünglich als persönliche Referenz entstanden — als Möglichkeit, im Blick zu behalten, welche Tools in Ops-Teams tatsächlich eingesetzt werden und wie sie zusammenspielen — und ist mit der Zeit zu einem öffentlichen Katalog herangewachsen.",
        "Es gibt kein Mutterunternehmen, keine Investoren und kein Vertriebsteam. Redaktionelle Entscheidungen trifft eine Person; wenn Sie eine davon für falsch halten, ist die Kontaktseite der richtige Ort, dies mitzuteilen.",
      ],
    },
    {
      heading: "Was Sie auf der Seite finden",
      body: [
        "ooligo gliedert Ops-Inhalte in mehrere sich überschneidende Formen: einen Tool-Katalog (Anbieterprofile mit Kategorie, Preismodell und Integrationen), Vergleiche (gegenüberstellende Analysen von Tools, die dasselbe Problem lösen), Workflows (mehrstufige Automatisierungen und die Tools, die sie ausführen), Stacks (Tool-Bündel, die in einer bestimmten Branche gut zusammenspielen) und einen Lernbereich (Definitionen, Frameworks und FAQs).",
        "Alles ist nach den drei Branchen gegliedert, die diese Seite abdeckt — RevOps, Legal Ops und TA/Recruiting Ops — ergänzt um eine querschnittliche Ebene gemeinsamer Konzepte, die in allen drei vorkommen.",
      ],
    },
    {
      heading: "Wie die Inhalte entstehen",
      body: [
        "Seiten werden aus Primärquellen entworfen — Anbieterdokumentation, öffentliche Preisseiten, Operatoren, die diese Tools täglich einsetzen — und vor der Veröffentlichung redaktionell geprüft. Wenn KI-Tools beim Entwurf eingesetzt werden, wird das Ergebnis als erster Durchgang behandelt, der gegen echte Quellen geprüft werden muss, nicht als Endprodukt.",
        "Jede Seite trägt im Frontmatter ein `last_updated`-Datum, damit Sie sehen können, wie frisch die Information ist. Wenn sich etwas wesentlich ändert — ein Anbieter sein Preismodell anpasst, ein neues Tool in einer Kategorie auftaucht, ein Workflow eine bessere Automatisierungsprimitive erhält — wird die Seite überarbeitet und das Datum aktualisiert.",
      ],
    },
    {
      heading: "Build in public",
      body: [
        "Der Quellcode der Seite liegt in einem öffentlichen GitHub-Repository unter der MIT-Lizenz. Die vollständige Architektur, das Inhaltsschema und die Roadmap sind aus dem Footer verlinkt. Korrekturen sind als Pull Requests oder als Nachricht über die Kontaktseite willkommen; das Ziel ist, dass der Katalog nach Ihrem Besuch genauer ist als davor.",
        "Die Seite finanziert sich über Displaywerbung (Google AdSense) und einen kleinen Sponsoringpool für den Newsletter. Beides hat keinen Einfluss darauf, welche Tools behandelt oder wie sie beschrieben werden — Preise, Integrationen und Einschränkungen werden so berichtet, wie sie sind, nicht wie die Anbieter sie gern hätten.",
      ],
    },
  ],
};

export const aboutByLocale: Partial<Record<LocaleCode, LegalPage>> & { en: LegalPage } = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  fr,
  de,
};
