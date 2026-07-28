import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { wikiContract } from './wiki-contract.mjs';

const repoRoot = process.cwd();
const buildRoot = path.join(repoRoot, '_site');
const headerPath = path.join(repoRoot, 'src', 'components', 'Header.astro');
const railPath = path.join(repoRoot, 'src', 'components', 'CollectionRail.astro');
const mobileMenuPath = path.join(repoRoot, 'src', 'components', 'MobileMenuToggle.astro');
const pagePath = path.join(repoRoot, 'src', 'pages', '[audience]', 'collections', '[section].astro');

async function run() {
  const [header, rail, mobileMenu, page] = await Promise.all([
    fs.readFile(headerPath, 'utf8'),
    fs.readFile(railPath, 'utf8'),
    fs.readFile(mobileMenuPath, 'utf8'),
    fs.readFile(pagePath, 'utf8'),
  ]);

  assert.equal(wikiContract.navigation.rail.length, 7);
  assert.equal(
    new Set(wikiContract.navigation.rail.map((item) => item.id)).size,
    wikiContract.navigation.rail.length,
  );
  assert.match(header, /<div class="wiki-header">/);
  assert.match(header, /<nav class="global-tools" aria-label="Wiki tools">/);
  assert.match(header, /<Search \/>/);
  assert.match(header, />History<\/a>/);
  assert.match(header, /\n\s+GitHub\n\s+<\/a>/);
  assert.match(header, /data-audience-control/);
  assert.match(header, /<ThemeSelect \/>/);
  assert.match(header, /min-height:\s*var\(--wiki-touch-target\)/);
  assert.match(header, /@media \(max-width: 30rem\)/);
  assert.match(header, /\.site-title span/);
  const searchIndex = header.indexOf('<Search />');
  const historyIndex = header.indexOf('>History</a>');
  const githubIndex = header.indexOf('\n      GitHub\n');
  const audienceIndex = header.indexOf('data-audience-control');
  assert.ok(searchIndex < historyIndex);
  assert.ok(historyIndex < githubIndex);
  assert.ok(githubIndex < audienceIndex);
  assert.doesNotMatch(header, /tabindex=["']?[1-9]/i);

  assert.match(rail, /<nav class="collection-rail" aria-label="Wiki collections"/);
  assert.match(rail, /aria-controls="[^"]*collection-rail-list[^"]*"/);
  assert.match(rail, /aria-expanded="true"/);
  assert.match(rail, /aria-current=/);
  assert.match(rail, /id="contextual-navigation"/);
  assert.match(rail, /aria-labelledby="contextual-navigation-title"/);
  assert.match(rail, /getCollection\('docs'\)/);
  assert.match(rail, /data-history-group=/);
  assert.doesNotMatch(rail, /<details[^>]*\sopen(?:\s|>|=)/);
  assert.match(rail, /data-collection-rail-collapsed/);
  assert.match(rail, /var\(--wiki-/);
  assert.doesNotMatch(rail, /tabindex=["']?[1-9]/i);
  assert.match(mobileMenu, /<starlight-menu-button[^>]*class="menu-toggle[^"]*"[^>]*aria-expanded="false"/);
  assert.match(mobileMenu, /<button[\s\S]*aria-expanded="false"/);
  assert.match(mobileMenu, /aria-controls="starlight__sidebar"/);
  assert.match(mobileMenu, /event\.key === 'Escape'/);
  assert.match(mobileMenu, /this\.pageScroll = window\.scrollY/);
  assert.match(mobileMenu, /this\.sidebarScroll = sidebar\?\.scrollTop/);
  assert.match(mobileMenu, /element\.toggleAttribute\('inert', expanded\)/);
  assert.match(mobileMenu, /sidebar\.scrollTop = this\.sidebarScroll/);
  assert.match(mobileMenu, /window\.scrollTo\(\{ top: this\.pageScroll/);
  assert.match(mobileMenu, /this\.btn\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(mobileMenu, /body\[data-mobile-menu-expanded\]/);
  assert.doesNotMatch(mobileMenu, /tabindex=["']?[1-9]/i);
  assert.match(page, /getStaticPaths/);
  assert.match(page, /getCollection\('docs'\)/);

  let collectionTargets = 0;
  for (const audience of wikiContract.audiences) {
    for (const item of wikiContract.navigation.rail) {
      const target = path.join(
        buildRoot,
        audience,
        'collections',
        item.id,
        'index.html',
      );
      const html = await fs.readFile(target, 'utf8');
      assert.match(html, /<header class="header/);
      assert.match(html, /aria-label="Wiki tools"/);
      assert.match(html, /aria-label="Wiki collections"/);
      assert.match(
        html,
        new RegExp(`aria-current="page" data-collection="${item.id}"`),
      );
      assert.match(html, /class="collection-list/);
      collectionTargets += 1;
    }
  }

  const desktopFixture = await fs.readFile(
    path.join(buildRoot, 'technical', 'project', 'index.html'),
    'utf8',
  );
  for (const item of wikiContract.navigation.rail) {
    assert.match(
      desktopFixture,
      new RegExp(`href="/technical/collections/${item.id}/"`),
    );
  }
  assert.match(desktopFixture, /aria-current="page" data-collection="overview"/);
  assert.match(desktopFixture, /id="contextual-navigation"/);
  assert.match(desktopFixture, /<starlight-menu-button[^>]*aria-expanded="false"/);
  assert.match(desktopFixture, /<button[^>]*aria-expanded="false"[^>]*aria-label="Menu"/);
  assert.match(desktopFixture, /href="\/technical\/project\/" aria-current="page"/);
  const historyGroups = [...desktopFixture.matchAll(/<details data-history-group="([^"]+)"[^>]*>/g)];
  assert.ok(historyGroups.length > 0, 'Expected contextual History groups in the project fixture.');
  for (const [details] of historyGroups) {
    assert.doesNotMatch(details, /\sopen(?:\s|>|=)/);
  }

  console.log(
    `Wiki shell validation passed: semantic header and collection landmarks, `
      + `${wikiContract.navigation.rail.length} ordered rail items, `
      + `${collectionTargets} working audience collection targets, `
      + `${historyGroups.length} initially collapsed History groups, `
      + 'contextual article state, mobile focus/scroll restoration, and DOM-native keyboard order.',
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
