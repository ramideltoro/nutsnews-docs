import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  inspectAutomatedDocChanges,
  mergeLogPathForRepository,
} from './automated-doc-changes.mjs';
import { automateWikiSource } from './docs-auto-approve.mjs';
import {
  buildMergeEvent,
  MAX_AUTOMATION_ATTEMPTS,
  retryIsBlocked,
} from './discover-nutsnews-merges.mjs';
import { importAutomatedMergeBundle } from './import-automated-merge-bundle.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import { prepareAutomatedMergeBundle } from './prepare-automated-merge-bundle.mjs';
import { recordMergeFailure } from './record-nutsnews-merge-failure.mjs';
import {
  approvalErrors,
  automatedRecord,
  expertSourceHash,
} from './wiki-approval.mjs';
import { wikiContract } from './wiki-contract.mjs';

const execFileAsync = promisify(execFile);

function sourceMarkdown(label = 'Current behavior') {
  return `---\ntitle: Automated fixture\nwiki:\n  slug: automated-fixture\n---\n# Automated fixture\n\n${label}.\n`;
}

async function write(root, relative, content) {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, 'utf8');
}

async function isolatedBundleFixture(t, label) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), `nutsnews-isolated-${label}-`));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const repository = 'ramideltoro/nutsnews-backend';
  const sourcePath = mergeLogPathForRepository(repository);
  const simplePath = `audiences/simple/${sourcePath}`;
  const technicalPath = `audiences/technical/${sourcePath}`;
  const diagramPath = 'diagrams/updates/AUTOMATED_NUTSNEWS_BACKEND_MERGE_LOG.mmd';
  const reviewPath = simplePath.replace(/\.md$/i, '.review.json');
  const eventPath = path.join(root, 'event.json');
  const contextPath = path.join(root, 'context.json');
  const workspace = path.join(root, '_automation-work/agent');
  const manifestFile = path.join(root, '_automation-work/trusted-bundle.json');
  await Promise.all([
    write(root, sourcePath, sourceMarkdown('Original canonical')),
    write(root, simplePath, sourceMarkdown('Original simple')),
    write(root, technicalPath, sourceMarkdown('Original technical')),
    write(root, diagramPath, 'flowchart LR\n  accTitle: Existing flow\n  A --> B\n'),
    write(root, reviewPath, '{}\n'),
    write(root, 'scripts/wiki/prompts/automated-merge-docs.md', 'Trusted fixture prompt.\n'),
    write(root, 'event.json', `${JSON.stringify({
      repository,
      pull_numbers: [42],
      head_sha: 'a'.repeat(40),
    })}\n`),
    write(root, 'context.json', '{"pulls":[]}\n'),
  ]);
  const manifest = await prepareAutomatedMergeBundle({
    repoRoot: root,
    eventFile: eventPath,
    contextFile: contextPath,
    workspace,
    manifestFile,
  });
  return {
    root,
    sourcePath,
    workspace,
    manifest,
    manifestFile,
  };
}

test('merge discovery aggregates every pending pull request in cursor order', () => {
  const repository = {
    full_name: 'ramideltoro/nutsnews-backend',
    default_branch: 'main',
  };
  const cursor = {
    lastMergedAt: '2026-07-28T10:00:00Z',
    lastPullNumber: 10,
    lastMergeCommit: '1'.repeat(40),
  };
  const event = buildMergeEvent(repository, cursor, [
    {
      number: 12,
      merged_at: '2026-07-28T12:00:00Z',
      merge_commit_sha: '3'.repeat(40),
      html_url: 'https://github.com/ramideltoro/nutsnews-backend/pull/12',
    },
    {
      number: 9,
      merged_at: '2026-07-28T09:00:00Z',
      merge_commit_sha: '0'.repeat(40),
    },
    {
      number: 11,
      merged_at: '2026-07-28T11:00:00Z',
      merge_commit_sha: '2'.repeat(40),
      html_url: 'https://github.com/ramideltoro/nutsnews-backend/pull/11',
    },
  ]);
  assert.deepEqual(event.pull_numbers, [11, 12]);
  assert.equal(event.previous_merge_commit, '1'.repeat(40));
  assert.equal(event.head_sha, '3'.repeat(40));
});

test('isolated Codex workspaces are outside the canonical wiki inventory', () => {
  assert.equal(wikiContract.exclusions.ignoreDirs.has('_automation-work'), true);
});

test('automated approvals require complete immutable merge provenance', () => {
  const source = sourceMarkdown();
  const hash = expertSourceHash(source);
  const approval = automatedRecord({
    reviewedOn: '2026-07-28T12:00:00Z',
    sourceHash: hash,
    sourceRepository: 'ramideltoro/nutsnews-backend',
    pullRequests: '11,12',
    mergeCommit: 'a'.repeat(40),
    workflowRun: '123456',
  });
  assert.deepEqual(approvalErrors(approval, hash), []);
  assert.match(
    approvalErrors(approval, expertSourceHash(sourceMarkdown('Changed behavior'))).join(' '),
    /stale/,
  );
  assert.throws(
    () => automatedRecord({
      reviewedOn: '2026-07-28T12:00:00Z',
      sourceHash: hash,
      sourceRepository: 'ramideltoro/nutsnews-docs',
      pullRequests: '11',
      mergeCommit: 'a'.repeat(40),
      workflowRun: '123456',
    }),
    /supported NutsNews source/,
  );
});

test('automated approval is written identically to a complete document bundle', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-auto-approval-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sourcePath = 'updates/AUTOMATED_FIXTURE.md';
  const source = sourceMarkdown();
  await Promise.all([
    write(root, sourcePath, source),
    write(root, `audiences/simple/${sourcePath}`, source),
    write(root, `audiences/technical/${sourcePath}`, source),
    write(root, 'diagrams/updates/AUTOMATED_FIXTURE.mmd', 'flowchart LR\n  A --> B\n'),
  ]);
  const result = await automateWikiSource({
    repoRoot: root,
    sourcePath,
    sourceRepository: 'ramideltoro/nutsnews-worker',
    pullRequests: '42',
    mergeCommit: 'b'.repeat(40),
    workflowRun: '987654',
    reviewedOn: '2026-07-28T13:00:00Z',
  });
  assert.equal(result.approval.state, 'automated');
  const approvals = await Promise.all([
    sourcePath,
    `audiences/simple/${sourcePath}`,
    `audiences/technical/${sourcePath}`,
  ].map(async (relative) => (
    parseMarkdownFrontmatter(await fs.readFile(path.join(root, relative), 'utf8'))
      .data.wiki.approval
  )));
  assert.deepEqual(approvals[1], approvals[0]);
  assert.deepEqual(approvals[2], approvals[0]);
});

test('change boundary accepts complete bundles and rejects tooling changes', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-auto-policy-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sourcePath = 'updates/AUTOMATED_FIXTURE.md';
  const source = sourceMarkdown();
  await Promise.all([
    write(root, sourcePath, source),
    write(root, `audiences/simple/${sourcePath}`, source),
    write(root, `audiences/technical/${sourcePath}`, source),
    write(root, 'diagrams/updates/AUTOMATED_FIXTURE.mmd', 'flowchart LR\n  A --> B\n'),
    write(root, 'package.json', '{}\n'),
  ]);
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  await execFileAsync('git', ['config', 'user.name', 'Fixture'], { cwd: root });
  await execFileAsync('git', ['add', '-A'], { cwd: root });
  await execFileAsync('git', ['commit', '-m', 'fixture'], { cwd: root });

  for (const relative of [
    sourcePath,
    `audiences/simple/${sourcePath}`,
    `audiences/technical/${sourcePath}`,
    'diagrams/updates/AUTOMATED_FIXTURE.mmd',
  ]) {
    await fs.appendFile(path.join(root, relative), '\nUpdated.\n', 'utf8');
  }
  const allowed = await inspectAutomatedDocChanges({ repoRoot: root });
  assert.deepEqual(allowed.sources, [sourcePath]);
  assert.deepEqual(allowed.errors, []);

  await fs.writeFile(path.join(root, 'package.json'), '{"changed":true}\n', 'utf8');
  const rejected = await inspectAutomatedDocChanges({ repoRoot: root });
  assert.match(rejected.errors.join(' '), /prohibited path: package\.json/);
});

test('change boundary rejects symlinked documentation artifacts', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-auto-symlink-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sourcePath = 'updates/AUTOMATED_FIXTURE.md';
  const source = sourceMarkdown();
  await Promise.all([
    write(root, sourcePath, source),
    write(root, `audiences/simple/${sourcePath}`, source),
    write(root, `audiences/technical/${sourcePath}`, source),
    write(root, 'diagrams/updates/AUTOMATED_FIXTURE.mmd', 'flowchart LR\n  A --> B\n'),
  ]);
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  await execFileAsync('git', ['config', 'user.name', 'Fixture'], { cwd: root });
  await execFileAsync('git', ['add', '-A'], { cwd: root });
  await execFileAsync('git', ['commit', '-m', 'fixture'], { cwd: root });
  await fs.rm(path.join(root, `audiences/simple/${sourcePath}`));
  await fs.symlink(
    path.join(root, sourcePath),
    path.join(root, `audiences/simple/${sourcePath}`),
  );
  await fs.appendFile(path.join(root, sourcePath), '\nUpdated.\n', 'utf8');
  await fs.appendFile(path.join(root, `audiences/technical/${sourcePath}`), '\nUpdated.\n', 'utf8');
  await fs.appendFile(path.join(root, 'diagrams/updates/AUTOMATED_FIXTURE.mmd'), '\n%% Updated\n');
  const rejected = await inspectAutomatedDocChanges({ repoRoot: root });
  assert.match(rejected.errors.join(' '), /must be a regular file/);
});

test('change boundary requires the repository log and exact merge references', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-auto-evidence-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const repository = 'ramideltoro/nutsnews-infra';
  const sourcePath = mergeLogPathForRepository(repository);
  const pullUrl = 'https://github.com/ramideltoro/nutsnews-infra/pull/428';
  const mergeCommit = 'd'.repeat(40);
  const source = sourceMarkdown(`${pullUrl}\n\n${mergeCommit}`);
  await Promise.all([
    write(root, sourcePath, source),
    write(root, `audiences/simple/${sourcePath}`, source),
    write(root, `audiences/technical/${sourcePath}`, source),
    write(root, 'diagrams/updates/AUTOMATED_NUTSNEWS_INFRA_MERGE_LOG.mmd', 'flowchart LR\n  A --> B\n'),
    write(root, 'event.json', `${JSON.stringify({
      repository,
      pull_numbers: [428],
      pulls: [{
        number: 428,
        html_url: pullUrl,
        merge_commit_sha: mergeCommit,
      }],
    })}\n`),
  ]);
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  await execFileAsync('git', ['config', 'user.name', 'Fixture'], { cwd: root });
  await execFileAsync('git', ['add', '-A'], { cwd: root });
  await execFileAsync('git', ['commit', '-m', 'fixture'], { cwd: root });
  for (const relative of [
    sourcePath,
    `audiences/simple/${sourcePath}`,
    `audiences/technical/${sourcePath}`,
    'diagrams/updates/AUTOMATED_NUTSNEWS_INFRA_MERGE_LOG.mmd',
  ]) {
    await fs.appendFile(path.join(root, relative), '\nUpdated.\n', 'utf8');
  }
  const accepted = await inspectAutomatedDocChanges({
    repoRoot: root,
    eventFile: 'event.json',
  });
  assert.deepEqual(accepted.errors, []);

  await fs.writeFile(path.join(root, sourcePath), sourceMarkdown('Missing references'), 'utf8');
  const rejected = await inspectAutomatedDocChanges({
    repoRoot: root,
    eventFile: 'event.json',
  });
  assert.match(rejected.errors.join(' '), /missing pull request link/);
  assert.match(rejected.errors.join(' '), /missing merge commit/);
});

test('isolated merge bundle imports only the exact five-artifact allowlist', async (t) => {
  const fixture = await isolatedBundleFixture(t, 'import');
  const requiredArtifacts = fixture.manifest.artifacts.filter((artifact) => artifact.required_change);
  assert.equal(requiredArtifacts.length, 4);
  for (const artifact of requiredArtifacts) {
    await fs.appendFile(
      path.join(fixture.workspace, artifact.workspace_path),
      '\nDocumented from bounded merge evidence.\n',
      'utf8',
    );
  }
  const importedSource = await importAutomatedMergeBundle({
    repoRoot: fixture.root,
    manifestFile: fixture.manifestFile,
  });
  assert.equal(importedSource, fixture.sourcePath);
  assert.match(
    await fs.readFile(path.join(fixture.root, fixture.sourcePath), 'utf8'),
    /Documented from bounded merge evidence/,
  );
});

test('isolated merge bundle creates a complete target when a repository has no log', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-isolated-new-log-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const repository = 'ramideltoro/nutsnews-new-service';
  const sourcePath = mergeLogPathForRepository(repository);
  const eventFile = path.join(root, 'event.json');
  const contextFile = path.join(root, 'context.json');
  const workspace = path.join(root, '_automation-work/agent');
  const manifestFile = path.join(root, '_automation-work/trusted-bundle.json');
  await Promise.all([
    write(root, 'scripts/wiki/wiki-inventory.generated.json', `${JSON.stringify({
      entries: [
        {
          source: {
            collection: 'platform-and-data',
            section: 'core-platform',
            order: 100,
          },
        },
        {
          source: {
            collection: 'start-here',
            section: 'overview',
            order: 227,
          },
        },
      ],
    })}\n`),
    write(root, 'scripts/wiki/prompts/automated-merge-docs.md', 'Trusted fixture prompt.\n'),
    write(root, 'event.json', `${JSON.stringify({
      repository,
      pull_numbers: [7],
      head_sha: 'b'.repeat(40),
    })}\n`),
    write(root, 'context.json', '{"pulls":[]}\n'),
  ]);

  const manifest = await prepareAutomatedMergeBundle({
    repoRoot: root,
    eventFile,
    contextFile,
    workspace,
    manifestFile,
  });
  assert.equal(manifest.source_path, sourcePath);
  assert.equal(manifest.artifacts.length, 5);
  const canonical = parseMarkdownFrontmatter(
    await fs.readFile(path.join(root, sourcePath), 'utf8'),
    sourcePath,
  );
  assert.equal(canonical.data.wiki.order, 228);
  for (const artifact of manifest.artifacts) {
    assert.equal((await fs.lstat(path.join(root, artifact.repository_path))).isFile(), true);
    assert.equal((await fs.lstat(path.join(workspace, artifact.workspace_path))).isFile(), true);
  }
});

test('isolated merge bundle rejects unchanged, symlinked, and unexpected artifacts', async (t) => {
  const unchanged = await isolatedBundleFixture(t, 'unchanged');
  await assert.rejects(
    importAutomatedMergeBundle({
      repoRoot: unchanged.root,
      manifestFile: unchanged.manifestFile,
    }),
    /did not update required artifact/,
  );

  const symlinked = await isolatedBundleFixture(t, 'symlink');
  for (const artifact of symlinked.manifest.artifacts.filter((item) => item.required_change)) {
    const target = path.join(symlinked.workspace, artifact.workspace_path);
    await fs.appendFile(target, '\nDocumented from bounded merge evidence.\n', 'utf8');
  }
  const symlinkArtifact = symlinked.manifest.artifacts.find((artifact) => artifact.required_change);
  const symlinkTarget = path.join(symlinked.workspace, symlinkArtifact.workspace_path);
  await fs.rm(symlinkTarget);
  await fs.symlink(path.join(symlinked.workspace, 'merge-event.json'), symlinkTarget);
  await assert.rejects(
    importAutomatedMergeBundle({
      repoRoot: symlinked.root,
      manifestFile: symlinked.manifestFile,
    }),
    /must be a regular file/,
  );

  const unexpected = await isolatedBundleFixture(t, 'unexpected');
  unexpected.manifest.artifacts.at(-1).repository_path = 'package.json';
  await fs.writeFile(
    unexpected.manifestFile,
    `${JSON.stringify(unexpected.manifest, null, 2)}\n`,
    'utf8',
  );
  await assert.rejects(
    importAutomatedMergeBundle({
      repoRoot: unexpected.root,
      manifestFile: unexpected.manifestFile,
    }),
    /unexpected repository path/,
  );
});

test('identical failed merge batches stop after the bounded retry limit', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-auto-failure-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, 'state.json');
  const eventPath = path.join(root, 'event.json');
  const repository = 'ramideltoro/nutsnews-backend';
  const event = {
    repository,
    head_sha: 'c'.repeat(40),
    merged_at: '2026-07-28T14:00:00Z',
    pull_numbers: [43],
  };
  await write(root, 'state.json', `${JSON.stringify({
    version: 1,
    owner: 'ramideltoro',
    repositories: {
      [repository]: {
        lastMergedAt: '2026-07-28T13:00:00Z',
        lastPullNumber: 42,
        lastMergeCommit: 'b'.repeat(40),
      },
    },
    failures: {},
  })}\n`);
  await write(root, 'event.json', `${JSON.stringify(event)}\n`);

  let failure;
  for (let attempt = 1; attempt <= MAX_AUTOMATION_ATTEMPTS; attempt += 1) {
    failure = await recordMergeFailure({
      statePath,
      eventPath,
      workflowRun: `${1000 + attempt}`,
      runUrl: `https://github.com/ramideltoro/nutsnews-docs/actions/runs/${1000 + attempt}`,
      failedAt: `2026-07-28T14:0${attempt}:00Z`,
    });
    assert.equal(failure.attempts, attempt);
  }
  assert.equal(failure.blocked, true);
  assert.equal(retryIsBlocked(event, failure), true);
  assert.equal(retryIsBlocked({ ...event, head_sha: 'd'.repeat(40) }, failure), false);
});
