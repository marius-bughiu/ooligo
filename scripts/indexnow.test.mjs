import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentRecord, selectBaseline, planChanges, assertProduction, verifyKey, submitUrls, notify, ENDPOINT, MAX_BATCH } from './indexnow.mjs';

const BASE = '1'.repeat(40), MID = '2'.repeat(40), HEAD = '3'.repeat(40);
const config = { version: 1, site: 'https://ooligo.com', branch: 'refs/heads/main', bootstrapSha: BASE, key: 'a'.repeat(32) };
const env = { GITHUB_ACTIONS: 'true', GITHUB_REF: config.branch, PUBLIC_SITE_URL: config.site, INDEXNOW_DEPLOY_SUCCESS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_SHA: HEAD };
const body = (slug = 'clay', locale = 'en', text = 'Useful source content.', extra = '') => `---\nslug: ${slug}\nlocale: ${locale}\n${extra}---\n${text}\n`;
const localeFile = JSON.stringify({ locales: ['en', 'es', 'pt-BR', 'ja', 'fr', 'de'].map(code => ({ code })) });
const fixture = (before = {}, after = {}, middle = before) => {
  const snapshots = { [BASE]: { 'content/locales.json': localeFile, ...before }, [MID]: { 'content/locales.json': localeFile, ...middle }, [HEAD]: { 'content/locales.json': localeFile, ...after } };
  return {
    head: () => HEAD,
    isAncestor: (a, b) => [BASE, MID, HEAD].includes(a) && [BASE, MID, HEAD].includes(b) && Number(a[0]) <= Number(b[0]),
    read: (ref, file) => snapshots[ref]?.[file] ?? null,
    files: (ref, prefix) => Object.keys(snapshots[ref]).filter(file => file.startsWith(prefix + '/')),
    changed: (a, b) => [...new Set([...Object.keys(snapshots[a]), ...Object.keys(snapshots[b])])].filter(file => snapshots[a][file] !== snapshots[b][file]),
  };
};
const plan = repo => planChanges({ base: BASE, head: HEAD, site: config.site, repo });
const receipt = (sha = MID) => ({ version: 1, site: config.site, branch: config.branch, sha, responseStatuses: [200] });
const response = (status = 200, headers = {}) => new Response('ok', { status, headers });
const keyResponse = () => new Response(config.key + '\n');
const noWait = async () => {};
const noLog = () => {};


test('canonical routes use frontmatter, comparisons map to vs and Brazilian locale preserves case', () => {
  const record = contentRecord('content/comparisons/pt-BR/file-name.mdx', body('clay-vs-apollo', 'pt-BR'), ['pt-BR'], config.site);
  assert.equal(record.url, 'https://ooligo.com/pt-BR/vs/clay-vs-apollo/');
});

test('unsupported locale, mismatched locale and malformed slug cannot produce submission URLs', () => {
  for (const [file, source] of [
    ['content/tools/ru/a.mdx', body('a', 'ru')],
    ['content/tools/en/a.mdx', body('a', 'es')],
    ['content/tools/en/a.mdx', body('../oops')],
  ]) assert.throws(() => contentRecord(file, source, ['en', 'es'], config.site), /Invalid canonical route/);
});

test('added, edited and deleted pages are submitted, unchanged pages are excluded', () => {
  const repo = fixture({
    'content/tools/en/clay.mdx': body(), 'content/learn/es/old.mdx': body('old', 'es'), 'content/tools/en/unchanged.mdx': body('unchanged'),
  }, {
    'content/tools/en/clay.mdx': body('clay', 'en', 'Updated evidence.'), 'content/workflows/fr/new.mdx': body('new', 'fr'), 'content/tools/en/unchanged.mdx': body('unchanged'),
  });
  assert.deepEqual(plan(repo).urls, ['https://ooligo.com/en/tools/clay/', 'https://ooligo.com/es/learn/old/', 'https://ooligo.com/fr/workflows/new/']);
});

test('slug changes notify both the removed and new canonical URLs', () => {
  const file = 'content/tools/en/entry.mdx';
  assert.deepEqual(plan(fixture({ [file]: body('old') }, { [file]: body('new') })).urls,
    ['https://ooligo.com/en/tools/new/', 'https://ooligo.com/en/tools/old/']);
});

test('file-only rename retaining the canonical URL and content does not notify', () => {
  assert.deepEqual(plan(fixture({ 'content/tools/en/old-name.mdx': body() }, { 'content/tools/en/new-name.mdx': body() })).urls, []);
});

test('frontmatter key order, trailing whitespace and maintenance dates alone do not notify', () => {
  const before = '---\nslug: clay\nlocale: en\npricing_checked: "2026-10-01"\n---\nUseful content.\n';
  const after = '---\r\nlocale: en\r\nslug: clay\r\npricing_checked: "2026-11-01"\r\nen_verified: "2026-11-01"\r\n---\r\nUseful content.   \r\n';
  assert.deepEqual(plan(fixture({ 'content/tools/en/clay.mdx': before }, { 'content/tools/en/clay.mdx': after })).urls, []);
});

test('rendered metadata and visible last_updated changes notify', () => {
  const file = 'content/learn/en/example.mdx';
  for (const extra of ['description: A new summary\n', 'last_updated: "2026-11-01"\n']) {
    assert.equal(plan(fixture({ [file]: body('example') }, { [file]: body('example', 'en', 'Useful source content.', extra) })).urls.length, 1);
  }
});

test('artifact updates notify existing localized workflow pages, not raw files', () => {
  const pages = { 'content/workflows/en/demo.mdx': body('demo'), 'content/workflows/es/demo.mdx': body('demo', 'es') };
  const file = 'apps/web/public/artifacts/demo/README.md';
  assert.deepEqual(plan(fixture({ ...pages, [file]: 'old' }, { ...pages, [file]: 'new' })).urls,
    ['https://ooligo.com/en/workflows/demo/', 'https://ooligo.com/es/workflows/demo/']);
});

test('artifact cache files are excluded', () => {
  const pages = { 'content/workflows/en/demo.mdx': body('demo') };
  assert.deepEqual(plan(fixture(pages, { ...pages, 'apps/web/public/artifacts/demo/__pycache__/pipeline.pyc': 'cache' })).urls, []);
});

test('shared template changes are reported without expanding the whole site', () => {
  const result = plan(fixture({}, { 'apps/web/src/layouts/BaseLayout.astro': 'new template' }));
  assert.deepEqual(result.urls, []);
  assert.deepEqual(result.skippedShared, ['apps/web/src/layouts/BaseLayout.astro']);
});

test('last accepted receipt spans cancelled/failed intervening deployments', () => {
  const repo = fixture({}, { 'content/tools/en/a.mdx': body('a'), 'content/tools/en/b.mdx': body('b') }, { 'content/tools/en/a.mdx': body('a') });
  const baseline = selectBaseline({ head: HEAD, config, receipt: receipt(BASE), repo });
  assert.equal(baseline.base, BASE);
  assert.equal(planChanges({ base: baseline.base, head: HEAD, site: config.site, repo }).urls.length, 2);
});

test('cache absent uses fixed integration baseline, not HEAD parent', () => {
  assert.equal(selectBaseline({ head: HEAD, config, repo: fixture() }).base, BASE);
});

test('foreign, invalid, failed and unreachable cached receipts fall back safely', () => {
  const repo = fixture();
  for (const bad of [{ ...receipt(), branch: 'refs/heads/topic' }, { ...receipt(), site: 'https://example.com' }, receipt('4'.repeat(40)), receipt('not-a-sha'), { ...receipt(), responseStatuses: [403] }]) {
    const result = selectBaseline({ head: HEAD, config, receipt: bad, repo });
    assert.equal(result.base, BASE); assert.equal(result.ignoredReceipt, true);
  }
  assert.throws(() => selectBaseline({ head: HEAD, config: { ...config, bootstrapSha: '4'.repeat(40) }, repo }), /reachable ancestor/);
});

test('only successfully published production main commits can submit', () => {
  assert.doesNotThrow(() => assertProduction(env, config, HEAD));
  for (const changed of [{ GITHUB_ACTIONS: 'false' }, { GITHUB_REF: 'refs/heads/topic' }, { INDEXNOW_DEPLOY_SUCCESS: 'false' }, { PUBLIC_SITE_URL: 'https://preview.pages.dev' }, { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_SHA: MID }]) {
    assert.throws(() => assertProduction({ ...env, ...changed }, config, HEAD), /successfully published/);
  }
});

test('production guard runs before any network request', async () => {
  let calls = 0;
  await assert.rejects(notify({ config, repo: fixture(), env: { ...env, INDEXNOW_DEPLOY_SUCCESS: 'false' }, fetchImpl: async () => { calls++; }, log: noLog }), /successfully published/);
  assert.equal(calls, 0);
});

test('key must be served verbatim at the live apex before any POST', async () => {
  const calls = [];
  await assert.rejects(submitUrls({ urls: ['https://ooligo.com/en/tools/clay/'], config, wait: noWait, log: noLog,
    fetchImpl: async (url, options) => { calls.push({ url, options }); return new Response('<html>not the key</html>'); } }), /key verification failed/);
  assert.equal(calls.length, 5); assert.ok(calls.every(call => !call.options.method));
  assert.ok(calls.every(call => call.options.redirect === 'error'));
});

test('transient key propagation failure is retried', async () => {
  let calls = 0;
  await verifyKey({ ...config, wait: noWait, fetchImpl: async () => ++calls === 1 ? response(404) : keyResponse() });
  assert.equal(calls, 2);
});

test('POST batches obey 10000 cap, deduplicate, and distinguish 202 from 200', async () => {
  const urls = Array.from({ length: MAX_BATCH + 1 }, (_, n) => `https://ooligo.com/en/tools/tool-${n}/`);
  const posts = [];
  const statuses = await submitUrls({ urls: [...urls, urls[0]], config, wait: noWait, log: noLog,
    fetchImpl: async (url, options) => {
      if (!options.method) return keyResponse();
      assert.equal(url, ENDPOINT); posts.push(JSON.parse(options.body));
      return response(posts.length === 1 ? 200 : 202);
    } });
  assert.deepEqual(posts.map(post => post.urlList.length), [10000, 1]);
  assert.deepEqual(statuses, [200, 202]);
  assert.ok(posts.every(post => post.host === 'ooligo.com' && post.keyLocation === `https://ooligo.com/${config.key}.txt`));
});

test('wrong host, fragments, queries and slashless URLs are refused before network', async () => {
  for (const url of ['https://www.ooligo.com/en/tools/clay/', 'https://ooligo.com/en/tools/clay/#x', 'https://ooligo.com/en/tools/clay/?x=1', 'https://ooligo.com/en/tools/clay']) {
    await assert.rejects(submitUrls({ urls: [url], config, fetchImpl: () => assert.fail('network should not run') }), /Noncanonical/);
  }
});

test('429 honors bounded Retry-After and retries; long delay defers', async () => {
  const waits = []; let posts = 0;
  await submitUrls({ urls: ['https://ooligo.com/en/tools/clay/'], config, log: noLog, wait: async ms => waits.push(ms), fetchImpl: async (_, options) => {
    if (!options.method) return keyResponse();
    return ++posts === 1 ? response(429, { 'retry-after': '7' }) : response(200);
  } });
  assert.deepEqual(waits, [7000]);
  await assert.rejects(submitUrls({ urls: ['https://ooligo.com/en/tools/clay/'], config, log: noLog, wait: () => assert.fail('must defer'),
    fetchImpl: async (_, options) => options.method ? response(429, { 'retry-after': '120' }) : keyResponse() }), /longer retry delay/);
});

test('4xx errors do not retry; 5xx errors exhaust a bounded retry budget', async () => {
  for (const status of [403, 422, 503]) {
    let posts = 0;
    await assert.rejects(submitUrls({ urls: ['https://ooligo.com/en/tools/clay/'], config, log: noLog, wait: noWait,
      fetchImpl: async (_, options) => { if (!options.method) return keyResponse(); posts++; return response(status); } }));
    assert.equal(posts, status === 503 ? 3 : 1);
  }
});

test('network failures retry at most three times and never return an accepted result', async () => {
  let posts = 0;
  await assert.rejects(submitUrls({ urls: ['https://ooligo.com/en/tools/clay/'], config, log: noLog, wait: noWait,
    fetchImpl: async (_, options) => {
      if (!options.method) return keyResponse();
      posts++; throw new TypeError('network unavailable');
    } }), /network failure after three attempts/);
  assert.equal(posts, 3);
});

test('Retry-After HTTP dates are honored rather than immediately retried', async () => {
  const later = new Date(Date.now() + 120000).toUTCString();
  await assert.rejects(submitUrls({ urls: ['https://ooligo.com/en/tools/clay/'], config, log: noLog, wait: () => assert.fail('must defer'),
    fetchImpl: async (_, options) => options.method ? response(429, { 'retry-after': later }) : keyResponse() }), /longer retry delay/);
});

test('partial batch failure cannot return a receipt', async () => {
  let posts = 0;
  await assert.rejects(submitUrls({ urls: ['https://ooligo.com/en/tools/a/', 'https://ooligo.com/en/tools/b/'], config, batchSize: 1, log: noLog, wait: noWait,
    fetchImpl: async (_, options) => { if (!options.method) return keyResponse(); return response(++posts === 1 ? 200 : 403); } }));
  assert.equal(posts, 2);
});

test('receipt advances only after all notifications accepted; 202 is marked pending validation', async () => {
  const repo = fixture({}, { 'content/tools/en/a.mdx': body('a') });
  const result = await notify({ config, repo, env, log: noLog, wait: noWait, fetchImpl: async (_, options) => options.method ? response(202) : keyResponse() });
  assert.equal(result.status, 'received-key-validation-pending');
  assert.equal(result.receipt.sha, HEAD); assert.deepEqual(result.receipt.responseStatuses, [202]);
  await assert.rejects(notify({ config, repo, env, log: noLog, wait: noWait, fetchImpl: async (_, options) => options.method ? response(403) : keyResponse() }));
});

test('no changes make no network calls and do not advance a receipt', async () => {
  const result = await notify({ config, repo: fixture(), env, log: noLog, fetchImpl: () => assert.fail('no network expected') });
  assert.equal(result.status, 'no-changed-urls'); assert.equal(result.receipt, null);
});

test('committed public key matches configured verification filename and content', () => {
  const actual = JSON.parse(readFileSync(new URL('./indexnow.config.json', import.meta.url), 'utf8'));
  assert.match(actual.key, /^[a-f0-9]{32}$/);
  assert.equal(readFileSync(new URL(`../apps/web/public/${actual.key}.txt`, import.meta.url), 'utf8').trim(), actual.key);
});
