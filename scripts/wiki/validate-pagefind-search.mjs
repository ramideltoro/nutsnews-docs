import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = path.join(repoRoot, '_site');

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

const [headSource, searchSource] = await Promise.all([
  readFile(path.join(repoRoot, 'src/components/Head.astro'), 'utf8'),
  readFile(path.join(repoRoot, 'src/components/AudienceSearch.astro'), 'utf8'),
]);

for (const name of ['audience', 'collection', 'section', 'status']) {
  assert.match(
    headSource,
    new RegExp(`data-pagefind-filter=["']${name}\\\\?\\[content\\\\?\\]["']`),
    `Head must expose the ${name} Pagefind filter`,
  );
}

assert.match(
  searchSource,
  /triggerFilters\(\{\s*audience:\s*\[audience\]\s*\}\)/,
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

let indexedPages = 0;
for (const audience of ['simple', 'technical']) {
  const files = (await walk(path.join(outputRoot, audience)))
    .filter((file) => path.basename(file) === 'index.html');
  assert.equal(files.length, 234, `${audience} must publish 234 searchable pages`);

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    assert.equal(
      filterValue(html, 'audience'),
      audience,
      `${path.relative(outputRoot, file)} has the wrong audience filter`,
    );
    for (const name of ['collection', 'section', 'status']) {
      assert.ok(
        filterValue(html, name),
        `${path.relative(outputRoot, file)} is missing the ${name} filter`,
      );
    }
  }
  indexedPages += files.length;
}

const pagefindFiles = await walk(path.join(outputRoot, 'pagefind'));
const filterFiles = pagefindFiles.filter((file) => file.endsWith('.pf_filter'));
assert.ok(filterFiles.length >= 4, 'Pagefind must emit filter indexes');
assert.ok(
  pagefindFiles.some((file) => path.basename(file) === 'pagefind-ui.js'),
  'the local Pagefind UI bundle is missing',
);
assert.ok(
  pagefindFiles.some((file) => path.basename(file) === 'pagefind-ui.css'),
  'the local Pagefind UI stylesheet is missing',
);

console.log(
  `Pagefind search valid: ${indexedPages} audience pages, 4 metadata filters, ${filterFiles.length} filter indexes.`,
);
