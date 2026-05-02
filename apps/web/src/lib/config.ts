import verticalsData from "../../../../content/verticals.json" with { type: "json" };
import localesData from "../../../../content/locales.json" with { type: "json" };

export type LocaleCode = "en" | "es" | "pt-BR";

export type Vertical = {
  id: string;
  slug: string;
  names: Record<LocaleCode, string>;
  tagline: Record<LocaleCode, string>;
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
