/**
 * "Contact" page prose, per locale.
 *
 * The only contact channel is the public GitHub repository — issues
 * for bug reports / feature requests / questions, pull requests for
 * fact corrections, discussions for broader threads. No form, no
 * private inbox: every conversation is public.
 */

import type { ContactPage } from "./types";
import type { LocaleCode } from "../config";

const LAST_UPDATED = "2026-05-13";

const en: ContactPage = {
  title: "Contact — ooligo",
  description:
    "Get in touch via the public GitHub repository — issues, pull requests, and discussions.",
  heading: "Contact",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo is run in the open and the only contact channel is the public GitHub repository.",
  sections: [
    {
      heading: "How to reach us",
      body: [
        "Open an issue for bug reports, missing tools, or factual errors. Open a pull request to propose a correction or addition directly. Open a discussion for broader questions — pricing context, vendor relationships, editorial direction, or anything that doesn't fit the issue/PR mold.",
        "Everything is public by design. If a topic genuinely needs to stay private, please don't send it here — there's no private channel to route it to.",
      ],
    },
  ],
  githubLinkLabel: "Open an issue on GitHub →",
};

const es: ContactPage = {
  title: "Contacto — ooligo",
  description:
    "Ponte en contacto a través del repositorio público de GitHub: issues, pull requests y discusiones.",
  heading: "Contacto",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo se mantiene en abierto y el único canal de contacto es el repositorio público de GitHub.",
  sections: [
    {
      heading: "Cómo contactarnos",
      body: [
        "Abre un issue para reportar errores, herramientas que faltan o inexactitudes. Abre un pull request para proponer una corrección o adición directamente. Abre una discusión para preguntas más amplias: contexto de precios, relaciones con proveedores, dirección editorial o cualquier cosa que no encaje como issue o PR.",
        "Todo es público por diseño. Si un tema realmente necesita permanecer privado, por favor no lo envíes aquí — no hay un canal privado al que enrutarlo.",
      ],
    },
  ],
  githubLinkLabel: "Abrir un issue en GitHub →",
};

const ptBR: ContactPage = {
  title: "Contato — ooligo",
  description:
    "Fale com a gente pelo repositório público no GitHub: issues, pull requests e discussions.",
  heading: "Contato",
  lastUpdated: LAST_UPDATED,
  lead: "O ooligo é mantido em aberto e o único canal de contato é o repositório público no GitHub.",
  sections: [
    {
      heading: "Como falar com a gente",
      body: [
        "Abra um issue para relatar bugs, ferramentas faltando ou imprecisões. Abra um pull request para propor uma correção ou adição direto. Abra uma discussion para perguntas mais amplas: contexto de preço, relações com fornecedores, direção editorial ou qualquer coisa que não caiba como issue ou PR.",
        "Tudo é público por design. Se um assunto realmente precisa ficar privado, por favor não envie por aqui — não há um canal privado para onde encaminhá-lo.",
      ],
    },
  ],
  githubLinkLabel: "Abrir um issue no GitHub →",
};

const ja: ContactPage = {
  title: "お問い合わせ — ooligo",
  description:
    "公開されたGitHubリポジトリからお問い合わせいただけます——issue、pull request、discussionが利用できます。",
  heading: "お問い合わせ",
  lastUpdated: LAST_UPDATED,
  lead: "ooligoはオープンに運営しており、お問い合わせ手段は公開GitHubリポジトリのみです。",
  sections: [
    {
      heading: "ご連絡方法",
      body: [
        "バグ報告、不足しているツール、事実関係の誤りについてはissueをご利用ください。修正や追加の提案は直接pull requestをお送りいただけます。価格情報の背景、ベンダーとの関係、編集方針など、issueやPRに収まらない広範な質問はdiscussionをご利用ください。",
        "すべては設計上、公開された場で行われます。本当に非公開で扱う必要のある話題は、こちらには送らないでください——個別の非公開チャネルはご用意していません。",
      ],
    },
  ],
  githubLinkLabel: "GitHubでissueを開く →",
};

const fr: ContactPage = {
  title: "Contact — ooligo",
  description:
    "Contactez-nous via le dépôt GitHub public : issues, pull requests et discussions.",
  heading: "Contact",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo est tenu en open source et le seul canal de contact est le dépôt GitHub public.",
  sections: [
    {
      heading: "Comment nous joindre",
      body: [
        "Ouvrez une issue pour signaler un bug, un outil manquant ou une inexactitude. Ouvrez une pull request pour proposer directement une correction ou un ajout. Ouvrez une discussion pour les questions plus larges : contexte tarifaire, relations avec les éditeurs, ligne éditoriale, ou tout ce qui n'entre pas dans le moule issue / PR.",
        "Tout est public par conception. Si un sujet doit vraiment rester privé, merci de ne pas l'envoyer ici — il n'y a pas de canal privé vers lequel le rediriger.",
      ],
    },
  ],
  githubLinkLabel: "Ouvrir une issue sur GitHub →",
};

const de: ContactPage = {
  title: "Kontakt — ooligo",
  description:
    "Nehmen Sie über das öffentliche GitHub-Repository Kontakt auf — Issues, Pull Requests und Discussions.",
  heading: "Kontakt",
  lastUpdated: LAST_UPDATED,
  lead: "ooligo wird offen betrieben und der einzige Kontaktkanal ist das öffentliche GitHub-Repository.",
  sections: [
    {
      heading: "So erreichen Sie uns",
      body: [
        "Öffnen Sie eine Issue für Fehlermeldungen, fehlende Tools oder sachliche Ungenauigkeiten. Öffnen Sie eine Pull Request, um direkt eine Korrektur oder Ergänzung vorzuschlagen. Öffnen Sie eine Discussion für breitere Fragen — Preiskontext, Anbieterbeziehungen, redaktionelle Ausrichtung oder alles, was nicht in Issue oder PR passt.",
        "Alles ist absichtlich öffentlich. Wenn ein Thema wirklich vertraulich bleiben muss, senden Sie es bitte nicht hierher — es gibt keinen privaten Kanal, an den es weitergeleitet werden könnte.",
      ],
    },
  ],
  githubLinkLabel: "Issue auf GitHub öffnen →",
};

export const contactByLocale: Partial<Record<LocaleCode, ContactPage>> & { en: ContactPage } = {
  en,
  es,
  "pt-BR": ptBR,
  ja,
  fr,
  de,
};
