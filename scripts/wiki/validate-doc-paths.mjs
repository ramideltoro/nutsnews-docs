import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ignoredDirs = new Set([
  '.git',
  '.github',
  '.idea',
  '.vscode',
  'node_modules',
  '.cache',
  'Archive',
  'archive',
  '_site',
  '.husky',
]);

const ignoredFiles = new Set([
  '.DS_Store',
  '.gitignore',
  '.gitattributes',
]);

async function walk(dir, rel = '') {
  const entries = await fs.readdir(path.join(repoRoot, dir), { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const name = entry.name;
    const full = path.join(dir, name);
    const childRel = rel ? path.join(rel, name) : name;

    if (entry.isDirectory()) {
      if (ignoredDirs.has(name)) {
        continue;
      }
      out.push(...(await walk(full, childRel)));
      continue;
    }

    if (entry.isFile()) {
      if (ignoredFiles.has(name)) {
        continue;
      }

      if (name.endsWith('.md')) {
        out.push(childRel);
      }
    }
  }

  return out;
}

(async () => {
  const docs = await walk('', '');

  const simpleCount = docs.length;
  if (simpleCount === 0) {
    console.error('No markdown documentation files discovered.');
    process.exitCode = 1;
    return;
  }

  const hasReadme = docs.includes('README.md');
  const hasIndex = docs.includes('index.md');

  console.log(`Discovered markdown documents: ${simpleCount}`);
  if (!hasReadme || !hasIndex) {
    console.log(`Contract check: README.md=${hasReadme ? 'ok' : 'missing'}, index.md=${hasIndex ? 'ok' : 'missing'}`);
  }

  if (!hasIndex) {
    console.error('Missing required index.md root entry point.');
    process.exitCode = 1;
    return;
  }

  if (!docs.includes('GITHUB_WIKI_AUTOMATION.md')) {
    console.error('Missing required publishing contract file: GITHUB_WIKI_AUTOMATION.md');
    process.exitCode = 1;
    return;
  }

  try {
    await fs.access(path.join(repoRoot, 'CNAME'));
    await fs.access(path.join(repoRoot, '_config.yml'));
    await fs.access(path.join(repoRoot, 'index.md'));
    await fs.access(path.join(repoRoot, '.github', 'workflows', 'wiki-pages.yml'));
  } catch (err) {
    console.error(`Workflow contract check failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  console.log('Inventory check passed.');
})();
