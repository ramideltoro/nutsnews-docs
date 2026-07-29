import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isHistoricalSourcePath,
  wikiContract,
} from './wiki-contract.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = path.join(repoRoot, '_site');
const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

function filterValue(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(
    new RegExp(
      `<meta[^>]+data-pagefind-filter=["']${escapedName}\\[content\\]["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i',
    ),
  );
  return match?.[1];
}

const [headSource, searchSource, articleHeaderSource, collectionRailSource, inventory] = await Promise.all([
  readFile(path.join(repoRoot, 'src/components/Head.astro'), 'utf8'),
  readFile(path.join(repoRoot, 'src/components/AudienceSearch.astro'), 'utf8'),
  readFile(path.join(repoRoot, 'src/components/ArticleHeader.astro'), 'utf8'),
  readFile(path.join(repoRoot, 'src/components/CollectionRail.astro'), 'utf8'),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
]);

for (const name of ['audience', 'collection', 'section', 'status', 'history']) {
  assert.match(
    headSource,
    new RegExp(`data-pagefind-filter=["']${name}\\\\?\\[content\\\\?\\]["']`),
    `Head must expose the ${name} Pagefind filter`,
  );
}

assert.match(
  searchSource,
  /triggerFilters\(/,
  'Pagefind UI must apply fixed filters',
);
assert.match(
  searchSource,
  /audience:\s*\[audience\]/,
  'Pagefind UI must fix its results to the active audience',
);
assert.match(searchSource, /aria-labelledby=/, 'search dialog needs an accessible name');
assert.match(searchSource, /aria-describedby=/, 'search dialog needs an accessible description');
assert.match(searchSource, /aria-live=["']polite["']/, 'search must announce readiness');
assert.match(searchSource, /openButton\.focus\(\)/, 'search must restore trigger focus');
assert.match(
  searchSource,
  /import\(['"]@pagefind\/default-ui['"]\)/,
  'search must use the local Pagefind UI package',
);
assert.doesNotMatch(
  searchSource,
  /https?:\/\//,
  'search must not depend on an external service or asset',
);
assert.match(searchSource, /data-include-history/, 'search needs an Include History control');
assert.match(
  searchSource,
  /\[historyFilterKey\]:\s*\[historyCurrentValue\]/,
  'search must exclude History by default',
);
assert.match(
  searchSource,
  /await pagefindIndex\.filters\(\)/,
  'search must verify the local index before creating the UI',
);
assert.match(
  searchSource,
  /input\.disabled = true/,
  'the fixed audience and History filters must not be user-removable',
);
assert.match(
  searchSource,
  /input\.closest\(['"]details['"]\)\?\.toggleAttribute\(['"]hidden['"], true\)/,
  'the duplicate fixed Pagefind controls must stay hidden',
);
assert.match(
  searchSource,
  /data-search-error/,
  'search initialization failures need a visible recovery state',
);
assert.match(articleHeaderSource, /Page status:/, 'pages must show their status in text');
assert.match(
  collectionRailSource,
  /open=\{group\.entries\.some/,
  'the active History group must open for direct browsing',
);

let indexedPages = 0;
const historyCounts = { current: 0, historical: 0 };
const historicalSources = inventory.entries.filter(
  (entry) => isHistoricalSourcePath(entry.source.path),
).length;
const collectionPages = wikiContract.navigation.rail.length;
const expectedPagesPerAudience = inventory.entries.length + collectionPages;
for (const audience of wikiContract.audiences) {
  const files = (await walk(path.join(outputRoot, audience)))
    .filter((file) => path.basename(file) === 'index.html');
  assert.equal(
    files.length,
    expectedPagesPerAudience,
    `${audience} must publish one searchable page per source plus collection pages`,
  );

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    assert.equal(
      filterValue(html, 'audience'),
      audience,
      `${path.relative(outputRoot, file)} has the wrong audience filter`,
    );
    for (const name of ['collection', 'section', 'status', 'history']) {
      assert.ok(
        filterValue(html, name),
        `${path.relative(outputRoot, file)} is missing the ${name} filter`,
      );
    }
    historyCounts[filterValue(html, 'history')] += 1;
  }
  indexedPages += files.length;
}
assert.deepEqual(
  historyCounts,
  {
    current: (
      inventory.entries.length - historicalSources + collectionPages
    ) * wikiContract.audiences.length,
    historical: historicalSources * wikiContract.audiences.length,
  },
  'Pagefind history classification must cover current and historical pages',
);

const [currentFixture, historicalFixture] = await Promise.all([
  readFile(path.join(outputRoot, 'simple/project/index.html'), 'utf8'),
  readFile(
    path.join(
      outputRoot,
      'simple/updates/readme-footer-search-menu-patch/index.html',
    ),
    'utf8',
  ),
]);
assert.ok(
  /data-page-status="active"[^>]*>[\s\S]*?Page status: Active/.test(currentFixture),
  'current pages need a textual Active status',
);
assert.ok(
  /data-page-status="historical"[^>]*>[\s\S]*?Page status: Historical/.test(historicalFixture),
  'History pages need a textual Historical status',
);
assert.ok(
  /<details data-history-group="updates" open(?:\s|>)/.test(historicalFixture),
  'the active historical page must remain directly browsable in an open group',
);

const pagefindFiles = await walk(path.join(outputRoot, 'pagefind'));
const filterFiles = pagefindFiles.filter((file) => file.endsWith('.pf_filter'));
assert.ok(filterFiles.length >= 5, 'Pagefind must emit filter indexes');
assert.ok(
  pagefindFiles.some((file) => path.basename(file) === 'pagefind-ui.js'),
  'the local Pagefind UI bundle is missing',
);
assert.ok(
  pagefindFiles.some((file) => path.basename(file) === 'pagefind-ui.css'),
  'the local Pagefind UI stylesheet is missing',
);

console.log(
  `Pagefind search valid: ${indexedPages} audience pages, `
    + `${historyCounts.current} current and ${historyCounts.historical} historical; `
    + `5 metadata filters and ${filterFiles.length} filter indexes.`,
);
