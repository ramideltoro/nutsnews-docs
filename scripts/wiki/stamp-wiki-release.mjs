import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const isDirectRun = path.resolve(process.argv[1] || '') === scriptPath;

function shaFromArgs(args) {
  const value = args.find((argument) => argument.startsWith('--sha='))?.slice('--sha='.length);
  assert.match(value || '', /^[0-9a-f]{40}$/, '--sha must be a full lowercase commit SHA');
  return value;
}

export async function stampWikiRelease({
  repoRoot = process.cwd(),
  outputDir = '_site',
  sha,
} = {}) {
  assert.match(sha || '', /^[0-9a-f]{40}$/, 'release SHA must be a full lowercase commit SHA');
  const manifest = JSON.parse(
    await fs.readFile(path.join(repoRoot, 'scripts/wiki/wiki-release.json'), 'utf8'),
  );
  const stamp = {
    schema_version: manifest.schema_version,
    release: manifest.release,
    commit_sha: sha,
    deployment: {
      mode: manifest.deployment.mode,
      public_url: manifest.deployment.public_url,
    },
  };
  const target = path.join(repoRoot, outputDir, 'release.json');
  await fs.writeFile(target, `${JSON.stringify(stamp, null, 2)}\n`, 'utf8');
  return stamp;
}

if (isDirectRun) {
  stampWikiRelease({ sha: shaFromArgs(process.argv.slice(2)) })
    .then((stamp) => {
      console.log(`Stamped ${stamp.release} Pages artifact for ${stamp.commit_sha}.`);
    })
    .catch((error) => {
      console.error(`Release stamp failed: ${error.message}`);
      process.exitCode = 1;
    });
}
