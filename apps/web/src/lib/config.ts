import verticalsData from "../../../../content/verticals.json" with { type: "json" };
import localesData from "../../../../content/locales.json" with { type: "json" };

export type LocaleCode =
  | "en"
  | "es"
  | "pt-BR"
  | "ja"
  | "ru"
  | "ro"
  | "fr"
  | "de"
  | "zh-CN"
  | "ko"
  | "ar";

// `en` is required (canonical fallback); other locales are optional and fall
// back to `en` at read time via `localizedName`/`localizedTagline`/`localeText`.
type LocalizedString = Partial<Record<LocaleCode, string>> & { en: string };

export type Vertical = {
  id: string;
  slug: string;
  names: LocalizedString;
  tagline: LocalizedString;
  icp: string;
  starter_tools: string[];
  newsletter_id: string;
  launch_phase: number;
  is_flagship: boolean;
};

export type Locale = {
  code: LocaleCode;
  name: string;
  native_name: string;
  hreflang: string;
  rtl: boolean;
  is_canonical: boolean;
  translated_from: string | null;
  launch_phase: number;
  regional_target?: string;
};

export const verticals: Vertical[] = verticalsData.verticals as Vertical[];
export const locales: Locale[] = localesData.locales as Locale[];
export const defaultLocale: LocaleCode = localesData.default_locale as LocaleCode;

export function getVertical(slug: string): Vertical | undefined {
  return verticals.find((v) => v.slug === slug);
}

export function getLocale(code: string): Locale | undefined {
  return locales.find((l) => l.code === code);
}

export function localizedName(vertical: Vertical, locale: LocaleCode): string {
  return vertical.names[locale] ?? vertical.names.en;
}

export function localizedTagline(vertical: Vertical, locale: LocaleCode): string {
  return vertical.tagline[locale] ?? vertical.tagline.en;
}

// Read a value from a locale-keyed table, falling back to `en` when the locale
// has no entry. Used by per-page label tables and chrome strings so adding a
// new locale to `locales.json` does not require touching every table.
export function localeText<T>(
  table: Partial<Record<LocaleCode, T>> & { en: T },
  locale: LocaleCode,
): T {
  return table[locale] ?? table.en;
}

// ----- AdSense -----
//
// Hardcoded publisher + slot IDs (intentional — no env indirection).
// AdSense IDs are not secrets: the publisher ID is rendered on every
// page in the loader script and ads.txt anyway, and slot IDs are
// emitted in <ins data-ad-slot> markup.
//
// Slot IDs are "Display ads → In-article" native units configured in
// the AdSense console. NOT auto ads, NOT in-feed, NOT page-level.
// See SponsoredAdSlot.astro for placement chrome.
export const ADSENSE_CLIENT = "ca-pub-1537458730659685" as const;

export const ADSENSE_SLOTS = {
  learnInArticle: "6410706738",
  vsInArticle: "8754858539",
} as const;

/** Minimum raw-markdown body length required to render an in-article ad
 * slot on a learn detail page. Below this, the page is treated as
 * "thin content" and the slot is suppressed (avoids AdSense policy
 * issues on definitions/short FAQs). */
export const ADSENSE_MIN_BODY_CHARS = 1500;
