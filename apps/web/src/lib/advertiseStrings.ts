/**
 * "Advertise" page prose, per locale.
 *
 * Sibling of lib/legal/* — chrome prose that ships in-repo rather than
 * routing through the MDX translation pipeline, because it's short, stable,
 * and needs to exist in every locale on day one.
 *
 * The inventory table on the page is rendered from AD_PLACEMENTS in
 * ~/lib/ads.ts; only the human-readable names live here. Adding a placement
 * means adding a row to that record and a name to each locale below.
 */

import type { AdPlacementId } from "./ads";
import type { LocaleCode } from "./config";

export interface AdvertiseFaq {
  q: string;
  a: string[];
}

export interface AdvertiseSection {
  heading: string;
  body: string[];
}

export interface AdvertisePlacementCopy {
  name: string;
  where: string;
  targeting: string;
}

export interface AdvertisePage {
  title: string;
  description: string;
  heading: string;
  lastUpdated: string;
  lead: string;

  inventoryHeading: string;
  inventoryIntro: string;
  colPlacement: string;
  colFormat: string;
  colWhere: string;
  colTargeting: string;
  colRate: string;
  rateOnRequest: string;
  placements: Record<AdPlacementId, AdvertisePlacementCopy>;
  specHeading: string;
  specNote: string;

  sections: AdvertiseSection[];

  faqHeading: string;
  faqs: AdvertiseFaq[];

  ctaHeading: string;
  ctaBody: string;
}

const LAST_UPDATED = "2026-07-25";

const en: AdvertisePage = {
  title: "Advertise — ooligo",
  description:
    "Static image placements on tool pages and vertical hubs, sold directly. Targeting by tool or by vertical. No ad network, no tracking.",
  heading: "Advertise on ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "We sell a small number of static image placements directly. No auction, no ad network, no tracking pixel — an image we host and a link to your site.",

  inventoryHeading: "Inventory",
  inventoryIntro:
    "Two placements, one per targeting axis. Both run a single advertiser: a booked slot carries your creative for the whole flight, with no rotation.",
  colPlacement: "Placement",
  colFormat: "Format",
  colWhere: "Where it runs",
  colTargeting: "Targeting",
  colRate: "Rate",
  rateOnRequest: "On request",
  placements: {
    "tool-sidebar": {
      name: "Tool sidebar",
      where: "Sticky sidebar on a tool detail page",
      targeting: "By tool",
    },
    "vertical-banner": {
      name: "Vertical banner",
      where: "Band above the tool grid on a vertical hub",
      targeting: "By vertical",
    },
  },
  specHeading: "Creative spec",
  specNote:
    "Supply a 2x PNG, JPG, or SVG under 150 KB, plus the destination URL. No animation. The creative has to stay legible on a #0A0A0B background, and it can't imitate ooligo's own interface — labeled ads only.",

  sections: [
    {
      heading: "How targeting works",
      body: [
        "Tool targeting puts your creative in the sidebar of specific tool pages. Buy one page, or every tool in a category. This is the placement to buy if you want to be in front of someone at the moment they're reading about a competitor.",
        "Vertical targeting puts a banner on a vertical hub — RevOps, Legal Ops, Recruiting. Hub traffic is broader and lands earlier in the evaluation than a tool page, so it reads as awareness rather than intercept.",
        "Either axis narrows by locale. ooligo publishes in English, Spanish, Portuguese, Japanese, French, and German, and a booking can run in all six or in one.",
      ],
    },
    {
      heading: "Pricing",
      body: [
        "Rates are quoted per booking. Two things move the number: how broad the targeting is — one tool page costs less than a whole category — and how long the flight runs. There is no CPM, no auction, and no impression minimum. You are buying a slot for a period, not inventory by the thousand.",
        "Traffic for a specific placement is shared on request. Name the page you're considering and we'll send the numbers for it.",
      ],
    },
    {
      heading: "Where advertising stops",
      body: [
        "Advertising buys placement. It does not buy coverage, position in a comparison, or a number in the ooligo score — those come from the published rubric and don't move for money. A sponsor gets no advance notice of a review and no right of reply beyond the correction process open to everyone.",
        "Every paid placement carries the advertiser's name in its label. We don't run native units that imitate editorial content.",
        "Some pages also carry programmatic ads through Google AdSense, labeled the same way. Those are separate from direct bookings and aren't sold here.",
      ],
    },
    {
      heading: "What we don't do",
      body: [
        'No third-party ad tags, no JavaScript, no tracking pixels, no cookies set on your behalf, no retargeting, and no audience data sold or shared. The creative is a static file served from our own origin, wrapped in a link marked rel="sponsored".',
        "The trade-off is that we can't report per-user attribution. What you get is the placement, the click destination, and whatever your own analytics records on arrival.",
      ],
    },
  ],

  faqHeading: "Questions",
  faqs: [
    {
      q: "Can we advertise on a competitor's tool page?",
      a: [
        "Yes — that's what tool targeting is for. The slot is labeled as an ad and sits in the sidebar, not in the body of the review.",
      ],
    },
    {
      q: "Does a booking change what you write about us?",
      a: [
        "No. A tool scored 6.4 stays 6.4 while the ad runs. Factual corrections go through GitHub, the same route open to anyone.",
      ],
    },
    {
      q: "Can we get category exclusivity?",
      a: [
        "Ask. Each slot already runs one advertiser at a time; locking a whole category or vertical for a flight is a separate conversation.",
      ],
    },
    {
      q: "Do you accept creative from an agency ad server?",
      a: [
        "No. We host the file. If your workflow requires a third-party tag, this isn't a fit.",
      ],
    },
    {
      q: "How do bookings end?",
      a: ["A flight has an end date and stops on it. Nothing auto-renews."],
    },
  ],

  ctaHeading: "Enquire",
  ctaBody:
    "Send the placement you want, the tools or verticals you want it on, and the dates. We'll come back with availability and a rate.",
};

const es: AdvertisePage = {
  title: "Publicidad — ooligo",
  description:
    "Espacios publicitarios de imagen estática en páginas de herramientas y hubs verticales, vendidos directamente. Segmentación por herramienta o por vertical. Sin red publicitaria, sin rastreo.",
  heading: "Publicidad en ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "Vendemos directamente un número reducido de espacios de imagen estática. Sin subasta, sin red publicitaria, sin píxel de rastreo: una imagen que alojamos nosotros y un enlace a tu sitio.",

  inventoryHeading: "Inventario",
  inventoryIntro:
    "Dos espacios, uno por eje de segmentación. Ambos son de un solo anunciante: un espacio reservado lleva tu creatividad durante toda la campaña, sin rotación.",
  colPlacement: "Espacio",
  colFormat: "Formato",
  colWhere: "Dónde aparece",
  colTargeting: "Segmentación",
  colRate: "Tarifa",
  rateOnRequest: "A consultar",
  placements: {
    "tool-sidebar": {
      name: "Barra lateral de herramienta",
      where: "Barra lateral fija en la página de una herramienta",
      targeting: "Por herramienta",
    },
    "vertical-banner": {
      name: "Banner de vertical",
      where: "Franja sobre la parrilla de herramientas del hub vertical",
      targeting: "Por vertical",
    },
  },
  specHeading: "Especificaciones de la creatividad",
  specNote:
    "Envía un PNG, JPG o SVG a 2x de menos de 150 KB, más la URL de destino. Sin animación. La creatividad tiene que leerse bien sobre un fondo #0A0A0B y no puede imitar la interfaz de ooligo: solo anuncios etiquetados.",

  sections: [
    {
      heading: "Cómo funciona la segmentación",
      body: [
        "La segmentación por herramienta coloca tu creatividad en la barra lateral de páginas de herramientas concretas. Compra una sola página o todas las herramientas de una categoría. Es el espacio que se compra para estar delante de alguien justo mientras lee sobre un competidor.",
        "La segmentación por vertical coloca un banner en un hub vertical: RevOps, Legal Ops, Recruiting. El tráfico de los hubs es más amplio y llega antes en la evaluación que el de una página de herramienta, así que funciona más como notoriedad que como intercepción.",
        "Cualquiera de los dos ejes se puede acotar por idioma. ooligo publica en inglés, español, portugués, japonés, francés y alemán, y una reserva puede correr en los seis o en uno solo.",
      ],
    },
    {
      heading: "Precios",
      body: [
        "Las tarifas se cotizan por reserva. Dos cosas mueven el número: qué tan amplia es la segmentación —una página de herramienta cuesta menos que una categoría entera— y cuánto dura la campaña. No hay CPM, ni subasta, ni mínimo de impresiones. Compras un espacio por un periodo, no inventario por millar.",
        "Compartimos el tráfico de un espacio concreto a petición. Dinos qué página te interesa y te enviamos sus números.",
      ],
    },
    {
      heading: "Dónde se detiene la publicidad",
      body: [
        "La publicidad compra ubicación. No compra cobertura, ni posición en una comparativa, ni un número en el ooligo score: eso sale de la rúbrica publicada y no se mueve por dinero. Un anunciante no recibe aviso previo de una reseña ni derecho de réplica más allá del proceso de corrección abierto a todo el mundo.",
        "Cada espacio pagado lleva el nombre del anunciante en su etiqueta. No vendemos formatos nativos que imiten contenido editorial.",
        "Algunas páginas también llevan publicidad programática de Google AdSense, etiquetada igual. Es independiente de las reservas directas y no se vende aquí.",
      ],
    },
    {
      heading: "Lo que no hacemos",
      body: [
        'Sin etiquetas publicitarias de terceros, sin JavaScript, sin píxeles de rastreo, sin cookies puestas en tu nombre, sin retargeting y sin venta ni cesión de datos de audiencia. La creatividad es un archivo estático servido desde nuestro propio origen, dentro de un enlace marcado con rel="sponsored".',
        "La contrapartida es que no podemos reportar atribución por usuario. Lo que obtienes es la ubicación, el destino del clic y lo que registre tu propia analítica a la llegada.",
      ],
    },
  ],

  faqHeading: "Preguntas",
  faqs: [
    {
      q: "¿Podemos anunciarnos en la página de un competidor?",
      a: [
        "Sí, para eso existe la segmentación por herramienta. El espacio está etiquetado como anuncio y va en la barra lateral, no en el cuerpo de la reseña.",
      ],
    },
    {
      q: "¿Una reserva cambia lo que escriben sobre nosotros?",
      a: [
        "No. Una herramienta puntuada con 6,4 sigue en 6,4 mientras corre el anuncio. Las correcciones factuales pasan por GitHub, la misma vía abierta a cualquiera.",
      ],
    },
    {
      q: "¿Hay exclusividad de categoría?",
      a: [
        "Pregúntanos. Cada espacio ya lleva un solo anunciante a la vez; bloquear una categoría o una vertical entera durante una campaña es otra conversación.",
      ],
    },
    {
      q: "¿Aceptan creatividades desde el ad server de una agencia?",
      a: [
        "No. El archivo lo alojamos nosotros. Si tu flujo exige una etiqueta de terceros, no encaja.",
      ],
    },
    {
      q: "¿Cómo terminan las reservas?",
      a: [
        "Una campaña tiene fecha de fin y se detiene ahí. No hay renovación automática.",
      ],
    },
  ],

  ctaHeading: "Consultar",
  ctaBody:
    "Escríbenos con el espacio que quieres, las herramientas o verticales donde lo quieres y las fechas. Te respondemos con disponibilidad y tarifa.",
};

const ptBR: AdvertisePage = {
  title: "Anuncie — ooligo",
  description:
    "Espaços de imagem estática em páginas de ferramentas e hubs verticais, vendidos direto. Segmentação por ferramenta ou por vertical. Sem rede de anúncios, sem rastreamento.",
  heading: "Anuncie no ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "Vendemos direto um número pequeno de espaços de imagem estática. Sem leilão, sem rede de anúncios, sem pixel de rastreamento — uma imagem hospedada por nós e um link para o seu site.",

  inventoryHeading: "Inventário",
  inventoryIntro:
    "Dois espaços, um por eixo de segmentação. Ambos rodam um único anunciante: o espaço reservado carrega a sua peça durante toda a veiculação, sem rodízio.",
  colPlacement: "Espaço",
  colFormat: "Formato",
  colWhere: "Onde aparece",
  colTargeting: "Segmentação",
  colRate: "Valor",
  rateOnRequest: "Sob consulta",
  placements: {
    "tool-sidebar": {
      name: "Barra lateral de ferramenta",
      where: "Barra lateral fixa na página de uma ferramenta",
      targeting: "Por ferramenta",
    },
    "vertical-banner": {
      name: "Banner de vertical",
      where: "Faixa acima da grade de ferramentas no hub da vertical",
      targeting: "Por vertical",
    },
  },
  specHeading: "Especificação da peça",
  specNote:
    "Envie um PNG, JPG ou SVG em 2x com menos de 150 KB, mais a URL de destino. Sem animação. A peça precisa continuar legível sobre um fundo #0A0A0B e não pode imitar a interface do ooligo — só anúncios sinalizados.",

  sections: [
    {
      heading: "Como funciona a segmentação",
      body: [
        "A segmentação por ferramenta coloca a sua peça na barra lateral de páginas específicas. Compre uma página só ou todas as ferramentas de uma categoria. É o espaço que se compra para estar na frente de alguém no momento em que essa pessoa lê sobre um concorrente.",
        "A segmentação por vertical coloca um banner no hub da vertical — RevOps, Legal Ops, Recruiting. O tráfego dos hubs é mais amplo e chega mais cedo na avaliação do que o de uma página de ferramenta, então funciona mais como awareness do que como intercepção.",
        "Qualquer um dos eixos pode ser restringido por idioma. O ooligo publica em inglês, espanhol, português, japonês, francês e alemão, e uma reserva pode rodar nos seis ou em um.",
      ],
    },
    {
      heading: "Preços",
      body: [
        "Os valores são cotados por reserva. Duas coisas mexem no número: o quão ampla é a segmentação — uma página de ferramenta custa menos que uma categoria inteira — e quanto tempo a veiculação dura. Não existe CPM, nem leilão, nem mínimo de impressões. Você compra um espaço por um período, não inventário por milheiro.",
        "Compartilhamos o tráfego de um espaço específico sob consulta. Diga qual página interessa e mandamos os números dela.",
      ],
    },
    {
      heading: "Onde a publicidade para",
      body: [
        "Publicidade compra espaço. Não compra cobertura, posição em uma comparação, nem número no ooligo score — isso vem da rubrica publicada e não se mexe por dinheiro. Um anunciante não recebe aviso prévio de uma análise nem direito de resposta além do processo de correção aberto a todo mundo.",
        "Todo espaço pago leva o nome do anunciante no rótulo. Não vendemos formatos nativos que imitem conteúdo editorial.",
        "Algumas páginas também exibem anúncios programáticos via Google AdSense, com o mesmo rótulo. Isso é separado das reservas diretas e não é vendido aqui.",
      ],
    },
    {
      heading: "O que não fazemos",
      body: [
        'Sem tags de anúncio de terceiros, sem JavaScript, sem pixels de rastreamento, sem cookies em seu nome, sem retargeting e sem venda ou compartilhamento de dados de audiência. A peça é um arquivo estático servido da nossa própria origem, dentro de um link marcado com rel="sponsored".',
        "A contrapartida é que não conseguimos reportar atribuição por usuário. O que você recebe é o espaço, o destino do clique e o que a sua própria analytics registrar na chegada.",
      ],
    },
  ],

  faqHeading: "Perguntas",
  faqs: [
    {
      q: "Podemos anunciar na página de um concorrente?",
      a: [
        "Pode — é exatamente para isso que existe a segmentação por ferramenta. O espaço é sinalizado como anúncio e fica na barra lateral, não no corpo da análise.",
      ],
    },
    {
      q: "Uma reserva muda o que vocês escrevem sobre nós?",
      a: [
        "Não. Uma ferramenta com nota 6,4 continua 6,4 enquanto o anúncio roda. Correções factuais passam pelo GitHub, o mesmo caminho aberto a qualquer pessoa.",
      ],
    },
    {
      q: "Dá para ter exclusividade de categoria?",
      a: [
        "Pergunte. Cada espaço já roda um anunciante por vez; travar uma categoria ou vertical inteira durante uma veiculação é outra conversa.",
      ],
    },
    {
      q: "Vocês aceitam peça do ad server de uma agência?",
      a: [
        "Não. O arquivo é hospedado por nós. Se o seu fluxo exige tag de terceiro, não dá certo.",
      ],
    },
    {
      q: "Como as reservas terminam?",
      a: [
        "A veiculação tem data de fim e para nela. Nada renova automaticamente.",
      ],
    },
  ],

  ctaHeading: "Falar com a gente",
  ctaBody:
    "Mande o espaço que você quer, as ferramentas ou verticais onde quer veicular e as datas. Respondemos com disponibilidade e valor.",
};

const ja: AdvertisePage = {
  title: "広告掲載 — ooligo",
  description:
    "ツールページとバーティカルハブの静止画広告枠を直接販売。ツール単位またはバーティカル単位でのターゲティング。アドネットワークなし、トラッキングなし。",
  heading: "ooligoへの広告掲載",
  lastUpdated: LAST_UPDATED,
  lead: "静止画の広告枠を少数だけ直接販売しています。オークションもアドネットワークもトラッキングピクセルもありません。当社がホストする画像と、貴社サイトへのリンクだけです。",

  inventoryHeading: "広告枠",
  inventoryIntro:
    "ターゲティング軸ごとに1つ、計2つの枠があります。どちらも1枠1広告主で、掲載期間中はローテーションなしで貴社のクリエイティブのみを表示します。",
  colPlacement: "枠",
  colFormat: "サイズ",
  colWhere: "掲載場所",
  colTargeting: "ターゲティング",
  colRate: "料金",
  rateOnRequest: "お問い合わせください",
  placements: {
    "tool-sidebar": {
      name: "ツールサイドバー",
      where: "ツール詳細ページの追従サイドバー",
      targeting: "ツール単位",
    },
    "vertical-banner": {
      name: "バーティカルバナー",
      where: "バーティカルハブのツール一覧上部の帯",
      targeting: "バーティカル単位",
    },
  },
  specHeading: "入稿規定",
  specNote:
    "2x のPNG・JPG・SVG（150 KB以下）と遷移先URLをご入稿ください。アニメーション不可。背景色 #0A0A0B 上で判読できること、およびooligoのUIを模倣しないことが条件です。広告は必ず広告として表示されます。",

  sections: [
    {
      heading: "ターゲティングの仕組み",
      body: [
        "ツールターゲティングでは、指定したツールページのサイドバーにクリエイティブを掲載します。1ページ単位でも、カテゴリ内の全ツール単位でも購入できます。競合製品について読んでいるまさにその瞬間に接触したい場合に選ぶ枠です。",
        "バーティカルターゲティングでは、RevOps・Legal Ops・Recruitingといったバーティカルハブにバナーを掲載します。ハブの流入はツールページより幅広く、検討のより早い段階にあたるため、刈り取りよりも認知に近い性質を持ちます。",
        "どちらの軸も言語で絞り込めます。ooligoは英語・スペイン語・ポルトガル語・日本語・フランス語・ドイツ語で公開しており、6言語すべてでも1言語のみでも掲載できます。",
      ],
    },
    {
      heading: "料金",
      body: [
        "料金は個別見積もりです。金額を左右するのは、ターゲティングの広さ（1ツールページよりカテゴリ全体のほうが高くなります）と掲載期間の2点です。CPMもオークションも最低インプレッション数もありません。購入するのは一定期間の枠であり、千インプレッション単位の在庫ではありません。",
        "特定の枠のトラフィックはご請求に応じて開示します。検討中のページをお知らせいただければ、その数値をお送りします。",
      ],
    },
    {
      heading: "広告が及ばない範囲",
      body: [
        "広告で買えるのは掲載枠だけです。取り上げるかどうか、比較記事での順位、ooligo scoreの数値は買えません。これらは公開されたルーブリックに基づくもので、金銭では動きません。広告主にレビューの事前通知はなく、反論の機会も、誰にでも開かれた訂正プロセス以上のものはありません。",
        "有料掲載にはすべてラベルに広告主名を表示します。編集コンテンツを模倣するネイティブ広告は扱いません。",
        "一部のページではGoogle AdSenseによるプログラマティック広告も同じラベルで表示されます。これは直接販売の枠とは別で、ここでの販売対象ではありません。",
      ],
    },
    {
      heading: "行わないこと",
      body: [
        'サードパーティの広告タグ、JavaScript、トラッキングピクセル、貴社に代わって発行するCookie、リターゲティング、オーディエンスデータの販売・共有——いずれも行いません。クリエイティブは当社オリジンから配信する静的ファイルで、rel="sponsored" を付与したリンクで囲みます。',
        "その代わり、ユーザー単位のアトリビューションは提供できません。提供できるのは掲載枠、遷移先、そして着地後に貴社自身の解析ツールが記録する内容です。",
      ],
    },
  ],

  faqHeading: "よくある質問",
  faqs: [
    {
      q: "競合ツールのページに広告を出せますか。",
      a: [
        "出せます。ツールターゲティングはそのための仕組みです。枠は広告として明示され、レビュー本文ではなくサイドバーに配置されます。",
      ],
    },
    {
      q: "出稿すると自社の評価は変わりますか。",
      a: [
        "変わりません。6.4と評価されたツールは、広告掲載中も6.4のままです。事実誤認の訂正はGitHub経由で、誰にでも開かれた同じ手順です。",
      ],
    },
    {
      q: "カテゴリ独占は可能ですか。",
      a: [
        "ご相談ください。各枠はもともと同時に1広告主のみです。カテゴリやバーティカル全体を期間中押さえる場合は別途の相談になります。",
      ],
    },
    {
      q: "代理店のアドサーバーからの配信は可能ですか。",
      a: [
        "できません。ファイルは当社でホストします。サードパーティタグが必須の運用であれば、この枠は適しません。",
      ],
    },
    {
      q: "掲載はどう終了しますか。",
      a: [
        "掲載には終了日があり、その日で停止します。自動更新はありません。",
      ],
    },
  ],

  ctaHeading: "お問い合わせ",
  ctaBody:
    "ご希望の枠、掲載したいツールまたはバーティカル、期間をお送りください。空き状況と料金をご返信します。",
};

const fr: AdvertisePage = {
  title: "Publicité — ooligo",
  description:
    "Emplacements en image statique sur les pages outils et les hubs verticaux, vendus en direct. Ciblage par outil ou par verticale. Pas de régie, pas de tracking.",
  heading: "Annoncer sur ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "Nous vendons en direct un petit nombre d'emplacements en image statique. Pas d'enchères, pas de régie, pas de pixel de tracking — une image que nous hébergeons et un lien vers votre site.",

  inventoryHeading: "Inventaire",
  inventoryIntro:
    "Deux emplacements, un par axe de ciblage. Les deux sont mono-annonceur : un emplacement réservé porte votre création pendant toute la campagne, sans rotation.",
  colPlacement: "Emplacement",
  colFormat: "Format",
  colWhere: "Où il s'affiche",
  colTargeting: "Ciblage",
  colRate: "Tarif",
  rateOnRequest: "Sur demande",
  placements: {
    "tool-sidebar": {
      name: "Colonne outil",
      where: "Colonne latérale fixe d'une page outil",
      targeting: "Par outil",
    },
    "vertical-banner": {
      name: "Bannière verticale",
      where: "Bandeau au-dessus de la grille d'outils d'un hub vertical",
      targeting: "Par verticale",
    },
  },
  specHeading: "Spécifications créatives",
  specNote:
    "Fournissez un PNG, JPG ou SVG en 2x de moins de 150 Ko, plus l'URL de destination. Pas d'animation. La création doit rester lisible sur un fond #0A0A0B et ne peut pas imiter l'interface d'ooligo — publicités identifiées uniquement.",

  sections: [
    {
      heading: "Comment fonctionne le ciblage",
      body: [
        "Le ciblage par outil place votre création dans la colonne latérale de pages outils précises. Achetez une seule page, ou tous les outils d'une catégorie. C'est l'emplacement à acheter pour apparaître au moment exact où quelqu'un lit une fiche concurrente.",
        "Le ciblage par verticale place une bannière sur un hub vertical : RevOps, Legal Ops, Recruiting. Le trafic des hubs est plus large et intervient plus tôt dans l'évaluation qu'une page outil, il relève donc davantage de la notoriété que de l'interception.",
        "Les deux axes se restreignent par langue. ooligo publie en anglais, espagnol, portugais, japonais, français et allemand, et une réservation peut couvrir les six langues ou une seule.",
      ],
    },
    {
      heading: "Tarifs",
      body: [
        "Les tarifs sont établis par réservation. Deux paramètres font varier le montant : l'étendue du ciblage — une page outil coûte moins qu'une catégorie entière — et la durée de la campagne. Ni CPM, ni enchères, ni minimum d'impressions. Vous achetez un emplacement pour une période, pas de l'inventaire au mille.",
        "Le trafic d'un emplacement précis est communiqué sur demande. Indiquez la page envisagée et nous envoyons ses chiffres.",
      ],
    },
    {
      heading: "Là où la publicité s'arrête",
      body: [
        "La publicité achète un emplacement. Elle n'achète ni la couverture, ni la position dans un comparatif, ni un point de ooligo score : cela découle de la grille publiée et ne bouge pas contre de l'argent. Un annonceur n'est pas prévenu à l'avance d'une évaluation et ne dispose d'aucun droit de réponse au-delà du processus de correction ouvert à tous.",
        "Chaque emplacement payant affiche le nom de l'annonceur dans son libellé. Nous ne vendons pas de formats natifs imitant du contenu éditorial.",
        "Certaines pages portent aussi des publicités programmatiques via Google AdSense, identifiées de la même façon. Elles sont distinctes des réservations directes et ne sont pas vendues ici.",
      ],
    },
    {
      heading: "Ce que nous ne faisons pas",
      body: [
        'Pas de tags publicitaires tiers, pas de JavaScript, pas de pixels de tracking, pas de cookies déposés pour votre compte, pas de retargeting, aucune donnée d\'audience vendue ou partagée. La création est un fichier statique servi depuis notre propre origine, dans un lien marqué rel="sponsored".',
        "En contrepartie, nous ne pouvons pas fournir d'attribution par utilisateur. Vous obtenez l'emplacement, la destination du clic, et ce que votre propre outil d'analyse enregistre à l'arrivée.",
      ],
    },
  ],

  faqHeading: "Questions",
  faqs: [
    {
      q: "Peut-on annoncer sur la page d'un concurrent ?",
      a: [
        "Oui — c'est précisément l'objet du ciblage par outil. L'emplacement est identifié comme publicité et se trouve dans la colonne latérale, pas dans le corps de l'évaluation.",
      ],
    },
    {
      q: "Une réservation change-t-elle ce que vous écrivez sur nous ?",
      a: [
        "Non. Un outil noté 6,4 reste à 6,4 pendant la campagne. Les corrections factuelles passent par GitHub, la même voie ouverte à tout le monde.",
      ],
    },
    {
      q: "Peut-on obtenir l'exclusivité d'une catégorie ?",
      a: [
        "Demandez. Chaque emplacement ne porte déjà qu'un annonceur à la fois ; bloquer une catégorie ou une verticale entière sur une campagne est une autre discussion.",
      ],
    },
    {
      q: "Acceptez-vous les créations depuis l'ad server d'une agence ?",
      a: [
        "Non. Nous hébergeons le fichier. Si votre process impose un tag tiers, ce n'est pas adapté.",
      ],
    },
    {
      q: "Comment se terminent les réservations ?",
      a: [
        "Une campagne a une date de fin et s'arrête à cette date. Rien ne se renouvelle automatiquement.",
      ],
    },
  ],

  ctaHeading: "Nous contacter",
  ctaBody:
    "Envoyez l'emplacement souhaité, les outils ou verticales visés et les dates. Nous répondons avec les disponibilités et un tarif.",
};

const de: AdvertisePage = {
  title: "Werbung — ooligo",
  description:
    "Statische Bildplatzierungen auf Tool-Seiten und Vertical-Hubs, direkt verkauft. Targeting nach Tool oder Vertical. Kein Ad-Netzwerk, kein Tracking.",
  heading: "Werben auf ooligo",
  lastUpdated: LAST_UPDATED,
  lead: "Wir verkaufen direkt eine kleine Zahl statischer Bildplatzierungen. Keine Auktion, kein Ad-Netzwerk, kein Tracking-Pixel — ein Bild, das wir hosten, und ein Link auf Ihre Website.",

  inventoryHeading: "Inventar",
  inventoryIntro:
    "Zwei Platzierungen, eine je Targeting-Achse. Beide laufen mit genau einem Werbekunden: Ein gebuchter Platz trägt Ihr Motiv über die gesamte Laufzeit, ohne Rotation.",
  colPlacement: "Platzierung",
  colFormat: "Format",
  colWhere: "Wo sie läuft",
  colTargeting: "Targeting",
  colRate: "Preis",
  rateOnRequest: "Auf Anfrage",
  placements: {
    "tool-sidebar": {
      name: "Tool-Sidebar",
      where: "Fixierte Sidebar auf einer Tool-Detailseite",
      targeting: "Nach Tool",
    },
    "vertical-banner": {
      name: "Vertical-Banner",
      where: "Band über dem Tool-Raster eines Vertical-Hubs",
      targeting: "Nach Vertical",
    },
  },
  specHeading: "Motiv-Spezifikation",
  specNote:
    "Liefern Sie ein PNG, JPG oder SVG in 2x unter 150 KB sowie die Ziel-URL. Keine Animation. Das Motiv muss auf einem Hintergrund in #0A0A0B lesbar bleiben und darf die Oberfläche von ooligo nicht nachbilden — nur gekennzeichnete Werbung.",

  sections: [
    {
      heading: "Wie das Targeting funktioniert",
      body: [
        "Tool-Targeting platziert Ihr Motiv in der Sidebar bestimmter Tool-Seiten. Buchen Sie eine einzelne Seite oder alle Tools einer Kategorie. Das ist die Platzierung für den Moment, in dem jemand gerade über einen Wettbewerber liest.",
        "Vertical-Targeting platziert ein Banner auf einem Vertical-Hub: RevOps, Legal Ops, Recruiting. Hub-Traffic ist breiter und liegt früher im Evaluierungsprozess als eine Tool-Seite, wirkt also eher wie Awareness als wie Abfangen.",
        "Beide Achsen lassen sich nach Sprache eingrenzen. ooligo publiziert auf Englisch, Spanisch, Portugiesisch, Japanisch, Französisch und Deutsch; eine Buchung läuft in allen sechs Sprachen oder in einer.",
      ],
    },
    {
      heading: "Preise",
      body: [
        "Preise werden pro Buchung kalkuliert. Zwei Faktoren bewegen die Zahl: wie breit das Targeting ist — eine Tool-Seite kostet weniger als eine ganze Kategorie — und wie lange die Laufzeit ist. Kein CPM, keine Auktion, kein Impression-Minimum. Sie kaufen einen Platz für einen Zeitraum, kein Inventar nach Tausenderkontakt.",
        "Den Traffic einer konkreten Platzierung teilen wir auf Anfrage. Nennen Sie die Seite, die Sie erwägen, und wir schicken die Zahlen dazu.",
      ],
    },
    {
      heading: "Wo Werbung aufhört",
      body: [
        "Werbung kauft Platzierung. Sie kauft keine Berichterstattung, keine Position in einem Vergleich und keinen Punkt im ooligo score — das ergibt sich aus dem veröffentlichten Bewertungsraster und bewegt sich nicht für Geld. Ein Werbekunde wird über eine Bewertung nicht vorab informiert und hat kein Gegendarstellungsrecht über den Korrekturprozess hinaus, der allen offensteht.",
        "Jede bezahlte Platzierung trägt den Namen des Werbekunden im Label. Native Formate, die redaktionelle Inhalte nachahmen, führen wir nicht.",
        "Einige Seiten tragen zusätzlich programmatische Werbung über Google AdSense, gleich gekennzeichnet. Sie ist von Direktbuchungen getrennt und wird hier nicht verkauft.",
      ],
    },
    {
      heading: "Was wir nicht tun",
      body: [
        'Keine Ad-Tags von Dritten, kein JavaScript, keine Tracking-Pixel, keine Cookies in Ihrem Namen, kein Retargeting, keine verkauften oder geteilten Audience-Daten. Das Motiv ist eine statische Datei von unserer eigenen Origin, eingefasst in einen Link mit rel="sponsored".',
        "Der Preis dafür: Wir können keine nutzerbezogene Attribution liefern. Sie bekommen die Platzierung, das Klickziel und das, was Ihre eigene Analytics beim Eintreffen aufzeichnet.",
      ],
    },
  ],

  faqHeading: "Fragen",
  faqs: [
    {
      q: "Dürfen wir auf der Seite eines Wettbewerbers werben?",
      a: [
        "Ja — genau dafür ist Tool-Targeting da. Der Platz ist als Werbung gekennzeichnet und sitzt in der Sidebar, nicht im Fließtext der Bewertung.",
      ],
    },
    {
      q: "Ändert eine Buchung, was Sie über uns schreiben?",
      a: [
        "Nein. Ein Tool mit 6,4 bleibt bei 6,4, solange die Anzeige läuft. Sachliche Korrekturen laufen über GitHub, denselben Weg, der allen offensteht.",
      ],
    },
    {
      q: "Gibt es Kategorie-Exklusivität?",
      a: [
        "Fragen Sie an. Jeder Platz läuft ohnehin mit einem Werbekunden zur Zeit; eine ganze Kategorie oder ein Vertical für eine Laufzeit zu blocken, ist ein eigenes Gespräch.",
      ],
    },
    {
      q: "Nehmen Sie Motive vom Ad-Server einer Agentur?",
      a: [
        "Nein. Wir hosten die Datei. Wenn Ihr Prozess ein Third-Party-Tag verlangt, passt das nicht.",
      ],
    },
    {
      q: "Wie enden Buchungen?",
      a: [
        "Eine Laufzeit hat ein Enddatum und stoppt dann. Nichts verlängert sich automatisch.",
      ],
    },
  ],

  ctaHeading: "Anfragen",
  ctaBody:
    "Schicken Sie die gewünschte Platzierung, die Tools oder Verticals und die Zeiträume. Wir melden uns mit Verfügbarkeit und Preis.",
};

export const advertiseByLocale: Partial<Record<LocaleCode, AdvertisePage>> & {
  en: AdvertisePage;
} = { en, es, "pt-BR": ptBR, ja, fr, de };

export function advertisePage(locale: LocaleCode): AdvertisePage {
  return advertiseByLocale[locale] ?? advertiseByLocale.en;
}
