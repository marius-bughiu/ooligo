import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkRedirects, redirectRules, renderRedirects } from './legacy-redirects.mjs';

const routes = new Set(['/en/', '/en/vs/clay-vs-apollo/', '/fr/tools/gong/', '/en/tools/clay/']);

test('historical aliases resolve both slash forms directly to canonical destinations', () => {
  const rules = redirectRules({ '/en/comparisons/clay-vs-apollo': '/en/vs/clay-vs-apollo/', '/fr/tools/gong.': '/fr/tools/gong/' }, routes);
  assert.deepEqual(rules[0], { source: '/', destination: '/en/', status: 302 });
  assert.deepEqual(rules.slice(1), [
    { source: '/en/comparisons/clay-vs-apollo', destination: '/en/vs/clay-vs-apollo/', status: 301 },
    { source: '/en/comparisons/clay-vs-apollo/', destination: '/en/vs/clay-vs-apollo/', status: 301 },
    { source: '/fr/tools/gong.', destination: '/fr/tools/gong/', status: 301 },
    { source: '/fr/tools/gong./', destination: '/fr/tools/gong/', status: 301 },
  ]);
  assert.ok(!rules.some(rule => rule.source === '/en/comparisons/unknown/'));
});

test('reject missing destinations and attempts to replace a current canonical page', () => {
  assert.throws(() => redirectRules({ '/old': '/en/tools/missing/' }, routes), /existing canonical/);
  assert.throws(() => redirectRules({ '/en/tools/clay': '/en/' }, routes), /existing page/);
  assert.throws(() => redirectRules({ '/old': '/en/tools/clay' }, routes), /existing canonical/);
});

test('reject wildcard, external, query and traversal rules', () => {
  for (const source of ['/tools/*', '/:locale/tools/clay', '//evil.example/path', '/old?x=1', '/old#fragment', '/a/../old', '/old/']) {
    assert.throws(() => redirectRules({ [source]: '/en/' }, routes), /exact path/);
  }
  assert.throws(() => redirectRules({ '/old': 'https://evil.example/' }, routes), /existing canonical/);
});

test('reject self redirects and chains even when the route set is inconsistent', () => {
  assert.throws(() => redirectRules({ '/old': '/old/' }, new Set(['/old/', '/en/'])), /existing page/);
  assert.throws(() => redirectRules({ '/old': '/en/', '/en': '/en/tools/clay/' }, routes), /existing page/);
});

test('honor the Cloudflare static-rule ceiling', () => {
  const aliases = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => ['/old-' + i, '/en/']));
  assert.throws(() => redirectRules(aliases, routes), /2000 static/);
});

test('output is deterministic and keeps root language behavior separate', () => {
  const aliases = { '/z': '/en/', '/a': '/en/tools/clay/' };
  assert.equal(renderRedirects(redirectRules(aliases, routes)), renderRedirects(redirectRules({ '/a': aliases['/a'], '/z': aliases['/z'] }, routes)));
  assert.match(renderRedirects(redirectRules(aliases, routes)), /^\/ \/en\/ 302$/m);
});

test('committed aliases and generated rules remain valid against the actual source catalog', () => {
  const result = checkRedirects();
  assert.ok(result.aliases > 0);
  const aliases = JSON.parse(readFileSync(new URL('./legacy-redirects.json', import.meta.url), 'utf8'));
  assert.equal(aliases['/en/comparisons/best-ai-tools-for-recruiting'], '/en/vs/best-ai-tools-for-recruiting/');
  assert.equal(aliases['/tools/karat'], '/en/tools/karat/');
  assert.equal(aliases['/en/Index'], '/en/');
  assert.equal(aliases['/en/r/cs'], undefined);
  assert.equal(aliases['/fr/tools/clearbit'], undefined);
  assert.equal(aliases['/bots'], undefined);
  assert.ok(Object.keys(aliases).every(source => !/^\/(ro|ar|ru|ko|zh-CN)\//.test(source)));
});
