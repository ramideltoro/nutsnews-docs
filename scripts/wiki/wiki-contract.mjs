const sourceAreas = [
  { id: 'root', prefix: '' },
  { id: 'archive', prefix: 'archive' },
  { id: 'ios', prefix: 'ios' },
  { id: 'reports', prefix: 'reports' },
  { id: 'updates', prefix: 'updates' },
];

const navigationCollections = [
  {
    id: 'start-here',
    label: 'Start here',
    order: 0,
    sections: ['overview', 'start-here', 'contributing'],
  },
  {
    id: 'product-and-reader-experience',
    label: 'Product and reader experience',
    order: 1,
    sections: ['public-product', 'admin-experience', 'ios'],
  },
  {
    id: 'platform-and-data',
    label: 'Platform and data',
    order: 2,
    sections: ['core-platform'],
  },
];

const expertFields = ['title', 'description', 'slug', 'collection', 'section', 'status', 'order'];

export const wikiContract = {
  version: '1.1.0',
  audiences: ['simple', 'technical'],
  route: {
    root: '/',
    technicalPrefix: '/technical',
    simplePrefix: '/simple',
    trailingSlash: 'always',
    landingAudience: 'simple',
    resolver: {
      preferenceKey: 'nutsnews.wiki.audience',
      allowedValues: ['simple', 'technical'],
      precedence: ['explicit-choice', 'stored-preference', 'landing-audience'],
      destinations: {
        simple: '/simple/',
        technical: '/technical/',
      },
    },
  },
  paths: {
    technicalSourceRoot: '.',
    simpleSourceRoot: 'audiences/simple',
    diagramRoot: 'diagrams',
    sourceAreas,
    canonicalPattern: '<source>.md',
    simplePattern: 'audiences/simple/<source>.md',
    diagramPattern: 'diagrams/<source-without-md>.mmd',
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
    expertFields,
    requiredOutputFields: expertFields,
    sourceMetadataFields: expertFields,
    sourceMetadata: {
      routeKey: 'wiki',
      slugKey: 'slug',
      sourceRouteKey: 'source_route',
      simpleRouteKey: 'simple_route',
      collectionKey: 'collection',
      sectionKey: 'section',
      statusKey: 'status',
      orderKey: 'order',
      diagramKey: 'primary_diagram',
    },
    precedence: {
      sharedMetadata: ['source.wiki.<field>', 'source.<field>', 'contract default'],
      title: ['source.title', 'simple.title', 'contract default'],
      description: ['source.description', 'first source prose', 'simple.description', 'contract default'],
      slug: ['source.wiki.slug', 'source.slug', 'canonical source path'],
      route: ['source.wiki.<audience>_route', 'source.<audience>_route', 'audience prefix + slug'],
      diagram: ['source.wiki.primary_diagram', 'source.primary_diagram', 'canonical source path'],
    },
  },
  navigation: {
    collections: navigationCollections,
  },
  markdown: {
    fileExtension: '.md',
    diagramExtension: '.mmd',
  },
  statusValues: ['active', 'draft', 'deprecated', 'obsolete'],
  defaults: {
    title: 'NutsNews documentation',
    description: 'NutsNews documentation page.',
    section: 'overview',
    collection: 'start-here',
    status: 'active',
    order: 0,
  },
};

export const wikiContractFixtures = [
  {
    area: 'root',
    source: 'ROOT_GUIDE.md',
    slug: 'root-guide',
    simplePath: 'audiences/simple/ROOT_GUIDE.md',
    diagramPath: 'diagrams/ROOT_GUIDE.mmd',
    technicalRoute: '/technical/root-guide',
    simpleRoute: '/simple/root-guide',
  },
  {
    area: 'archive',
    source: 'archive/ROOT_CLEANUP_GUIDE.md',
    slug: 'archive/root-cleanup-guide',
    simplePath: 'audiences/simple/archive/ROOT_CLEANUP_GUIDE.md',
    diagramPath: 'diagrams/archive/ROOT_CLEANUP_GUIDE.mmd',
    technicalRoute: '/technical/archive/root-cleanup-guide',
    simpleRoute: '/simple/archive/root-cleanup-guide',
  },
  {
    area: 'ios',
    source: 'ios/RELEASE_GUIDE.md',
    slug: 'ios/release-guide',
    simplePath: 'audiences/simple/ios/RELEASE_GUIDE.md',
    diagramPath: 'diagrams/ios/RELEASE_GUIDE.mmd',
    technicalRoute: '/technical/ios/release-guide',
    simpleRoute: '/simple/ios/release-guide',
  },
  {
    area: 'reports',
    source: 'reports/QUALITY_REPORT.md',
    slug: 'reports/quality-report',
    simplePath: 'audiences/simple/reports/QUALITY_REPORT.md',
    diagramPath: 'diagrams/reports/QUALITY_REPORT.mmd',
    technicalRoute: '/technical/reports/quality-report',
    simpleRoute: '/simple/reports/quality-report',
  },
  {
    area: 'updates',
    source: 'updates/RELEASE_UPDATE.md',
    slug: 'updates/release-update',
    simplePath: 'audiences/simple/updates/RELEASE_UPDATE.md',
    diagramPath: 'diagrams/updates/RELEASE_UPDATE.mmd',
    technicalRoute: '/technical/updates/release-update',
    simpleRoute: '/simple/updates/release-update',
  },
];

export function normalizeSlug(value) {
  return `${value ?? ''}`
    .toLowerCase()
    .replace(/\\/g, '/')
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
    .replace(/\/+/g, '/')
    .replace(/(?<!:)\/{2,}/g, '/')
    .replace(/\/+$/, '')
    .replace(/^\/*/, '/');
}

export function publishedRoute(route) {
  const normalized = normalizeRoute(route) || wikiContract.route.root;
  return normalized === wikiContract.route.root ? normalized : `${normalized}/`;
}

export function normalizeSourcePath(relPath) {
  const normalized = `${relPath ?? ''}`
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/');

  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    !normalized.toLowerCase().endsWith(wikiContract.markdown.fileExtension)
  ) {
    throw new Error(`invalid canonical wiki source path: ${relPath}`);
  }

  return normalized;
}

function sourceValue(frontmatter, field) {
  return frontmatter?.wiki?.[field] ?? frontmatter?.[field];
}

export function deriveSlugFromSource(relPath, frontmatter = {}) {
  const sourcePath = normalizeSourcePath(relPath);
  const configured = sourceValue(frontmatter, wikiContract.frontmatter.sourceMetadata.slugKey);
  const noExt = sourcePath.replace(/\.md$/i, '');
  return normalizeSlug(configured || noExt);
}

export function simplePathFromSource(relPath) {
  return `${wikiContract.paths.simpleSourceRoot}/${normalizeSourcePath(relPath)}`;
}

export function deriveAudienceRoute(audience, relPath, frontmatter = {}) {
  if (!wikiContract.audiences.includes(audience)) {
    throw new Error(`unsupported wiki audience: ${audience}`);
  }

  const routeKey = audience === 'technical'
    ? wikiContract.frontmatter.sourceMetadata.sourceRouteKey
    : wikiContract.frontmatter.sourceMetadata.simpleRouteKey;
  const configured = sourceValue(frontmatter, routeKey);
  if (configured) {
    return normalizeRoute(configured);
  }

  return normalizeRoute(
    `${wikiContract.route[`${audience}Prefix`]}/${deriveSlugFromSource(relPath, frontmatter)}`,
  );
}

export function diagramPathFromSource(relPath) {
  const sourcePath = normalizeSourcePath(relPath);
  const noExt = sourcePath.replace(/\.md$/i, '');
  return `${wikiContract.paths.diagramRoot}/${noExt}${wikiContract.markdown.diagramExtension}`;
}

export function deriveDiagramPath(frontmatter, relPath) {
  const configured = sourceValue(frontmatter, wikiContract.frontmatter.sourceMetadata.diagramKey);
  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim().replace(/\\/g, '/');
  }

  if (configured && typeof configured === 'object' && configured.file) {
    return `${configured.file}`.trim().replace(/\\/g, '/');
  }

  return diagramPathFromSource(relPath);
}

export function deriveCollection(frontmatter = {}) {
  return sourceValue(frontmatter, wikiContract.frontmatter.sourceMetadata.collectionKey)
    || wikiContract.defaults.collection;
}

export function deriveSection(frontmatter = {}) {
  return sourceValue(frontmatter, wikiContract.frontmatter.sourceMetadata.sectionKey)
    || wikiContract.defaults.section;
}

export function deriveStatus(frontmatter = {}) {
  return sourceValue(frontmatter, wikiContract.frontmatter.sourceMetadata.statusKey)
    || wikiContract.defaults.status;
}

export function deriveOrder(frontmatter = {}, fallback = wikiContract.defaults.order) {
  const rawOrder = sourceValue(frontmatter, wikiContract.frontmatter.sourceMetadata.orderKey);
  const parsed = Number.parseInt(rawOrder, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function wikiContractSnapshot() {
  return {
    version: wikiContract.version,
    audiences: wikiContract.audiences,
    sourceAreas: wikiContract.paths.sourceAreas,
    pathPatterns: {
      canonical: wikiContract.paths.canonicalPattern,
      simple: wikiContract.paths.simplePattern,
      diagram: wikiContract.paths.diagramPattern,
    },
    expertFields: wikiContract.frontmatter.expertFields,
    route: wikiContract.route,
    statusValues: wikiContract.statusValues,
    navigationCollections: wikiContract.navigation.collections,
    defaults: wikiContract.defaults,
    precedence: wikiContract.frontmatter.precedence,
  };
}
