import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import { technicalMirrorPathFromSource } from './wiki-contract.mjs';
import {
  approvalContract,
  approvalErrors,
  expertSourceHash,
} from './wiki-approval.mjs';
import { wikiContract } from './wiki-contract.mjs';

const repoRoot = process.cwd();
const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');

if (!approvalContract.requiredForPublishing) {
  console.log('Wiki human approval gate is disabled; approval metadata is advisory.');
  process.exit(0);
}

const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
assert.ok(
  inventory.entries.length >= wikiContract.baselineSourceCount,
  'approval gate requires at least the v1 baseline wiki inventory',
);

let reviewManifestCount = 0;
for (const entry of inventory.entries) {
  const technicalMirrorPath = technicalMirrorPathFromSource(entry.source.path);
  const [rawSource, rawSimple, rawTechnicalMirror] = await Promise.all([
    fs.readFile(path.join(repoRoot, entry.source.path), 'utf8'),
    fs.readFile(path.join(repoRoot, entry.simple.sourcePath), 'utf8'),
    fs.readFile(path.join(repoRoot, technicalMirrorPath), 'utf8'),
  ]);
  const expectedHash = expertSourceHash(rawSource);
  const sourceApproval = parseMarkdownFrontmatter(rawSource).data?.wiki?.approval;
  const simpleApproval = parseMarkdownFrontmatter(rawSimple).data?.wiki?.approval;
  const technicalMirrorApproval = parseMarkdownFrontmatter(rawTechnicalMirror)
    .data?.wiki?.approval;
  const sourceErrors = approvalErrors(sourceApproval, expectedHash);
  const simpleErrors = approvalErrors(simpleApproval, expectedHash);
  const technicalMirrorErrors = approvalErrors(technicalMirrorApproval, expectedHash);
  assert.deepEqual(
    sourceErrors,
    [],
    `${entry.source.path}: ${sourceErrors.join('; ')}`,
  );
  assert.deepEqual(
    simpleErrors,
    [],
    `${entry.simple.sourcePath}: ${simpleErrors.join('; ')}`,
  );
  assert.deepEqual(
    technicalMirrorErrors,
    [],
    `${technicalMirrorPath}: ${technicalMirrorErrors.join('; ')}`,
  );
  for (const field of [
    'state',
    'publishing',
    'reviewed_by',
    'reviewed_on',
    'technical_source_hash',
    'automation',
  ]) {
    assert.equal(
      simpleApproval[field],
      sourceApproval[field],
      `${entry.source.path}: source and Simple approval ${field} differ`,
    );
    assert.equal(
      technicalMirrorApproval[field],
      sourceApproval[field],
      `${entry.source.path}: source and Technical mirror approval ${field} differ`,
    );
  }

  const reviewPath = path.join(
    repoRoot,
    entry.simple.sourcePath.replace(/\.md$/i, '.review.json'),
  );
  const manifest = await fs.readFile(reviewPath, 'utf8').catch(() => null);
  if (manifest !== null) {
    reviewManifestCount += 1;
    const review = JSON.parse(manifest);
    assert.equal(review.state, sourceApproval.state, `${reviewPath}: state differs`);
    assert.equal(review.publishing, sourceApproval.publishing, `${reviewPath}: publishing differs`);
    assert.deepEqual(review.approval, sourceApproval, `${reviewPath}: approval differs`);
  }
}

console.log(
  `Wiki approval gate passed: ${inventory.entries.length} current human or automated approvals, `
    + `${inventory.entries.length * 3} source/mirror records, `
    + `${reviewManifestCount} review manifests.`,
);
