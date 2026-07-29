import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { wikiContract } from './wiki-contract.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = path.join(repoRoot, '_site');
const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');

function normalizeBase(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

const base = normalizeBase(process.env.WIKI_BASE_PATH || '/');
const basePrefix = base === '/' ? '' : base.slice(0, -1);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

function builtPathFor(route) {
  const cleanRoute = route.replace(/^\/+|\/+$/g, '');
  return path.join(outputRoot, cleanRoute, 'index.html');
}

function documentAssetReferences(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => reference.startsWith(`${basePrefix}/_astro/`));
}

const [astroConfig, pageSource, inventory, notFoundHtml] = await Promise.all([
  readFile(path.join(repoRoot, 'astro.config.mjs'), 'utf8'),
  readFile(path.join(repoRoot, 'src/pages/404.astro'), 'utf8'),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
  readFile(path.join(outputRoot, '404.html'), 'utf8'),
]);

assert.match(
  astroConfig,
  /trailingSlash:\s*['"]always['"]/,
  'Astro must publish clean trailing-slash directories',
);
assert.match(
  astroConfig,
  /disable404Route:\s*true/,
  'the branded 404 must replace Starlight’s default route without a collision',
);
assert.match(notFoundHtml, /<title>Page not found \| NutsNews Wiki<\/title>/);
assert.match(notFoundHtml, /<meta name="robots" content="noindex">/);
assert.match(notFoundHtml, /data-not-found-page/);
assert.doesNotMatch(notFoundHtml, /data-pagefind-body/);
assert.doesNotMatch(notFoundHtml, /<meta name="nutsnews:[^"]+" content="">/);
assert.match(
  notFoundHtml,
  new RegExp(`href="${basePrefix}/simple/"`),
  '404 must offer a base-aware Simple recovery link',
);
assert.match(
  notFoundHtml,
  new RegExp(`href="${basePrefix}/technical/"`),
  '404 must offer a base-aware Technical recovery link',
);
assert.match(
  notFoundHtml,
  new RegExp(`href="${basePrefix}/simple/collections/overview/"`),
  '404 must offer a base-aware History recovery link',
);
assert.match(
  notFoundHtml,
  new RegExp(`data-base-url="${base}"`),
  '404 search must receive the configured base URL',
);
assert.match(pageSource, /bundlePath:\s*`\$\{baseUrl\.replace/);
assert.match(pageSource, /audience:\s*\[audience\]/);
assert.match(pageSource, /history:\s*\['current'\]/);
assert.doesNotMatch(pageSource, /https?:\/\//, '404 recovery must stay pure static');

const assetReferences = documentAssetReferences(notFoundHtml);
assert.ok(assetReferences.length >= 3, '404 must load its local branded assets');
for (const reference of assetReferences) {
  const outputRelative = reference.slice(basePrefix.length + 1);
  await access(path.join(outputRoot, outputRelative));
}

assert.ok(inventory.entries.length >= wikiContract.baselineSourceCount);
const audienceRoutes = inventory.entries.flatMap((entry) => [
  entry.simple.route,
  entry.technical.route,
]);
await Promise.all(audienceRoutes.map((route) => access(builtPathFor(route))));

const nestedFixture = inventory.entries.find((entry) => entry.source.path.includes('/'));
assert.ok(nestedFixture, 'nested-route fixture missing');
await Promise.all([
  access(builtPathFor(nestedFixture.simple.route)),
  access(builtPathFor(nestedFixture.technical.route)),
]);

let audiencePageCount = 0;
for (const audience of ['simple', 'technical']) {
  const audienceFiles = (await walk(path.join(outputRoot, audience)))
    .filter((file) => file.endsWith('.html'));
  assert.equal(
    audienceFiles.length,
    inventory.entries.length + 7,
    `${audience} must publish one article page per source plus seven collection pages`,
  );
  assert.ok(
    audienceFiles.every((file) => path.basename(file) === 'index.html'),
    `${audience} routes must use clean trailing-slash directories`,
  );
  audiencePageCount += audienceFiles.length;
}

console.log(
  `Static routing valid for base ${base}: ${audienceRoutes.length} inventory routes, `
    + `${audiencePageCount} audience pages, ${assetReferences.length} local 404 assets; `
    + `nested=${nestedFixture.source.path}.`,
);
