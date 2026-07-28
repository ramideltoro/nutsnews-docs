import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { approveWikiSource } from './docs-approve-core.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  approvalErrors,
  approvedRecord,
  expertSourceHash,
  normalizeExpertSource,
} from './wiki-approval.mjs';

const sourcePath = 'reports/APPROVAL_FIXTURE.md';
const pendingSource = `---
title: Approval Fixture
wiki:
  source_route: /technical/reports/approval-fixture/
  simple_route: /simple/reports/approval-fixture/
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: pending
---
# Approval Fixture

The Technical fact is version one.
`;
const pendingSimple = pendingSource.replace(
  'The Technical fact is version one.',
  'The Simple explanation is version one.',
);

async function fixtureRepo(t, { reviewManifest = true } = {}) {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nutsnews-docs-approval-'));
  t.after(() => fs.rm(repoRoot, { recursive: true, force: true }));
  const simplePath = `audiences/simple/${sourcePath}`;
  const technicalMirrorPath = `audiences/technical/${sourcePath}`;
  await Promise.all([
    fs.mkdir(path.dirname(path.join(repoRoot, sourcePath)), { recursive: true }),
    fs.mkdir(path.dirname(path.join(repoRoot, simplePath)), { recursive: true }),
    fs.mkdir(path.dirname(path.join(repoRoot, technicalMirrorPath)), { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(path.join(repoRoot, sourcePath), pendingSource.replace(/\n/g, '\r\n')),
    fs.writeFile(path.join(repoRoot, simplePath), pendingSimple),
    fs.writeFile(path.join(repoRoot, technicalMirrorPath), pendingSource),
  ]);
  if (reviewManifest) {
    await fs.writeFile(
      path.join(repoRoot, simplePath.replace(/\.md$/, '.review.json')),
      `${JSON.stringify({
        state: 'unreviewed',
        publishing: 'blocked',
        review_notes: ['Verify the Technical fact.'],
      }, null, 2)}\n`,
    );
  }
  return repoRoot;
}

test('normalized expert hashes ignore line endings and approval records, but stale on content edits', () => {
  const lfHash = expertSourceHash(pendingSource);
  const crlfHash = expertSourceHash(pendingSource.replace(/\n/g, '\r\n'));
  assert.equal(lfHash, crlfHash);

  const approved = approvedRecord({
    reviewedBy: 'Rami Del Toro',
    reviewedOn: '2026-07-28T16:00:00-04:00',
    sourceHash: lfHash,
  });
  const withDifferentApproval = pendingSource
    .replace('    reviewed_by: pending', `    reviewed_by: ${JSON.stringify(approved.reviewed_by)}`)
    .replace('    reviewed_on: pending', `    reviewed_on: ${JSON.stringify(approved.reviewed_on)}`)
    .replace('    technical_source_hash: pending', `    technical_source_hash: ${lfHash}`);
  assert.equal(expertSourceHash(withDifferentApproval), lfHash);
  assert.equal(normalizeExpertSource(withDifferentApproval), normalizeExpertSource(pendingSource));

  const edited = pendingSource.replace('version one', 'version two');
  assert.notEqual(expertSourceHash(edited), lfHash);
  assert.match(approvalErrors(approved, expertSourceHash(edited)).join(' '), /stale/);
});

test('docs:approve records a separate human identity, time, and current hash atomically', async (t) => {
  const repoRoot = await fixtureRepo(t);
  const beforeSource = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
  const result = await approveWikiSource({
    repoRoot,
    sourcePath,
    reviewedBy: 'Rami Del Toro',
    reviewedOn: '2026-07-28T16:00:00-04:00',
    confirmHumanReview: true,
  });

  assert.equal(result.approval.reviewed_on, '2026-07-28T20:00:00.000Z');
  assert.equal(result.approval.technical_source_hash, expertSourceHash(beforeSource));
  const simplePath = `audiences/simple/${sourcePath}`;
  const [nextSource, nextSimple, nextTechnicalMirror, review] = await Promise.all([
    fs.readFile(path.join(repoRoot, sourcePath), 'utf8'),
    fs.readFile(path.join(repoRoot, simplePath), 'utf8'),
    fs.readFile(path.join(repoRoot, `audiences/technical/${sourcePath}`), 'utf8'),
    fs.readFile(path.join(repoRoot, simplePath.replace(/\.md$/, '.review.json')), 'utf8')
      .then(JSON.parse),
  ]);
  assert.match(nextSource, /\r\n/, 'Technical source line endings must be preserved');
  assert.match(nextSource, /The Technical fact is version one\./);
  assert.match(nextSimple, /The Simple explanation is version one\./);
  for (const raw of [nextSource, nextSimple, nextTechnicalMirror]) {
    const approval = parseMarkdownFrontmatter(raw).data.wiki.approval;
    assert.equal(approval.state, 'approved');
    assert.equal(approval.publishing, 'allowed');
    assert.equal(approval.reviewed_by, 'Rami Del Toro');
    assert.equal(approval.reviewed_on, '2026-07-28T20:00:00.000Z');
    assert.equal(approval.technical_source_hash, result.approval.technical_source_hash);
  }
  assert.equal(review.state, 'approved');
  assert.equal(review.publishing, 'allowed');
  assert.deepEqual(review.approval, result.approval);
});

test('approval requires explicit human confirmation and rejects generator identities', async (t) => {
  const repoRoot = await fixtureRepo(t, { reviewManifest: false });
  const before = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
  await assert.rejects(
    approveWikiSource({
      repoRoot,
      sourcePath,
      reviewedBy: 'Rami Del Toro',
    }),
    /confirm-human-review/,
  );
  for (const reviewedBy of ['OpenAI', 'Codex', 'gpt-5.4-mini', 'docs:prepare', 'release bot']) {
    await assert.rejects(
      approveWikiSource({
        repoRoot,
        sourcePath,
        reviewedBy,
        confirmHumanReview: true,
      }),
      /human reviewer/,
    );
  }
  assert.equal(await fs.readFile(path.join(repoRoot, sourcePath), 'utf8'), before);
});

test('fresh approval remains current after LF/CRLF conversion', () => {
  const expectedHash = expertSourceHash(pendingSource);
  const approval = approvedRecord({
    reviewedBy: 'Rami Del Toro',
    reviewedOn: '2026-07-28T20:00:00.000Z',
    sourceHash: expectedHash,
  });
  assert.deepEqual(
    approvalErrors(approval, expertSourceHash(pendingSource.replace(/\n/g, '\r\n'))),
    [],
  );
});

test('draft, blocked, pending, and stale approval records fail the gate', () => {
  const currentHash = expertSourceHash(pendingSource);
  const draftErrors = approvalErrors({
    state: 'unreviewed',
    publishing: 'blocked',
    reviewed_by: 'pending',
    reviewed_on: 'pending',
    technical_source_hash: currentHash,
  }, currentHash);
  assert.match(draftErrors.join(' '), /state must be approved/);
  assert.match(draftErrors.join(' '), /publishing must be allowed/);
  assert.match(draftErrors.join(' '), /human reviewer/);
  assert.match(draftErrors.join(' '), /review time/);

  const fresh = approvedRecord({
    reviewedBy: 'Rami Del Toro',
    reviewedOn: '2026-07-28T20:00:00.000Z',
    sourceHash: currentHash,
  });
  assert.match(
    approvalErrors(fresh, expertSourceHash(`${pendingSource}\nSubstantive edit.\n`)).join(' '),
    /stale/,
  );
});

test('approval-only frontmatter is hash-neutral for legacy Technical sources', async (t) => {
  const repoRoot = await fixtureRepo(t, { reviewManifest: false });
  const technicalWithoutFrontmatter = '# Legacy Technical source\n\nA stable fact.\n';
  await fs.writeFile(path.join(repoRoot, sourcePath), technicalWithoutFrontmatter);
  const beforeHash = expertSourceHash(technicalWithoutFrontmatter);
  await approveWikiSource({
    repoRoot,
    sourcePath,
    reviewedBy: 'Rami Del Toro',
    reviewedOn: '2026-07-28T20:00:00.000Z',
    confirmHumanReview: true,
  });
  const approvedSource = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
  assert.match(approvedSource, /^---\nwiki:\n {2}approval:/);
  assert.match(approvedSource, /# Legacy Technical source/);
  assert.equal(expertSourceHash(approvedSource), beforeHash);
});

test('repaired legacy frontmatter parses consistently for identical mirror content', () => {
  const malformed = pendingSource.replace(
    'title: Approval Fixture',
    'title: Update: Approval Fixture',
  );
  const first = parseMarkdownFrontmatter(malformed);
  const second = parseMarkdownFrontmatter(malformed);
  assert.equal(first.data.title, 'Update: Approval Fixture');
  assert.equal(second.data.title, first.data.title);
  assert.deepEqual(second.data.wiki.approval, first.data.wiki.approval);
});
