interface PageMetadataInput {
  description?: string;
  body?: string;
  title: string;
  locale: string;
}

/** Tool names remain product identities; an authored title describes the page. */
export function toolPageTitle(data: { name: string; title?: string; locale: string }): string {
  if (data.title?.trim()) return data.title.trim();
  const titles: Record<string, string> = {
    en: `${data.name}: pricing and features`,
    es: `${data.name}: precios y funciones`,
    "pt-BR": `${data.name}: preços e recursos`,
    de: `${data.name}: Preise und Funktionen`,
    fr: `${data.name}\u00a0: tarifs et fonctionnalités`,
    ja: `${data.name} の料金と機能`,
  };
  return titles[data.locale] ?? titles.en!;
}

function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, value: string) => {
    if (!value.startsWith("#")) return named[value.toLowerCase()] ?? entity;
    const code = value[1]?.toLowerCase() === "x"
      ? Number.parseInt(value.slice(2), 16)
      : Number.parseInt(value.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code)
      : "";
  });
}

/** Read prose only. Code, JSX/expressions, lists, tables and editorial notes aren't snippets. */
export function openingParagraph(body: string): string | undefined {
  const source = body
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const lines: string[] = [];
  let fence: { marker: string; length: number } | undefined;
  for (const line of source.split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker?.[0] === fence.marker && marker.length >= fence.length && line.trim() === marker) fence = undefined;
      lines.push("");
    } else if (marker) {
      fence = { marker: marker[0]!, length: marker.length };
      lines.push("");
    } else {
      lines.push(line);
    }
  }
  const prose = lines.join("\n");

  for (const block of prose.split(/\n\s*\n/)) {
    const candidate = block.trim();
    // Skip whole blocks rather than exposing code after partially stripping MDX.
    if (!candidate || /^(?:#{1,6}\s|>|\||[-*+]\s|\d+[.)]\s|import\s|export\s|<|\{|\[\^?[^\]]+\]:|[-*_]{3,}\s*$)/m.test(candidate)) continue;
    if (/[{}]|<\/?[A-Za-z][^>]*>/.test(candidate)) continue;
    const text = decodeEntities(candidate
      .replace(/!\[[^\]]*\]\((?:[^()\n]|\([^()\n]*\))*\)/g, "")
      .replace(/\[([^\]]+)\]\((?:[^()\n]|\([^()\n]*\))*\)/g, "$1")
      .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
      .replace(/\[\^[^\]]+\]/g, "")
      .replace(/`+([^`]+)`+/g, "$1")
      .replace(/(\*\*|__|~~)(.*?)\1/g, "$2")
      // Asterisks can emphasize text inside a Japanese sentence; underscores
      // require word boundaries so identifiers such as crm_id stay intact.
      .replace(/(^|[^\\\p{Script=Latin}\p{N}*])\*(?![\s*])([^*]*?\S)\*(?=$|[^\p{Script=Latin}\p{N}*])/gu, "$1$2")
      .replace(/(^|[^\p{L}\p{N}])_(\S(?:.*?\S)?)_(?=$|[^\p{L}\p{N}])/gu, "$1$2")
      .replace(/\\([\\`*_{}\[\]()#+.!>-])/g, "$1"))
      .replace(/\s+/g, " ").trim();
    // Tiny labels/images and source-only blocks are not useful descriptions.
    if (Array.from(text).length < 40 || /^(?:https?:\/\/|Sources?:\s*https?:\/\/)/i.test(text)) continue;
    return text;
  }
  return undefined;
}

function excerpt(text: string, locale: string): string {
  const characters = Array.from(text);
  if (characters.length <= 160) return text;
  let shortened = characters.slice(0, 159).join("");
  // Latin-script locales break at a word; Japanese has no such boundary.
  if (locale !== "ja") {
    const boundary = shortened.lastIndexOf(" ");
    if (boundary >= 100) shortened = shortened.slice(0, boundary);
  }
  return `${shortened.replace(/[\s,;:—-]+$/, "")}…`;
}

/** Authored descriptions win. Legacy pages summarize their own localized prose. */
export function pageDescription(data: PageMetadataInput): string {
  if (data.description?.trim()) return data.description.trim();
  const paragraph = openingParagraph(data.body ?? "");
  if (paragraph) return excerpt(paragraph, data.locale);
  const fallback: Record<string, string> = {
    en: `Explore ${data.title} on ooligo.`,
    es: `Consulta ${data.title} en ooligo.`,
    "pt-BR": `Confira ${data.title} no ooligo.`,
    de: `Informationen zu ${data.title} auf ooligo.`,
    fr: `Découvrez ${data.title} sur ooligo.`,
    ja: `${data.title}について ooligo で確認できます。`,
  };
  return fallback[data.locale] ?? fallback.en!;
}
