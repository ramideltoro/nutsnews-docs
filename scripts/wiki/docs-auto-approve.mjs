#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { upsertWikiApproval } from './docs-approve-core.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  automatedRecord,
  approvalErrors,
  expertSourceHash,
} from './wiki-approval.mjs';
import {
  classifySourcePath,
  normalizeSourcePath,
  simplePathFromSource,
  technicalMirrorPathFromSource,
} from './wiki-contract.mjs';

async function exists(target) {
  return fs.stat(target).then((stat) => stat.isFile()).catch(() => false);
}

function parseArguments(argv) {
  const options = {
    sourcesFile: null,
    sourceRepository: null,
    pullRequests: null,
    mergeCommit: null,
    workflowRun: null,
    reviewedOn: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const key = {
      '--sources-file': 'sourcesFile',
      '--source-repository': 'sourceRepository',
      '--pull-requests': 'pullRequests',
      '--merge-commit': 'mergeCommit',
      '--workflow-run': 'workflowRun',
      '--reviewed-on': 'reviewedOn',
    }[argument];
    if (!key) throw new Error(`unknown argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    options[key] = value;
    index += 1;
  }
  for (const key of [
    'sourcesFile',
    'sourceRepository',
    'pullRequests',
    'mergeCommit',
    'workflowRun',
  ]) {
    if (!options[key]) throw new Error(`missing required option: ${key}`);
  }
  return options;
}

export async function automateWikiSource({
  repoRoot = process.cwd(),
  sourcePath: rawSourcePath,
  sourceRepository,
  pullRequests,
  mergeCommit,
  workflowRun,
  reviewedOn = new Date().toISOString(),
}) {
  const sourcePath = normalizeSourcePath(rawSourcePath);
  classifySourcePath(sourcePath);
  const simplePath = simplePathFromSource(sourcePath);
  const technicalPath = technicalMirrorPathFromSource(sourcePath);
  const reviewPath = simplePath.replace(/\.md$/i, '.review.json');
  const paths = [sourcePath, simplePath, technicalPath];
  const raw = await Promise.all(paths.map(async (relative) => {
    const target = path.join(repoRoot, relative);
    return fs.readFile(target, 'utf8').catch(() => {
      throw new Error(`required automated documentation artifact is missing: ${relative}`);
    });
  }));
  const sourceHash = expertSourceHash(raw[0]);
  const approval = automatedRecord({
    reviewedOn,
    sourceHash,
    sourceRepository,
    pullRequests,
    mergeCommit,
    workflowRun,
  });
  const next = raw.map((markdown) => upsertWikiApproval(markdown, approval));
  for (let index = 0; index < next.length; index += 1) {
    const parsed = parseMarkdownFrontmatter(next[index]);
    const errors = approvalErrors(parsed.data?.wiki?.approval, sourceHash);
    if (errors.length) {
      throw new Error(`${paths[index]}: automated approval is invalid: ${errors.join('; ')}`);
    }
  }

  const writes = paths.map((relative, index) => (
    fs.writeFile(path.join(repoRoot, relative), next[index], 'utf8')
  ));
  const reviewTarget = path.join(repoRoot, reviewPath);
  if (await exists(reviewTarget)) {
    const review = JSON.parse(await fs.readFile(reviewTarget, 'utf8'));
    review.state = approval.state;
    review.publishing = approval.publishing;
    review.approval = approval;
    writes.push(fs.writeFile(reviewTarget, `${JSON.stringify(review, null, 2)}\n`, 'utf8'));
  }
  await Promise.all(writes);
  return { sourcePath, approval };
}

export async function runDocsAutoApprove(argv) {
  const options = parseArguments(argv);
  const sources = JSON.parse(await fs.readFile(options.sourcesFile, 'utf8'));
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error('sources file must contain at least one canonical source path');
  }
  const results = [];
  for (const sourcePath of sources) {
    results.push(await automateWikiSource({
      sourcePath,
      sourceRepository: options.sourceRepository,
      pullRequests: options.pullRequests,
      mergeCommit: options.mergeCommit,
      workflowRun: options.workflowRun,
      reviewedOn: options.reviewedOn || new Date().toISOString(),
    }));
  }
  console.log(`Recorded automated provenance for ${results.length} canonical source bundle(s).`);
  return results;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runDocsAutoApprove(process.argv.slice(2)).catch((error) => {
    console.error(`docs:auto-approve: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
