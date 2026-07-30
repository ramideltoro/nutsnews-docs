import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_PLATFORMS = Object.freeze(['darwin', 'linux']);
const SNAPSHOT_DIRECTORY = path.join(
  'tests',
  'wiki',
  'reader-journeys.spec.mjs-snapshots',
);
const PLATFORM_REVIEW_PATH = path.join(
  'tests',
  'wiki',
  'visual-baseline-platform-reviews.json',
);

function snapshotIdentity(file) {
  const filename = path.basename(file);
  const match = filename.match(/^(.*)-(darwin|linux)\.png$/);
  if (!match) return null;
  return { logicalName: match[1], platform: match[2] };
}

export function validateVisualBaselineParity({
  files,
  changedFiles = [],
  requiredPlatforms = REQUIRED_PLATFORMS,
  platformReviews = {},
  currentHashes = {},
}) {
  const errors = [];
  const inventory = new Map();
  const changes = new Map();

  for (const file of files) {
    const identity = snapshotIdentity(file);
    if (!identity) continue;
    const platforms = inventory.get(identity.logicalName) || new Set();
    platforms.add(identity.platform);
    inventory.set(identity.logicalName, platforms);
  }

  for (const [logicalName, platforms] of inventory) {
    const missing = requiredPlatforms.filter((platform) => !platforms.has(platform));
    if (missing.length > 0) {
      errors.push(
        `${logicalName} is missing reviewed baseline companion(s): ${missing.join(', ')}`,
      );
    }
  }

  for (const file of changedFiles) {
    const identity = snapshotIdentity(file);
    if (!identity) continue;
    const platforms = changes.get(identity.logicalName) || new Set();
    platforms.add(identity.platform);
    changes.set(identity.logicalName, platforms);
  }

  for (const [logicalName, platforms] of changes) {
    const missing = requiredPlatforms.filter((platform) => !platforms.has(platform));
    if (missing.length > 0) {
      const review = platformReviews[logicalName];
      const changedPlatforms = [...platforms].sort();
      const reviewedPlatforms = [...(review?.platforms || [])].sort();
      const reviewMatches = changedPlatforms.length === reviewedPlatforms.length
        && changedPlatforms.every((platform, index) => platform === reviewedPlatforms[index]);
      if (!reviewMatches) {
        errors.push(
          `${logicalName} changed for ${changedPlatforms.join(', ')} only; `
          + `review and commit its ${missing.join(', ')} companion baseline too, or add a `
          + 'hash-bound platform-only review',
        );
      }
    }
  }

  for (const [logicalName, review] of Object.entries(platformReviews)) {
    if (!inventory.has(logicalName)) {
      errors.push(`platform-only review references unknown baseline: ${logicalName}`);
      continue;
    }
    if (typeof review.reason !== 'string' || review.reason.trim().length < 20) {
      errors.push(`${logicalName} platform-only review must include a specific reason`);
    }
    if (!Array.isArray(review.platforms) || review.platforms.length === 0) {
      errors.push(`${logicalName} platform-only review must name at least one platform`);
    }
    for (const platform of review.platforms || []) {
      if (!requiredPlatforms.includes(platform)) {
        errors.push(`${logicalName} platform-only review has unsupported platform: ${platform}`);
        continue;
      }
      const expectedHash = review.sha256?.[platform];
      const actualHash = currentHashes[logicalName]?.[platform];
      if (!/^[0-9a-f]{64}$/.test(expectedHash || '')) {
        errors.push(`${logicalName} platform-only review must pin the ${platform} SHA-256`);
      } else if (!actualHash) {
        errors.push(`${logicalName} ${platform} baseline could not be verified`);
      } else if (expectedHash !== actualHash) {
        errors.push(`${logicalName} ${platform} baseline changed after its platform-only review`);
      }
    }
  }

  return errors;
}

function gitLines(args) {
  try {
    const output = execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return output ? output.split('\n') : [];
  } catch {
    return [];
  }
}

function requestedBase() {
  const cliBase = process.argv
    .slice(2)
    .find((argument) => argument.startsWith('--base='))
    ?.slice('--base='.length);
  if (cliBase) return cliBase;
  if (process.env.WIKI_VISUAL_BASE_SHA) return process.env.WIKI_VISUAL_BASE_SHA;
  return gitLines(['rev-parse', '--verify', 'origin/main'])[0] || '';
}

function changedSnapshots() {
  const base = requestedBase();
  const committed = base
    ? gitLines(['diff', '--name-only', `${base}...HEAD`, '--', SNAPSHOT_DIRECTORY])
    : [];
  const workingTree = gitLines([
    'diff',
    '--name-only',
    'HEAD',
    '--',
    SNAPSHOT_DIRECTORY,
  ]);
  const untracked = gitLines([
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    SNAPSHOT_DIRECTORY,
  ]);
  return [...new Set([...committed, ...workingTree, ...untracked])];
}

async function run() {
  const snapshotRoot = path.join(process.cwd(), SNAPSHOT_DIRECTORY);
  const files = await fs.readdir(snapshotRoot);
  const platformReviews = JSON.parse(
    await fs.readFile(path.join(process.cwd(), PLATFORM_REVIEW_PATH), 'utf8'),
  );
  const currentHashes = {};
  for (const file of files) {
    const identity = snapshotIdentity(file);
    if (!identity) continue;
    currentHashes[identity.logicalName] ||= {};
    currentHashes[identity.logicalName][identity.platform] = createHash('sha256')
      .update(await fs.readFile(path.join(snapshotRoot, file)))
      .digest('hex');
  }
  const changedFiles = changedSnapshots();
  const errors = validateVisualBaselineParity({
    files,
    changedFiles,
    platformReviews,
    currentHashes,
  });

  if (errors.length > 0) {
    throw new Error(
      `Visual baseline parity failed:\n- ${errors.join('\n- ')}\n`
      + 'Generate and review both macOS and Linux snapshots for every changed baseline. '
      + 'A legitimate platform-only change needs a reason and exact SHA-256 in '
      + `${PLATFORM_REVIEW_PATH}.`,
    );
  }

  const logicalBaselines = new Set(files.map(snapshotIdentity).filter(Boolean).map(
    (identity) => identity.logicalName,
  ));
  const changedBaselines = new Set(changedFiles.map(snapshotIdentity).filter(Boolean).map(
    (identity) => identity.logicalName,
  ));
  console.log(
    `Visual baseline parity passed: ${logicalBaselines.size} darwin/linux pair(s), `
    + `${changedBaselines.size} changed pair(s) reviewed together.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
