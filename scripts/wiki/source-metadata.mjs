import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  historyGroupForSource,
  normalizeSourcePath,
  simplePathFromSource,
} from './wiki-contract.mjs';

const repoRoot = process.cwd();
const githubEditRoot = 'https://github.com/ramideltoro/nutsnews-docs/edit/main';
const metadataCache = new Map();
let headCommitDate;

function validIsoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toISOString();
}

function gitDate(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function sourceFileForAudience(audience, canonicalSourcePath) {
  const canonical = normalizeSourcePath(canonicalSourcePath);
  if (audience === 'technical') return canonical;
  if (audience === 'simple') return simplePathFromSource(canonical);
  throw new Error(`Unsupported wiki audience: ${audience}`);
}

export function githubEditUrlForSource(sourcePath) {
  const normalized = normalizeSourcePath(sourcePath);
  const encodedPath = normalized.split('/').map(encodeURIComponent).join('/');
  return `${githubEditRoot}/${encodedPath}`;
}

export function selectLastUpdatedDate({
  sourceGitDate,
  headGitDate,
  fileModifiedDate,
}) {
  const selected = [
    sourceGitDate,
    headGitDate,
    fileModifiedDate,
  ].map(validIsoDate).find(Boolean);

  if (!selected) {
    throw new Error('Unable to determine a valid last-updated date');
  }
  return selected;
}

async function lastUpdatedForSource(sourcePath) {
  const sourceGitDate = gitDate(['log', '-1', '--format=%cI', '--', sourcePath]);
  headCommitDate ||= gitDate(['show', '-s', '--format=%cI', 'HEAD']);
  const stat = await fs.stat(path.join(repoRoot, sourcePath));
  return selectLastUpdatedDate({
    sourceGitDate,
    headGitDate: headCommitDate,
    fileModifiedDate: stat.mtime.toISOString(),
  });
}

export async function sourceMetadataForPage({
  audience,
  canonicalSourcePath,
  sourceStatus,
}) {
  if (
    !canonicalSourcePath
    || `${canonicalSourcePath}`.startsWith('virtual:')
    || !['simple', 'technical'].includes(audience)
  ) return null;
  const sourcePath = sourceFileForAudience(audience, canonicalSourcePath);
  const cacheKey = `${audience}:${sourcePath}:${sourceStatus}`;
  if (metadataCache.has(cacheKey)) return metadataCache.get(cacheKey);

  const historyGroup = historyGroupForSource(canonicalSourcePath);
  const metadata = {
    sourcePath,
    editUrl: githubEditUrlForSource(sourcePath),
    lastUpdated: await lastUpdatedForSource(sourcePath),
    pageStatus: historyGroup
      ? `Historical — ${historyGroup.label}`
      : `${sourceStatus || 'active'}`.replace(/^./, (character) => character.toUpperCase()),
  };
  metadataCache.set(cacheKey, metadata);
  return metadata;
}
