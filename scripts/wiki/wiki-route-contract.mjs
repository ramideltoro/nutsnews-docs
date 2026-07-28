import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  normalizeRoute,
  publishedRoute,
  technicalMirrorPathFromSource,
  wikiContract,
} from './wiki-contract.mjs';

function posix(value) {
  return value.split(path.sep).join('/');
}

export function normalizeBasePath(value = '/') {
  const trimmed = `${value}`.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

function basePrefix(base) {
  return base === '/' ? '' : base.slice(0, -1);
}

function withBase(base, route) {
  return `${basePrefix(base)}${publishedRoute(route)}`;
}

async function walk(root, relative = '') {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(root, next)));
    else if (entry.isFile()) files.push(posix(next));
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function generatedPathFor(repoRoot, audience, route) {
  const normalized = normalizeRoute(route);
  const prefix = normalizeRoute(wikiContract.route[`${audience}Prefix`]).replace(/^\//, '');
  const cleaned = normalized.replace(/^\//, '').replace(/\/+$/, '');
  const relative = cleaned === prefix
    ? `${audience}.md`
    : `${audience}/${cleaned.startsWith(`${prefix}/`) ? cleaned.slice(prefix.length + 1) : cleaned}/index.md`;
  return path.join(repoRoot, wikiContract.generatedContentRoot, relative);
}

function builtRelativePathForRoute(route) {
  const cleaned = normalizeRoute(route).replace(/^\/+|\/+$/g, '');
  return cleaned ? `${cleaned}/index.html` : 'index.html';
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return tag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, 'i'))?.[1];
}

function tagWithAttribute(html, tagName, name, value) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))]
    .find((match) => attribute(match[0], name) === value)?.[0];
}

function metaContent(html, name) {
  const tag = tagWithAttribute(html, 'meta', 'name', name);
  return tag ? attribute(tag, 'content') : undefined;
}

function pagefindFilter(html, name) {
  const tag = tagWithAttribute(html, 'meta', 'data-pagefind-filter', `${name}[content]`);
  return tag ? attribute(tag, 'content') : undefined;
}

function linkHref(html, relation) {
  const tag = tagWithAttribute(html, 'link', 'rel', relation);
  return tag ? attribute(tag, 'href') : undefined;
}

function htmlIds(html) {
  return new Set(
    [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]),
  );
}

async function exists(absolutePath) {
  return access(absolutePath).then(() => true).catch(() => false);
}

export async function loadWikiRouteSnapshot({
  repoRoot,
  outputRoot = path.join(repoRoot, '_site'),
  base = '/',
  expectedSourceCount = 227,
} = {}) {
  const normalizedBase = normalizeBasePath(base);
  const inventory = JSON.parse(
    await readFile(
      path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json'),
      'utf8',
    ),
  );
  const builtFiles = new Set(await walk(outputRoot));
  const htmlByFile = new Map();
  for (const relativePath of [...builtFiles].filter((file) => file.endsWith('.html'))) {
    htmlByFile.set(relativePath, await readFile(path.join(outputRoot, relativePath), 'utf8'));
  }

  const entries = [];
  for (const entry of inventory.entries) {
    const audiences = {};
    for (const audience of wikiContract.audiences) {
      const generatedPath = generatedPathFor(repoRoot, audience, entry[audience].route);
      const generated = parseMarkdownFrontmatter(await readFile(generatedPath, 'utf8'));
      const builtFile = builtRelativePathForRoute(entry[audience].route);
      audiences[audience] = {
        route: entry[audience].route,
        generated: generated.data || {},
        html: htmlByFile.get(builtFile) || '',
        builtFile,
      };
    }
    entries.push({
      source: entry.source,
      diagram: entry.diagram,
      simpleMirrorExists: await exists(path.join(repoRoot, entry.simple.sourcePath)),
      technicalMirrorExists: await exists(
        path.join(repoRoot, technicalMirrorPathFromSource(entry.source.path)),
      ),
      simple: audiences.simple,
      technical: audiences.technical,
    });
  }

  return {
    base: normalizedBase,
    expectedSourceCount,
    inventorySourcePaths: inventory.sourcePaths,
    entries,
    builtFiles,
    htmlByFile,
    rootHtml: htmlByFile.get('index.html') || '',
    pagefindFiles: [...builtFiles].filter((file) => file.startsWith('pagefind/')),
  };
}

function addError(errors, source, message) {
  errors.push({ source, message });
}

function validateInternalLinks(snapshot, entry, audience, errors) {
  const page = entry[audience];
  const currentUrl = `https://fixture.invalid${withBase(snapshot.base, page.route)}`;
  const prefix = basePrefix(snapshot.base);
  const currentIds = htmlIds(page.html);

  for (const match of page.html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const rawHref = match[1].replaceAll('&amp;', '&');
    if (!rawHref || rawHref.startsWith('#') && rawHref.length === 1) continue;
    let target;
    try {
      target = new URL(rawHref, currentUrl);
    } catch {
      addError(errors, `${entry.source.path}:${audience}`, `invalid built link ${rawHref}`);
      continue;
    }
    if (target.origin !== 'https://fixture.invalid') continue;
    if (prefix && target.pathname !== prefix && !target.pathname.startsWith(`${prefix}/`)) {
      addError(
        errors,
        `${entry.source.path}:${audience}`,
        `internal link escapes configured base ${snapshot.base}: ${rawHref}`,
      );
      continue;
    }

    const withoutBase = prefix ? target.pathname.slice(prefix.length) : target.pathname;
    let decoded;
    try {
      decoded = decodeURIComponent(withoutBase);
    } catch {
      addError(
        errors,
        `${entry.source.path}:${audience}`,
        `built link has invalid URL encoding: ${rawHref}`,
      );
      continue;
    }
    const relative = decoded === '/'
      ? 'index.html'
      : decoded.endsWith('/')
        ? `${decoded.replace(/^\/+/, '')}index.html`
        : decoded.replace(/^\/+/, '');
    const candidates = [relative, `${relative.replace(/\/+$/, '')}/index.html`];
    const builtFile = candidates.find((candidate) => snapshot.builtFiles.has(candidate));
    if (!builtFile) {
      addError(
        errors,
        `${entry.source.path}:${audience}`,
        `built internal link does not resolve: ${rawHref}`,
      );
      continue;
    }

    if (target.hash && target.hash !== '#') {
      let fragment;
      try {
        fragment = decodeURIComponent(target.hash.slice(1));
      } catch {
        addError(
          errors,
          `${entry.source.path}:${audience}`,
          `built fragment has invalid URL encoding: ${rawHref}`,
        );
        continue;
      }
      const ids = builtFile === page.builtFile
        ? currentIds
        : htmlIds(snapshot.htmlByFile.get(builtFile) || '');
      if (!ids.has(fragment)) {
        addError(
          errors,
          `${entry.source.path}:${audience}`,
          `built fragment #${fragment} is absent from ${builtFile}`,
        );
      }
    }
  }
}

export function validateWikiRouteSnapshot(snapshot) {
  const errors = [];
  const seenSlugs = new Map();
  const rootFixtures = snapshot.entries.filter((entry) => !entry.source.path.includes('/'));
  const nestedFixtures = snapshot.entries.filter((entry) => entry.source.path.includes('/'));
  const collections = new Map(
    wikiContract.navigation.collections.map((collection) => [collection.id, collection]),
  );

  if (snapshot.entries.length !== snapshot.expectedSourceCount) {
    addError(
      errors,
      'inventory',
      `found ${snapshot.entries.length} entries; expected ${snapshot.expectedSourceCount}`,
    );
  }
  if (
    JSON.stringify(snapshot.inventorySourcePaths)
    !== JSON.stringify(snapshot.entries.map((entry) => entry.source.path))
  ) {
    addError(errors, 'inventory', 'source paths do not match the ordered content entries');
  }
  if (rootFixtures.length === 0) addError(errors, 'inventory', 'root source fixture is missing');
  if (nestedFixtures.length === 0) addError(errors, 'inventory', 'nested source fixture is missing');

  const rootSimple = `${basePrefix(snapshot.base)}/simple/`;
  const rootTechnical = `${basePrefix(snapshot.base)}/technical/`;
  if (!snapshot.rootHtml.includes(`href="${rootSimple}"`)) {
    addError(errors, 'index.html', `root Simple destination is not base-aware: ${rootSimple}`);
  }
  if (!snapshot.rootHtml.includes(`href="${rootTechnical}"`)) {
    addError(errors, 'index.html', `root Technical destination is not base-aware: ${rootTechnical}`);
  }
  if (!snapshot.rootHtml.includes('data-default-audience="simple"')) {
    addError(errors, 'index.html', 'root resolver does not expose the Simple default');
  }

  for (const entry of snapshot.entries) {
    const sourcePath = entry.source.path;
    const slugKey = entry.source.slug.toLocaleLowerCase('en-US');
    if (seenSlugs.has(slugKey)) {
      addError(errors, sourcePath, `duplicate slug also used by ${seenSlugs.get(slugKey)}`);
    } else {
      seenSlugs.set(slugKey, sourcePath);
    }

    const collection = collections.get(entry.source.collection);
    if (!collection || !collection.sections.includes(entry.source.section)) {
      addError(errors, sourcePath, 'collection and section are not an allowed category pair');
    }
    if (!entry.simpleMirrorExists) addError(errors, sourcePath, 'Simple mirror is missing');
    if (!entry.technicalMirrorExists) addError(errors, sourcePath, 'Technical mirror is missing');

    const expectedShared = {
      slug: entry.source.slug,
      collection: entry.source.collection,
      section: entry.source.section,
      status: entry.source.status,
      order: entry.source.order,
      source_path: sourcePath,
      diagram: entry.diagram.path,
      source_route: entry.technical.route,
      simple_route: entry.simple.route,
    };

    for (const audience of wikiContract.audiences) {
      const page = entry[audience];
      const pairedAudience = audience === 'simple' ? 'technical' : 'simple';
      const expectedPrefix = wikiContract.route[`${audience}Prefix`];
      if (
        page.route !== expectedPrefix
        && !page.route.startsWith(`${expectedPrefix}/`)
      ) {
        addError(errors, `${sourcePath}:${audience}`, `route is outside ${expectedPrefix}`);
      }
      if (!page.html) {
        addError(errors, `${sourcePath}:${audience}`, `built route is missing: ${page.route}`);
        continue;
      }
      for (const [field, expected] of Object.entries(expectedShared)) {
        if (page.generated[field] !== expected) {
          addError(
            errors,
            `${sourcePath}:${audience}`,
            `generated ${field} is ${JSON.stringify(page.generated[field])}; expected ${JSON.stringify(expected)}`,
          );
        }
      }
      if (page.generated.audience !== audience) {
        addError(errors, `${sourcePath}:${audience}`, 'generated audience metadata is wrong');
      }
      if (page.generated.generated_for !== page.route) {
        addError(errors, `${sourcePath}:${audience}`, 'generated route metadata is wrong');
      }
      if (page.generated.paired_route !== entry[pairedAudience].route) {
        addError(errors, `${sourcePath}:${audience}`, 'generated paired route is wrong');
      }

      const metadata = {
        audience: metaContent(page.html, 'nutsnews:audience'),
        sourcePath: metaContent(page.html, 'nutsnews:source-path'),
        pagefindAudience: pagefindFilter(page.html, 'audience'),
        pagefindCollection: pagefindFilter(page.html, 'collection'),
        pagefindSection: pagefindFilter(page.html, 'section'),
        pagefindStatus: pagefindFilter(page.html, 'status'),
        pagefindHistory: pagefindFilter(page.html, 'history'),
      };
      if (metadata.audience !== audience || metadata.pagefindAudience !== audience) {
        addError(errors, `${sourcePath}:${audience}`, 'built audience/Pagefind metadata is wrong');
      }
      if (metadata.sourcePath !== sourcePath) {
        addError(errors, `${sourcePath}:${audience}`, 'built source-path metadata is wrong');
      }
      if (
        metadata.pagefindCollection !== entry.source.collection
        || metadata.pagefindSection !== entry.source.section
        || metadata.pagefindStatus !== entry.source.status
        || !['current', 'historical'].includes(metadata.pagefindHistory)
      ) {
        addError(errors, `${sourcePath}:${audience}`, 'built Pagefind category metadata is incomplete');
      }

      const expectedCanonical = `https://wiki.nutsnews.com${withBase(snapshot.base, page.route)}`;
      const expectedAlternate = `https://wiki.nutsnews.com${withBase(
        snapshot.base,
        entry[pairedAudience].route,
      )}`;
      if (linkHref(page.html, 'canonical') !== expectedCanonical) {
        addError(errors, `${sourcePath}:${audience}`, 'canonical route is not base-aware');
      }
      const alternate = tagWithAttribute(page.html, 'link', 'data-audience', pairedAudience);
      if (!alternate || attribute(alternate, 'href') !== expectedAlternate) {
        addError(errors, `${sourcePath}:${audience}`, 'paired audience route is not base-aware');
      }

      const currentHref = withBase(snapshot.base, page.route);
      const pairedHref = withBase(snapshot.base, entry[pairedAudience].route);
      const hasAudienceHref = (href) => (
        page.html.includes(`href="${href}"`)
        || page.html.includes(`href="${href.replace(/\/$/, '')}"`)
      );
      if (!hasAudienceHref(currentHref) || !hasAudienceHref(pairedHref)) {
        addError(errors, `${sourcePath}:${audience}`, 'audience toggle routes are missing');
      }
      validateInternalLinks(snapshot, entry, audience, errors);
    }
  }

  const filterIndexes = snapshot.pagefindFiles.filter((file) => file.endsWith('.pf_filter'));
  if (filterIndexes.length < 5) addError(errors, 'pagefind', 'fewer than five filter indexes exist');
  if (!snapshot.pagefindFiles.includes('pagefind/pagefind-ui.js')) {
    addError(errors, 'pagefind', 'local Pagefind UI JavaScript is missing');
  }
  if (!snapshot.pagefindFiles.includes('pagefind/pagefind-ui.css')) {
    addError(errors, 'pagefind', 'local Pagefind UI stylesheet is missing');
  }

  return errors.sort((left, right) => (
    left.source.localeCompare(right.source) || left.message.localeCompare(right.message)
  ));
}

export function formatWikiRouteErrors(errors, limit = 30) {
  if (errors.length === 0) return 'Wiki content-route snapshot passed.';
  const lines = [`Wiki content-route snapshot failed with ${errors.length} error(s):`];
  for (const error of errors.slice(0, limit)) lines.push(`- ${error.source}: ${error.message}`);
  if (errors.length > limit) lines.push(`- ... and ${errors.length - limit} more`);
  return lines.join('\n');
}
