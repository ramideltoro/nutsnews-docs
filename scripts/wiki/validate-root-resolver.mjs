import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { wikiContract } from './wiki-contract.mjs';

const repoRoot = process.cwd();
const pagePath = path.join(repoRoot, 'src', 'pages', 'index.astro');
const builtPath = path.join(repoRoot, '_site', 'index.html');

function assertPattern(value, pattern, message) {
  if (!pattern.test(value)) {
    throw new Error(message);
  }
}

async function run() {
  const [page, built] = await Promise.all([
    fs.readFile(pagePath, 'utf8'),
    fs.readFile(builtPath, 'utf8'),
  ]);
  const { resolver } = wikiContract.route;

  assert.equal(wikiContract.route.landingAudience, 'simple');
  assert.equal(resolver.preferenceKey, 'nutsnews.wiki.audience');
  assert.equal(resolver.queryParameter, 'audience');
  assert.deepEqual(
    resolver.precedence,
    ['explicit-choice', 'stored-preference', 'landing-audience'],
  );
  assert.deepEqual(
    resolver.forwarding,
    {
      removeQueryParameters: ['audience'],
      preserveOtherQueryParameters: true,
      preserveFragment: true,
    },
  );

  assert.match(page, /import\.meta\.env\.BASE_URL/);
  assert.match(page, /localStorage\.getItem\(key\)/);
  assert.match(page, /allowed\.includes\(explicit\)/);
  assert.match(page, /allowed\.includes\(stored\)/);
  assert.match(page, /current\.searchParams\.delete\(queryParameter\)/);
  assert.match(page, /target\.search = current\.searchParams\.toString\(\)/);
  assert.match(page, /target\.hash = current\.hash/);
  assert.match(page, /location\.replace\(target\.href\)/);
  assert.match(page, /target\.href !== current\.href/);
  assert.doesNotMatch(page, /location\.assign\(/);
  assert.doesNotMatch(page, /http-equiv=["']refresh/i);

  assertPattern(
    built,
    /<main[^>]*data-root-resolver/,
    'Root build is missing the resolver landmark.',
  );
  assertPattern(
    built,
    /<nav[^>]*aria-label="Choose a wiki audience"/,
    'Root build is missing the fallback audience navigation.',
  );
  assertPattern(
    built,
    /<a[^>]*href="\/simple\/"[^>]*data-audience-destination="simple"/,
    'Root build is missing the no-JavaScript Simple link.',
  );
  assertPattern(
    built,
    /<a[^>]*href="\/technical\/"[^>]*data-audience-destination="technical"/,
    'Root build is missing the no-JavaScript Technical link.',
  );
  assertPattern(
    built,
    /<noscript>[\s\S]*Both links above work without it/,
    'Root build is missing the no-JavaScript explanation.',
  );
  assertPattern(
    built,
    /data-default-audience="simple"/,
    'Root build must expose the Simple default.',
  );

  console.log(
    'Root resolver validation passed: Simple default, stored/explicit precedence, normal fallback '
      + 'links, query control removal, query/fragment forwarding, and base-aware destinations.',
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
