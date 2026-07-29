#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  classifySourcePath,
  normalizeSourcePath,
  simplePathFromSource,
  technicalMirrorPathFromSource,
} from './wiki-contract.mjs';

const execFileAsync = promisify(execFile);

function posix(value) {
  return value.split(path.sep).join('/');
}

function isCanonicalSource(relative) {
  if (!relative.endsWith('.md') || relative === 'index.md') return false;
  if (relative.startsWith('audiences/') || relative.startsWith('diagrams/')) return false;
  try {
    classifySourcePath(relative);
    return true;
  } catch {
    return false;
  }
}

function ownerSourceForArtifact(relative) {
  if (relative.startsWith('audiences/simple/')) {
    return relative.slice('audiences/simple/'.length).replace(/\.review\.json$/i, '.md');
  }
  if (relative.startsWith('audiences/technical/')) {
    return relative.slice('audiences/technical/'.length);
  }
  if (relative.startsWith('diagrams/') && relative.endsWith('.mmd')) {
    return `${relative.slice('diagrams/'.length, -'.mmd'.length)}.md`;
  }
  return null;
}

export function mergeLogPathForRepository(repository) {
  if (
    !/^ramideltoro\/nutsnews(?:-[a-z0-9-]+)?$/.test(`${repository ?? ''}`)
    || repository === 'ramideltoro/nutsnews-docs'
  ) {
    throw new Error('merge event repository is invalid');
  }
  const repositoryName = repository.split('/').at(-1);
  return `updates/AUTOMATED_${repositoryName.replace(/-/g, '_').toUpperCase()}_MERGE_LOG.md`;
}

async function gitLines(repoRoot, args) {
  const { stdout } = await execFileAsync('git', ['-C', repoRoot, ...args], {
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout.split(/\r?\n/).map((line) => posix(line.trim())).filter(Boolean);
}

export async function inspectAutomatedDocChanges({
  repoRoot = process.cwd(),
  eventFile = null,
} = {}) {
  const [changed, untracked, deleted] = await Promise.all([
    gitLines(repoRoot, ['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD']),
    gitLines(repoRoot, ['ls-files', '--others', '--exclude-standard']),
    gitLines(repoRoot, ['diff', '--name-only', '--diff-filter=D', 'HEAD']),
  ]);
  const paths = [...new Set([...changed, ...untracked])].sort();
  const errors = deleted.map((relative) => `automated documentation may not delete files: ${relative}`);
  const sources = paths.filter(isCanonicalSource).map(normalizeSourcePath);
  const sourceSet = new Set(sources);

  for (const relative of paths) {
    const target = path.join(repoRoot, relative);
    const stat = await fs.lstat(target).catch(() => null);
    if (!stat?.isFile() || stat.isSymbolicLink()) {
      errors.push(`automated documentation path must be a regular file: ${relative}`);
      continue;
    }
    if (isCanonicalSource(relative)) continue;
    const owner = ownerSourceForArtifact(relative);
    if (!owner) {
      errors.push(`automated documentation changed a prohibited path: ${relative}`);
      continue;
    }
    try {
      classifySourcePath(owner);
    } catch {
      errors.push(`automated documentation artifact has no valid canonical owner: ${relative}`);
      continue;
    }
    if (!sourceSet.has(owner)) {
      errors.push(`automated artifact changed without its canonical source: ${relative}`);
    }
  }

  for (const source of sources) {
    for (const required of [
      simplePathFromSource(source),
      technicalMirrorPathFromSource(source),
      `diagrams/${source.replace(/\.md$/i, '.mmd')}`,
    ]) {
      const target = path.join(repoRoot, required);
      const present = await fs.stat(target).then((stat) => stat.isFile()).catch(() => false);
      if (!present) errors.push(`${source}: required bundle artifact is missing: ${required}`);
    }
  }

  if (eventFile) {
    const event = JSON.parse(await fs.readFile(path.resolve(repoRoot, eventFile), 'utf8'));
    const mergeLogPath = mergeLogPathForRepository(event.repository);
    if (!sourceSet.has(mergeLogPath)) {
      errors.push(`required repository merge log was not changed: ${mergeLogPath}`);
    } else {
      const mergeLog = await fs.readFile(path.join(repoRoot, mergeLogPath), 'utf8');
      if (
        !Array.isArray(event.pulls)
        || event.pulls.length === 0
        || event.pulls.length !== event.pull_numbers?.length
        || event.pulls.some((pull, index) => pull.number !== event.pull_numbers[index])
      ) {
        errors.push('merge event is missing complete pull request evidence');
      } else {
        for (const pull of event.pulls) {
          if (!`${pull.html_url ?? ''}` || !mergeLog.includes(pull.html_url)) {
            errors.push(`${mergeLogPath}: missing pull request link for #${pull.number}`);
          }
          if (!/^[a-f0-9]{40}$/.test(`${pull.merge_commit_sha ?? ''}`)
              || !mergeLog.includes(pull.merge_commit_sha)) {
            errors.push(`${mergeLogPath}: missing merge commit for #${pull.number}`);
          }
        }
      }
    }
  }

  return { paths, sources, errors };
}

if (import.meta.url === `file://${path.resolve(process.argv[1] || '')}`) {
  const eventFileIndex = process.argv.indexOf('--event-file');
  const eventFile = eventFileIndex >= 0 ? process.argv[eventFileIndex + 1] : null;
  if (eventFileIndex >= 0 && !eventFile) {
    throw new Error('--event-file requires a value');
  }
  const report = await inspectAutomatedDocChanges({ eventFile });
  if (process.argv.includes('--sources-only')) {
    console.log(JSON.stringify(report.sources));
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
  if (report.errors.length) process.exitCode = 1;
}
