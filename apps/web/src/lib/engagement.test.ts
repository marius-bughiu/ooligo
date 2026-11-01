import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { analyticsConfig, copySampleCommand, engagementPayload, initializeAnalytics, sendEngagement } from "./engagement";

const origin = "https://ooligo.com";
const workflow = { workflow_slug: "lead-enrichment-clay-claude", locale: "ja", placement: "sample" };

test("analytics never initializes on local builds, preview domains or another origin", () => {
  for (const href of ["http://localhost:4321/en/", "https://ooligo.pages.dev/en/", "https://www.ooligo.com/en/", "http://ooligo.com/en/"]) {
    const browser = { location: new URL(href) } as unknown as Window;
    initializeAnalytics(browser, { createElement: () => assert.fail("must not load analytics") } as unknown as Document);
    assert.equal(browser.gtag, undefined);
    assert.equal(browser.dataLayer, undefined);
  }
});

test("debug mode is opt-in and page-only; attribution survives removing the debug flag", () => {
  const config = analyticsConfig(`${origin}/en/?utm_source=newsletter&utm_medium=email&utm_campaign=demo&gclid=test-click&analytics_debug=1#run-example`)!;
  const page = new URL(String(config.page_location));
  assert.equal(config.debug_mode, true);
  assert.equal(page.searchParams.get("utm_source"), "newsletter");
  assert.equal(page.searchParams.get("utm_medium"), "email");
  assert.equal(page.searchParams.get("utm_campaign"), "demo");
  assert.equal(page.searchParams.get("gclid"), "test-click");
  assert.equal(page.searchParams.has("analytics_debug"), false);
  assert.equal(page.hash, "");
  for (const suffix of ["", "?analytics_debug=0", "?analytics_debug=true"]) {
    assert.equal("debug_mode" in analyticsConfig(`${origin}/en/${suffix}`)!, false);
  }
});

test("production bootstrap exposes gtag and the event sender outside its module scope", () => {
  const scripts: { src: string; async: boolean }[] = [];
  const browser = { location: new URL(`${origin}/en/?analytics_debug=1`) } as unknown as Window;
  const doc = { createElement: () => ({}), head: { appendChild: (script: { src: string; async: boolean }) => scripts.push(script) } } as unknown as Document;
  initializeAnalytics(browser, doc);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0]?.src, "https://www.googletagmanager.com/gtag/js?id=G-W6BZJ1Q021");
  assert.equal(scripts[0]?.async, true);
  const queued = browser.dataLayer!.map(args => Array.from(args as ArrayLike<unknown>));
  assert.equal(queued[0]?.[0], "js");
  assert.deepEqual(queued[1], ["config", "G-W6BZJ1Q021", { page_location: `${origin}/en/`, debug_mode: true }]);
  assert.equal(browser.ooligoTrack?.("sample_feedback", { ...workflow, response: "worked" }), true);
  assert.equal(browser.dataLayer!.length, 3);
});

test("custom payloads accept controlled choices and discard private or arbitrary fields", () => {
  const payload = engagementPayload("sample_feedback", { ...workflow, response: "got_stuck", email: "private@example.com", href: "https://example.com/?token=secret", free_text: "private message" });
  assert.deepEqual(payload, { ...workflow, response: "got_stuck" });
  assert.equal(engagementPayload("sample_completed", workflow), undefined);
  assert.equal(engagementPayload("sample_feedback", { ...workflow, response: "private message" }), undefined);
  assert.equal(engagementPayload("artifact_copy", { ...workflow, workflow_slug: "user@example.com" }), undefined);
  assert.equal(engagementPayload("artifact_copy", { ...workflow, locale: "secret" }), undefined);
  assert.equal(engagementPayload("artifact_download_click", { ...workflow, download_kind: "completed" }), undefined);
});

test("analytics absence, nonproduction hosts and exceptions fail harmlessly", () => {
  const input = { ...workflow, response: "worked" };
  assert.equal(sendEngagement(origin, undefined, "sample_feedback", input), false);
  assert.equal(sendEngagement("http://localhost:4321", () => assert.fail("no local event"), "sample_feedback", input), false);
  assert.equal(sendEngagement(origin, () => { throw new Error("blocked"); }, "sample_feedback", input), false);
});

test("command-copy success waits for the clipboard; failures never count", async () => {
  let resolveCopy: () => void = () => {};
  let events = 0;
  const pending = copySampleCommand({ writeText: text => {
    assert.equal(text, "python3 pipeline.py demo");
    return new Promise<void>(resolve => { resolveCopy = resolve; });
  } }, () => { events++; });
  assert.equal(events, 0);
  resolveCopy();
  assert.equal(await pending, true);
  assert.equal(events, 1);
  assert.equal(await copySampleCommand({ writeText: async () => { throw new Error("denied"); } }, () => { events++; }), false);
  assert.equal(await copySampleCommand(undefined, () => { events++; }), false);
  assert.equal(events, 1);
  assert.equal(await copySampleCommand({ writeText: async () => {} }, () => { throw new Error("analytics blocked"); }), true);
});

const footerSource = readFileSync(new URL("../components/Footer.astro", import.meta.url), "utf8").match(/<script is:inline>([\s\S]*?)<\/script>/)![1]!;

test("actual newsletter handler counts only an accepted response and keeps success when analytics throws", async () => {
  for (const [httpOk, jsonOk, throwAnalytics] of [[false, true, false], [true, false, false], [true, true, false], [true, true, true]]) {
    const events: unknown[][] = [];
    let listener: (event: { preventDefault: () => void }) => Promise<void> = async () => {};
    const button = { disabled: false, textContent: "Subscribe", getAttribute: () => "Subscribe" };
    const status = { hidden: true, textContent: "", classList: { remove() {}, add() {} }, getAttribute: (name: string) => name === "data-msg-success" ? "Subscribed" : "Failed" };
    class Form {
      hidden = false;
      dataset = { source: "footer", vertical: "global" };
      action = "/api/subscribe";
      parentElement = { querySelector: () => status };
      querySelector() { return button; }
      addEventListener(_name: string, handler: typeof listener) { listener = handler; }
    }
    const form = new Form();
    vm.runInNewContext(footerSource, {
      document: { querySelectorAll: () => [form], documentElement: { lang: "en" } }, HTMLFormElement: Form,
      FormData: class { get() { return "private@example.com"; } },
      fetch: async () => ({ ok: httpOk, json: async () => ({ ok: jsonOk }) }),
      window: { ooligoTrack: (...args: unknown[]) => { if (throwAnalytics) throw new Error("blocked"); events.push(args); } },
    });
    await listener({ preventDefault() {} });
    assert.equal(form.hidden, Boolean(httpOk && jsonOk));
    assert.equal(events.length, httpOk && jsonOk && !throwAnalytics ? 1 : 0);
    assert.equal(JSON.stringify(events).includes("private@example.com"), false);
    assert.equal(button.disabled, false);
    if (httpOk && jsonOk) assert.equal(status.textContent, "Subscribed");
  }
});

const artifactSource = readFileSync(new URL("../components/ArtifactBrowser.astro", import.meta.url), "utf8").match(/<script is:inline define:vars=\{\{ id, artifactSlug, artifactType, locale \}\}>([\s\S]*?)<\/script>/)![1]!;

test("actual artifact handlers distinguish download clicks from successful clipboard writes", async () => {
  for (const allowed of [true, false]) {
    const events: unknown[][] = [];
    let copy: () => Promise<void> = async () => {};
    let download = () => {};
    const button = { addEventListener: (_name: string, fn: () => Promise<void>) => { copy = fn; }, getAttribute: () => "0", hasAttribute: () => true, setAttribute() {} };
    const link = { addEventListener: (_name: string, fn: () => void) => { download = fn; }, getAttribute: () => "/artifacts/demo.zip", hasAttribute: () => false };
    const root = {
      querySelectorAll: (selector: string) => selector === ".ab-copy" ? [button] : selector.startsWith("a[download]") ? [link] : [],
      querySelector: () => ({ textContent: "private artifact contents" }),
    };
    vm.runInNewContext(artifactSource, {
      id: "demo", artifactSlug: "demo", artifactType: "prompt", locale: "en", document: { querySelector: () => root },
      navigator: { clipboard: { writeText: async () => { if (!allowed) throw new Error("blocked"); } } },
      window: { ooligoTrack: (...args: unknown[]) => events.push(args) }, setTimeout() {},
    });
    download();
    await (copy as (event: { stopPropagation: () => void }) => Promise<void>)({ stopPropagation() {} });
    assert.equal(events[0]?.[0], "artifact_download_click");
    assert.equal(events.length, allowed ? 2 : 1);
    if (allowed) assert.equal(events[1]?.[0], "artifact_copy");
    assert.equal(JSON.stringify(events).includes("private artifact contents"), false);
  }
});
