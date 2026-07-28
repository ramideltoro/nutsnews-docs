import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const isDirectRun = path.resolve(process.argv[1] || '') === scriptPath;

const secretPatterns = [
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pous]_[A-Za-z0-9_]{36,100}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /BEGIN [A-Z ]*PRIVATE KEY/,
];

const sourceExtensions = new Set([
  '.astro',
  '.map',
  '.md',
  '.mdx',
  '.mjs',
  '.mmd',
  '.ts',
  '.tsx',
]);

async function walk(root, relative = '') {
  const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  const symlinks = [];

  for (const entry of entries) {
    const child = relative ? path.join(relative, entry.name) : entry.name;
    if (entry.isSymbolicLink()) {
      symlinks.push(child);
    } else if (entry.isDirectory()) {
      const nested = await walk(root, child);
      files.push(...nested.files);
      symlinks.push(...nested.symlinks);
    } else if (entry.isFile()) {
      files.push(child);
    }
  }

  return { files, symlinks };
}

function normalizedBase(value) {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function parseSha(args) {
  return args.find((argument) => argument.startsWith('--sha='))?.slice('--sha='.length) || '';
}

export async function validatePagesArtifact({
  repoRoot = process.cwd(),
  outputDir = '_site',
  expectedSha,
  expectedSiteUrl = process.env.WIKI_SITE_URL,
  expectedBasePath = process.env.WIKI_BASE_PATH,
} = {}) {
  const errors = [];
  const outputRoot = path.join(repoRoot, outputDir);
  const manifest = JSON.parse(
    await fs.readFile(path.join(repoRoot, 'scripts/wiki/wiki-release.json'), 'utf8'),
  );
  const inventory = JSON.parse(
    await fs.readFile(path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json'), 'utf8'),
  );

  if (manifest.schema_version !== 1 || manifest.release !== 'v1' || manifest.ready !== true) {
    errors.push('release manifest must explicitly mark schema 1 v1 as ready');
  }
  if (inventory.entries?.length !== manifest.expected_source_count) {
    errors.push(
      `inventory has ${inventory.entries?.length ?? 0} sources; `
      + `${manifest.expected_source_count} are required for v1`,
    );
  }

  if (manifest.deployment.mode !== 'pre-cutover') {
    errors.push('release manifest must remain pre-cutover until the production domain gate');
  }
  if (expectedSiteUrl && expectedSiteUrl !== manifest.deployment.site_url) {
    errors.push('WIKI_SITE_URL does not match the release manifest');
  }
  if (expectedBasePath && normalizedBase(expectedBasePath) !== manifest.deployment.base_path) {
    errors.push('WIKI_BASE_PATH does not match the release manifest');
  }

  const { files, symlinks } = await walk(outputRoot);
  if (symlinks.length > 0) {
    errors.push(`artifact contains ${symlinks.length} symbolic link(s)`);
  }

  const requiredFiles = ['index.html', 'simple/index.html', 'technical/index.html', 'release.json'];
  for (const required of requiredFiles) {
    if (!files.includes(required)) errors.push(`artifact is missing ${required}`);
  }
  if (files.includes('CNAME')) {
    errors.push('pre-cutover artifact must not claim the custom domain');
  }

  for (const file of files) {
    const segments = file.split(path.sep);
    const basename = path.basename(file);
    if (segments.some((segment) => segment.startsWith('.')) || /^\.?env(?:\.|$)/i.test(basename)) {
      errors.push(`artifact contains hidden/environment path: ${file}`);
    }
    if (sourceExtensions.has(path.extname(file).toLowerCase())) {
      errors.push(`artifact contains source file: ${file}`);
    }

    const data = await fs.readFile(path.join(outputRoot, file));
    if (data.includes(0)) continue;
    const text = data.toString('utf8');
    if (secretPatterns.some((pattern) => pattern.test(text))) {
      errors.push(`artifact contains a secret or source-environment marker: ${file}`);
    }
  }

  const stamp = JSON.parse(
    await fs.readFile(path.join(outputRoot, 'release.json'), 'utf8'),
  );
  if (!/^[0-9a-f]{40}$/.test(expectedSha || '')) {
    errors.push('expected SHA must be a full lowercase commit SHA');
  } else if (stamp.commit_sha !== expectedSha) {
    errors.push('artifact release stamp does not match the validated commit');
  }
  if (stamp.release !== manifest.release
      || stamp.deployment?.mode !== manifest.deployment.mode
      || stamp.deployment?.public_url !== manifest.deployment.public_url) {
    errors.push('artifact release stamp does not match the allowlisted release manifest');
  }

  const index = await fs.readFile(path.join(outputRoot, 'index.html'), 'utf8');
  if (!index.includes(`rel="canonical" href="${manifest.deployment.public_url}"`)) {
    errors.push('root canonical URL does not match the pre-cutover public URL');
  }
  const basePrefix = manifest.deployment.base_path === '/' ? '' : manifest.deployment.base_path;
  if (!index.includes(`href="${basePrefix}/simple/"`)
      || !index.includes(`href="${basePrefix}/technical/"`)) {
    errors.push('root audience destinations are not project-base aware');
  }

  return {
    errors,
    files: files.length,
    sources: inventory.entries?.length ?? 0,
    release: manifest.release,
    publicUrl: manifest.deployment.public_url,
  };
}

if (isDirectRun) {
  validatePagesArtifact({ expectedSha: parseSha(process.argv.slice(2)) })
    .then((result) => {
      if (result.errors.length > 0) {
        for (const error of result.errors) console.error(`- ${error}`);
        console.error(`Pages artifact validation failed: ${result.errors.length} violation(s).`);
        process.exitCode = 1;
        return;
      }
      console.log(
        `Pages artifact validation passed: ${result.release}, ${result.sources} sources, `
        + `${result.files} files, ${result.publicUrl}`,
      );
    })
    .catch((error) => {
      console.error(`Pages artifact validation failed: ${error.message}`);
      process.exitCode = 1;
    });
}
