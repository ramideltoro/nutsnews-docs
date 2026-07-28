import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { wikiContract } from './wiki-contract.mjs';

const repoRoot = process.cwd();
const headerPath = path.join(repoRoot, 'src', 'components', 'Header.astro');
const buildRoot = path.join(repoRoot, '_site');

function assertPattern(value, pattern, message) {
  if (!pattern.test(value)) {
    throw new Error(message);
  }
}

async function readBuilt(route) {
  return fs.readFile(
    path.join(buildRoot, route.replace(/^\/+|\/+$/g, ''), 'index.html'),
    'utf8',
  );
}

function assertAudienceLinks(html, currentAudience, currentRoute, pairedRoute) {
  const simpleRoute = currentAudience === 'simple' ? currentRoute : pairedRoute;
  const technicalRoute = currentAudience === 'technical' ? currentRoute : pairedRoute;
  assertPattern(
    html,
    new RegExp(
      `<a[^>]*href="${simpleRoute}/?"[^>]*aria-label="Simple audience"[^>]*`
        + 'data-audience-control[^>]*data-target-audience="simple"',
    ),
    `${currentRoute} is missing its normal Simple audience link.`,
  );
  assertPattern(
    html,
    new RegExp(
      `<a[^>]*href="${technicalRoute}/?"[^>]*aria-label="Technical audience"[^>]*`
        + 'data-audience-control[^>]*data-target-audience="technical"',
    ),
    `${currentRoute} is missing its normal Technical audience link.`,
  );
  assertPattern(
    html,
    new RegExp(
      `href="${currentRoute}/?"[^>]*aria-current="page"[^>]*`
        + `data-target-audience="${currentAudience}"`,
    ),
    `${currentRoute} must mark the explicit URL audience as current.`,
  );
  assertPattern(
    html,
    new RegExp(`data-preference-key="${wikiContract.route.resolver.preferenceKey}"`),
    `${currentRoute} is missing the contracted preference key.`,
  );
}

async function run() {
  const header = await fs.readFile(headerPath, 'utf8');
  assert.equal(wikiContract.route.resolver.preferenceKey, 'nutsnews.wiki.audience');
  assert.deepEqual(wikiContract.route.resolver.allowedValues, ['simple', 'technical']);
  assert.match(header, /role="group"\s+aria-label="Audience"/);
  assert.match(header, /data-target-audience="simple"/);
  assert.match(header, /data-target-audience="technical"/);
  assert.match(header, /aria-current=/);
  assert.match(header, /from ['"]\.\.\/lib\/audience-routing\.mjs['"]/);
  assert.match(header, /persistAudiencePreference\(localStorage, key, value\)/);
  assert.match(header, /destinationWithCurrentFragment\(\{/);
  assert.match(header, /if \(explicitAudience\) storeAudience\(explicitAudience\)/);
  assert.doesNotMatch(header, /location\.(?:assign|replace)\(/);
  assert.doesNotMatch(header, /<button[^>]*data-audience-control/);

  const [technical, simple, nestedTechnical, nestedSimple] = await Promise.all([
    readBuilt('/technical/project'),
    readBuilt('/simple/project'),
    readBuilt('/technical/archive/nutsnews-app-store-privacy-policy-update-readme'),
    readBuilt('/simple/archive/nutsnews-app-store-privacy-policy-update-readme'),
  ]);
  assertAudienceLinks(technical, 'technical', '/technical/project', '/simple/project');
  assertAudienceLinks(simple, 'simple', '/simple/project', '/technical/project');
  assertAudienceLinks(
    nestedTechnical,
    'technical',
    '/technical/archive/nutsnews-app-store-privacy-policy-update-readme',
    '/simple/archive/nutsnews-app-store-privacy-policy-update-readme',
  );
  assertAudienceLinks(
    nestedSimple,
    'simple',
    '/simple/archive/nutsnews-app-store-privacy-policy-update-readme',
    '/technical/archive/nutsnews-app-store-privacy-policy-update-readme',
  );

  console.log(
    'Audience switch validation passed: normal Simple/Technical links, current-route precedence, '
      + 'paired root/nested routes, fragment preservation, and contracted storage persistence.',
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
