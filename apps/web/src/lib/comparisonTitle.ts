interface ComparisonTitleData {
  title?: string;
  slug: string;
  locale: string;
  type: "pairwise" | "roundup" | "alternatives";
  tool_a?: string;
  tool_b?: string;
  tools?: string[];
}

/** Keep titles consistent across search metadata, headings, cards and sharing. */
export function comparisonTitle(
  data: ComparisonTitleData,
  resolveTool: (slug: string) => string,
): string {
  if (data.title?.trim()) return data.title.trim();
  if (data.type === "pairwise" && data.tool_a && data.tool_b) {
    return `${resolveTool(data.tool_a)} vs ${resolveTool(data.tool_b)}`;
  }
  if (data.type === "alternatives" && data.tools?.[0]) {
    const tool = resolveTool(data.tools[0]);
    const titles: Record<string, string> = {
      en: `Alternatives to ${tool}`,
      es: `Alternativas a ${tool}`,
      "pt-BR": `Alternativas para ${tool}`,
      fr: `Alternatives à ${tool}`,
      de: `Alternativen zu ${tool}`,
      ja: `${tool}の代替ツール`,
    };
    return titles[data.locale] ?? titles.en!;
  }
  // Legacy roundups must retain their specific topic, never just a vertical.
  return data.slug.replace(/-/g, " ")
    .replace(/\b(ai|mcp|crm|crms|ats|abm|clm)\b/g, (word) => word.toUpperCase())
    .replace(/^./, (letter) => letter.toUpperCase());
}
