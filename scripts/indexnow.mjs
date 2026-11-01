/** Notify IndexNow after production publication; never reads generated site output. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';

export const ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_BATCH = 10000;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COLLECTION_ROUTES = { tools: 'tools', comparisons: 'vs', workflows: 'workflows', learn: 'learn', stacks: 'stacks' };
const MAINTENANCE_FIELDS = new Set(['en_verified', 'pricing_checked', 'material_change_at', 'translated_from', 'translated_at', 'translation_model', 'source_sha256']);
const SHA = /^[0-9a-f]{40}$/;
const textSignature = text => text.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function sorted(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
  return value;
}

export function contentRecord(file, text, locales, site) {
  const match = /^content\/(tools|comparisons|workflows|learn|stacks)\/([^/]+)\/[^/]+\.mdx$/.exec(file);
  if (!match || text == null) return null;
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!frontmatter) throw new Error(`Missing frontmatter: ${file}`);
  const data = matter(text).data;
  if (!data || typeof data !== 'object' || typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug) || data.locale !== match[2] || !locales.includes(data.locale)) {
    throw new Error(`Invalid canonical route in ${file}`);
  }
  const renderedData = Object.fromEntries(Object.entries(data).filter(([key]) => !MAINTENANCE_FIELDS.has(key)));
  return {
    url: `${site}/${data.locale}/${COLLECTION_ROUTES[match[1]]}/${data.slug}/`,
    signature: JSON.stringify(sorted(renderedData)) + '\n' + textSignature(text.slice(frontmatter[0].length)),
  };
}

export function gitAdapter(cwd = ROOT) {
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
  return {
    head: () => git(['rev-parse', 'HEAD']).trim(),
    isAncestor: (base, head) => {
      if (!SHA.test(base) || !SHA.test(head)) return false;
      try { git(['merge-base', '--is-ancestor', base, head]); return true; } catch { return false; }
    },
    read: (ref, file) => {
      try { return git(['show', `${ref}:${file}`]); } catch { return null; }
    },
    files: (ref, prefix) => git(['ls-tree', '-r', '--name-only', ref, '--', prefix]).trim().split('\n').filter(Boolean),
    changed: (base, head) => git(['diff', '--name-only', '-z', '--no-renames', base, head, '--']).split('\0').filter(Boolean),
  };
}

export function selectBaseline({ head, config, receipt, repo }) {
  if (!SHA.test(head) || !repo.isAncestor(config.bootstrapSha, head)) throw new Error('Bootstrap SHA is not a reachable ancestor; refusing an unbounded submission');
  const validReceipt = receipt && receipt.version === config.version && receipt.site === config.site && receipt.branch === config.branch &&
    SHA.test(receipt.sha ?? '') && Array.isArray(receipt.responseStatuses) && receipt.responseStatuses.length > 0 &&
    receipt.responseStatuses.every(status => status === 200 || status === 202) &&
    repo.isAncestor(config.bootstrapSha, receipt.sha) && repo.isAncestor(receipt.sha, head);
  return { base: validReceipt ? receipt.sha : config.bootstrapSha, source: validReceipt ? 'accepted-receipt' : 'bootstrap', ignoredReceipt: Boolean(receipt && !validReceipt) };
}

export function planChanges({ base, head, site, repo }) {
  const beforeLocales = JSON.parse(repo.read(base, 'content/locales.json') ?? '{"locales":[]}').locales.map(locale => locale.code);
  const afterLocales = JSON.parse(repo.read(head, 'content/locales.json') ?? '{"locales":[]}').locales.map(locale => locale.code);
  const before = new Map(), after = new Map(), artifactSlugs = new Set(), skippedShared = [];
  const changed = repo.changed(base, head);
  for (const file of changed) {
    const oldText = repo.read(base, file), newText = repo.read(head, file);
    const oldEntry = contentRecord(file, oldText, beforeLocales, site), newEntry = contentRecord(file, newText, afterLocales, site);
    if (oldEntry) before.set(oldEntry.url, oldEntry.signature);
    if (newEntry) after.set(newEntry.url, newEntry.signature);
    const artifact = /^apps\/web\/public\/artifacts\/([a-z0-9-]+)\/(.+)$/.exec(file);
    if (artifact && !/(?:^|\/)(?:__pycache__|node_modules|\.git|\.venv|__MACOSX)(?:\/|$)|\.(?:pyc|pyo|swp|swo)$|(?:^|\/)(?:\.DS_Store|Thumbs\.db)$/.test(artifact[2]) && textSignature(oldText ?? '') !== textSignature(newText ?? '')) {
      artifactSlugs.add(artifact[1]);
    }
    if (/^apps\/web\/src\/|^apps\/web\/astro\.config|^content\/(?:locales|verticals)\.json$|^apps\/web\/public\/_redirects$/.test(file)) skippedShared.push(file);
  }
  const urls = new Set([...new Set([...before.keys(), ...after.keys()])].filter(url => before.get(url) !== after.get(url)));
  // Artifact source is embedded in workflow pages; notify their existing localized routes.
  if (artifactSlugs.size) for (const [ref, locales] of [[base, beforeLocales], [head, afterLocales]]) {
    for (const file of repo.files(ref, 'content/workflows')) {
      const slug = /\/([^/]+)\.mdx$/.exec(file)?.[1];
      if (!artifactSlugs.has(slug)) continue;
      const entry = contentRecord(file, repo.read(ref, file), locales, site);
      if (entry) urls.add(entry.url);
    }
  }
  return { urls: [...urls].sort(), changedFiles: changed.length, skippedShared, artifactSlugs: [...artifactSlugs].sort() };
}

export function assertProduction(env, config, head) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REF !== config.branch || env.PUBLIC_SITE_URL !== config.site ||
      env.INDEXNOW_DEPLOY_SUCCESS !== 'true' || !['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) || env.GITHUB_SHA !== head) {
    throw new Error('IndexNow submit requires the successfully published main production commit in GitHub Actions');
  }
}

function checkConfig(config) {
  if (config.version !== 1 || config.site !== 'https://ooligo.com' || config.branch !== 'refs/heads/main' ||
      !SHA.test(config.bootstrapSha ?? '') || !/^[a-f0-9]{32}$/.test(config.key ?? '')) throw new Error('Invalid IndexNow configuration');
}

export async function verifyKey({ site, key, fetchImpl = fetch, wait = sleep, attempts = 5 }) {
  const url = `${site}/${key}.txt`;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Cache-Control': 'no-cache' } });
      if (response.status === 200 && (await response.text()).trim() === key) return;
    } catch { /* A newly published edge can be temporarily unavailable. */ }
    if (attempt < attempts) await wait(5000);
  }
  throw new Error('Live production key verification failed; no IndexNow URLs submitted');
}

export async function submitUrls({ urls, config, fetchImpl = fetch, wait = sleep, log = console.log, batchSize = MAX_BATCH }) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH) throw new Error('Invalid IndexNow batch size');
  const list = [...new Set(urls)].sort();
  for (const url of list) {
    const parsed = new URL(url);
    if (parsed.origin !== config.site || parsed.search || parsed.hash || !parsed.pathname.endsWith('/')) throw new Error('Noncanonical or wrong-host URL in notification plan');
  }
  if (!list.length) return [];
  await verifyKey({ site: config.site, key: config.key, fetchImpl, wait });
  const statuses = [];
  for (let offset = 0; offset < list.length; offset += batchSize) {
    const urlList = list.slice(offset, offset + batchSize);
    const body = JSON.stringify({ host: new URL(config.site).host, key: config.key, keyLocation: `${config.site}/${config.key}.txt`, urlList });
    let status;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetchImpl(ENDPOINT, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
        status = response.status;
        if (status === 200 || status === 202) break;
        if (status !== 429 && status < 500) throw new Error(`IndexNow rejected batch with HTTP ${status}`);
        if (attempt === 3) throw new Error(`IndexNow retry limit reached (HTTP ${status})`);
        const retryAfter = response.headers.get('retry-after');
        const retryDate = retryAfter ? Date.parse(retryAfter) : NaN;
        const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter)
          : Number.isFinite(retryDate) ? Math.max(0, Math.ceil((retryDate - Date.now()) / 1000)) : 5 * attempt;
        // Do not shorten a server-specified long pause: defer to a later workflow instead.
        if (seconds > 60) throw new Error(`IndexNow requests a longer retry delay (HTTP ${status}); receipt remains unchanged`);
        await wait(Math.max(1, seconds) * 1000);
      } catch (error) {
        if (error.message?.startsWith('IndexNow ')) throw error;
        if (attempt === 3) throw new Error('IndexNow network failure after three attempts');
        await wait(5000 * attempt);
      }
    }
    statuses.push(status);
    log(`IndexNow: batch ${statuses.length}, ${urlList.length} URLs, HTTP ${status}${status === 202 ? ' (received; key validation pending)' : ' (received)'}`);
  }
  return statuses;
}

export async function notify({ config, receipt, repo, env, fetchImpl = fetch, wait = sleep, log = console.log, onPlan = () => {} }) {
  checkConfig(config);
  const head = repo.head();
  assertProduction(env, config, head);
  const baseline = selectBaseline({ head, config, receipt, repo });
  if (baseline.ignoredReceipt) log('IndexNow: cached receipt invalid/unreachable; using the fixed bootstrap baseline');
  const plan = planChanges({ base: baseline.base, head, site: config.site, repo });
  onPlan(plan);
  log(`IndexNow: ${plan.urls.length} changed canonical URLs; baseline ${baseline.source} ${baseline.base.slice(0, 8)}`);
  if (plan.skippedShared.length) log(`IndexNow: ${plan.skippedShared.length} shared/template/config changes not expanded into site-wide notifications; sitemap discovery remains available`);
  if (!plan.urls.length) return { status: 'no-changed-urls', urlCount: 0, receipt: null };
  const responseStatuses = await submitUrls({ urls: plan.urls, config, fetchImpl, wait, log });
  return {
    status: responseStatuses.includes(202) ? 'received-key-validation-pending' : 'received',
    urlCount: plan.urls.length,
    receipt: { version: config.version, site: config.site, branch: config.branch, sha: head, responseStatuses, urlCount: plan.urls.length, receivedAt: new Date().toISOString() },
  };
}

function outputs(env, data) {
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, Object.entries(data).map(([key, value]) => `${key}=${value}\n`).join(''));
}

async function main() {
  const config = JSON.parse(readFileSync(resolve(ROOT, 'scripts/indexnow.config.json'), 'utf8'));
  checkConfig(config);
  const statePath = resolve(ROOT, '.cache/indexnow/receipt.json');
  let receipt;
  try { receipt = JSON.parse(readFileSync(statePath, 'utf8')); } catch { /* No usable receipt: fixed bootstrap, not the preceding commit. */ }
  const repo = gitAdapter();
  if (process.argv[2] === 'plan') {
    const baseline = selectBaseline({ head: repo.head(), config, receipt, repo });
    console.log(JSON.stringify({ ...baseline, ...planChanges({ base: baseline.base, head: repo.head(), site: config.site, repo }) }, null, 2));
    return;
  }
  if (process.argv[2] !== 'submit') throw new Error('Usage: node scripts/indexnow.mjs plan|submit');
  outputs(process.env, { receipt_ready: false, status: 'failed', url_count: 'unknown' });
  const result = await notify({ config, receipt, repo, env: process.env,
    onPlan: plan => outputs(process.env, { url_count: plan.urls.length }),
  });
  if (result.receipt) {
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify(result.receipt, null, 2) + '\n');
  }
  outputs(process.env, { receipt_ready: Boolean(result.receipt), status: result.status, url_count: result.urlCount });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(`IndexNow notification failed: ${error.message}`);
    process.exitCode = 1;
  });
}
