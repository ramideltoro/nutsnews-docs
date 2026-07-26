import { promises as fs } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=', 2);

  if (!key.startsWith('--')) {
    return acc;
  }

  if (key === '--help' || key === '-h') {
    acc.help = true;
    return acc;
  }

  acc[key.slice(2).replace(/-/g, '_')] = value ?? true;
  return acc;
}, {});

if (args.help) {
  console.log('Usage: node validate-wiki-budgets.mjs [--build-duration=<seconds>] [--output=_site]');
  console.log('Validates generated wiki artifact size and pagefind/mermaid bundle constraints.');
  process.exit(0);
}

const repoRoot = process.cwd();
const outputDir = path.resolve(repoRoot, args.output || '_site');
const maxTotalBytes = Number(
  args.max_total_mb
    ? Number(args.max_total_mb) * 1024 * 1024
    : 1 * 1024 * 1024 * 1024,
);
const maxLargestBytes = Number(
  args.max_largest_mb
    ? Number(args.max_largest_mb) * 1024 * 1024
    : 100 * 1024 * 1024,
);
const maxBuildSeconds = Number(args.max_build_seconds ?? 600);
const maxPagefindBytes = Number(
  args.max_pagefind_mb
    ? Number(args.max_pagefind_mb) * 1024 * 1024
    : 300 * 1024 * 1024,
);
const buildDurationSeconds = Number(
  args.build_duration ?? process.env.WIKI_BUILD_DURATION_SECONDS ?? NaN,
);

const externalLibraryPattern = /https?:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdnjs\.com)\/[^\n\s]*(?:mermaid|pagefind)[^\n\s]*/i;

async function walkFiles(dir, rel = '') {
  const entries = await fs.readdir(path.join(repoRoot, dir), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = path.join(dir, entry.name);
    const relChild = rel ? path.join(rel, entry.name) : entry.name;

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(child, relChild)));
      continue;
    }

    if (entry.isFile()) {
      files.push(relChild);
    }
  }

  return files;
}

function formatBytes(v) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = v;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(1)} ${units[unit]}`;
}

(async () => {
  try {
    await fs.access(outputDir);
  } catch {
    console.error(`Build validation failed: output directory missing at ${outputDir}`);
    process.exitCode = 1;
    return;
  }

  const relFiles = await walkFiles(path.relative(repoRoot, outputDir));
  let totalBytes = 0;
  let largest = { path: '', size: 0 };
  const fileSizes = [];
  const externalLibraryReferences = [];

  for (const rel of relFiles) {
    const full = path.join(outputDir, rel);
    const stat = await fs.stat(full);

    if (!stat.isFile()) {
      continue;
    }

    const size = stat.size;
    totalBytes += size;
    if (size > largest.size) {
      largest = { path: rel, size };
    }
    fileSizes.push({ path: rel, size });

    if (['.html', '.js', '.css'].includes(path.extname(rel))) {
      try {
        const text = await fs.readFile(full, 'utf8');
        for (const line of text.split('\n')) {
          if (externalLibraryPattern.test(line)) {
            externalLibraryReferences.push({ path: rel, line: line.trim().slice(0, 200) });
          }
        }
      } catch {
        // skip non-text files safely
      }
    }
  }

  const topFiles = fileSizes
    .filter((entry) => entry.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  const pagefindPath = path.join(outputDir, 'pagefind');
  let pagefindBytes = 0;
  try {
    const pagefindEntries = await walkFiles(path.relative(repoRoot, pagefindPath));
    for (const rel of pagefindEntries) {
      const stat = await fs.stat(path.join(pagefindPath, rel));
      if (stat.isFile()) {
        pagefindBytes += stat.size;
      }
    }
  } catch {
    pagefindBytes = 0;
  }

  console.log('Wiki artifact budget report:');
  console.log(`- Total size: ${formatBytes(totalBytes)} (${totalBytes} bytes)`);
  console.log(`- Largest file: ${largest.path} (${formatBytes(largest.size)})`);
  console.log(`- Pagefind size: ${formatBytes(pagefindBytes)} (${pagefindBytes} bytes)`);
  if (!Number.isNaN(buildDurationSeconds)) {
    console.log(`- Build duration: ${buildDurationSeconds}s (${(buildDurationSeconds / 60).toFixed(1)}m)`);
  } else {
    console.log('- Build duration: not provided');
  }
  console.log('- Top 10 largest files:');
  for (const item of topFiles) {
    console.log(`  - ${item.path}: ${formatBytes(item.size)}`);
  }
  if (externalLibraryReferences.length > 0) {
    console.log('- External mermaid/pagefind references detected:');
    for (const ref of externalLibraryReferences) {
      console.log(`  - ${ref.path}: ${ref.line}`);
    }
  }

  const failures = [];
  if (totalBytes > maxTotalBytes) {
    failures.push(`Total artifact size (${formatBytes(totalBytes)}) exceeds max ${formatBytes(maxTotalBytes)}.`);
  }
  if (largest.size > maxLargestBytes) {
    failures.push(`Largest file (${formatBytes(largest.size)} at ${largest.path}) exceeds max ${formatBytes(maxLargestBytes)}.`);
  }
  if (pagefindBytes > maxPagefindBytes) {
    failures.push(`Pagefind output (${formatBytes(pagefindBytes)}) exceeds max ${formatBytes(maxPagefindBytes)}.`);
  }
  if (!Number.isNaN(buildDurationSeconds) && buildDurationSeconds > maxBuildSeconds) {
    failures.push(`Build duration (${buildDurationSeconds}s) exceeds max ${maxBuildSeconds}s.`);
  }
  if (externalLibraryReferences.length > 0) {
    failures.push('External CDN references for mermaid/pagefind were found. Search and diagram assets must be local/bundled.');
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error(`Wiki artifact budget validation failed: ${failures.length} violation(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('Wiki artifact budget validation passed.');
})();
