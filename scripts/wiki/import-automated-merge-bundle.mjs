#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mergeLogPathForRepository } from './automated-doc-changes.mjs';
import {
  diagramPathFromSource,
  simplePathFromSource,
  technicalMirrorPathFromSource,
} from './wiki-contract.mjs';

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function importAutomatedMergeBundle({
  repoRoot = process.cwd(),
  manifestFile,
}) {
  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  if (
    manifest.contract !== 'nutsnews-wiki-isolated-bundle/v1'
    || manifest.source_path !== mergeLogPathForRepository(manifest.repository)
    || !Array.isArray(manifest.artifacts)
    || manifest.artifacts.length !== 5
  ) {
    throw new Error('isolated Codex bundle manifest is invalid');
  }
  const expectedPaths = new Set([
    manifest.source_path,
    simplePathFromSource(manifest.source_path),
    technicalMirrorPathFromSource(manifest.source_path),
    diagramPathFromSource(manifest.source_path),
    simplePathFromSource(manifest.source_path).replace(/\.md$/i, '.review.json'),
  ]);
  const repositoryPaths = manifest.artifacts.map((artifact) => artifact.repository_path);
  if (
    new Set(repositoryPaths).size !== expectedPaths.size
    || repositoryPaths.some((repositoryPath) => !expectedPaths.has(repositoryPath))
  ) {
    throw new Error('isolated Codex bundle contains an unexpected repository path');
  }
  const prepared = [];
  for (const artifact of manifest.artifacts) {
    const workspaceTarget = path.resolve(manifest.workspace, artifact.workspace_path);
    const expectedWorkspacePrefix = `${path.resolve(manifest.workspace)}${path.sep}`;
    if (!workspaceTarget.startsWith(expectedWorkspacePrefix)) {
      throw new Error(`workspace artifact escapes the isolated root: ${artifact.workspace_path}`);
    }
    const stat = await fs.lstat(workspaceTarget);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`isolated artifact must be a regular file: ${artifact.workspace_path}`);
    }
    const content = await fs.readFile(workspaceTarget);
    if (artifact.required_change && sha256(content) === artifact.initial_sha256) {
      throw new Error(`Codex did not update required artifact: ${artifact.repository_path}`);
    }
    if (
      artifact.required_change
      && /\bTODO\b|Draft scaffold:|Auto-generated placeholder diagram/i.test(content.toString('utf8'))
    ) {
      throw new Error(`Codex left scaffold content in ${artifact.repository_path}`);
    }
    prepared.push({
      content,
      target: path.join(repoRoot, artifact.repository_path),
    });
  }
  await Promise.all(prepared.map(({ content, target }) => fs.writeFile(target, content)));
  console.log(`Imported ${prepared.length} isolated documentation artifacts.`);
  return manifest.source_path;
}

function parseArguments(argv) {
  if (argv.length !== 2 || argv[0] !== '--manifest-file') {
    throw new Error('usage: import-automated-merge-bundle.mjs --manifest-file <manifest.json>');
  }
  return path.resolve(argv[1]);
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  importAutomatedMergeBundle({
    manifestFile: parseArguments(process.argv.slice(2)),
  }).catch((error) => {
    console.error(`import-automated-merge-bundle: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
