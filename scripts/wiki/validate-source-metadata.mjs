import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  githubEditUrlForSource,
  selectLastUpdatedDate,
  sourceFileForAudience,
} from './source-metadata.mjs';
import { wikiContract } from './wiki-contract.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, '_site');
const inventory = JSON.parse(
  await fs.readFile(
    path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json'),
    'utf8',
  ),
);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function outputPathForRoute(route) {
  return path.join(outputRoot, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

check(
  sourceFileForAudience('technical', 'archive/ROOT GUIDE.md') === 'archive/ROOT GUIDE.md',
  'Technical source mapping must preserve nested canonical paths',
);
check(
  sourceFileForAudience('simple', 'archive/ROOT GUIDE.md')
    === 'audiences/simple/archive/ROOT GUIDE.md',
  'Simple source mapping must preserve nested mirror paths',
);
check(
  githubEditUrlForSource('archive/ROOT GUIDE#1.md').endsWith(
    '/archive/ROOT%20GUIDE%231.md',
  ),
  'GitHub edit URLs must encode each nested path segment',
);
check(
  selectLastUpdatedDate({
    sourceGitDate: '',
    headGitDate: '2026-01-02T03:04:05Z',
    fileModifiedDate: '2026-02-03T04:05:06Z',
  }) === '2026-01-02T03:04:05.000Z',
  'Shallow Git history must fall back to a valid HEAD commit date',
);

let validatedPages = 0;
let nestedPages = 0;
for (const entry of inventory.entries) {
  for (const audience of wikiContract.audiences) {
    const sourcePath = sourceFileForAudience(audience, entry.source.path);
    await fs.access(path.join(repoRoot, sourcePath));
    const editUrl = githubEditUrlForSource(sourcePath);
    const html = await fs.readFile(
      outputPathForRoute(entry[audience].route),
      'utf8',
    );

    check(
      html.includes(`href="${editUrl}" data-edit-source`),
      `${entry[audience].route} is missing its exact source edit URL`,
    );
    check(
      new RegExp(
        `<code[^>]*data-source-path[^>]*>${escapeRegExp(sourcePath)}</code>`,
      ).test(html),
      `${entry[audience].route} is missing its source path`,
    );
    const date = html.match(
      /<time[^>]*datetime="([^"]+)"[^>]*data-last-updated[^>]*>/,
    )?.[1];
    check(date && !Number.isNaN(new Date(date).valueOf()), `${entry[audience].route} has no valid date`);
    check(
      /<dd[^>]*data-source-status[^>]*>[^<]+<\/dd>/.test(html),
      `${entry[audience].route} is missing textual page status`,
    );
    if (entry.source.path.includes('/')) nestedPages += 1;
    validatedPages += 1;
  }
}

for (const audience of wikiContract.audiences) {
  for (const item of wikiContract.navigation.rail) {
    const html = await fs.readFile(
      outputPathForRoute(`/${audience}/collections/${item.id}`),
      'utf8',
    );
    check(
      !html.includes('data-edit-source'),
      `virtual collection ${audience}/${item.id} must not emit an edit URL`,
    );
  }
}

console.log(
  `Source metadata valid: ${validatedPages} audience pages, ${nestedPages} nested mappings, `
    + 'valid Git dates with shallow fallback, and 14 virtual pages without edit URLs.',
);
