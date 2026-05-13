/**
 * "Privacy" page prose, per locale.
 *
 * Canonical = en. Documents the actual data flows on the site: GA4
 * pageviews, AdSense (with the existing consent UI in BaseLayout), and
 * the beehiiv newsletter via /api/subscribe. Keep this in sync with
 * what the site actually does — drift here is a real liability.
 */

import type { LegalPage } from "./types";
import type { LocaleCode } from "../config";

const LAST_UPDATED = "2026-05-13";

const en: LegalPage = {
  title: "Privacy — ooligo",
  description:
    "How ooligo collects and uses data: analytics, advertising cookies, and the newsletter signup. Plain language, no dark patterns.",
  heading: "Privacy",
  lastUpdated: LAST_UPDATED,
  lead: "This page describes what data ooligo collects, why, and how to opt out where applicable. The site is built static and serves no first-party tracking beyond the third-party services listed below.",
  sections: [
    {
      heading: "What we collect",
      body: [
        "ooligo does not maintain its own user accounts, profiles, or login system, and does not set any first-party cookies for advertising or tracking. Data collection happens only through three third-party services:",
        "Google Analytics 4 records aggregated pageviews, referrers, device/browser metadata, and approximate (country/region-level) location. Google AdSense serves the display ads on content pages and reads/sets advertising cookies subject to your consent. Beehiiv stores your email address and the vertical you selected if you subscribe to the newsletter via the footer or a vertical landing page. Cloudflare Web Analytics, when enabled, records aggregated pageview counts using no cookies and no personally identifiable information.",
      ],
    },
    {
      heading: "Advertising and consent",
      body: [
        "Ads are served by Google AdSense. For visitors in regions where consent is legally required (the EU/EEA, UK, and Switzerland in particular), the site displays Google's Funding Choices consent dialog before any non-essential cookies are set. You can change or withdraw your consent at any time using the in-page consent control rendered by the same dialog.",
        "If you decline consent, ads either do not load or render in a non-personalized mode, depending on Google's behavior in your region. The rest of the site (catalog, comparisons, workflows, learn) functions identically with or without consent.",
      ],
    },
    {
      heading: "Newsletter",
      body: [
        "If you subscribe to the newsletter, your email address and the selected vertical are sent to Beehiiv, which stores them and handles delivery. The subscription form posts JSON to a server-side endpoint on this site so that the Beehiiv API key is never exposed to the browser. You can unsubscribe at any time using the link in every newsletter email; the unsubscribe is handled by Beehiiv directly.",
      ],
    },
    {
      heading: "Contact form",
      body: [
        "If you reach out via the contact form, the name, email, and message you submit are sent to a private inbox controlled by the site owner. The submission is not stored on this site, is not shared with third parties, and is used only to respond to your message. If you'd rather not submit your email, the GitHub issues channel linked from the contact page is a fully public alternative.",
      ],
    },
    {
      heading: "Your rights and how to reach us",
      body: [
        "If you are in the EU/EEA, UK, or another jurisdiction with comparable rights, you can request access to, correction of, or deletion of any personal data ooligo holds about you. The only data ooligo controls directly is the contact-form inbox and the Beehiiv subscription record; for those, send a request via the contact page. For advertising cookies set by Google AdSense and analytics handled by Google Analytics, requests are best directed to Google directly — those services operate under their own privacy policies, which we link from the relevant sections above.",
      ],
    },
  ],
};

const es: LegalPage = {
  title: "Privacidad — ooligo",
  description:
    "Cómo ooligo recopila y usa datos: analítica, cookies publicitarias y suscripción al boletín. Lenguaje claro, sin patrones oscuros.",
  heading: "Privacidad",
  lastUpdated: LAST_UPDATED,
  lead: "Esta página describe qué datos recopila ooligo, por qué y cómo darse de baja cuando corresponda. El sitio es estático y no usa seguimiento propio más allá de los servicios de terceros listados a continuación.",
  sections: [
    {
      heading: "Qué recopilamos",
      body: [
        "ooligo no mantiene cuentas de usuario, perfiles ni sistema de inicio de sesión propios, y no establece cookies propias con fines publicitarios o de seguimiento. La recopilación de datos ocurre únicamente a través de tres servicios de terceros:",
        "Google Analytics 4 registra visitas agregadas, referencias, metadatos de dispositivo/navegador y ubicación aproximada (a nivel de país/región). Google AdSense sirve los anuncios gráficos en las páginas de contenido y lee/establece cookies publicitarias sujetas a tu consentimiento. Beehiiv almacena tu correo electrónico y la vertical que seleccionaste si te suscribes al boletín desde el pie de página o una landing de vertical. Cloudflare Web Analytics, cuando está habilitado, registra conteos agregados de visitas a páginas sin usar cookies ni información personal identificable.",
      ],
    },
    {
      heading: "Publicidad y consentimiento",
      body: [
        "Los anuncios los sirve Google AdSense. Para visitantes en regiones donde se exige consentimiento (en particular UE/EEE, Reino Unido y Suiza), el sitio muestra el diálogo de consentimiento Funding Choices de Google antes de establecer cualquier cookie no esencial. Puedes cambiar o retirar tu consentimiento en cualquier momento usando el control en página que muestra ese mismo diálogo.",
        "Si rechazas el consentimiento, los anuncios no se cargan o se muestran en modo no personalizado, según el comportamiento de Google en tu región. El resto del sitio (catálogo, comparaciones, workflows, aprendizaje) funciona igual con o sin consentimiento.",
      ],
    },
    {
      heading: "Boletín",
      body: [
        "Si te suscribes al boletín, tu correo electrónico y la vertical seleccionada se envían a Beehiiv, que los almacena y se encarga del envío. El formulario de suscripción manda JSON a un endpoint del lado del servidor en este sitio para que la clave de API de Beehiiv nunca llegue al navegador. Puedes darte de baja en cualquier momento desde el enlace incluido en cada correo del boletín; la baja la gestiona Beehiiv directamente.",
      ],
    },
    {
      heading: "Formulario de contacto",
      body: [
        "Si te pones en contacto a través del formulario, el nombre, correo electrónico y mensaje que envíes llegan a un buzón privado controlado por el propietario del sitio. El envío no se almacena en este sitio, no se comparte con terceros y se usa solo para responderte. Si prefieres no enviar tu correo, el canal de GitHub Issues enlazado desde la página de contacto es una alternativa totalmente pública.",
      ],
    },
    {
      heading: "Tus derechos y cómo contactarnos",
      body: [
        "Si estás en la UE/EEE, Reino Unido u otra jurisdicción con derechos equivalentes, puedes solicitar acceso, corrección o eliminación de los datos personales que ooligo tenga sobre ti. Los únicos datos que ooligo controla directamente son el buzón del formulario de contacto y el registro de suscripción en Beehiiv; para esos, envía una solicitud por la página de contacto. Para las cookies publicitarias de Google AdSense y la analítica gestionada por Google Analytics, las solicitudes se dirigen mejor directamente a Google — esos servicios operan bajo sus propias políticas de privacidad, enlazadas en las secciones anteriores.",
      ],
    },
  ],
};

const ptBR: LegalPage = {
  title: "Privacidade — ooligo",
  description:
    "Como o ooligo coleta e usa dados: analytics, cookies publicitários e cadastro na newsletter. Linguagem clara, sem dark patterns.",
  heading: "Privacidade",
  lastUpdated: LAST_UPDATED,
  lead: "Esta página descreve quais dados o ooligo coleta, por quê, e como cancelar quando aplicável. O site é estático e não usa rastreamento próprio além dos serviços de terceiros listados abaixo.",
  sections: [
    {
      heading: "O que coletamos",
      body: [
        "O ooligo não mantém contas de usuário, perfis ou sistema de login próprios, e não define nenhum cookie próprio com finalidade publicitária ou de rastreamento. A coleta de dados acontece somente por meio de três serviços de terceiros:",
        "O Google Analytics 4 registra visualizações agregadas de página, referenciadores, metadados de dispositivo/navegador e localização aproximada (no nível de país/região). O Google AdSense exibe os anúncios gráficos nas páginas de conteúdo e lê/define cookies publicitários sujeitos ao seu consentimento. A Beehiiv armazena seu e-mail e a vertical selecionada caso você assine a newsletter pelo rodapé ou por uma landing de vertical. O Cloudflare Web Analytics, quando ativado, registra contagens agregadas de visualizações de página sem usar cookies nem dados pessoais identificáveis.",
      ],
    },
    {
      heading: "Publicidade e consentimento",
      body: [
        "Os anúncios são exibidos pelo Google AdSense. Para visitantes em regiões onde o consentimento é legalmente exigido (em particular UE/EEE, Reino Unido e Suíça), o site exibe o diálogo de consentimento Funding Choices do Google antes que qualquer cookie não essencial seja definido. Você pode alterar ou retirar seu consentimento a qualquer momento usando o controle em página renderizado pelo mesmo diálogo.",
        "Se você recusar o consentimento, os anúncios ou não carregam, ou aparecem em modo não personalizado, conforme o comportamento do Google na sua região. O restante do site (catálogo, comparações, workflows, aprendizado) funciona igual com ou sem consentimento.",
      ],
    },
    {
      heading: "Newsletter",
      body: [
        "Se você assinar a newsletter, seu e-mail e a vertical selecionada são enviados à Beehiiv, que os armazena e cuida do envio. O formulário envia JSON para um endpoint do lado do servidor neste site para que a chave de API da Beehiiv nunca seja exposta ao navegador. Você pode cancelar a inscrição a qualquer momento pelo link em cada e-mail da newsletter; o cancelamento é tratado diretamente pela Beehiiv.",
      ],
    },
    {
      heading: "Formulário de contato",
      body: [
        "Se você entrar em contato pelo formulário, o nome, e-mail e mensagem enviados vão para uma caixa de entrada privada controlada pelo proprietário do site. O envio não é armazenado neste site, não é compartilhado com terceiros e é usado apenas para responder à sua mensagem. Se preferir não enviar seu e-mail, o canal de Issues no GitHub linkado na página de contato é uma alternativa totalmente pública.",
      ],
    },
    {
      heading: "Seus direitos e como falar com a gente",
      body: [
        "Se você está na UE/EEE, no Reino Unido ou em outra jurisdição com direitos equivalentes, pode solicitar acesso, correção ou exclusão de quaisquer dados pessoais que o ooligo tenha sobre você. Os únicos dados que o ooligo controla diretamente são a caixa do formulário de contato e o registro de assinatura na Beehiiv; para esses, envie uma solicitação pela página de contato. Para os cookies publicitários do Google AdSense e a analytics do Google Analytics, os pedidos são melhor direcionados diretamente ao Google — esses serviços operam sob suas próprias políticas de privacidade, linkadas nas seções acima.",
      ],
    },
  ],
};

const ja: LegalPage = {
  title: "プライバシー — ooligo",
  description:
    "ooligoがどのようにデータを収集・使用するかについて：アクセス解析、広告クッキー、ニュースレターの登録。わかりやすい言葉で、ダークパターンなしに。",
  heading: "プライバシー",
  lastUpdated: LAST_UPDATED,
  lead: "このページは、ooligoが収集するデータの内容、その理由、該当する場合のオプトアウト方法を説明します。サイトは静的に構築されており、以下に挙げる第三者サービス以外の独自トラッキングは行っていません。",
  sections: [
    {
      heading: "収集するデータ",
      body: [
        "ooligoは独自のユーザーアカウント、プロフィール、ログインシステムを持たず、広告やトラッキング目的のファーストパーティCookieも設定しません。データの収集は次の3つの第三者サービスを通じてのみ行われます。",
        "Google Analytics 4は、集計されたページビュー、リファラー、デバイス／ブラウザのメタデータ、おおよその所在地（国・地域レベル）を記録します。Google AdSenseはコンテンツページのディスプレイ広告を配信し、お客様の同意に基づいて広告Cookieを読み書きします。Beehiivは、フッターまたは業種別ランディングページからニュースレターに登録された場合に、メールアドレスと選択された業種を保存します。Cloudflare Web Analyticsは、有効化されている場合に限り、Cookieや個人を特定できる情報を使用せずに集計されたページビュー数のみを記録します。",
      ],
    },
    {
      heading: "広告と同意",
      body: [
        "広告はGoogle AdSenseによって配信されます。法的に同意が必要な地域（特にEU／EEA、英国、スイス）からの訪問者には、不要なCookieが設定される前にGoogleのFunding Choices同意ダイアログを表示します。同じダイアログで表示されるページ内の同意コントロールから、いつでも同意の変更・取り下げが可能です。",
        "同意を拒否した場合、お客様の地域でのGoogleの動作に応じて、広告は読み込まれないか、非パーソナライズモードで表示されます。サイトのその他の部分（カタログ、比較、ワークフロー、学習）は、同意の有無にかかわらず同様に機能します。",
      ],
    },
    {
      heading: "ニュースレター",
      body: [
        "ニュースレターに登録された場合、メールアドレスと選択された業種はBeehiivに送信され、保存および配信が行われます。登録フォームは本サイトのサーバー側エンドポイントへJSONをPOSTし、BeehiivのAPIキーがブラウザに露出しないようにしています。各ニュースレターメールに含まれる解除リンクからいつでも購読を解除でき、解除はBeehiivが直接処理します。",
      ],
    },
    {
      heading: "お問い合わせフォーム",
      body: [
        "お問い合わせフォームからご連絡いただいた場合、入力されたお名前、メールアドレス、メッセージは、サイト運営者が管理する非公開の受信箱に届きます。送信内容は本サイトに保存されず、第三者と共有されることもなく、ご返信の目的にのみ使用されます。メールアドレスを送信したくない場合は、お問い合わせページからリンクされているGitHubのIssuesチャネルが完全に公開された代替手段です。",
      ],
    },
    {
      heading: "あなたの権利と連絡方法",
      body: [
        "EU／EEA、英国、または同等の権利が認められる他の管轄内にお住まいの場合、ooligoが保持するご自身に関する個人データへのアクセス、訂正、削除を請求できます。ooligoが直接管理しているのは、お問い合わせフォームの受信箱とBeehiivの購読レコードのみです。これらについては、お問い合わせページからご請求ください。Google AdSenseが設定する広告CookieやGoogle Analyticsが扱うアクセス解析データについては、それぞれのサービスがそれぞれのプライバシーポリシーのもとで運営されているため、Googleへ直接ご請求いただくのが最も適切です。該当ポリシーへのリンクは上記の関連セクションに記載しています。",
      ],
    },
  ],
};

const fr: LegalPage = {
  title: "Confidentialité — ooligo",
  description:
    "Comment ooligo collecte et utilise les données : analytique, cookies publicitaires et inscription à la newsletter. Langue claire, pas de dark patterns.",
  heading: "Confidentialité",
  lastUpdated: LAST_UPDATED,
  lead: "Cette page décrit les données qu'ooligo collecte, pourquoi, et comment vous y opposer le cas échéant. Le site est statique et n'utilise aucun traçage propriétaire au-delà des services tiers listés ci-dessous.",
  sections: [
    {
      heading: "Ce que nous collectons",
      body: [
        "ooligo ne gère ni comptes utilisateurs, ni profils, ni système d'authentification, et ne dépose aucun cookie propriétaire à des fins publicitaires ou de traçage. La collecte de données se fait uniquement via trois services tiers :",
        "Google Analytics 4 enregistre des pages vues agrégées, des référents, des métadonnées d'appareil/navigateur et une localisation approximative (au niveau du pays/de la région). Google AdSense diffuse les annonces display sur les pages de contenu et lit/dépose des cookies publicitaires soumis à votre consentement. Beehiiv stocke votre adresse e-mail et le secteur sélectionné si vous vous abonnez à la newsletter depuis le pied de page ou une landing sectorielle. Cloudflare Web Analytics, lorsqu'il est activé, enregistre des compteurs de pages vues agrégés sans cookies ni informations personnelles identifiables.",
      ],
    },
    {
      heading: "Publicité et consentement",
      body: [
        "Les annonces sont diffusées par Google AdSense. Pour les visiteurs dans les régions où le consentement est légalement requis (en particulier UE/EEE, Royaume-Uni et Suisse), le site affiche le dialogue de consentement Funding Choices de Google avant tout dépôt de cookie non essentiel. Vous pouvez modifier ou retirer votre consentement à tout moment via le contrôle en page rendu par ce même dialogue.",
        "Si vous refusez le consentement, les annonces ne se chargent pas ou s'affichent en mode non personnalisé, selon le comportement de Google dans votre région. Le reste du site (catalogue, comparaisons, workflows, apprentissage) fonctionne de la même manière avec ou sans consentement.",
      ],
    },
    {
      heading: "Newsletter",
      body: [
        "Si vous vous abonnez à la newsletter, votre adresse e-mail et le secteur choisi sont transmis à Beehiiv, qui les stocke et gère l'envoi. Le formulaire d'abonnement envoie du JSON à un endpoint côté serveur de ce site afin que la clé d'API Beehiiv ne soit jamais exposée au navigateur. Vous pouvez vous désabonner à tout moment via le lien présent dans chaque e-mail de la newsletter ; la désinscription est gérée directement par Beehiiv.",
      ],
    },
    {
      heading: "Formulaire de contact",
      body: [
        "Si vous nous écrivez via le formulaire de contact, le nom, l'e-mail et le message envoyés arrivent dans une boîte privée contrôlée par le propriétaire du site. Le message n'est pas stocké sur ce site, n'est pas partagé avec des tiers et n'est utilisé que pour vous répondre. Si vous préférez ne pas transmettre votre e-mail, le canal GitHub Issues lié depuis la page de contact est une alternative entièrement publique.",
      ],
    },
    {
      heading: "Vos droits et comment nous joindre",
      body: [
        "Si vous êtes dans l'UE/EEE, au Royaume-Uni ou dans une autre juridiction offrant des droits équivalents, vous pouvez demander l'accès, la rectification ou la suppression des données personnelles qu'ooligo détient à votre sujet. Les seules données qu'ooligo contrôle directement sont la boîte du formulaire de contact et l'enregistrement d'abonnement Beehiiv ; pour celles-ci, adressez une demande via la page de contact. Pour les cookies publicitaires déposés par Google AdSense et l'analytique gérée par Google Analytics, il est préférable de vous adresser directement à Google — ces services opèrent sous leurs propres politiques de confidentialité, liées dans les sections ci-dessus.",
      ],
    },
  ],
};

const de: LegalPage = {
  title: "Datenschutz — ooligo",
  description:
    "Wie ooligo Daten erhebt und verwendet: Analytics, Werbe-Cookies und Newsletter-Anmeldung. Klare Sprache, keine Dark Patterns.",
  heading: "Datenschutz",
  lastUpdated: LAST_UPDATED,
  lead: "Diese Seite beschreibt, welche Daten ooligo erhebt, warum, und wie Sie ggf. widersprechen können. Die Seite ist statisch und nutzt jenseits der unten genannten Drittanbieterdienste kein eigenes Tracking.",
  sections: [
    {
      heading: "Welche Daten wir erheben",
      body: [
        "ooligo unterhält weder eigene Benutzerkonten oder Profile noch ein Anmeldesystem und setzt keine eigenen Cookies zu Werbe- oder Tracking-Zwecken. Daten werden ausschließlich über drei Drittanbieter erhoben:",
        "Google Analytics 4 erfasst aggregierte Seitenaufrufe, Referrer, Geräte-/Browser-Metadaten und einen ungefähren Standort (Land/Region). Google AdSense liefert die Display-Anzeigen auf Inhaltsseiten und liest/setzt Werbe-Cookies vorbehaltlich Ihrer Einwilligung. Beehiiv speichert Ihre E-Mail-Adresse und die gewählte Branche, falls Sie den Newsletter über den Footer oder eine branchenspezifische Landingpage abonnieren. Cloudflare Web Analytics zählt — sofern aktiviert — ausschließlich aggregierte Seitenaufrufe, ohne Cookies und ohne personenbezogene Daten zu verwenden.",
      ],
    },
    {
      heading: "Werbung und Einwilligung",
      body: [
        "Die Anzeigen werden von Google AdSense ausgeliefert. Für Besucher aus Regionen, in denen eine Einwilligung gesetzlich erforderlich ist (insbesondere EU/EWR, Vereinigtes Königreich und Schweiz), zeigt die Seite Googles Funding-Choices-Einwilligungsdialog, bevor nicht zwingend erforderliche Cookies gesetzt werden. Sie können Ihre Einwilligung jederzeit über das in der Seite gerenderte Einwilligungs-Element desselben Dialogs ändern oder widerrufen.",
        "Wenn Sie nicht einwilligen, werden Anzeigen entweder nicht geladen oder in einem nicht-personalisierten Modus angezeigt, je nach Verhalten von Google in Ihrer Region. Der restliche Funktionsumfang der Seite (Katalog, Vergleiche, Workflows, Lernbereich) funktioniert mit und ohne Einwilligung gleich.",
      ],
    },
    {
      heading: "Newsletter",
      body: [
        "Wenn Sie den Newsletter abonnieren, werden Ihre E-Mail-Adresse und die gewählte Branche an Beehiiv übermittelt; Beehiiv speichert beides und übernimmt den Versand. Das Anmeldeformular sendet JSON an einen serverseitigen Endpoint dieser Seite, sodass der Beehiiv-API-Schlüssel niemals an den Browser gelangt. Sie können das Abonnement jederzeit über den Link in jeder Newsletter-E-Mail kündigen; die Abmeldung wickelt Beehiiv direkt ab.",
      ],
    },
    {
      heading: "Kontaktformular",
      body: [
        "Wenn Sie sich über das Kontaktformular melden, gelangen Name, E-Mail-Adresse und Nachricht in ein privates Postfach, das vom Seitenbetreiber kontrolliert wird. Die Einsendung wird nicht auf dieser Seite gespeichert, nicht an Dritte weitergegeben und ausschließlich verwendet, um auf Ihre Nachricht zu antworten. Wenn Sie Ihre E-Mail-Adresse nicht übermitteln möchten, ist der über die Kontaktseite verlinkte GitHub-Issues-Kanal eine vollständig öffentliche Alternative.",
      ],
    },
    {
      heading: "Ihre Rechte und wie Sie uns erreichen",
      body: [
        "Wenn Sie in der EU/im EWR, im Vereinigten Königreich oder einer anderen Jurisdiktion mit vergleichbaren Rechten ansässig sind, können Sie Auskunft, Berichtigung oder Löschung der personenbezogenen Daten verlangen, die ooligo über Sie hält. Die einzigen Daten, die ooligo selbst kontrolliert, sind das Postfach des Kontaktformulars und der Beehiiv-Abonnementeintrag; bitte richten Sie entsprechende Anfragen über die Kontaktseite an uns. Für Werbe-Cookies von Google AdSense und die Analyse durch Google Analytics ist es am sinnvollsten, sich direkt an Google zu wenden — diese Dienste arbeiten nach eigenen Datenschutzrichtlinien, die in den obigen Abschnitten verlinkt sind.",
      ],
    },
  ],
};

export const privacyByLocale: Partial<Record<LocaleCode, LegalPage>> & { en: LegalPage } = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  fr,
  de,
};
