import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');

function runScript(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' },
  });
}

function routeToDocPath(audience, route) {
  const normalized = route.startsWith('/') ? route.slice(1) : route;
  if (normalized === audience) {
    return path.join(repoRoot, 'src', 'content', 'docs', `${audience}.md`);
  }

  const segment = normalized
    .replace(new RegExp(`^${audience}/?`), '')
    .replace(/\/+$/, '');

  return path.join(
    repoRoot,
    'src',
    'content',
    'docs',
    audience,
    segment || 'index',
    'index.md',
  );
}

async function assertAudienceRoutes(entries, audience) {
  const unique = new Set();
  const generatedChecks = [];

  for (const entry of entries) {
    const route = entry[audience]?.route;
    const technicalRoute = entry.technical?.route;
    const simpleRoute = entry.simple?.route;

    assert.equal(typeof route, 'string', `${audience} route missing`);
    assert.ok(route === `/${audience}` || route.startsWith(`/${audience}/`), `${audience} route must be namespaced: ${route}`);

    if (audience === 'technical') {
      assert.notEqual(technicalRoute, simpleRoute, 'technical and simple routes should remain separate');
    }

    const generatedPath = routeToDocPath(audience, route);
    unique.add(route);

    assert.equal(route.includes('/audiences/'), false, `${audience} route unexpectedly includes audiences: ${route}`);
    assert.ok(entry.diagram?.path?.startsWith('diagrams/'), 'diagram path should come from diagrams root');
    assert.ok(!entry.diagram?.path?.startsWith('diagrams/audiences/'), 'diagram should not be audience duplicate');
    assert.ok(/\.mmd$/.test(entry.diagram?.path || ''), 'diagram path should target Mermaid file');

    generatedChecks.push(fs.access(generatedPath));
  }

  assert.equal(unique.size, 227, `${audience} routes should be unique and complete`);
  await Promise.all(generatedChecks);
}

test('wiki content generation writes the canonical 227-entry inventory', async () => {
  const output = runScript('node', ['scripts/wiki/generate-wiki-content.mjs', '--strict']);
  assert.match(output, /Generated\s+227\s+source\s+entries\./, 'generation should report 227 sources');

  const rawInventory = await fs.readFile(inventoryPath, 'utf8');
  const inventory = JSON.parse(rawInventory);

  assert.equal(inventory.sourceCount, 227, 'inventory source count must be 227');
  assert.equal(inventory.entries.length, 227, 'inventory entry count must be 227');

  await assertAudienceRoutes(inventory.entries, 'technical');
  await assertAudienceRoutes(inventory.entries, 'simple');

  const allSourcePaths = new Set(inventory.sourcePaths);
  assert.equal(allSourcePaths.size, 227, 'sourcePaths should be unique');
});

test('generated markdown files are free of markdown extension links', async () => {
  await runScript('node', ['scripts/wiki/generate-wiki-content.mjs']);
  const markdownPattern = /\[[^\]]*\]\(([^)\s]+\.md(?:[?#][^)]+)?)\)/g;
  const docsPath = path.join(repoRoot, 'src/content/docs');

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const current = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(current)));
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(current);
      }
    }
    return files;
  };

  const docFiles = await walk(docsPath);
  for (const file of docFiles) {
    const content = await fs.readFile(file, 'utf8');
    const matches = [...content.matchAll(markdownPattern)];
    const invalid = matches.find((match) => {
      const target = match[1] || '';
      return !/^(?:https?:\/\/|mailto:|tel:|#)/i.test(target);
    });
    if (invalid) {
      throw new Error(`generated doc still contains markdown links: ${path.relative(repoRoot, file)} -> ${invalid[0]}`);
    }
  }

  assert.ok(docFiles.length >= 450, `expected generated docs, got ${docFiles.length}`);
});
