import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { stampWikiRelease } from './stamp-wiki-release.mjs';
import { validatePagesArtifact } from './validate-pages-artifact.mjs';

const fixtureSha = 'a'.repeat(40);
const fixtureDeployment = {
  mode: 'pre-cutover',
  site_url: 'https://ramideltoro.github.io',
  base_path: '/nutsnews-docs',
  public_url: 'https://ramideltoro.github.io/nutsnews-docs/',
};

async function write(root, relative, content) {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

async function fixtureRepo(t) {
  const repoRoot = await fs.mkdtemp(path.join(tmpdir(), 'wiki-pages-artifact-'));
  t.after(() => fs.rm(repoRoot, { recursive: true, force: true }));
  await write(repoRoot, 'scripts/wiki/wiki-release.json', `${JSON.stringify({
    schema_version: 1,
    release: 'v1',
    ready: true,
    expected_source_count: 2,
    deployment: fixtureDeployment,
  })}\n`);
  await write(repoRoot, 'scripts/wiki/wiki-inventory.generated.json', `${JSON.stringify({
    entries: [{ source: 'ONE.md' }, { source: 'TWO.md' }],
  })}\n`);
  await write(
    repoRoot,
    '_site/index.html',
    '<link rel="canonical" href="https://ramideltoro.github.io/nutsnews-docs/">'
      + '<link rel="shortcut icon" href="/nutsnews-docs/favicon.svg">'
      + '<a href="/nutsnews-docs/simple/">Simple</a>'
      + '<a href="/nutsnews-docs/technical/">Technical</a>',
  );
  await write(repoRoot, '_site/favicon.svg', '<svg viewBox="0 0 64 64"></svg>');
  await write(repoRoot, '_site/simple/index.html', '<h1>Simple</h1>');
  await write(repoRoot, '_site/technical/index.html', '<h1>Technical</h1>');
  await write(repoRoot, '_site/_astro/app.js', 'globalThis.wikiReady = true;');
  await stampWikiRelease({ repoRoot, sha: fixtureSha });
  return repoRoot;
}

async function validate(repoRoot) {
  return validatePagesArtifact({
    repoRoot,
    expectedSha: fixtureSha,
    expectedSiteUrl: fixtureDeployment.site_url,
    expectedBasePath: fixtureDeployment.base_path,
  });
}

test('clean pre-cutover artifact passes deterministically', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const first = await validate(repoRoot);
  const second = await validate(repoRoot);
  assert.deepEqual(second, first);
  assert.deepEqual(first.errors, []);
  assert.equal(first.sources, 2);
  assert.equal(first.files, 6);
});

test('incomplete inventory fixture cannot publish', async (t) => {
  const repoRoot = await fixtureRepo(t);
  await write(repoRoot, 'scripts/wiki/wiki-inventory.generated.json', '{"entries":[]}\n');
  const result = await validate(repoRoot);
  assert.ok(result.errors.some((error) => error.includes('2 are required for v1')));
});

test('secret and source-environment fixture cannot publish', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const syntheticKey = `sk-${'x'.repeat(24)}`;
  await write(repoRoot, '_site/.env.production', `OPENAI_API_KEY=${syntheticKey}\n`);
  const result = await validate(repoRoot);
  assert.ok(result.errors.some((error) => error.includes('hidden/environment path')));
  assert.ok(result.errors.some((error) => error.includes('secret or source-environment marker')));
});

test('artifact stamped from a different commit cannot publish', async (t) => {
  const repoRoot = await fixtureRepo(t);
  await stampWikiRelease({ repoRoot, sha: 'b'.repeat(40) });
  const result = await validate(repoRoot);
  assert.ok(result.errors.some((error) => error.includes('does not match the validated commit')));
});

test('missing local favicon cannot publish', async (t) => {
  const repoRoot = await fixtureRepo(t);
  await fs.rm(path.join(repoRoot, '_site/favicon.svg'));
  const result = await validate(repoRoot);
  assert.ok(result.errors.some((error) => error.includes('local favicon is missing')));
});

test('rollback contract remains documented', async () => {
  const rollback = await fs.readFile(
    path.join(process.cwd(), 'GITHUB_WIKI_AUTOMATION.md'),
    'utf8',
  );
  assert.match(rollback, /### Rollback/);
  assert.match(rollback, /last-good commit SHA/);
  assert.match(rollback, /Verify `https:\/\/wiki\.nutsnews\.com`/);
});
