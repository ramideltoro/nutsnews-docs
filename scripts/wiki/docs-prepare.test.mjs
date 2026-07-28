import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  DOCS_PREPARE_MODEL,
  addMermaidAccessibility,
  prepareWikiDraft,
  validateMermaidDraft,
} from './docs-prepare-core.mjs';
import { runDocsPrepare, safeErrorMessage } from './docs-prepare.mjs';

const sourcePath = 'reports/PREPARE_FIXTURE.md';
const sourceMarkdown = `---
title: Prepare Fixture
description: Technical fixture for the author-time draft command.
wiki:
  source_route: /technical/reports/prepare-fixture/
  simple_route: /simple/reports/prepare-fixture/
  status: active
  collection: platform-and-data
  section: core-platform
  order: 9
---

# Prepare Fixture

Preserve the [operator guide](https://example.com/operator) and never expose a credential.

## Safety boundary

The reviewer must verify the deployment claim before publication.
`;

function structuredDraft(overrides = {}) {
  return {
    simple_title: 'Prepare Fixture (Simple)',
    simple_description: 'A plain-language fixture for the draft command.',
    simple_markdown: [
      '# Prepare Fixture',
      '',
      'This draft explains the author-time workflow in plain language.',
      '',
      '## Safety boundary',
      '',
      'A person must verify the deployment claim before publication.',
    ].join('\n'),
    mermaid: 'flowchart TD\n  source[Technical source] --> review[Human review]',
    accessibility: {
      title: 'Draft review flow',
      description: 'A Technical source becomes a draft that waits for human review.',
    },
    review_notes: [
      'Verify the deployment claim.',
      'Confirm the operator guide link.',
    ],
    ...overrides,
  };
}

function fakeClient(outputs) {
  const requests = [];
  return {
    requests,
    responses: {
      async create(request) {
        requests.push(request);
        const next = outputs.shift();
        if (next instanceof Error) throw next;
        return { output_text: JSON.stringify(next) };
      },
    },
  };
}

async function fixtureRepo(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-docs-prepare-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.writeFile(path.join(root, sourcePath), sourceMarkdown);
  return root;
}

test('prepares blocked Simple, Mermaid, and review artifacts with the Responses API contract', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const client = fakeClient([structuredDraft()]);
  const validated = [];
  const result = await prepareWikiDraft({
    repoRoot,
    sourcePath,
    client,
    validateMermaid: async (source) => validated.push(source),
    now: () => new Date('2026-07-28T12:00:00.000Z'),
  });

  assert.equal(client.requests.length, 1);
  const [request] = client.requests;
  assert.equal(request.model, DOCS_PREPARE_MODEL);
  assert.equal(request.store, false);
  assert.equal(request.text.format.type, 'json_schema');
  assert.equal(request.text.format.strict, true);
  assert.equal(request.text.format.schema.additionalProperties, false);
  assert.match(request.input, /canonical_technical_markdown/);
  assert.match(request.input, /reports\/PREPARE_FIXTURE\.md/);

  assert.deepEqual(result.paths, {
    simple: 'audiences/simple/reports/PREPARE_FIXTURE.md',
    diagram: 'diagrams/reports/PREPARE_FIXTURE.mmd',
    review: 'audiences/simple/reports/PREPARE_FIXTURE.review.json',
  });
  assert.equal(result.state, 'unreviewed');
  assert.equal(result.publishing, 'blocked');
  assert.equal(validated.length, 1);

  const [simpleRaw, diagramRaw, reviewRaw] = await Promise.all([
    fs.readFile(path.join(repoRoot, result.paths.simple), 'utf8'),
    fs.readFile(path.join(repoRoot, result.paths.diagram), 'utf8'),
    fs.readFile(path.join(repoRoot, result.paths.review), 'utf8'),
  ]);
  const simple = parseMarkdownFrontmatter(simpleRaw);
  assert.equal(simple.data.wiki.approval.state, 'unreviewed');
  assert.equal(simple.data.wiki.approval.publishing, 'blocked');
  assert.equal(simple.data.wiki.approval.reviewed_by, 'pending');
  assert.equal(simple.data.wiki.approval.reviewed_on, 'pending');
  assert.match(simple.data.wiki.approval.technical_source_hash, /^[a-f0-9]{64}$/);
  assert.match(simple.content, /^# Prepare Fixture/m);
  assert.match(diagramRaw, /accTitle: Draft review flow/);
  assert.match(diagramRaw, /accDescr \{/);
  const review = JSON.parse(reviewRaw);
  assert.equal(review.state, 'unreviewed');
  assert.equal(review.publishing, 'blocked');
  assert.equal(review.generator.api, 'responses');
  assert.equal(review.generator.model, DOCS_PREPARE_MODEL);
  assert.equal(review.generator.store, false);
  assert.equal(review.generated_at, '2026-07-28T12:00:00.000Z');
  assert.equal(review.review_notes.length, 2);
});

test('refuses every existing artifact before making an API request unless force is explicit', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const existingPath = path.join(
    repoRoot,
    'audiences/simple/reports/PREPARE_FIXTURE.md',
  );
  await fs.mkdir(path.dirname(existingPath), { recursive: true });
  await fs.writeFile(existingPath, 'preserve me\n');
  const blockedClient = fakeClient([structuredDraft()]);

  await assert.rejects(
    prepareWikiDraft({
      repoRoot,
      sourcePath,
      client: blockedClient,
      validateMermaid: async () => {},
    }),
    /without --force/,
  );
  assert.equal(blockedClient.requests.length, 0);
  assert.equal(await fs.readFile(existingPath, 'utf8'), 'preserve me\n');

  const forcedClient = fakeClient([structuredDraft({ simple_title: 'Forced replacement' })]);
  await prepareWikiDraft({
    repoRoot,
    sourcePath,
    client: forcedClient,
    force: true,
    validateMermaid: async () => {},
  });
  const forced = parseMarkdownFrontmatter(await fs.readFile(existingPath, 'utf8'));
  assert.equal(forced.data.title, 'Forced replacement');
  assert.equal(forcedClient.requests.length, 1);
});

test('retries invalid Mermaid exactly once and writes only the corrected bundle', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const client = fakeClient([
    structuredDraft({ mermaid: 'flowchart TD\n  broken["Unterminated' }),
    structuredDraft({ mermaid: 'flowchart LR\n  draft[Draft] --> reviewer[Reviewer]' }),
  ]);
  const validated = [];
  const result = await prepareWikiDraft({
    repoRoot,
    sourcePath,
    client,
    validateMermaid: async (source) => {
      validated.push(source);
      if (source.includes('Unterminated')) throw new Error('local Mermaid parser rejected draft');
    },
  });

  assert.equal(client.requests.length, 2);
  assert.match(client.requests[1].input, /failed the local parser/i);
  assert.equal(client.requests[1].store, false);
  assert.match(
    await fs.readFile(path.join(repoRoot, result.paths.diagram), 'utf8'),
    /draft\[Draft\] --> reviewer\[Reviewer\]/,
  );
  assert.equal(validated.length, 2);
});

test('invalid Mermaid after one retry leaves no draft artifacts', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const client = fakeClient([
    structuredDraft({ mermaid: 'flowchart TD\n  first["Unterminated' }),
    structuredDraft({ mermaid: 'flowchart LR\n  second["Still unterminated' }),
  ]);

  await assert.rejects(
    prepareWikiDraft({
      repoRoot,
      sourcePath,
      client,
      validateMermaid: async () => {
        throw new Error('local Mermaid parser rejected draft');
      },
    }),
    /after one retry/,
  );
  assert.equal(client.requests.length, 2);
  for (const relative of [
    'audiences/simple/reports/PREPARE_FIXTURE.md',
    'diagrams/reports/PREPARE_FIXTURE.mmd',
    'audiences/simple/reports/PREPARE_FIXTURE.review.json',
  ]) {
    await assert.rejects(fs.access(path.join(repoRoot, relative)));
  }
});

test('the real local Mermaid parser accepts the accessibility-enriched diagram', async () => {
  const diagram = addMermaidAccessibility(
    'flowchart TD\n  source[Source] --> review[Review]',
    {
      title: 'Accessible draft flow',
      description: 'The source moves to a draft and then waits for review.',
    },
  );
  await validateMermaidDraft(diagram);
});

test('the CLI requires the key only from the process environment', async () => {
  await assert.rejects(
    runDocsPrepare([sourcePath], {}),
    /OPENAI_API_KEY is required in the process environment/,
  );
});

test('CLI error reporting redacts API-key-shaped values', () => {
  const syntheticKey = ['sk', 'proj', 'synthetic-value-that-must-never-print'].join('-');
  const message = safeErrorMessage(
    new Error(`request failed with ${syntheticKey}`),
    syntheticKey,
  );
  assert.doesNotMatch(message, /synthetic-value/);
  assert.equal(message, 'request failed with [redacted]');
});
