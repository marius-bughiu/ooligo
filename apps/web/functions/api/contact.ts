/// <reference types="@cloudflare/workers-types" />
/**
 * Contact form delivery.
 *
 * The site is statically built; this Cloudflare Pages Function is the
 * only path that touches the owner's inbox, and it exists so the owner
 * email and any delivery credentials never reach the client. Wired to
 * the /[locale]/contact/ form on every locale.
 *
 * Delivery path: Resend (https://resend.com) HTTP API. The Resend API
 * key, sender, and recipient are read from env. If RESEND_API_KEY is
 * absent the function returns 500 so the form's `error` branch fires.
 *
 * Env (Cloudflare Pages → Settings → Environment variables, encrypted):
 *   RESEND_API_KEY        re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   CONTACT_FROM_EMAIL    "ooligo contact <contact@ooligo.com>"
 *   CONTACT_TO_EMAIL      "owner-inbox@example.com"
 */

interface Env {
  RESEND_API_KEY: string;
  CONTACT_FROM_EMAIL: string;
  CONTACT_TO_EMAIL: string;
}

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

type ErrorCode =
  | "invalid_email"
  | "rate_limited"
  | "server_error"
  | "bad_request";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function fail(error: ErrorCode, status: number): Response {
  return json({ ok: false, error }, status);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL || !env.CONTACT_TO_EMAIL) {
    console.error(
      "contact: missing RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL env binding",
    );
    return fail("server_error", 500);
  }

  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return fail("bad_request", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL) {
    return fail("invalid_email", 400);
  }
  if (!name || name.length > MAX_NAME) {
    return fail("bad_request", 400);
  }
  if (!message || message.length > MAX_MESSAGE) {
    return fail("bad_request", 400);
  }

  const referrer = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("cf-connecting-ip") ?? "";

  const subject = `[ooligo contact] ${name}`;
  const plain =
    `From: ${name} <${email}>\n` +
    `Referrer: ${referrer}\n` +
    `User-Agent: ${userAgent}\n` +
    `IP: ${ip}\n\n` +
    message;
  const html =
    `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
    `<p><strong>Referrer:</strong> ${escapeHtml(referrer)}</p>` +
    `<p><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</p>` +
    `<p><strong>IP:</strong> ${escapeHtml(ip)}</p>` +
    `<hr/>` +
    `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(message)}</pre>`;

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      reply_to: email,
      subject,
      text: plain,
      html,
    }),
  });

  if (upstream.ok) {
    return json({ ok: true });
  }

  if (upstream.status === 429) {
    return fail("rate_limited", 429);
  }

  const upstreamBody = await upstream.text().catch(() => "<unreadable>");
  console.error(
    `contact: resend ${upstream.status} ${upstream.statusText}: ${upstreamBody}`,
  );
  return fail("server_error", 502);
};
