/**
 * Aggregator for trust-page prose (about / privacy / contact / terms).
 *
 * Per-page modules live in ./legal/ so individual pages can be edited
 * without scrolling past thousands of lines of unrelated locales. This
 * file is the single entry point used by the page templates.
 */

import { aboutByLocale } from "./legal/about";
import { privacyByLocale } from "./legal/privacy";
import { contactByLocale } from "./legal/contact";
import { termsByLocale } from "./legal/terms";
import type { LocaleCode } from "./config";
import type { ContactPage, LegalPage } from "./legal/types";

// Localized label for the "Last updated" line at the top of each trust page.
const LAST_UPDATED_LABEL: Record<LocaleCode, string> = {
  en: "Last updated",
  es: "Última actualización",
  "pt-BR": "Última atualização",
  ja: "最終更新日",
  fr: "Dernière mise à jour",
  de: "Zuletzt aktualisiert",
};

function pick<T>(
  table: Partial<Record<LocaleCode, T>> & { en: T },
  locale: LocaleCode,
): T {
  return table[locale] ?? table.en;
}

export function aboutPage(locale: LocaleCode): LegalPage {
  return pick(aboutByLocale, locale);
}

export function privacyPage(locale: LocaleCode): LegalPage {
  return pick(privacyByLocale, locale);
}

export function contactPage(locale: LocaleCode): ContactPage {
  return pick(contactByLocale, locale);
}

export function termsPage(locale: LocaleCode): LegalPage {
  return pick(termsByLocale, locale);
}

export function lastUpdatedLabel(locale: LocaleCode): string {
  return LAST_UPDATED_LABEL[locale] ?? LAST_UPDATED_LABEL.en;
}

export type { LegalPage, ContactPage } from "./legal/types";
