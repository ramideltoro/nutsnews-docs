import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  destinationWithCurrentFragment,
  persistAudiencePreference,
  readAudiencePreference,
  resolvedAudienceUrl,
  selectAudience,
} from '../../src/lib/audience-routing.mjs';
import {
  formatWikiRouteErrors,
  loadWikiRouteSnapshot,
  validateWikiRouteSnapshot,
} from './wiki-route-contract.mjs';

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();

async function build(base) {
  try {
    await execFileAsync('npm', ['run', 'build'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        WIKI_BASE_PATH: base,
      },
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    const tail = `${error.stdout || ''}\n${error.stderr || ''}`
      .trim()
      .split('\n')
      .slice(-30)
      .join('\n');
    throw new Error(`offline ${base} build failed:\n${tail}`);
  }
}

function assertValid(snapshot) {
  const errors = validateWikiRouteSnapshot(snapshot);
  assert.deepEqual(errors, [], formatWikiRouteErrors(errors));
  assert.ok(snapshot.entries.some((entry) => !entry.source.path.includes('/')));
  assert.ok(snapshot.entries.some((entry) => entry.source.path.includes('/')));
  for (const audience of ['simple', 'technical']) {
    assert.equal(
      snapshot.entries.filter((entry) => entry[audience].html).length,
      snapshot.entries.length,
      `${audience} must load every root and nested content entry`,
    );
  }
}

test('audience precedence, persistence, query forwarding, and fragments are deterministic', () => {
  const allowed = ['simple', 'technical'];
  assert.equal(
    selectAudience({
      explicit: 'technical',
      stored: 'simple',
      fallback: 'simple',
      allowed,
    }),
    'technical',
  );
  assert.equal(
    selectAudience({
      explicit: 'invalid',
      stored: 'technical',
      fallback: 'simple',
      allowed,
    }),
    'technical',
  );
  assert.equal(
    selectAudience({
      explicit: null,
      stored: 'invalid',
      fallback: 'simple',
      allowed,
    }),
    'simple',
  );

  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(readAudiencePreference(storage, 'nutsnews.wiki.audience'), null);
  assert.equal(
    persistAudiencePreference(storage, 'nutsnews.wiki.audience', 'technical', allowed),
    true,
  );
  assert.equal(readAudiencePreference(storage, 'nutsnews.wiki.audience'), 'technical');
  assert.equal(
    persistAudiencePreference(storage, 'nutsnews.wiki.audience', 'invalid', allowed),
    false,
  );
  assert.equal(
    readAudiencePreference({ getItem: () => { throw new Error('blocked'); } }, 'key'),
    null,
  );

  assert.equal(
    resolvedAudienceUrl({
      currentHref: 'https://wiki.nutsnews.com/wiki-preview/?audience=technical&ref=qa#details',
      destinationHref: '/wiki-preview/technical/',
      queryParameter: 'audience',
    }),
    'https://wiki.nutsnews.com/wiki-preview/technical/?ref=qa#details',
  );
  assert.equal(
    destinationWithCurrentFragment({
      currentHref: 'https://wiki.nutsnews.com/simple/project/#deployment',
      destinationHref: '/technical/project/?view=full',
    }),
    '/technical/project/?view=full#deployment',
  );
});

test('offline content loading and audience routes pass under custom and default bases', {
  timeout: 120_000,
}, async (t) => {
  await t.test('custom /wiki-preview/ base', async () => {
    await build('/wiki-preview/');
    const snapshot = await loadWikiRouteSnapshot({
      repoRoot,
      base: '/wiki-preview/',
    });
    assertValid(snapshot);
  });

  await t.test('default / base', async () => {
    await build('/');
    const snapshot = await loadWikiRouteSnapshot({
      repoRoot,
      base: '/',
    });
    assertValid(snapshot);

    const brokenMetadata = structuredClone(snapshot);
    brokenMetadata.entries[0].simple.html = brokenMetadata.entries[0].simple.html.replace(
      'name="nutsnews:audience" content="simple"',
      'name="nutsnews:audience" content="broken"',
    );
    const metadataErrors = validateWikiRouteSnapshot(brokenMetadata);
    assert.ok(
      metadataErrors.some((error) => error.message.includes('audience/Pagefind metadata')),
      'broken audience metadata fixture must fail',
    );

    const brokenLink = structuredClone(snapshot);
    brokenLink.entries[0].technical.html = brokenLink.entries[0].technical.html.replace(
      /href="\/simple\/[^"]+"/,
      'href="/simple/definitely-missing/"',
    );
    const linkErrors = validateWikiRouteSnapshot(brokenLink);
    assert.ok(
      linkErrors.some((error) => error.message.includes('does not resolve')),
      'broken internal-link fixture must fail',
    );
  });
});
