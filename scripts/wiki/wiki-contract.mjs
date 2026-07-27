export const wikiContract = {
  version: '1.0.0',
  route: {
    technicalPrefix: '/technical',
    simplePrefix: '/simple',
    landingAudience: 'simple',
  },
  paths: {
    technicalSourceRoot: '.',
    simpleSourceRoot: 'audiences/simple',
    diagramRoot: 'diagrams',
  },
  generatedContentRoot: 'src/content/docs',
  exclusions: {
    ignoreFiles: new Set(['index.md']),
    ignoreDirs: new Set([
      '.git',
      '.github',
      '.idea',
      '.vscode',
      '.jekyll-cache',
      '_site',
      '.cache',
      '.npm',
      'node_modules',
      '_sitemaps',
      '.well-known',
      '.husky',
      'bin',
      'dist',
      'public',
      'scripts',
      'src',
      'diagrams',
    ]),
  },
  frontmatter: {
    requiredOutputFields: ['title', 'description', 'slug', 'section', 'status', 'order'],
    sourceMetadataFields: ['title', 'collection', 'section', 'status', 'order'],
    sourceMetadata: {
      routeKey: 'wiki',
      sourceRouteKey: 'source_route',
      simpleRouteKey: 'simple_route',
      collectionKey: 'collection',
      sectionKey: 'section',
      statusKey: 'status',
      orderKey: 'order',
    },
  },
  markdown: {
    fileExtension: '.md',
    diagramExtension: '.mmd',
  },
  statusValues: ['active', 'draft', 'deprecated', 'obsolete'],
  defaultSection: 'overview',
  defaultCollection: 'start-here',
  defaults: {
    status: 'active',
    order: 0,
  },
};

export function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '')
    .replace(/^\/+/, '');
}

export function normalizeRoute(route) {
  if (!route) {
    return route;
  }

  return `${route}`
    .replace(/\\/g, '/')
    .replace(/\/+/, '/')
    .replace(/\/+/g, '/')
    .replace(/(?<!:)\/{2,}/g, '/')
    .replace(/\/+$/, '')
    .replace(/^\/*/, '/');
}

export function deriveSlugFromSource(relPath) {
  const noExt = relPath.replace(/\.md$/i, '');
  return normalizeSlug(noExt);
}

export function deriveAudienceRoute(audience, relPath, frontmatter) {
  const wiki = frontmatter?.wiki || {};

  if (audience === 'technical' && wiki.source_route) {
    return normalizeRoute(wiki.source_route);
  }

  if (audience === 'simple' && wiki.simple_route) {
    return normalizeRoute(wiki.simple_route);
  }

  return normalizeRoute(`${wikiContract.route[`${audience}Prefix`]}/${deriveSlugFromSource(relPath)}`);
}

export function diagramPathFromSource(relPath) {
  const noExt = relPath.replace(/\.md$/i, '');
  return `${wikiContract.paths.diagramRoot}/${noExt}${wikiContract.markdown.diagramExtension}`;
}
