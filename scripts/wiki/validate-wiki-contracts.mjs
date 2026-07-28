import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  classifySourcePath,
  deriveAudienceRoute,
  deriveCollection,
  deriveDiagramPath,
  deriveOrder,
  deriveSection,
  deriveSlugFromSource,
  deriveStatus,
  diagramPathFromSource,
  historyGroupForSource,
  isHistoricalSourcePath,
  normalizeRoute,
  publishedRoute,
  simplePathFromSource,
  validateMirrorInventory,
  wikiContract,
  wikiContractFixtures,
  wikiContractSnapshot,
} from './wiki-contract.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

const repoRoot = process.cwd();
const expectedSourceCount = 227;
const humanContractPath = path.join(repoRoot, 'scripts', 'wiki', 'WIKI_CONTRACT.md');

async function walkMarkdownFiles(rootDir, relativeRoot = '') {
  const absolute = path.join(rootDir, relativeRoot);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (wikiContract.exclusions.ignoreDirs.has(entry.name)) {
      continue;
    }

    const nextRelative = path.join(relativeRoot, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdownFiles(rootDir, nextRelative)));
      continue;
    }

    if (
      entry.isFile()
      && entry.name.endsWith(wikiContract.markdown.fileExtension)
      && !wikiContract.exclusions.ignoreFiles.has(entry.name)
    ) {
      out.push(nextRelative);
    }
  }

  return out;
}

function recordAssertion(errors, label, callback) {
  try {
    callback();
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }
}

async function validateContractDefinition(errors) {
  const expectedFields = ['title', 'description', 'slug', 'collection', 'section', 'status', 'order'];
  const sourceAreaIds = wikiContract.paths.sourceAreas.map((area) => area.id).sort();
  const fixtureAreaIds = wikiContractFixtures.map((fixture) => fixture.area).sort();

  recordAssertion(errors, 'expert frontmatter fields', () => {
    assert.deepEqual(wikiContract.frontmatter.expertFields, expectedFields);
    assert.deepEqual(wikiContract.frontmatter.requiredOutputFields, expectedFields);
  });

  recordAssertion(errors, 'source area fixture coverage', () => {
    assert.deepEqual(fixtureAreaIds, sourceAreaIds);
    assert.ok(wikiContractFixtures.some((fixture) => !fixture.source.includes('/')));
    assert.ok(wikiContractFixtures.some((fixture) => fixture.source.includes('/')));
  });

  recordAssertion(errors, 'unclassified source fixture', () => {
    assert.throws(
      () => classifySourcePath('unclassified/FUTURE_GUIDE.md'),
      /unclassified canonical wiki source path/,
    );
  });

  recordAssertion(errors, 'audience mirror fixtures', () => {
    assert.deepEqual(
      validateMirrorInventory(
        ['ROOT.md', 'updates/NESTED.md'],
        ['ROOT.md', 'updates/NESTED.md'],
      ),
      [],
    );
    const mirrorErrors = validateMirrorInventory(
      ['ROOT.md', 'updates/MISSING.md'],
      ['ROOT.md', 'orphan/EXTRA.md', 'ORPHAN/extra.md'],
    );
    assert.ok(mirrorErrors.some((error) => error.includes('missing simple mirror')));
    assert.ok(mirrorErrors.some((error) => error.includes('orphan simple mirror')));
    assert.ok(mirrorErrors.some((error) => error.includes('duplicate simple mirror')));
  });

  for (const fixture of wikiContractFixtures) {
    recordAssertion(errors, `${fixture.area} contract fixture`, () => {
      assert.equal(classifySourcePath(fixture.source), fixture.area);
      assert.equal(deriveSlugFromSource(fixture.source), fixture.slug);
      assert.equal(simplePathFromSource(fixture.source), fixture.simplePath);
      assert.equal(diagramPathFromSource(fixture.source), fixture.diagramPath);
      assert.equal(deriveAudienceRoute('technical', fixture.source), fixture.technicalRoute);
      assert.equal(deriveAudienceRoute('simple', fixture.source), fixture.simpleRoute);
      assert.equal(publishedRoute(fixture.technicalRoute), `${fixture.technicalRoute}/`);
      assert.equal(publishedRoute(fixture.simpleRoute), `${fixture.simpleRoute}/`);
    });
  }

  const precedenceFixture = {
    slug: 'flat-slug',
    source_route: '/technical/flat-route/',
    simple_route: '/simple/flat-route/',
    primary_diagram: 'diagrams/FLAT.mmd',
    collection: 'start-here',
    section: 'overview',
    status: 'active',
    order: 1,
    wiki: {
      slug: 'nested-slug',
      source_route: '/technical/nested-route/',
      simple_route: '/simple/nested-route/',
      primary_diagram: { file: 'diagrams/NESTED.mmd' },
      collection: 'platform-and-data',
      section: 'core-platform',
      status: 'draft',
      order: 7,
    },
  };

  recordAssertion(errors, 'frontmatter precedence fixture', () => {
    assert.equal(deriveSlugFromSource('FIXTURE.md', precedenceFixture), 'nested-slug');
    assert.equal(
      deriveAudienceRoute('technical', 'FIXTURE.md', precedenceFixture),
      '/technical/nested-route',
    );
    assert.equal(
      deriveAudienceRoute('simple', 'FIXTURE.md', precedenceFixture),
      '/simple/nested-route',
    );
    assert.equal(deriveDiagramPath(precedenceFixture, 'FIXTURE.md'), 'diagrams/NESTED.mmd');
    assert.equal(deriveCollection(precedenceFixture), 'platform-and-data');
    assert.equal(deriveSection(precedenceFixture), 'core-platform');
    assert.equal(deriveStatus(precedenceFixture), 'draft');
    assert.equal(deriveOrder(precedenceFixture), 7);
  });

  recordAssertion(errors, 'root resolver contract', () => {
    assert.equal(wikiContract.route.root, '/');
    assert.equal(wikiContract.route.landingAudience, 'simple');
    assert.deepEqual(
      wikiContract.route.resolver.precedence,
      ['explicit-choice', 'stored-preference', 'landing-audience'],
    );
    assert.equal(wikiContract.route.resolver.queryParameter, 'audience');
    assert.deepEqual(
      wikiContract.route.resolver.forwarding,
      {
        removeQueryParameters: ['audience'],
        preserveOtherQueryParameters: true,
        preserveFragment: true,
      },
    );
    assert.equal(
      wikiContract.route.resolver.destinations[wikiContract.route.landingAudience],
      '/simple/',
    );
  });

  recordAssertion(errors, 'History classification and search contract', () => {
    assert.deepEqual(
      wikiContract.history.groups.map(({ id, label }) => ({ id, label })),
      [
        { id: 'updates', label: 'Updates' },
        { id: 'reports', label: 'Reports' },
        { id: 'archive', label: 'Archives' },
        { id: 'ios', label: 'Classified notes' },
      ],
    );
    assert.equal(historyGroupForSource('updates/RELEASE.md')?.id, 'updates');
    assert.equal(isHistoricalSourcePath('archive/ROOT_CLEANUP.md'), true);
    assert.equal(isHistoricalSourcePath('PROJECT.md'), false);
    assert.equal(isHistoricalSourcePath('virtual:collections/overview'), false);
    assert.equal(wikiContract.history.searchFilter.defaultIncludeHistory, false);
  });

  recordAssertion(errors, 'navigation collection contract', () => {
    const ids = wikiContract.navigation.collections.map((collection) => collection.id);
    const acceptedSections = new Set(
      wikiContract.navigation.collections.flatMap((collection) => collection.sections),
    );
    const railIds = wikiContract.navigation.rail.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes(wikiContract.defaults.collection));
    assert.equal(new Set(railIds).size, railIds.length);
    assert.equal(railIds.length, 7);
    assert.deepEqual(new Set(railIds), acceptedSections);
    for (const collection of wikiContract.navigation.collections) {
      assert.ok(collection.label);
      assert.ok(Number.isInteger(collection.order));
      assert.ok(collection.sections.length > 0);
    }
  });

  recordAssertion(errors, 'status contract', () => {
    assert.equal(new Set(wikiContract.statusValues).size, wikiContract.statusValues.length);
    assert.ok(wikiContract.statusValues.includes(wikiContract.defaults.status));
  });

  try {
    const humanContract = await fs.readFile(humanContractPath, 'utf8');
    const match = humanContract.match(
      /<!-- wiki-contract:start -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- wiki-contract:end -->/,
    );
    assert.ok(match, 'missing machine-checked contract block');
    assert.deepEqual(JSON.parse(match[1]), wikiContractSnapshot());
  } catch (error) {
    errors.push(`human contract mismatch: ${error.message}`);
  }
}

async function run() {
  const sourcePaths = (await walkMarkdownFiles(repoRoot))
    .filter((sourcePath) => sourcePath !== 'index.md' && !sourcePath.startsWith('audiences/'))
    .sort((left, right) => left.localeCompare(right));
  const errors = [];
  const warnings = [];
  const routeMap = new Map();
  const slugMap = new Map();
  const sourceAreaCounts = new Map(wikiContract.paths.sourceAreas.map((area) => [area.id, 0]));
  const collections = new Map(
    wikiContract.navigation.collections.map((collection) => [collection.id, collection]),
  );

  await validateContractDefinition(errors);

  for (const sourcePath of sourcePaths) {
    const sourceRaw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const sourceParsed = parseMarkdownFrontmatter(sourceRaw);
    const sourceData = sourceParsed.data || {};
    const area = classifySourcePath(sourcePath);
    sourceAreaCounts.set(area, (sourceAreaCounts.get(area) || 0) + 1);

    const technicalRoute = deriveAudienceRoute('technical', sourcePath, sourceData);
    const requiredSimplePath = simplePathFromSource(sourcePath);
    let simpleData = {};

    try {
      const simpleRaw = await fs.readFile(path.join(repoRoot, requiredSimplePath), 'utf8');
      const simpleParsed = parseMarkdownFrontmatter(simpleRaw);
      simpleData = simpleParsed.data || {};
    } catch {
      errors.push(`missing simple mirror: ${requiredSimplePath}`);
    }

    const simpleRoute = deriveAudienceRoute('simple', sourcePath, sourceData);
    const technicalRouteNorm = normalizeRoute(technicalRoute);
    const simpleRouteNorm = normalizeRoute(simpleRoute);
    const slug = deriveSlugFromSource(sourcePath, sourceData);
    const collection = deriveCollection(sourceData);
    const section = deriveSection(sourceData);
    const status = deriveStatus(sourceData);
    const order = deriveOrder(sourceData, sourcePaths.indexOf(sourcePath) + 1);
    const diagram = deriveDiagramPath(sourceData, sourcePath);

    if (!technicalRouteNorm?.startsWith(wikiContract.route.technicalPrefix)) {
      errors.push(`technical route outside namespace for ${sourcePath}: ${technicalRouteNorm}`);
    }

    if (!simpleRouteNorm?.startsWith(wikiContract.route.simplePrefix)) {
      errors.push(`simple route outside namespace for ${sourcePath}: ${simpleRouteNorm}`);
    }

    if (!publishedRoute(technicalRouteNorm).endsWith('/')) {
      errors.push(`technical public route lacks trailing slash for ${sourcePath}`);
    }

    if (!publishedRoute(simpleRouteNorm).endsWith('/')) {
      errors.push(`simple public route lacks trailing slash for ${sourcePath}`);
    }

    if (!diagram.startsWith(`${wikiContract.paths.diagramRoot}/`)) {
      errors.push(`diagram outside contract root for ${sourcePath}: ${diagram}`);
    }

    if (routeMap.has(technicalRouteNorm)) {
      errors.push(
        `duplicate technical route ${technicalRouteNorm} for ${sourcePath} and ${routeMap.get(technicalRouteNorm)}`,
      );
    } else {
      routeMap.set(technicalRouteNorm, sourcePath);
    }

    if (routeMap.has(simpleRouteNorm)) {
      errors.push(
        `duplicate simple route ${simpleRouteNorm} for ${sourcePath} and ${routeMap.get(simpleRouteNorm)}`,
      );
    } else {
      routeMap.set(simpleRouteNorm, sourcePath);
    }

    if (slugMap.has(slug) && slugMap.get(slug) !== sourcePath) {
      errors.push(`duplicate slug ${slug} from ${sourcePath} and ${slugMap.get(slug)}`);
    } else {
      slugMap.set(slug, sourcePath);
    }

    if (!sourceData.title && !simpleData.title) {
      errors.push(`missing title in both source and simple docs for ${sourcePath}`);
    }

    if (!sourceData.description && !sourceParsed.content.trim()) {
      warnings.push(`missing source description and prose in ${sourcePath}`);
    }

    const collectionContract = collections.get(collection);
    if (!collectionContract) {
      errors.push(`unknown navigation collection ${collection} in ${sourcePath}`);
    } else if (!collectionContract.sections.includes(section)) {
      errors.push(`section ${section} is not in collection ${collection} for ${sourcePath}`);
    }

    const explicitStatus = sourceData.wiki?.status ?? sourceData.status;
    if (explicitStatus && !wikiContract.statusValues.includes(explicitStatus)) {
      errors.push(`invalid wiki status ${explicitStatus} in ${sourcePath}`);
    }

    const explicitOrder = sourceData.wiki?.order ?? sourceData.order;
    if (explicitOrder !== undefined && !Number.isFinite(Number.parseInt(explicitOrder, 10))) {
      errors.push(`invalid wiki order ${explicitOrder} in ${sourcePath}`);
    }

    if (!wikiContract.statusValues.includes(status)) {
      errors.push(`derived invalid wiki status ${status} in ${sourcePath}`);
    }

    if (!Number.isInteger(order)) {
      errors.push(`derived non-integer wiki order ${order} in ${sourcePath}`);
    }
  }

  for (const [area, count] of sourceAreaCounts) {
    if (count === 0) {
      errors.push(`source area has no canonical fixtures or documents: ${area}`);
    }
  }

  if (sourcePaths.length !== expectedSourceCount) {
    errors.push(`expected ${expectedSourceCount} sources, found ${sourcePaths.length}`);
  }

  if (warnings.length > 0) {
    console.log('Contract warnings:');
    for (const item of warnings.slice(0, 40)) {
      console.log(`- ${item}`);
    }
    if (warnings.length > 40) {
      console.log(`- ... and ${warnings.length - 40} more`);
    }
  }

  if (errors.length > 0) {
    console.error('Contract errors:');
    for (const item of errors.slice(0, 40)) {
      console.error(`- ${item}`);
    }
    if (errors.length > 40) {
      console.error(`- ... and ${errors.length - 40} more`);
    }
    process.exit(1);
  }

  console.log(
    `Contract validation passed for ${sourcePaths.length} source documents across ${sourceAreaCounts.size} source areas.`,
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
