import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  normalizeRoute,
  publishedRoute,
  wikiContract,
} from './wiki-contract.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

const repoRoot = process.cwd();
const generatedRoot = path.join(repoRoot, wikiContract.generatedContentRoot);
const buildRoot = path.join(repoRoot, '_site');
const inventoryPath = path.join(repoRoot, 'scripts', 'wiki', 'wiki-inventory.generated.json');
const productionSite = 'https://wiki.nutsnews.com';

async function walkFiles(root, relative = '') {
  const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(root, next)));
    } else if (entry.isFile()) {
      files.push(next);
    }
  }
  return files;
}

function generatedPathFor(audience, route) {
  const normalized = normalizeRoute(route);
  const prefix = normalizeRoute(wikiContract.route[`${audience}Prefix`]).replace(/^\//, '');
  const cleaned = normalized.replace(/^\//, '').replace(/\/+$/, '');
  if (cleaned === prefix) {
    return path.join(generatedRoot, `${audience}.md`);
  }

  const remainder = cleaned.startsWith(`${prefix}/`)
    ? cleaned.slice(prefix.length + 1)
    : cleaned;
  return path.join(generatedRoot, audience, remainder, 'index.md');
}

function builtPathFor(route) {
  const cleaned = normalizeRoute(route).replace(/^\//, '').replace(/\/+$/, '');
  return path.join(buildRoot, cleaned, 'index.html');
}

function firstHeading(markdown) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^#\s+\S/.test(line));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function validateGeneratedPair(entry) {
  const technicalPath = generatedPathFor('technical', entry.technical.route);
  const simplePath = generatedPathFor('simple', entry.simple.route);
  const [technicalRaw, simpleRaw, sourceRaw, mirrorRaw] = await Promise.all([
    fs.readFile(technicalPath, 'utf8'),
    fs.readFile(simplePath, 'utf8'),
    fs.readFile(path.join(repoRoot, entry.source.path), 'utf8'),
    fs.readFile(path.join(repoRoot, entry.simple.sourcePath), 'utf8'),
  ]);
  const technical = parseMarkdownFrontmatter(technicalRaw);
  const simple = parseMarkdownFrontmatter(simpleRaw);
  const source = parseMarkdownFrontmatter(sourceRaw);
  const mirror = parseMarkdownFrontmatter(mirrorRaw);
  const sharedFields = [
    'title',
    'description',
    'slug',
    'collection',
    'section',
    'status',
    'order',
    'source_route',
    'simple_route',
    'source_path',
    'diagram',
  ];

  for (const field of sharedFields) {
    assert.deepEqual(
      simple.data[field],
      technical.data[field],
      `${entry.source.path}: mismatched ${field}`,
    );
  }

  assert.equal(technical.data.audience, 'technical');
  assert.equal(simple.data.audience, 'simple');
  assert.equal(technical.data.generated_for, entry.technical.route);
  assert.equal(simple.data.generated_for, entry.simple.route);
  assert.equal(technical.data.paired_route, entry.simple.route);
  assert.equal(simple.data.paired_route, entry.technical.route);
  assert.equal(technical.data.source_path, entry.source.path);
  assert.equal(simple.data.source_path, entry.source.path);
  assert.equal(firstHeading(technical.content), firstHeading(source.content));
  assert.equal(firstHeading(simple.content), firstHeading(mirror.content));
}

async function validateBuiltRoute(entry, audience) {
  const current = entry[audience].route;
  const paired = audience === 'simple' ? entry.technical.route : entry.simple.route;
  const pairedAudience = audience === 'simple' ? 'technical' : 'simple';
  const html = await fs.readFile(builtPathFor(current), 'utf8');
  const canonical = `${productionSite}${publishedRoute(current)}`;
  const alternate = `${productionSite}${publishedRoute(paired)}`;

  assert.match(
    html,
    new RegExp(`<link rel="canonical" href="${escapeRegExp(canonical)}"`),
    `${current}: missing canonical`,
  );
  assert.match(
    html,
    new RegExp(
      `<link rel="alternate" href="${escapeRegExp(alternate)}"[^>]+data-audience="${pairedAudience}"`,
    ),
    `${current}: missing audience alternate`,
  );
  assert.match(
    html,
    new RegExp(`<meta name="nutsnews:audience" content="${audience}"`),
    `${current}: missing audience metadata`,
  );
  assert.match(
    html,
    new RegExp(
      `<meta name="nutsnews:source-path" content="${escapeRegExp(entry.source.path)}"`,
    ),
    `${current}: missing source metadata`,
  );
  assert.ok(html.includes('<main'), `${current}: article content is not present in static HTML`);
}

async function run() {
  const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
  assert.ok(inventory.entries.length >= wikiContract.baselineSourceCount);
  const generatedMarkdown = (await walkFiles(generatedRoot))
    .filter((file) => file.endsWith('.md'));
  assert.equal(generatedMarkdown.length, inventory.entries.length * 2);

  await Promise.all(inventory.entries.map((entry) => validateGeneratedPair(entry)));

  const rootFixture = inventory.entries.find((entry) => !entry.source.path.includes('/'));
  const nestedFixture = inventory.entries.find((entry) => entry.source.path.includes('/'));
  assert.ok(rootFixture, 'root audience fixture missing');
  assert.ok(nestedFixture, 'nested audience fixture missing');

  await Promise.all(
    inventory.entries.flatMap((entry) => [
      validateBuiltRoute(entry, 'technical'),
      validateBuiltRoute(entry, 'simple'),
    ]),
  );

  console.log(
    `Audience route validation passed for ${inventory.entries.length} sources, `
      + `${generatedMarkdown.length} generated Markdown files, and `
      + `${inventory.entries.length * 2} static audience pages; `
      + `root=${rootFixture.source.path}, nested=${nestedFixture.source.path}.`,
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
