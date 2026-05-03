/// <reference types="@cloudflare/workers-types" />
/**
 * Newsletter signup proxy → beehiiv.
 *
 * The site is statically built; this Cloudflare Pages Function is the only
 * server-side surface and exists so the beehiiv API key never reaches the
 * client. Wired to the footer form (every page) and the per-vertical
 * landing-page forms; the body's `vertical` field becomes both a UTM
 * campaign tag and a `vertical` custom field on the beehiiv subscriber so
 * future locale/vertical-native sends can segment.
 *
 * Env (Cloudflare Pages → Settings → Environment variables, encrypted):
 *   BEEHIIV_PUBLICATION_ID  pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   BEEHIIV_API_KEY         opaque bearer token
 */

interface Env {
  BEEHIIV_PUBLICATION_ID: string;
  BEEHIIV_API_KEY: string;
}

type SubscribeBody = {
  email?: unknown;
  vertical?: unknown;
  source?: unknown;
};

type ErrorCode =
  | "invalid_email"
  | "rate_limited"
  | "server_error"
  | "bad_request";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SOURCES = new Set(["footer", "vertical_page"]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function fail(error: ErrorCode, status: number): Response {
  return json({ ok: false, error }, status);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.BEEHIIV_PUBLICATION_ID || !env.BEEHIIV_API_KEY) {
    console.error("subscribe: missing BEEHIIV_PUBLICATION_ID or BEEHIIV_API_KEY env binding");
    return fail("server_error", 500);
  }

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return fail("bad_request", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return fail("invalid_email", 400);
  }

  const verticalRaw = typeof body.vertical === "string" ? body.vertical.trim() : "";
  const vertical = /^[a-z0-9-]{1,32}$/.test(verticalRaw) ? verticalRaw : "global";

  const sourceRaw = typeof body.source === "string" ? body.source : "";
  const source = ALLOWED_SOURCES.has(sourceRaw) ? sourceRaw : "footer";

  const referrer = request.headers.get("origin") ?? request.headers.get("referer") ?? "";

  const upstream = await fetch(
    `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: "ooligo",
        utm_medium: source,
        utm_campaign: vertical,
        referring_site: referrer,
        custom_fields: [{ name: "vertical", value: vertical }],
      }),
    },
  );

  if (upstream.ok) {
    return json({ ok: true });
  }

  if (upstream.status === 400) {
    return fail("invalid_email", 400);
  }
  if (upstream.status === 429) {
    return fail("rate_limited", 429);
  }

  const upstreamBody = await upstream.text().catch(() => "<unreadable>");
  console.error(`subscribe: beehiiv ${upstream.status} ${upstream.statusText}: ${upstreamBody}`);
  return fail("server_error", 502);
};
