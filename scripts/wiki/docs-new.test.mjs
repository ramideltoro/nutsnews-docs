import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createWikiScaffold } from './docs-new-core.mjs';
import { runDocsNew } from './docs-new.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  approvalErrors,
  expertSourceHash,
} from './wiki-approval.mjs';
import { validateMermaidDraft } from './docs-prepare-core.mjs';

async function fixtureRepo(t) {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-docs-new-'));
  t.after(() => fs.rm(repoRoot, { recursive: true, force: true }));
  return repoRoot;
}

async function artifactContents(repoRoot, paths) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([name, relative]) => [
        name,
        await fs.readFile(path.join(repoRoot, relative), 'utf8'),
      ]),
    ),
  );
}

test('root scaffolds are deterministic, complete, accessible, and publication-blocked', async (t) => {
  const firstRoot = await fixtureRepo(t);
  const secondRoot = await fixtureRepo(t);
  const options = {
    sourcePath: 'NEW_API_GUIDE.md',
    collection: 'platform-and-data',
    section: 'core-platform',
    order: 4,
  };
  const first = await createWikiScaffold({ repoRoot: firstRoot, ...options });
  const second = await createWikiScaffold({ repoRoot: secondRoot, ...options });

  assert.deepEqual(first, second);
  assert.deepEqual(first.paths, {
    source: 'NEW_API_GUIDE.md',
    simple: 'audiences/simple/NEW_API_GUIDE.md',
    technicalMirror: 'audiences/technical/NEW_API_GUIDE.md',
    diagram: 'diagrams/NEW_API_GUIDE.mmd',
    review: 'audiences/simple/NEW_API_GUIDE.review.json',
  });
  assert.equal(first.state, 'unreviewed');
  assert.equal(first.publishing, 'blocked');
  assert.equal(first.nextCommands.length, 3);
  const firstArtifacts = await artifactContents(firstRoot, first.paths);
  const secondArtifacts = await artifactContents(secondRoot, second.paths);
  assert.deepEqual(firstArtifacts, secondArtifacts);

  const source = parseMarkdownFrontmatter(firstArtifacts.source);
  const simple = parseMarkdownFrontmatter(firstArtifacts.simple);
  const technicalMirror = parseMarkdownFrontmatter(firstArtifacts.technicalMirror);
  assert.equal(source.data.title, 'New API Guide');
  assert.equal(source.data.wiki.source_route, '/technical/new-api-guide');
  assert.equal(source.data.wiki.simple_route, '/simple/new-api-guide');
  assert.equal(source.data.wiki.status, 'draft');
  assert.equal(source.data.wiki.order, 4);
  assert.equal(expertSourceHash(firstArtifacts.source), first.sourceHash);
  for (const approval of [
    source.data.wiki.approval,
    simple.data.wiki.approval,
    technicalMirror.data.wiki.approval,
  ]) {
    assert.equal(approval.state, 'unreviewed');
    assert.equal(approval.publishing, 'blocked');
    assert.equal(approval.reviewed_by, 'pending');
    assert.match(approvalErrors(approval, first.sourceHash).join(' '), /state must be approved/);
  }
  await validateMermaidDraft(firstArtifacts.diagram);
  const review = JSON.parse(firstArtifacts.review);
  assert.equal(review.state, 'unreviewed');
  assert.equal(review.publishing, 'blocked');
  assert.deepEqual(review.next_commands, first.nextCommands);
});

test('nested scaffolds derive stable nested paths, routes, and shell-safe next commands', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const result = await createWikiScaffold({
    repoRoot,
    sourcePath: 'archive/New Reader Guide.md',
    collection: 'start-here',
    section: 'overview',
  });
  assert.deepEqual(result.paths, {
    source: 'archive/New Reader Guide.md',
    simple: 'audiences/simple/archive/New Reader Guide.md',
    technicalMirror: 'audiences/technical/archive/New Reader Guide.md',
    diagram: 'diagrams/archive/New Reader Guide.mmd',
    review: 'audiences/simple/archive/New Reader Guide.review.json',
  });
  const source = parseMarkdownFrontmatter(
    await fs.readFile(path.join(repoRoot, result.paths.source), 'utf8'),
  );
  assert.equal(source.data.title, 'New Reader Guide');
  assert.equal(source.data.wiki.source_route, '/technical/archive/new-reader-guide');
  assert.equal(source.data.wiki.simple_route, '/simple/archive/new-reader-guide');
  assert.match(result.nextCommands[0], /'archive\/New Reader Guide\.md'/);
  assert.match(result.nextCommands[1], /--confirm-human-review$/);
});

test('existing targets are preserved and no partial scaffold is created', async (t) => {
  const repoRoot = await fixtureRepo(t);
  await fs.writeFile(path.join(repoRoot, 'DUPLICATE.md'), 'preserve me\n');
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'DUPLICATE.md',
      collection: 'start-here',
      section: 'overview',
    }),
    /refusing to overwrite/,
  );
  assert.equal(await fs.readFile(path.join(repoRoot, 'DUPLICATE.md'), 'utf8'), 'preserve me\n');
  await assert.rejects(fs.access(path.join(repoRoot, 'audiences/simple/DUPLICATE.md')));
  await assert.rejects(fs.access(path.join(repoRoot, 'diagrams/DUPLICATE.mmd')));
});

test('unsafe and unclassified paths are rejected', async (t) => {
  const repoRoot = await fixtureRepo(t);
  for (const sourcePath of [
    '../ESCAPE.md',
    '/ABSOLUTE.md',
    'audiences/simple/BAD.md',
    'diagrams/BAD.md',
    'other/UNCLASSIFIED.md',
    'index.md',
  ]) {
    await assert.rejects(
      createWikiScaffold({
        repoRoot,
        sourcePath,
        collection: 'start-here',
        section: 'overview',
      }),
      /(?:invalid|unsafe|unclassified)/,
    );
  }
});

test('symlinked artifact parents cannot escape the workspace', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const outsideRoot = await fixtureRepo(t);
  await fs.symlink(outsideRoot, path.join(repoRoot, 'archive'), 'dir');
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'archive/ESCAPE.md',
      collection: 'start-here',
      section: 'overview',
    }),
    /unsafe symlinked/,
  );
  await assert.rejects(fs.access(path.join(outsideRoot, 'ESCAPE.md')));
});

test('collection and section must match the navigation contract', async (t) => {
  const repoRoot = await fixtureRepo(t);
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'BAD_COLLECTION.md',
      collection: 'unknown',
      section: 'overview',
    }),
    /unsupported wiki collection/,
  );
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'BAD_SECTION.md',
      collection: 'platform-and-data',
      section: 'overview',
    }),
    /does not belong/,
  );
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'BAD_ORDER.md',
      collection: 'start-here',
      section: 'overview',
      order: '01',
    }),
    /non-negative integer/,
  );
});

test('duplicate and case-insensitive route sources are rejected before writes', async (t) => {
  const repoRoot = await fixtureRepo(t);
  await fs.writeFile(
    path.join(repoRoot, 'EXISTING.md'),
    `---
title: Existing
wiki:
  source_route: /technical/collision/
  simple_route: /simple/collision/
---
# Existing
`,
  );
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'COLLISION.md',
      collection: 'start-here',
      section: 'overview',
    }),
    /route already exists/,
  );
  await fs.writeFile(path.join(repoRoot, 'Guide.md'), '# Existing case variant\n');
  await assert.rejects(
    createWikiScaffold({
      repoRoot,
      sourcePath: 'guide.md',
      collection: 'start-here',
      section: 'overview',
    }),
    /(?:source path already exists|refusing to overwrite)/,
  );
});

test('CLI reports all artifacts and exact next commands', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const messages = [];
  const result = await runDocsNew([
    'reports/QUALITY_PLAN.md',
    '--collection',
    'platform-and-data',
    '--section',
    'core-platform',
  ], {
    repoRoot,
    log: (message) => messages.push(message),
  });
  assert.match(messages[0], /Created 5 wiki draft artifacts/);
  for (const artifactPath of Object.values(result.paths)) {
    assert.ok(messages.some((message) => message.includes(artifactPath)));
  }
  assert.ok(messages.includes('Next commands:'));
  for (const command of result.nextCommands) {
    assert.ok(messages.some((message) => message.endsWith(command)));
  }
});
