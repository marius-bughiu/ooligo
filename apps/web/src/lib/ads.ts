/**
 * Direct-sold ad inventory.
 *
 * Distinct from the AdSense units in `SponsoredAdSlot.astro`: those are
 * programmatic, in-article, and filled by Google. These are static images
 * sold by us, to a named advertiser, for a fixed flight — no auction, no
 * third-party script, no tracking pixel. The creative is a file we host.
 *
 * This module is the single source of truth for the inventory: `AdSlot.astro`
 * renders from it, and `/[locale]/advertise/` documents it from the same
 * constants, so the public rate sheet can never drift from what actually
 * ships.
 *
 * To book a slot: add an `AdCreative` to `AD_CREATIVES`. To take it down:
 * remove it, or let `ends` lapse. An unfilled placement renders the
 * "available" placeholder rather than collapsing, so the layout is identical
 * whether or not a slot is sold.
 */

import type { LocaleCode } from "./config";

/** Where advertising enquiries go. Not an editorial channel — see contact.ts. */
export const ADS_CONTACT_EMAIL = "contact@ooligo.com" as const;

export type AdPlacementId = "tool-sidebar" | "vertical-banner";

/** How a placement's inventory is addressed when booking. */
export type AdTargeting = "tool" | "vertical";

export interface AdPlacement {
  id: AdPlacementId;
  /**
   * Intrinsic creative size in CSS px. Advertisers supply a 2x asset at
   * these proportions; the slot reserves the aspect ratio so a booked
   * creative causes no layout shift versus the placeholder.
   */
  width: number;
  height: number;
  /** Which surface the slot renders on — documented on /advertise/. */
  surface: "tool-detail" | "vertical-hub";
  targeting: AdTargeting;
}

/**
 * Two placements, deliberately. One per targeting method, so every unit we
 * sell is addressable by exactly one axis and the inventory stays legible.
 *
 *   tool-sidebar    300x250 medium rectangle, in the sticky aside of a tool
 *                   page (22rem column, ~318px of usable inner width).
 *   vertical-banner 728x90 leaderboard, band above the tool grid on a
 *                   vertical hub. Scales down fluidly; aspect ratio held.
 */
export const AD_PLACEMENTS: Record<AdPlacementId, AdPlacement> = {
  "tool-sidebar": {
    id: "tool-sidebar",
    width: 300,
    height: 250,
    surface: "tool-detail",
    targeting: "tool",
  },
  "vertical-banner": {
    id: "vertical-banner",
    width: 728,
    height: 90,
    surface: "vertical-hub",
    targeting: "vertical",
  },
};

export interface AdCreative {
  placement: AdPlacementId;
  /** Advertiser name. Rendered in the disclosure label — never hidden. */
  advertiser: string;
  /** Image path under /public (e.g. "/ads/acme-300x250.png") or absolute URL. */
  src: string;
  /** Click destination. Rendered with rel="sponsored noopener". */
  href: string;
  /** Alt text. Required: the creative carries the message, so it must be described. */
  alt: string;
  /**
   * Targeting. Empty/omitted means the creative runs across all inventory for
   * its placement. `tools` applies to tool-sidebar, `verticals` to
   * vertical-banner; `locales` narrows either.
   */
  tools?: string[];
  verticals?: string[];
  locales?: LocaleCode[];
  /** Flight window, ISO date (inclusive). Omit for open-ended. */
  starts?: string;
  ends?: string;
}

/**
 * Booked creatives. Empty = every slot shows the "available" placeholder,
 * which is the intended launch state.
 */
export const AD_CREATIVES: AdCreative[] = [];

/**
 * Public rate card. `null` renders "rates on request" on /advertise/ and
 * omits the price column entirely. Populate with real monthly rates to
 * publish pricing — the page picks it up with no further edits.
 */
export const AD_RATE_CARD: Record<AdPlacementId, string> | null = null;

export interface AdSlotContext {
  placement: AdPlacementId;
  locale: LocaleCode;
  /** Tool slug, for tool-sidebar. */
  tool?: string;
  /** Vertical slug, for vertical-banner. */
  vertical?: string;
  /** Today, ISO date. Injected so the caller controls the build-time clock. */
  today?: string;
}

function withinFlight(creative: AdCreative, today: string): boolean {
  if (creative.starts && today < creative.starts) return false;
  if (creative.ends && today > creative.ends) return false;
  return true;
}

/**
 * Pick the creative for a slot, or null when the slot is unsold.
 *
 * More specific beats less specific: a creative naming this exact tool or
 * vertical wins over a run-of-network one, so a targeted booking is never
 * crowded out by a broad one. Ties break on declaration order.
 */
export function resolveCreative(ctx: AdSlotContext): AdCreative | null {
  const today = ctx.today ?? new Date().toISOString().slice(0, 10);

  const eligible = AD_CREATIVES.filter((c) => {
    if (c.placement !== ctx.placement) return false;
    if (!withinFlight(c, today)) return false;
    if (c.locales?.length && !c.locales.includes(ctx.locale)) return false;
    if (c.tools?.length && (!ctx.tool || !c.tools.includes(ctx.tool))) return false;
    if (c.verticals?.length && (!ctx.vertical || !c.verticals.includes(ctx.vertical))) {
      return false;
    }
    return true;
  });

  if (eligible.length === 0) return null;

  const specificity = (c: AdCreative) =>
    (c.tools?.length ? 2 : 0) + (c.verticals?.length ? 2 : 0) + (c.locales?.length ? 1 : 0);

  return eligible.reduce((best, c) => (specificity(c) > specificity(best) ? c : best));
}
