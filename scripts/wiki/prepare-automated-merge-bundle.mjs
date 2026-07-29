#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mergeLogPathForRepository } from './automated-doc-changes.mjs';
import { createWikiScaffold } from './docs-new-core.mjs';
import {
  diagramPathFromSource,
  simplePathFromSource,
  technicalMirrorPathFromSource,
} from './wiki-contract.mjs';

const AUTOMATED_WIKI_ORDER_FLOOR = 1_000_000;

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function parseArguments(argv) {
  const options = {
    eventFile: null,
    contextFile: null,
    workspace: null,
    manifestFile: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const key = {
      '--event-file': 'eventFile',
      '--context-file': 'contextFile',
      '--workspace': 'workspace',
      '--manifest-file': 'manifestFile',
    }[argument];
    if (!key) throw new Error(`unknown option: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    options[key] = path.resolve(value);
    index += 1;
  }
  for (const [key, value] of Object.entries(options)) {
    if (!value) throw new Error(`${key} is required`);
  }
  return options;
}

async function exists(target) {
  return fs.stat(target).then((stat) => stat.isFile()).catch(() => false);
}

async function nextGlobalWikiOrder(repoRoot) {
  const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');
  const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
  const orders = inventory.entries
    .map((entry) => entry.source)
    .filter((source) => Number.isSafeInteger(source.order))
    .map((source) => source.order);
  return Math.max(AUTOMATED_WIKI_ORDER_FLOOR, ...orders) + 1;
}

export async function prepareAutomatedMergeBundle({
  repoRoot = process.cwd(),
  eventFile,
  contextFile,
  workspace,
  manifestFile,
}) {
  const event = JSON.parse(await fs.readFile(eventFile, 'utf8'));
  const sourcePath = mergeLogPathForRepository(event.repository);
  const canonicalTarget = path.join(repoRoot, sourcePath);
  if (!(await exists(canonicalTarget))) {
    await createWikiScaffold({
      repoRoot,
      sourcePath,
      collection: 'platform-and-data',
      section: 'core-platform',
      order: await nextGlobalWikiOrder(repoRoot),
    });
  }

  const relativePaths = [
    sourcePath,
    simplePathFromSource(sourcePath),
    technicalMirrorPathFromSource(sourcePath),
    diagramPathFromSource(sourcePath),
    simplePathFromSource(sourcePath).replace(/\.md$/i, '.review.json'),
  ];
  const workspacePresent = await fs.stat(workspace).then(() => true).catch(() => false);
  if (workspacePresent) throw new Error(`isolated Codex workspace already exists: ${workspace}`);
  await fs.mkdir(path.join(workspace, 'wiki'), { recursive: true });

  const artifacts = [];
  for (const relativePath of relativePaths) {
    const source = path.join(repoRoot, relativePath);
    const content = await fs.readFile(source);
    const workspacePath = path.posix.join('wiki', relativePath.replaceAll(path.sep, '/'));
    const target = path.join(workspace, workspacePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
    artifacts.push({
      repository_path: relativePath.replaceAll(path.sep, '/'),
      workspace_path: workspacePath,
      initial_sha256: sha256(content),
      required_change: !relativePath.endsWith('.review.json'),
    });
  }

  await Promise.all([
    fs.copyFile(eventFile, path.join(workspace, 'merge-event.json')),
    fs.copyFile(contextFile, path.join(workspace, 'merge-context.json')),
    fs.copyFile(
      path.join(repoRoot, 'scripts/wiki/prompts/automated-merge-docs.md'),
      path.join(workspace, 'prompt.md'),
    ),
  ]);
  const agentTarget = {
    contract: 'nutsnews-wiki-isolated-bundle/v1',
    repository: event.repository,
    pull_numbers: event.pull_numbers,
    source_path: sourcePath,
    artifacts: artifacts.map(({ repository_path, workspace_path, required_change }) => ({
      repository_path,
      workspace_path,
      required_change,
    })),
  };
  await fs.writeFile(
    path.join(workspace, 'target-bundle.json'),
    `${JSON.stringify(agentTarget, null, 2)}\n`,
    'utf8',
  );
  const trustedManifest = {
    ...agentTarget,
    workspace: path.resolve(workspace),
    artifacts,
  };
  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await fs.writeFile(manifestFile, `${JSON.stringify(trustedManifest, null, 2)}\n`, 'utf8');
  console.log(`Prepared isolated Codex bundle for ${sourcePath}.`);
  return trustedManifest;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  prepareAutomatedMergeBundle({
    repoRoot: process.cwd(),
    ...parseArguments(process.argv.slice(2)),
  }).catch((error) => {
    console.error(`prepare-automated-merge-bundle: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
