import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  deriveAudienceRoute,
  deriveSlugFromSource,
  normalizeRoute,
  wikiContract,
} from './wiki-contract.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

const repoRoot = process.cwd();
const expectedSourceCount = 227;

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

    if (entry.isFile() && entry.name.endsWith(wikiContract.markdown.fileExtension) && !wikiContract.exclusions.ignoreFiles.has(entry.name)) {
      out.push(nextRelative);
    }
  }

  return out;
}

async function run() {
  const sourcePaths = (await walkMarkdownFiles(repoRoot)).filter((p) => p !== 'index.md' && !p.startsWith('audiences/'));
  const errors = [];
  const warnings = [];
  const routeMap = new Map();
  const slugMap = new Map();

  for (const sourcePath of sourcePaths) {
    const sourceRaw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const sourceParsed = parseMarkdownFrontmatter(sourceRaw);
    const sourceData = sourceParsed.data || {};

    const technicalRoute = deriveAudienceRoute('technical', sourcePath, sourceData);
    const requiredSimplePath = path.join(wikiContract.paths.simpleSourceRoot, sourcePath);
    let simpleData = {};

    try {
      const simpleRaw = await fs.readFile(path.join(repoRoot, requiredSimplePath), 'utf8');
      const simpleParsed = parseMarkdownFrontmatter(simpleRaw);
      simpleData = simpleParsed.data || {};
    } catch {
      errors.push(`missing simple mirror: ${requiredSimplePath}`);
    }

    const simpleRoute = deriveAudienceRoute('simple', sourcePath, simpleData);
    const technicalRouteNorm = normalizeRoute(technicalRoute);
    const simpleRouteNorm = normalizeRoute(simpleRoute);
    const slug = deriveSlugFromSource(sourcePath);

    if (routeMap.has(technicalRouteNorm)) {
      errors.push(`duplicate technical route ${technicalRouteNorm} for ${sourcePath} and ${routeMap.get(technicalRouteNorm)}`);
    } else {
      routeMap.set(technicalRouteNorm, sourcePath);
    }

    if (routeMap.has(simpleRouteNorm)) {
      errors.push(`duplicate simple route ${simpleRouteNorm} for ${sourcePath} and ${routeMap.get(simpleRouteNorm)}`);
    } else {
      routeMap.set(simpleRouteNorm, sourcePath);
    }

    if (slugMap.has(slug) && slugMap.get(slug) !== sourcePath) {
      warnings.push(`duplicate slug ${slug} from ${sourcePath} and ${slugMap.get(slug)}`);
    } else {
      slugMap.set(slug, sourcePath);
    }

    const titleData = sourceData.title || simpleData.title;
    const descriptionData = sourceData.description || simpleData.description;
    const collectionData = sourceData.wiki?.collection || sourceData.collection || simpleData.wiki?.collection || simpleData.collection;
    const sectionData = sourceData.wiki?.section || sourceData.section || simpleData.wiki?.section || simpleData.section;
    const statusData = sourceData.wiki?.status || sourceData.status || simpleData.wiki?.status || simpleData.status;
    const orderData = sourceData.wiki?.order ?? sourceData.order ?? simpleData.wiki?.order ?? simpleData.order;

    if (!titleData) {
      errors.push(`missing title in both source and simple docs for ${sourcePath}`);
    }

    if (!descriptionData) {
      warnings.push(`missing source description in ${sourcePath}`);
    }

    if (!collectionData) {
      warnings.push(`missing wiki.collection in ${sourcePath}`);
    }

    if (!sectionData) {
      warnings.push(`missing wiki.section in ${sourcePath}`);
    }

    if (!statusData) {
      warnings.push(`missing wiki.status in ${sourcePath}`);
    }

    if (!orderData && orderData !== 0) {
      warnings.push(`missing wiki.order in ${sourcePath}`);
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

  console.log(`Contract validation passed for ${sourcePaths.length} source documents.`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
