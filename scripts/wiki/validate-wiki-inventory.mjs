import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  classifySourcePath,
  deriveAudienceRoute,
  deriveDiagramPath,
  deriveSlugFromSource,
  simplePathFromSource,
  wikiContract,
} from './wiki-contract.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const inventoryPath = path.join(repoRoot, 'scripts', 'wiki', 'wiki-inventory.generated.json');
const generatorPath = path.join(repoRoot, 'scripts', 'wiki', 'generate-wiki-content.mjs');
const minimumSourceCount = wikiContract.baselineSourceCount;

async function generateInventory() {
  await execFileAsync(process.execPath, [generatorPath, '--strict'], {
    cwd: repoRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
  return fs.readFile(inventoryPath, 'utf8');
}

function assertUnique(entries, selector, label) {
  const seen = new Map();
  for (const entry of entries) {
    const value = selector(entry);
    if (seen.has(value)) {
      throw new Error(`duplicate ${label} ${value}: ${seen.get(value)} and ${entry.source.path}`);
    }
    seen.set(value, entry.source.path);
  }
}

async function assertFile(relativePath, label) {
  const stat = await fs.stat(path.join(repoRoot, relativePath));
  assert.ok(stat.isFile(), `${label} is not a file: ${relativePath}`);
}

async function run() {
  const first = await generateInventory();
  const second = await generateInventory();
  assert.equal(second, first, 'repeated inventory generation must be byte-for-byte stable');

  const inventory = JSON.parse(first);
  assert.equal('generatedAtUtc' in inventory, false, 'stable manifest may not contain a timestamp');
  assert.equal(inventory.contractVersion, wikiContract.version);
  assert.ok(inventory.sourceCount >= minimumSourceCount);
  assert.equal(inventory.sourcePaths.length, inventory.sourceCount);
  assert.equal(inventory.entries.length, inventory.sourceCount);
  assert.equal(inventory.warnings.length, 0);
  assert.equal(new Set(inventory.sourcePaths).size, inventory.sourceCount);
  assert.deepEqual(
    inventory.entries.map((entry) => entry.source.path),
    inventory.sourcePaths,
  );

  assertUnique(inventory.entries, (entry) => entry.source.slug, 'slug');
  assertUnique(inventory.entries, (entry) => entry.source.order, 'order');
  assertUnique(inventory.entries, (entry) => entry.technical.route, 'technical route');
  assertUnique(inventory.entries, (entry) => entry.simple.route, 'simple route');

  assert.throws(
    () => assertUnique(
      [
        { source: { path: 'ONE.md', slug: 'same' } },
        { source: { path: 'TWO.md', slug: 'same' } },
      ],
      (entry) => entry.source.slug,
      'slug',
    ),
    /duplicate slug/,
  );
  assert.throws(
    () => assertUnique(
      [
        { source: { path: 'ONE.md', order: 7 } },
        { source: { path: 'TWO.md', order: 7 } },
      ],
      (entry) => entry.source.order,
      'order',
    ),
    /duplicate order/,
  );
  assert.throws(
    () => classifySourcePath('future-area/UNCLASSIFIED.md'),
    /unclassified canonical wiki source path/,
  );

  for (const entry of inventory.entries) {
    const sourcePath = entry.source.path;
    const sourceRaw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const sourceData = parseMarkdownFrontmatter(sourceRaw).data || {};
    const expectedSimplePath = simplePathFromSource(sourcePath);

    assert.equal(entry.source.area, classifySourcePath(sourcePath));
    assert.equal(entry.source.slug, deriveSlugFromSource(sourcePath, sourceData));
    assert.ok(entry.source.title);
    assert.ok(entry.source.description);
    assert.ok(entry.source.collection);
    assert.ok(entry.source.section);
    assert.ok(wikiContract.statusValues.includes(entry.source.status));
    assert.ok(Number.isInteger(entry.source.order));
    assert.equal(entry.technical.sourcePath, sourcePath);
    assert.equal(entry.simple.sourcePath, expectedSimplePath);
    assert.equal(
      entry.technical.route,
      deriveAudienceRoute('technical', sourcePath, sourceData),
    );
    assert.equal(entry.simple.route, deriveAudienceRoute('simple', sourcePath, sourceData));
    assert.equal(entry.diagram.path, deriveDiagramPath(sourceData, sourcePath));
    assert.equal(entry.diagram.exists, true);

    await Promise.all([
      assertFile(sourcePath, 'canonical source'),
      assertFile(expectedSimplePath, 'Simple mirror'),
      assertFile(entry.diagram.path, 'Mermaid diagram'),
    ]);
  }

  console.log(
    `Stable inventory validation passed for ${inventory.sourceCount} sources, `
      + `${inventory.entries.length} Simple mappings, ${inventory.entries.length} diagrams, `
      + `and ${inventory.entries.length * 2} audience routes.`,
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
