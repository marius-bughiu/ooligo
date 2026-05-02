/**
 * Open Graph SVG generators.
 *
 * Each entity type renders to a 1200x630 SVG that ships as the
 * og:image for that page. We use SVG rather than PNG to keep build
 * time minimal and dependencies zero (no satori, no headless
 * rendering). Trade-off: some social platforms (notably Facebook)
 * reject SVG previews — they fall back to no image. Twitter, X,
 * LinkedIn, Slack, Discord, and iMessage all accept SVG.
 *
 * Future upgrade path: swap renderSvg → satori if Facebook traffic
 * matters. Layout stays the same.
 *
 * Typography degrades to system fonts. Brand recognition is
 * carried by:
 *   - Pure black canvas background (#0A0A0B)
 *   - Amber accent strip on the left edge
 *   - Glyph + lowercase wordmark top-left
 *   - Mono numerics + monocased uppercase labels
 */

const W = 1200;
const H = 630;

const C = {
  canvas: "#0a0a0b",
  surface1: "#111114",
  surface2: "#18181d",
  border: "#3a3a45",
  borderSubtle: "#27272f",
  textPrimary: "#f5f5f7",
  textSecondary: "#b4b4bc",
  textTertiary: "#7a7a82",
  accent: "#f0a500",
};

// System mono stack — every renderer has these. Better consistency
// than trying to ship Geist embedded.
const FONT_MONO =
  '"SF Mono", Menlo, Consolas, "Roboto Mono", monospace';
const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Truncate text by *visual* length — assumes mono renders ~14px wide
 * per character at 56px font-size. Used to keep titles inside the
 * usable canvas width.
 */
function clip(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1).trimEnd() + "…";
}

/**
 * Shared chrome wrapping every OG image: bg, accent strip, glyph,
 * wordmark, entity-type label top-right.
 */
function chrome({
  entityLabel,
  metaTopRight,
}: {
  entityLabel: string;
  metaTopRight?: string;
}): { open: string; close: string } {
  const open = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family='${FONT_SANS}'>
  <rect width="${W}" height="${H}" fill="${C.canvas}"/>
  <!-- Amber accent strip -->
  <rect x="0" y="0" width="8" height="${H}" fill="${C.accent}"/>

  <!-- Top-left: glyph + wordmark -->
  <g transform="translate(72,72)">
    <rect x="0" y="0" width="40" height="40" rx="9" ry="9" fill="${C.accent}"/>
    <circle cx="14" cy="20" r="5" fill="${C.canvas}"/>
    <circle cx="26" cy="20" r="5" fill="${C.canvas}"/>
    <text x="56" y="29" font-family='${FONT_MONO}' font-size="22" font-weight="500" fill="${C.textPrimary}" letter-spacing="-0.02em">ooligo</text>
  </g>

  <!-- Top-right: entity-type label -->
  <text x="${W - 72}" y="100" text-anchor="end" font-family='${FONT_MONO}' font-size="14" letter-spacing="0.12em" fill="${C.textTertiary}">
    ${escapeXml(entityLabel.toUpperCase())}${metaTopRight ? ` · ${escapeXml(metaTopRight.toUpperCase())}` : ""}
  </text>
`;
  const close = `</svg>`;
  return { open, close };
}

interface BodyTextOpts {
  /** Headline rendered as mono, large, white */
  title: string;
  /** Optional secondary line below the title (mono, secondary color) */
  subtitle?: string;
  /** Mono caption shown on the bottom-left */
  bottomLeft?: string;
  /** Amber pill on the bottom-right (e.g. score "9.2 / 10") */
  bottomRightPill?: string;
}

function bodyText({
  title,
  subtitle,
  bottomLeft,
  bottomRightPill,
}: BodyTextOpts): string {
  const titleText = clip(title, 56);
  const subtitleText = subtitle ? clip(subtitle, 80) : undefined;
  const bottomLeftText = bottomLeft ?? "";

  return `
  <!-- Title (mono, large) -->
  <text x="72" y="340" font-family='${FONT_MONO}' font-size="64" font-weight="600" fill="${C.textPrimary}" letter-spacing="-0.04em">
    ${escapeXml(titleText)}
  </text>

  ${
    subtitleText
      ? `<text x="72" y="400" font-family='${FONT_MONO}' font-size="26" fill="${C.textSecondary}" letter-spacing="-0.01em">
    ${escapeXml(subtitleText)}
  </text>`
      : ""
  }

  <!-- Bottom-left meta -->
  ${
    bottomLeftText
      ? `<text x="72" y="${H - 72}" font-family='${FONT_MONO}' font-size="18" letter-spacing="0.06em" fill="${C.textTertiary}">${escapeXml(bottomLeftText.toUpperCase())}</text>`
      : ""
  }

  ${
    bottomRightPill
      ? `<g transform="translate(${W - 72},${H - 90})">
    <rect x="-220" y="0" width="220" height="48" rx="24" ry="24" fill="${C.surface1}" stroke="${C.borderSubtle}" stroke-width="1"/>
    <text x="-110" y="32" text-anchor="middle" font-family='${FONT_MONO}' font-size="22" font-weight="500" fill="${C.accent}" letter-spacing="-0.01em">${escapeXml(bottomRightPill)}</text>
  </g>`
      : ""
  }
`;
}

/* ============ Default ============ */

export function renderDefaultOg(): string {
  const { open, close } = chrome({ entityLabel: "Marketplace" });
  return `${open}${bodyText({
    title: "ooligo",
    subtitle: "The AI workflow marketplace for ops leaders.",
    bottomLeft: "RevOps · Legal Ops · Recruiting",
  })}${close}`;
}

/* ============ Tool ============ */

interface ToolOgInput {
  name: string;
  category: string;
  ooligo_score?: number | null;
  ai_native?: boolean;
  pricing_label?: string; // e.g. "$149/mo · usage-based"
}

export function renderToolOg(t: ToolOgInput): string {
  const { open, close } = chrome({ entityLabel: "Tool" });

  const subtitle = [
    t.category,
    t.pricing_label,
    t.ai_native ? "AI-native" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return `${open}${bodyText({
    title: t.name,
    subtitle,
    bottomLeft: "ooligo.com · tools",
    bottomRightPill:
      t.ooligo_score != null
        ? `${t.ooligo_score.toFixed(1)} / 10`
        : undefined,
  })}${close}`;
}

/* ============ Comparison ============ */

interface ComparisonOgInput {
  type: "pairwise" | "roundup" | "alternatives";
  pageTitle: string; // already resolved (e.g. "Clay vs Apollo")
  contextLabel?: string; // category / vertical
}

export function renderComparisonOg(c: ComparisonOgInput): string {
  const typeLabel =
    c.type === "pairwise"
      ? "Pairwise"
      : c.type === "alternatives"
        ? "Alternatives"
        : "Roundup";
  const { open, close } = chrome({
    entityLabel: "Comparison",
    metaTopRight: typeLabel,
  });

  return `${open}${bodyText({
    title: c.pageTitle,
    subtitle: c.contextLabel,
    bottomLeft: "ooligo.com · vs",
  })}${close}`;
}

/* ============ Workflow ============ */

interface WorkflowOgInput {
  title: string;
  artifact_type: string;
  difficulty?: string;
  time_to_setup?: string;
}

export function renderWorkflowOg(w: WorkflowOgInput): string {
  const { open, close } = chrome({
    entityLabel: "Workflow",
    metaTopRight: w.artifact_type,
  });

  const subtitle = [
    w.difficulty,
    w.time_to_setup ? `⌁ ${w.time_to_setup}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return `${open}${bodyText({
    title: w.title,
    subtitle,
    bottomLeft: "ooligo.com · workflows",
  })}${close}`;
}

/* ============ Learn ============ */

interface LearnOgInput {
  title: string;
  type: "definition" | "faq" | "how-to" | "framework" | "glossary";
  question?: string;
}

export function renderLearnOg(l: LearnOgInput): string {
  const { open, close } = chrome({
    entityLabel: "Learn",
    metaTopRight: l.type,
  });

  return `${open}${bodyText({
    title: l.title,
    subtitle: l.question,
    bottomLeft: "ooligo.com · learn",
  })}${close}`;
}

/* ============ Stack ============ */

interface StackOgInput {
  title: string;
  use_case?: string;
  difficulty?: string;
  toolCount?: number;
}

export function renderStackOg(s: StackOgInput): string {
  const { open, close } = chrome({
    entityLabel: "Stack",
    metaTopRight: s.difficulty,
  });

  const subtitle = s.use_case;
  const bottomLeft =
    s.toolCount != null
      ? `ooligo.com · stacks · ${s.toolCount} tools`
      : "ooligo.com · stacks";

  return `${open}${bodyText({
    title: s.title,
    subtitle,
    bottomLeft,
  })}${close}`;
}

/* ============ Vertical landing ============ */

interface VerticalOgInput {
  name: string;
  tagline: string;
  isFlagship?: boolean;
}

export function renderVerticalOg(v: VerticalOgInput): string {
  const { open, close } = chrome({
    entityLabel: "Vertical",
    metaTopRight: v.isFlagship ? "Flagship" : undefined,
  });

  return `${open}${bodyText({
    title: v.name,
    subtitle: v.tagline,
    bottomLeft: "ooligo.com · /r",
  })}${close}`;
}
