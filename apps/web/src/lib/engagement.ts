const PRODUCTION_ORIGIN = "https://ooligo.com";
const LOCALES = ["en", "es", "pt-BR", "de", "fr", "ja"];
const ARTIFACT_TYPES = ["prompt", "claude-skill", "mcp-server", "n8n-flow", "cursor-rule", "agent-template", "sop"];
const PLACEMENTS = ["home_hero", "home_example", "sample", "artifact_browser"];
const SAMPLE_WORKFLOW = "lead-enrichment-clay-claude";
const SAMPLE_COMMAND = "python3 pipeline.py demo";
type Details = Record<string, unknown>;
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    ooligoTrack?: (name: string, details: Details) => boolean;
  }
}

/** Only controlled identifiers and choices are sent; never DOM text, emails or hrefs. */
export function engagementPayload(name: string, input: Details): Record<string, string> | undefined {
  const locale = typeof input.locale === "string" && LOCALES.includes(input.locale) ? input.locale : undefined;
  if (!locale) return undefined;
  if (name === "newsletter_signup") {
    return {
      locale,
      signup_source: input.signup_source === "vertical_page" ? "vertical_page" : "footer",
      vertical: typeof input.vertical === "string" && ["revops", "legal-ops", "recruiting", "customer-success"].includes(input.vertical) ? input.vertical : "global",
    };
  }
  const slug = typeof input.workflow_slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.workflow_slug) && input.workflow_slug.length <= 100 ? input.workflow_slug : undefined;
  if (!slug) return undefined;
  const common = { workflow_slug: slug, locale };
  const placement = typeof input.placement === "string" && PLACEMENTS.includes(input.placement) ? input.placement : undefined;
  if (name === "workflow_cta_click" && slug === SAMPLE_WORKFLOW && ["home_hero", "home_example"].includes(placement ?? "")) {
    return { ...common, placement: placement! };
  }
  if (name === "sample_command_copy" && slug === SAMPLE_WORKFLOW) return { ...common, placement: "sample" };
  if (name === "sample_feedback" && slug === SAMPLE_WORKFLOW && ["worked", "got_stuck"].includes(String(input.response))) {
    return { ...common, response: String(input.response), placement: "sample" };
  }
  if (name === "artifact_copy" || name === "artifact_download_click") {
    const artifactType = typeof input.artifact_type === "string" && ARTIFACT_TYPES.includes(input.artifact_type) ? input.artifact_type : "unknown";
    const payload = { ...common, artifact_type: artifactType, placement: placement ?? "artifact_browser" };
    if (name === "artifact_copy") return payload;
    if (input.download_kind === "bundle" || input.download_kind === "file") return { ...payload, download_kind: input.download_kind };
  }
  return undefined;
}

export function sendEngagement(origin: string, gtag: Gtag | undefined, name: string, input: Details): boolean {
  if (origin !== PRODUCTION_ORIGIN || typeof gtag !== "function") return false;
  const payload = engagementPayload(name, input);
  if (!payload) return false;
  try {
    gtag("event", name, payload);
    return true;
  } catch {
    return false;
  }
}

export function analyticsConfig(href: string): Record<string, unknown> | undefined {
  const url = new URL(href);
  if (url.origin !== PRODUCTION_ORIGIN) return undefined;
  const debug = url.searchParams.get("analytics_debug") === "1";
  url.searchParams.delete("analytics_debug");
  url.hash = "";
  // Preserve campaign parameters and attribution IDs; only our testing flag is removed.
  return { page_location: url.href, ...(debug ? { debug_mode: true } : {}) };
}

/** Called only by a production build. The host guard also excludes local build previews. */
export function initializeAnalytics(win: Window, doc: Document): void {
  const config = analyticsConfig(win.location.href);
  if (!config) return;
  try {
    win.dataLayer = win.dataLayer || [];
    win.gtag = win.gtag || function () { win.dataLayer!.push(arguments); };
    win.ooligoTrack = (name, input) => sendEngagement(win.location.origin, win.gtag, name, input);
    win.gtag("js", new Date());
    win.gtag("config", "G-W6BZJ1Q021", config);
    const script = doc.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-W6BZJ1Q021";
    doc.head.appendChild(script);
  } catch {
    // Analytics blocking must not affect copy, downloads, forms or feedback controls.
  }
}

/** A copy is counted only after the clipboard promise resolves. */
export async function copySampleCommand(clipboard: Pick<Clipboard, "writeText"> | undefined, onCopied: () => void): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(SAMPLE_COMMAND);
  } catch {
    return false;
  }
  // The callback is analytics, so a blocked sender cannot turn a successful copy into failure.
  try { onCopied(); } catch { /* optional analytics */ }
  return true;
}

export function installEngagementControls(doc: Document, win: Window): void {
  if (doc.documentElement.dataset.ooligoEngagementBound) return;
  doc.documentElement.dataset.ooligoEngagementBound = "true";
  const track = (name: string, input: Details) => {
    try { win.ooligoTrack?.(name, { ...input, locale: doc.documentElement.lang }); } catch { /* optional analytics */ }
  };
  doc.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest<HTMLElement>("[data-ooligo-event], [data-ooligo-copy], [data-ooligo-feedback]");
    if (!control) return;
    const data = control.dataset;
    const details = { workflow_slug: data.workflowSlug, placement: data.placement, artifact_type: data.artifactType, download_kind: data.downloadKind };

    if (data.ooligoCopy === SAMPLE_COMMAND && control instanceof HTMLButtonElement) {
      if (control.disabled || data.workflowSlug !== SAMPLE_WORKFLOW) return;
      control.disabled = true;
      const copied = await copySampleCommand(win.navigator.clipboard, () => track("sample_command_copy", details));
      const status = control.parentElement?.querySelector<HTMLElement>("[data-copy-status]");
      if (status) status.textContent = (copied ? data.copySuccess : data.copyError) ?? "";
      control.disabled = false;
      return;
    }

    if (data.ooligoFeedback && control instanceof HTMLButtonElement) {
      const group = control.closest<HTMLElement>("[data-sample-feedback]");
      if (!group || group.dataset.answered || data.workflowSlug !== SAMPLE_WORKFLOW) return;
      if (!["worked", "got_stuck"].includes(data.ooligoFeedback)) return;
      group.dataset.answered = "true";
      group.querySelectorAll<HTMLButtonElement>("[data-ooligo-feedback]").forEach(button => {
        button.disabled = true;
        button.setAttribute("aria-pressed", String(button === control));
      });
      const status = group.querySelector<HTMLElement>("[data-feedback-status]");
      if (status) status.textContent = data.feedbackResponse ?? "";
      track("sample_feedback", { ...details, response: data.ooligoFeedback });
      return;
    }

    if (data.ooligoEvent) track(data.ooligoEvent, details);
  });
}
