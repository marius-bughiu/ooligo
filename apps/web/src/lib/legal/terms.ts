/**
 * "Terms" page prose, per locale.
 *
 * Canonical = en. Covers content licensing (CC BY 4.0 for prose, MIT
 * for code), trademark notice, advertising disclosure (Google AdSense),
 * editorial-independence statement, and the standard "no warranty"
 * disclaimer. Not legal advice; written in plain language.
 */

import type { LegalPage } from "./types";
import type { LocaleCode } from "../config";

const LAST_UPDATED = "2026-05-13";

const en: LegalPage = {
  title: "Terms — ooligo",
  description:
    "Terms of use for ooligo: content licensing, trademarks, advertising disclosure, and the standard disclaimer.",
  heading: "Terms",
  lastUpdated: LAST_UPDATED,
  lead: "Plain-language terms of use. By browsing the site you accept the points below; if any of them is a deal-breaker for your use case, please don't use the site.",
  sections: [
    {
      heading: "Content licensing",
      body: [
        "The site's source code is published under the MIT license. The editorial content (definitions, comparisons, workflow descriptions, learn entries) is published under the Creative Commons Attribution 4.0 International license (CC BY 4.0). You may reuse, adapt, and redistribute the content for any purpose, including commercial use, provided you give appropriate credit and link back to the original page on ooligo.",
        "Tool and vendor names, descriptions, and any third-party logos used to identify them are the property of their respective owners and are used here for editorial identification only.",
      ],
    },
    {
      heading: "Trademarks and third-party content",
      body: [
        "ooligo is not affiliated with, sponsored by, or endorsed by any of the tools, vendors, or companies it covers, unless explicitly stated on a given page. References to third-party products are editorial. If you are the trademark owner of a product covered here and want a correction or removal, the contact page is the fastest route — most requests are resolved within a few business days.",
      ],
    },
    {
      heading: "Advertising and sponsorship",
      body: [
        "ooligo displays advertisements served by Google AdSense. Ads are clearly labeled as sponsored and are placed in dedicated slots that are visually distinct from editorial content. The site does not currently take direct sponsorship deals from the tools it covers; if that changes, the relevant pages will carry a visible sponsorship disclosure.",
        "Editorial coverage — which tools are included, how they are scored, which comparisons are written — is decided independently of advertising. If a tool is missing from a category, it is because we haven't gotten to it yet, not because of a paid arrangement.",
      ],
    },
    {
      heading: "Accuracy and disclaimer",
      body: [
        "ooligo aims for accurate, up-to-date information, but the content is provided on an \"as is\" basis without any warranties, express or implied. Tool pricing, integrations, features, and ownership change frequently; always verify pricing and contract terms directly with the vendor before purchase. The site owner is not liable for any losses or damages arising from reliance on the information published here.",
      ],
    },
    {
      heading: "Changes to these terms",
      body: [
        "These terms may be updated as the site evolves. Material changes will be reflected in the last-updated date at the top of this page, and significant shifts (for example, introducing a paid plan or a different licensing model) will also be called out in the newsletter and via a notice on the homepage for a reasonable period.",
      ],
    },
  ],
};

const es: LegalPage = {
  title: "Términos — ooligo",
  description:
    "Condiciones de uso de ooligo: licencia de contenido, marcas, divulgación publicitaria y exención de responsabilidad estándar.",
  heading: "Términos",
  lastUpdated: LAST_UPDATED,
  lead: "Condiciones de uso en lenguaje claro. Al navegar por el sitio aceptas los puntos siguientes; si alguno te impide usarlo, por favor no lo uses.",
  sections: [
    {
      heading: "Licencia del contenido",
      body: [
        "El código fuente del sitio se publica bajo licencia MIT. El contenido editorial (definiciones, comparaciones, descripciones de workflows, entradas de aprendizaje) se publica bajo la licencia Creative Commons Atribución 4.0 Internacional (CC BY 4.0). Puedes reutilizar, adaptar y redistribuir el contenido para cualquier fin, incluido el comercial, siempre que des crédito adecuado y enlaces a la página original en ooligo.",
        "Los nombres y descripciones de herramientas y proveedores, así como los logotipos de terceros usados para identificarlos, son propiedad de sus respectivos titulares y se utilizan aquí únicamente con fines editoriales de identificación.",
      ],
    },
    {
      heading: "Marcas y contenido de terceros",
      body: [
        "ooligo no está afiliado, patrocinado ni avalado por ninguna de las herramientas, proveedores o empresas que cubre, salvo que se indique explícitamente en una página concreta. Las referencias a productos de terceros son editoriales. Si eres titular de una marca cubierta aquí y deseas una corrección o retirada, la página de contacto es la vía más rápida — la mayoría de las solicitudes se resuelven en unos pocos días hábiles.",
      ],
    },
    {
      heading: "Publicidad y patrocinio",
      body: [
        "ooligo muestra anuncios servidos por Google AdSense. Los anuncios están claramente etiquetados como patrocinados y se colocan en espacios específicos visualmente distinguidos del contenido editorial. El sitio no acepta actualmente acuerdos directos de patrocinio con las herramientas que cubre; si eso cambia, las páginas afectadas mostrarán una divulgación de patrocinio visible.",
        "La cobertura editorial — qué herramientas se incluyen, cómo se puntúan, qué comparaciones se escriben — se decide de forma independiente a la publicidad. Si falta una herramienta en una categoría, es porque aún no la hemos cubierto, no por un acuerdo pagado.",
      ],
    },
    {
      heading: "Exactitud y exención de responsabilidad",
      body: [
        "ooligo busca información precisa y actualizada, pero el contenido se ofrece \"tal cual\", sin garantías expresas ni implícitas. Los precios, integraciones, funciones y propiedad de las herramientas cambian con frecuencia; verifica siempre los precios y las condiciones contractuales directamente con el proveedor antes de comprar. El propietario del sitio no se hace responsable de pérdidas o daños derivados de basarse en la información publicada aquí.",
      ],
    },
    {
      heading: "Cambios en estos términos",
      body: [
        "Estos términos pueden actualizarse a medida que el sitio evoluciona. Los cambios sustanciales se reflejarán en la fecha de última actualización en la parte superior de esta página, y los giros importantes (por ejemplo, la introducción de un plan de pago o un modelo de licencia distinto) también se anunciarán en el boletín y mediante un aviso en la página de inicio durante un periodo razonable.",
      ],
    },
  ],
};

const ptBR: LegalPage = {
  title: "Termos — ooligo",
  description:
    "Termos de uso do ooligo: licença de conteúdo, marcas, divulgação de publicidade e cláusula de isenção padrão.",
  heading: "Termos",
  lastUpdated: LAST_UPDATED,
  lead: "Termos de uso em linguagem clara. Ao navegar pelo site, você aceita os pontos abaixo; se algum deles for um impeditivo para o seu caso, por favor não use o site.",
  sections: [
    {
      heading: "Licença do conteúdo",
      body: [
        "O código-fonte do site é publicado sob a licença MIT. O conteúdo editorial (definições, comparações, descrições de workflows, entradas de aprendizado) é publicado sob a licença Creative Commons Atribuição 4.0 Internacional (CC BY 4.0). Você pode reutilizar, adaptar e redistribuir o conteúdo para qualquer finalidade, incluindo uso comercial, desde que dê o crédito adequado e linke de volta para a página original no ooligo.",
        "Os nomes e descrições de ferramentas e fornecedores, bem como logotipos de terceiros usados para identificá-los, são de propriedade de seus respectivos titulares e são utilizados aqui apenas para identificação editorial.",
      ],
    },
    {
      heading: "Marcas e conteúdo de terceiros",
      body: [
        "O ooligo não é afiliado, patrocinado ou endossado por nenhuma das ferramentas, fornecedores ou empresas que cobre, salvo se declarado explicitamente em uma página específica. As referências a produtos de terceiros são editoriais. Se você for o titular de uma marca abordada aqui e quiser uma correção ou remoção, a página de contato é o caminho mais rápido — a maioria dos pedidos é resolvida em poucos dias úteis.",
      ],
    },
    {
      heading: "Publicidade e patrocínio",
      body: [
        "O ooligo exibe anúncios servidos pelo Google AdSense. Os anúncios são claramente rotulados como patrocinados e são colocados em espaços dedicados, visualmente distintos do conteúdo editorial. O site, atualmente, não aceita acordos diretos de patrocínio com as ferramentas que cobre; se isso mudar, as páginas afetadas exibirão uma divulgação de patrocínio visível.",
        "A cobertura editorial — quais ferramentas são incluídas, como são pontuadas, quais comparações são escritas — é decidida de forma independente da publicidade. Se uma ferramenta está faltando em uma categoria, é porque ainda não chegamos nela, não por causa de algum acordo pago.",
      ],
    },
    {
      heading: "Precisão e isenção",
      body: [
        "O ooligo busca informação precisa e atualizada, mas o conteúdo é fornecido \"como está\", sem garantias expressas ou implícitas. Preços, integrações, funcionalidades e propriedade das ferramentas mudam com frequência; sempre verifique preços e termos contratuais diretamente com o fornecedor antes de qualquer compra. O proprietário do site não é responsável por perdas ou danos decorrentes da confiança nas informações publicadas aqui.",
      ],
    },
    {
      heading: "Mudanças nestes termos",
      body: [
        "Estes termos podem ser atualizados conforme o site evolui. Mudanças relevantes serão refletidas na data de última atualização no topo desta página, e mudanças significativas (por exemplo, a introdução de um plano pago ou um modelo de licenciamento diferente) também serão sinalizadas na newsletter e por meio de um aviso na home por um período razoável.",
      ],
    },
  ],
};

const ja: LegalPage = {
  title: "利用規約 — ooligo",
  description:
    "ooligoの利用規約：コンテンツのライセンス、商標、広告の開示、標準的な免責事項。",
  heading: "利用規約",
  lastUpdated: LAST_UPDATED,
  lead: "わかりやすい言葉で書かれた利用規約です。本サイトをご利用いただいた時点で、以下の各項に同意したものとみなします。いずれかが受け入れがたい場合は、本サイトのご利用をお控えください。",
  sections: [
    {
      heading: "コンテンツのライセンス",
      body: [
        "本サイトのソースコードはMITライセンスのもとで公開されています。編集コンテンツ（定義、比較、ワークフローの記述、学習エントリ）はクリエイティブ・コモンズ表示4.0国際ライセンス（CC BY 4.0）のもとで公開されています。適切なクレジットを表示し、ooligo上の元ページへのリンクを掲載していただける限り、商用利用を含むあらゆる目的での再利用、改変、再配布が可能です。",
        "ツール名、ベンダー名、それらを識別するために使用された第三者のロゴおよびその説明は、それぞれの所有者の所有物であり、本サイトでは編集上の識別目的でのみ使用されています。",
      ],
    },
    {
      heading: "商標および第三者コンテンツ",
      body: [
        "ooligoは、ページ上で明示的に記載されている場合を除き、取り上げているツール、ベンダー、企業のいずれとも提携、後援、または推奨関係にありません。第三者製品への言及はすべて編集上のものです。本サイトで取り上げられている商品の商標権者で、修正または削除をご希望の場合は、お問い合わせページが最も迅速な手段です。多くのご依頼は数営業日以内に対応されます。",
      ],
    },
    {
      heading: "広告とスポンサーシップ",
      body: [
        "ooligoはGoogle AdSenseによって配信される広告を掲載しています。広告はスポンサードであることが明示され、編集コンテンツと視覚的に区別された専用枠に配置されます。本サイトは現時点で、掲載しているツールから直接のスポンサーシップを受けていません。今後変更が生じた場合は、該当ページに目に見える形でスポンサーシップ開示を掲載します。",
        "編集上の取り扱い——どのツールを掲載するか、どのようにスコアリングするか、どの比較を書くか——は、広告とは独立して決定されます。あるカテゴリでツールが欠けている場合、それは有料の取り決めではなく、まだ取り上げていないためです。",
      ],
    },
    {
      heading: "正確性および免責",
      body: [
        "ooligoは正確かつ最新の情報を目指していますが、コンテンツは明示または黙示の保証なしに「現状のまま」提供されます。ツールの価格、連携、機能、所有者は頻繁に変わります。ご購入の前には必ずベンダーに直接、価格や契約条件をご確認ください。本サイトに掲載された情報への依拠から生じる損失や損害について、サイト運営者は責任を負いません。",
      ],
    },
    {
      heading: "本規約の変更",
      body: [
        "本規約は、サイトの発展に応じて改定される可能性があります。重要な変更はこのページ上部の最終更新日に反映され、特に大きな変更（例：有料プランの導入や異なるライセンスモデルへの変更）はニュースレターおよびホームページの告知でも一定期間お知らせします。",
      ],
    },
  ],
};

const fr: LegalPage = {
  title: "Conditions — ooligo",
  description:
    "Conditions d'utilisation d'ooligo : licence du contenu, marques, mentions publicitaires et clause de non-responsabilité standard.",
  heading: "Conditions",
  lastUpdated: LAST_UPDATED,
  lead: "Conditions d'utilisation en langage clair. En naviguant sur le site, vous acceptez les points ci-dessous ; si l'un d'entre eux est rédhibitoire dans votre cas, merci de ne pas utiliser le site.",
  sections: [
    {
      heading: "Licence du contenu",
      body: [
        "Le code source du site est publié sous licence MIT. Le contenu éditorial (définitions, comparaisons, descriptions de workflows, entrées d'apprentissage) est publié sous licence Creative Commons Attribution 4.0 International (CC BY 4.0). Vous pouvez réutiliser, adapter et redistribuer le contenu à n'importe quelle fin, y compris commerciale, à condition de créditer correctement et de pointer vers la page d'origine sur ooligo.",
        "Les noms et descriptions d'outils et d'éditeurs, ainsi que les logos tiers utilisés pour les identifier, sont la propriété de leurs détenteurs respectifs et ne sont utilisés ici qu'à des fins éditoriales d'identification.",
      ],
    },
    {
      heading: "Marques et contenu tiers",
      body: [
        "ooligo n'est ni affilié à, ni sponsorisé par, ni approuvé par les outils, éditeurs ou entreprises qu'il couvre, sauf mention explicite sur une page donnée. Les références à des produits tiers sont éditoriales. Si vous êtes le titulaire d'une marque couverte ici et souhaitez une correction ou un retrait, la page de contact est la voie la plus rapide — la plupart des demandes sont traitées en quelques jours ouvrés.",
      ],
    },
    {
      heading: "Publicité et partenariats",
      body: [
        "ooligo affiche des annonces diffusées par Google AdSense. Les annonces sont clairement étiquetées comme sponsorisées et placées dans des emplacements dédiés, visuellement distincts du contenu éditorial. Le site n'accepte pas actuellement de partenariats directs avec les outils qu'il couvre ; si cela change, les pages concernées comporteront une divulgation de partenariat visible.",
        "La couverture éditoriale — quels outils sont inclus, comment ils sont notés, quelles comparaisons sont écrites — est décidée indépendamment de la publicité. Si un outil manque dans une catégorie, c'est parce que nous ne l'avons pas encore traité, pas à cause d'un accord rémunéré.",
      ],
    },
    {
      heading: "Exactitude et clause de non-responsabilité",
      body: [
        "ooligo vise une information exacte et à jour, mais le contenu est fourni « en l'état », sans aucune garantie, expresse ou implicite. Les tarifs, intégrations, fonctionnalités et propriété des outils changent fréquemment ; vérifiez toujours les tarifs et les conditions contractuelles directement auprès de l'éditeur avant tout achat. Le propriétaire du site n'est pas responsable des pertes ou dommages résultant d'une confiance accordée aux informations publiées ici.",
      ],
    },
    {
      heading: "Modifications des présentes conditions",
      body: [
        "Les présentes conditions peuvent être mises à jour au fil de l'évolution du site. Les changements significatifs seront reflétés dans la date de dernière mise à jour en haut de cette page, et les évolutions majeures (par exemple l'introduction d'un plan payant ou d'un autre modèle de licence) seront également signalées dans la newsletter et via un avis sur la page d'accueil pendant une période raisonnable.",
      ],
    },
  ],
};

const de: LegalPage = {
  title: "AGB — ooligo",
  description:
    "Nutzungsbedingungen für ooligo: Inhaltslizenz, Marken, Werbehinweis und Standardhaftungsausschluss.",
  heading: "Nutzungsbedingungen",
  lastUpdated: LAST_UPDATED,
  lead: "Nutzungsbedingungen in klarer Sprache. Mit dem Aufruf der Seite akzeptieren Sie die folgenden Punkte; falls einer davon ein Ausschlusskriterium für Sie ist, nutzen Sie die Seite bitte nicht.",
  sections: [
    {
      heading: "Inhaltslizenz",
      body: [
        "Der Quellcode der Seite wird unter der MIT-Lizenz veröffentlicht. Die redaktionellen Inhalte (Definitionen, Vergleiche, Workflow-Beschreibungen, Lerneinträge) werden unter der Creative Commons Namensnennung 4.0 International (CC BY 4.0) veröffentlicht. Sie dürfen die Inhalte zu jedem Zweck — einschließlich kommerzieller Nutzung — weiterverwenden, anpassen und weiterverbreiten, sofern Sie eine angemessene Quellenangabe machen und auf die Originalseite auf ooligo verlinken.",
        "Tool- und Anbieternamen, deren Beschreibungen sowie Logos Dritter, die zu deren Identifikation verwendet werden, sind Eigentum der jeweiligen Inhaber und werden hier ausschließlich zu redaktionellen Identifikationszwecken eingesetzt.",
      ],
    },
    {
      heading: "Marken und Inhalte Dritter",
      body: [
        "ooligo steht weder in einer Geschäftsbeziehung zu noch in einer Sponsoring- oder Empfehlungsbeziehung mit den hier behandelten Tools, Anbietern oder Unternehmen, sofern dies auf einer Seite nicht ausdrücklich angegeben ist. Verweise auf Produkte Dritter sind redaktionell. Sind Sie Markeninhaber eines hier behandelten Produkts und wünschen eine Berichtigung oder Entfernung, ist die Kontaktseite der schnellste Weg — die meisten Anfragen werden innerhalb weniger Werktage erledigt.",
      ],
    },
    {
      heading: "Werbung und Sponsoring",
      body: [
        "ooligo zeigt Anzeigen, die von Google AdSense ausgeliefert werden. Anzeigen sind klar als gesponsert gekennzeichnet und werden in eigenen Bereichen platziert, die sich optisch deutlich vom redaktionellen Inhalt abheben. Die Seite nimmt derzeit keine direkten Sponsorings von den behandelten Tools an; sollte sich das ändern, werden die betroffenen Seiten einen sichtbaren Sponsoring-Hinweis enthalten.",
        "Die redaktionelle Abdeckung — welche Tools aufgenommen werden, wie sie bewertet werden, welche Vergleiche entstehen — wird unabhängig von der Werbung entschieden. Wenn ein Tool in einer Kategorie fehlt, liegt das daran, dass wir es noch nicht behandelt haben, nicht an einer bezahlten Vereinbarung.",
      ],
    },
    {
      heading: "Genauigkeit und Haftungsausschluss",
      body: [
        "ooligo strebt nach genauen und aktuellen Informationen, die Inhalte werden jedoch „wie besehen\" und ohne ausdrückliche oder stillschweigende Garantien bereitgestellt. Preise, Integrationen, Funktionen und Eigentumsverhältnisse von Tools ändern sich häufig; prüfen Sie Preise und Vertragsbedingungen vor einem Kauf stets direkt beim Anbieter. Der Seitenbetreiber haftet nicht für Verluste oder Schäden, die aus dem Vertrauen auf die hier veröffentlichten Informationen entstehen.",
      ],
    },
    {
      heading: "Änderungen dieser Bedingungen",
      body: [
        "Diese Bedingungen können sich mit der Weiterentwicklung der Seite ändern. Wesentliche Änderungen werden im Datum der letzten Aktualisierung oben auf dieser Seite vermerkt; bei bedeutenden Anpassungen (etwa Einführung eines kostenpflichtigen Plans oder eines anderen Lizenzmodells) erfolgt zusätzlich ein Hinweis im Newsletter sowie für einen angemessenen Zeitraum auf der Startseite.",
      ],
    },
  ],
};

export const termsByLocale: Partial<Record<LocaleCode, LegalPage>> & { en: LegalPage } = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  fr,
  de,
};
