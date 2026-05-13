/**
 * Shared types for the trust-page strings (about / privacy / contact / terms).
 *
 * The trust pages are not catalog entities — they're chrome. Storing the
 * prose in TypeScript modules keeps them out of `content/` (where they
 * would pollute listing/search surfaces) while still allowing all six
 * locales to ship with the build.
 */

import type { LocaleCode } from "../config";

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalPage {
  /** <title> tag */
  title: string;
  /** <meta description> tag */
  description: string;
  /** H1 on the page */
  heading: string;
  /** ISO date — rendered next to the "Last updated" label */
  lastUpdated: string;
  /** Optional lead paragraph rendered above the first section */
  lead?: string;
  sections: LegalSection[];
}

export interface ContactPage extends LegalPage {
  /** Label of the link pointing at GitHub Issues (the only contact channel). */
  githubLinkLabel: string;
}

export type LegalStringsTable = Partial<Record<LocaleCode, LegalPage>> & {
  en: LegalPage;
};
