/**
 * "Contact" page prose + form labels, per locale.
 *
 * The page exposes a JSON POST form against /api/contact (a Cloudflare
 * Pages Function) and surfaces the public GitHub Issues channel as an
 * alternate. The owner's email address is NOT rendered in any locale —
 * keep it that way.
 */

import type { ContactPage } from "./types";
import type { LocaleCode } from "../config";

const LAST_UPDATED = "2026-05-13";

const en: ContactPage = {
  title: "Contact — ooligo",
  description:
    "Get in touch with the ooligo team: corrections, feedback, partnership questions, or anything else.",
  heading: "Contact",
  lastUpdated: LAST_UPDATED,
  lead: "If you've spotted a factual error, want to suggest a tool or workflow we're missing, or have a partnership or press question, this form reaches the site owner directly.",
  sections: [
    {
      heading: "Use the form for direct messages",
      body: [
        "Submissions are forwarded to a private inbox. You'll typically hear back within a few business days. The form is the best channel for anything that includes private context — pricing details under NDA, factual corrections you can source but don't want to make public, or partnership discussions.",
      ],
    },
    {
      heading: "Use GitHub for public corrections",
      body: [
        "If the issue is a public fact about a tool, a comparison, a workflow, or a learn entry — a price changed, an integration was added or removed, a category misclassification — opening a GitHub issue or pull request is faster and more transparent. Other readers can see the discussion and the fix, and the change ships as a normal site update.",
      ],
    },
  ],
  form: {
    name_label: "Name",
    email_label: "Email",
    message_label: "Message",
    submit: "Send message",
    submitting: "Sending…",
    success: "Thanks — message received. We'll be in touch.",
    error: "Something went wrong sending the message. Please try again.",
    invalid_email: "Please enter a valid email address.",
    github_intro: "Prefer a public channel? Open an issue or pull request:",
    github_link_label: "GitHub issues",
  },
};

const es: ContactPage = {
  title: "Contacto — ooligo",
  description:
    "Ponte en contacto con el equipo de ooligo: correcciones, comentarios, dudas de colaboración o cualquier otra cosa.",
  heading: "Contacto",
  lastUpdated: LAST_UPDATED,
  lead: "Si detectaste un error factual, quieres sugerir una herramienta o workflow que falta, o tienes una pregunta de colaboración o prensa, este formulario llega directamente al propietario del sitio.",
  sections: [
    {
      heading: "Usa el formulario para mensajes directos",
      body: [
        "Los envíos se reenvían a un buzón privado. Normalmente recibirás respuesta en unos pocos días hábiles. El formulario es el mejor canal para cualquier cosa que incluya contexto privado: detalles de precios bajo NDA, correcciones con fuente que prefieras no hacer públicas o conversaciones de colaboración.",
      ],
    },
    {
      heading: "Usa GitHub para correcciones públicas",
      body: [
        "Si se trata de un hecho público sobre una herramienta, una comparación, un workflow o una entrada de aprendizaje — un precio que cambió, una integración añadida o eliminada, una clasificación errónea — abrir un issue o un pull request en GitHub es más rápido y transparente. Otros lectores ven la discusión y la corrección, y el cambio se publica como una actualización normal del sitio.",
      ],
    },
  ],
  form: {
    name_label: "Nombre",
    email_label: "Correo electrónico",
    message_label: "Mensaje",
    submit: "Enviar mensaje",
    submitting: "Enviando…",
    success: "Gracias, mensaje recibido. Te contactaremos.",
    error: "Algo salió mal al enviar el mensaje. Inténtalo de nuevo.",
    invalid_email: "Ingresa un correo electrónico válido.",
    github_intro: "¿Prefieres un canal público? Abre un issue o un pull request:",
    github_link_label: "GitHub issues",
  },
};

const ptBR: ContactPage = {
  title: "Contato — ooligo",
  description:
    "Fale com a equipe do ooligo: correções, feedback, parcerias ou qualquer outra coisa.",
  heading: "Contato",
  lastUpdated: LAST_UPDATED,
  lead: "Se você encontrou um erro factual, quer sugerir uma ferramenta ou workflow que está faltando, ou tem uma dúvida sobre parceria ou imprensa, este formulário chega direto ao proprietário do site.",
  sections: [
    {
      heading: "Use o formulário para mensagens diretas",
      body: [
        "As mensagens são encaminhadas para uma caixa de entrada privada. Em geral, você recebe retorno em alguns dias úteis. O formulário é o melhor canal para tudo que envolve contexto privado: detalhes de preço sob NDA, correções factuais com fonte que você prefere não tornar públicas ou conversas de parceria.",
      ],
    },
    {
      heading: "Use o GitHub para correções públicas",
      body: [
        "Se for um fato público sobre uma ferramenta, uma comparação, um workflow ou uma entrada de aprendizado — um preço que mudou, uma integração que entrou ou saiu, uma categoria classificada errado — abrir um issue ou pull request no GitHub é mais rápido e transparente. Outros leitores enxergam a discussão e a correção, e a mudança vai ao ar como uma atualização normal do site.",
      ],
    },
  ],
  form: {
    name_label: "Nome",
    email_label: "E-mail",
    message_label: "Mensagem",
    submit: "Enviar mensagem",
    submitting: "Enviando…",
    success: "Obrigado — mensagem recebida. Entraremos em contato.",
    error: "Algo deu errado ao enviar a mensagem. Tente novamente.",
    invalid_email: "Insira um e-mail válido.",
    github_intro: "Prefere um canal público? Abra um issue ou pull request:",
    github_link_label: "GitHub issues",
  },
};

const ja: ContactPage = {
  title: "お問い合わせ — ooligo",
  description:
    "ooligoチームへのご連絡：修正のご提案、ご意見、パートナーシップに関するご質問など。",
  heading: "お問い合わせ",
  lastUpdated: LAST_UPDATED,
  lead: "事実関係の誤りを見つけた、不足しているツールやワークフローを提案したい、パートナーシップや取材のご質問がある——このフォームから直接サイト運営者へお問い合わせいただけます。",
  sections: [
    {
      heading: "直接のご連絡はフォームをご利用ください",
      body: [
        "送信内容は非公開の受信箱に転送されます。通常は数営業日以内にご返信します。NDA対象の価格情報、ソースはあるが公開はしたくない事実訂正、パートナーシップの相談など、非公開の文脈を含むご連絡はフォームが最も適した経路です。",
      ],
    },
    {
      heading: "公開できる修正はGitHubをご利用ください",
      body: [
        "ツール、比較、ワークフロー、学習エントリに関する公開可能な事実——価格の変更、連携の追加・削除、カテゴリ分類の誤りなど——であれば、GitHubのissueまたはpull requestを開く方が迅速で透明性があります。他の読者も議論や修正の内容を確認でき、変更は通常のサイト更新として反映されます。",
      ],
    },
  ],
  form: {
    name_label: "お名前",
    email_label: "メールアドレス",
    message_label: "メッセージ",
    submit: "メッセージを送信",
    submitting: "送信中…",
    success: "ありがとうございます — メッセージを受け付けました。追ってご連絡します。",
    error: "メッセージの送信中に問題が発生しました。もう一度お試しください。",
    invalid_email: "有効なメールアドレスを入力してください。",
    github_intro: "公開チャネルをお選びの場合は、issueまたはpull requestを開いてください：",
    github_link_label: "GitHub issues",
  },
};

const fr: ContactPage = {
  title: "Contact — ooligo",
  description:
    "Contactez l'équipe d'ooligo : corrections, retours, questions de partenariat ou autres.",
  heading: "Contact",
  lastUpdated: LAST_UPDATED,
  lead: "Si vous avez repéré une erreur factuelle, souhaitez suggérer un outil ou un workflow manquant, ou avez une question de partenariat ou de presse, ce formulaire atteint directement le propriétaire du site.",
  sections: [
    {
      heading: "Utilisez le formulaire pour les messages directs",
      body: [
        "Les envois sont transférés vers une boîte privée. Vous obtenez généralement une réponse sous quelques jours ouvrés. Le formulaire est le bon canal pour tout ce qui comporte un contexte privé : détails tarifaires sous NDA, corrections factuelles sourcées que vous préférez ne pas rendre publiques, discussions de partenariat.",
      ],
    },
    {
      heading: "Utilisez GitHub pour les corrections publiques",
      body: [
        "S'il s'agit d'un fait public concernant un outil, une comparaison, un workflow ou une entrée d'apprentissage — un prix qui a changé, une intégration ajoutée ou retirée, une catégorisation erronée — ouvrir une issue ou une pull request GitHub est plus rapide et plus transparent. Les autres lecteurs voient la discussion et la correction, et le changement est livré comme une mise à jour normale du site.",
      ],
    },
  ],
  form: {
    name_label: "Nom",
    email_label: "E-mail",
    message_label: "Message",
    submit: "Envoyer le message",
    submitting: "Envoi…",
    success: "Merci — message reçu. Nous reviendrons vers vous.",
    error: "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer.",
    invalid_email: "Veuillez saisir une adresse e-mail valide.",
    github_intro: "Vous préférez un canal public ? Ouvrez une issue ou une pull request :",
    github_link_label: "GitHub issues",
  },
};

const de: ContactPage = {
  title: "Kontakt — ooligo",
  description:
    "Nehmen Sie Kontakt mit dem ooligo-Team auf: Korrekturen, Feedback, Partnerschaftsanfragen oder anderes.",
  heading: "Kontakt",
  lastUpdated: LAST_UPDATED,
  lead: "Wenn Sie einen sachlichen Fehler entdeckt haben, ein fehlendes Tool oder einen fehlenden Workflow vorschlagen möchten oder eine Partnerschafts- oder Presseanfrage haben, erreicht dieses Formular direkt den Seitenbetreiber.",
  sections: [
    {
      heading: "Nutzen Sie das Formular für direkte Nachrichten",
      body: [
        "Eingehende Nachrichten werden an ein privates Postfach weitergeleitet. In der Regel erhalten Sie innerhalb weniger Werktage eine Antwort. Das Formular ist der richtige Kanal für alles mit nicht-öffentlichem Kontext: Preisdetails unter NDA, sachliche Korrekturen mit Quelle, die Sie nicht öffentlich machen möchten, oder Partnerschaftsgespräche.",
      ],
    },
    {
      heading: "Nutzen Sie GitHub für öffentliche Korrekturen",
      body: [
        "Handelt es sich um eine öffentliche Tatsache zu einem Tool, einem Vergleich, einem Workflow oder einem Lerneintrag — ein geänderter Preis, eine hinzugekommene oder weggefallene Integration, eine falsche Kategorisierung —, ist das Öffnen einer Issue oder Pull Request auf GitHub schneller und transparenter. Andere Leser sehen die Diskussion und die Korrektur, und die Änderung erscheint als normales Site-Update.",
      ],
    },
  ],
  form: {
    name_label: "Name",
    email_label: "E-Mail",
    message_label: "Nachricht",
    submit: "Nachricht senden",
    submitting: "Wird gesendet…",
    success: "Danke — Nachricht erhalten. Wir melden uns.",
    error: "Beim Senden der Nachricht ist etwas schiefgelaufen. Bitte erneut versuchen.",
    invalid_email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    github_intro: "Lieber ein öffentlicher Kanal? Öffnen Sie eine Issue oder Pull Request:",
    github_link_label: "GitHub-Issues",
  },
};

export const contactByLocale: Partial<Record<LocaleCode, ContactPage>> & { en: ContactPage } = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  fr,
  de,
};
