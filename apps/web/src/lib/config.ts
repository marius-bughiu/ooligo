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
// All AdSense IDs are env-driven so the loader script and ad slots stay
// dark in any environment that does not opt in (dev, preview, /design/,
// missing-env builds). Component renderers must null-check before
// emitting markup. See SponsoredAdSlot.astro and BaseLayout.astro.
//
// Required env (Cloudflare Pages + local .env):
//   PUBLIC_ADSENSE_CLIENT       e.g. "ca-pub-XXXXXXXXXXXXXXXX"
//   PUBLIC_ADSENSE_SLOT_LEARN   10-digit slot id from AdSense console
//   PUBLIC_ADSENSE_SLOT_VS      10-digit slot id from AdSense console
//
// Slot IDs must be created as "Display ads → In-article" native units.
// NOT auto ads, NOT in-feed, NOT page-level. See plan.
export const ADSENSE_CLIENT: string | null =
  import.meta.env.PUBLIC_ADSENSE_CLIENT ?? null;

export const ADSENSE_SLOTS = {
  learnInArticle: import.meta.env.PUBLIC_ADSENSE_SLOT_LEARN ?? null,
  vsInArticle: import.meta.env.PUBLIC_ADSENSE_SLOT_VS ?? null,
} as const;

/** Minimum raw-markdown body length required to render an in-article ad
 * slot on a learn detail page. Below this, the page is treated as
 * "thin content" and the slot is suppressed (avoids AdSense policy
 * issues on definitions/short FAQs). */
export const ADSENSE_MIN_BODY_CHARS = 1500;
