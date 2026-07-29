import { promises as fs } from 'node:fs';
import path from 'node:path';

import { extractMermaidAccessibility } from './mermaid-accessibility.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  approvalContract,
  approvalErrors,
  expertSourceHash,
} from './wiki-approval.mjs';
import {
  deriveAudienceRoute,
  deriveCollection,
  deriveDiagramPath,
  deriveOrder,
  deriveSection,
  deriveSlugFromSource,
  deriveStatus,
  normalizeRoute,
  simplePathFromSource,
  technicalMirrorPathFromSource,
  wikiContract,
} from './wiki-contract.mjs';

const INVENTORY_PATH = 'scripts/wiki/wiki-inventory.generated.json';
const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const EXTERNAL_TARGET = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

const remediation = {
  approval: 'Run docs:approve after human review, or let the trusted merge workflow record current automated provenance.',
  diagram: 'Add one valid, accessible Mermaid diagram at the canonical diagram path.',
  fragment: 'Update the fragment to match a heading in the linked document.',
  image: 'Give the image meaningful alt text, a caption, and a resolvable asset target.',
  inventory: 'Run npm run wiki:prepare and commit the stable generated inventory.',
  link: 'Update the target to a canonical wiki source or remove the broken link.',
  mirror: 'Create or remove the mirror so every canonical source has exactly one Simple and Technical mirror.',
  orphan: 'Remove the unreferenced artifact or connect it to its canonical source.',
  schema: 'Correct the frontmatter or generated inventory field to match the wiki contract.',
  uniqueness: 'Assign a unique canonical slug, order, and audience route.',
};

function posix(value) {
  return value.split(path.sep).join('/');
}

function addError(errors, source, invariant, message, fix = remediation[invariant]) {
  errors.push({
    source: source || 'repository',
    invariant,
    message,
    remediation: fix,
  });
}

async function fileExists(absolutePath) {
  return fs.stat(absolutePath).then((stat) => stat.isFile()).catch(() => false);
}

async function walkFiles(root, relativeRoot = '') {
  const absoluteRoot = path.join(root, relativeRoot);
  const entries = await fs.readdir(absoluteRoot, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const relative = posix(path.join(relativeRoot, entry.name));
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(root, relative)));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function canonicalSourcePaths(repoRoot) {
  const files = await walkFiles(repoRoot);
  return files.filter((relative) => {
    const segments = relative.split('/');
    return relative.endsWith(wikiContract.markdown.fileExtension)
      && relative !== 'index.md'
      && !segments.some((segment) => wikiContract.exclusions.ignoreDirs.has(segment))
      && !relative.startsWith('audiences/')
      && !wikiContract.exclusions.ignoreFiles.has(path.posix.basename(relative));
  });
}

async function audienceMarkdownPaths(repoRoot, audience) {
  const root = `audiences/${audience}`;
  return (await walkFiles(path.join(repoRoot, root)))
    .filter((relative) => relative.endsWith(wikiContract.markdown.fileExtension))
    .map((relative) => `${root}/${relative}`);
}

function stableErrors(errors) {
  return errors.sort((left, right) => (
    left.source.localeCompare(right.source)
    || left.invariant.localeCompare(right.invariant)
    || left.message.localeCompare(right.message)
  ));
}

function stripCode(markdown, { preserveInlineText = false } = {}) {
  const lines = markdown.split(/\r?\n/);
  let fence = null;
  return lines.map((line) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      return '';
    }
    if (fence || /^(?: {4}|\t)/.test(line)) return '';
    return line.replace(
      /(`+)(.*?)\1/g,
      preserveInlineText ? (_match, _ticks, content) => content : '',
    );
  });
}

function githubHeadingSlug(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]/g, '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{M}\p{N} _-]/gu, '')
    .replace(/\s+/g, '-');
}

function headingFragments(markdown) {
  const fragments = new Set();
  const occurrences = new Map();
  for (const line of stripCode(markdown, { preserveInlineText: true })) {
    const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubHeadingSlug(match[1]);
    if (!base) continue;
    const count = occurrences.get(base) || 0;
    fragments.add(count === 0 ? base : `${base}-${count}`);
    occurrences.set(base, count + 1);
  }
  for (const match of markdown.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)) {
    fragments.add(match[1]);
  }
  return fragments;
}

function splitTarget(rawTarget) {
  const target = rawTarget.replace(/^<(.+)>$/, '$1').trim();
  const hashAt = target.indexOf('#');
  const queryAt = target.indexOf('?');
  const boundary = [hashAt, queryAt].filter((value) => value >= 0).sort((a, b) => a - b)[0];
  const core = boundary === undefined ? target : target.slice(0, boundary);
  const fragment = hashAt < 0 ? '' : target.slice(hashAt + 1).split('?')[0];
  return { core, fragment };
}

function markdownReferences(markdown) {
  const lines = stripCode(markdown);
  const references = [];
  const inline = /(!?)\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(?:\s+["']([^"']*)["'])?\)/g;
  const definition = /^\s*\[[^\]]+\]:\s+(<[^>]+>|[^\s]+)(?:\s+["']([^"']*)["'])?\s*$/;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const match of line.matchAll(inline)) {
      references.push({
        line: index + 1,
        image: match[1] === '!',
        label: match[2].trim(),
        target: match[3],
        caption: (match[4] || '').trim(),
      });
    }
    const match = line.match(definition);
    if (match) {
      references.push({
        line: index + 1,
        image: false,
        label: '',
        target: match[1],
        caption: (match[2] || '').trim(),
      });
    }
  }

  return references;
}

function resolveSourceTarget(currentSource, rawCore) {
  if (!rawCore) return currentSource;
  let core;
  try {
    core = decodeURIComponent(rawCore).replace(/\\/g, '/');
  } catch {
    return null;
  }
  if (core.startsWith('/')) return path.posix.normalize(core.replace(/^\/+/, ''));
  return path.posix.normalize(path.posix.join(path.posix.dirname(currentSource), core));
}

function resolveSourceCandidate(sourceLookup, resolved) {
  if (!resolved) return null;
  const candidates = [resolved, `${resolved}.md`, path.posix.join(resolved, 'index.md')];
  for (const candidate of candidates) {
    const canonical = sourceLookup.get(candidate.toLocaleLowerCase('en-US'));
    if (canonical) return canonical;
  }
  return null;
}

async function validateDocumentReferences({
  errors,
  repoRoot,
  sourcePath,
  logicalSourcePath,
  markdown,
  sourceLookup,
  fragmentLookup,
}) {
  const lines = stripCode(markdown);
  for (const reference of markdownReferences(markdown)) {
    const { core, fragment } = splitTarget(reference.target);

    if (reference.image) {
      if (!reference.label) {
        addError(errors, sourcePath, 'image', `line ${reference.line}: image alt text is empty`);
      }
      const nextMeaningful = lines.slice(reference.line).find((line) => line.trim())?.trim() || '';
      const adjacentCaption = /^(?:[*_]\s*)?(?:Figure|Diagram|Image|Screenshot)\b/i.test(nextMeaningful);
      if (!reference.caption && !adjacentCaption) {
        addError(errors, sourcePath, 'image', `line ${reference.line}: image has no caption`);
      }
      if (core && !EXTERNAL_TARGET.test(core)) {
        const asset = resolveSourceTarget(logicalSourcePath, core);
        if (!asset || !IMAGE_EXTENSION.test(asset) || !(await fileExists(path.join(repoRoot, asset)))) {
          addError(
            errors,
            sourcePath,
            'image',
            `line ${reference.line}: image target does not resolve: ${reference.target}`,
          );
        }
      }
      continue;
    }

    if (EXTERNAL_TARGET.test(core) || /^(?:mailto|tel):/i.test(core)) continue;
    if (core && IMAGE_EXTENSION.test(core)) continue;

    const resolved = resolveSourceTarget(logicalSourcePath, core);
    if (!resolved) {
      addError(
        errors,
        sourcePath,
        'link',
        `line ${reference.line}: target is not valid URL encoding: ${reference.target}`,
      );
      continue;
    }
    const candidate = resolveSourceCandidate(sourceLookup, resolved);
    if (!candidate) {
      const directoryPrefix = `${resolved.replace(/\/+$/, '')}/`.toLocaleLowerCase('en-US');
      const directoryExists = !fragment
        && [...sourceLookup.keys()].some((source) => source.startsWith(directoryPrefix));
      if (directoryExists) continue;
      addError(
        errors,
        sourcePath,
        'link',
        `line ${reference.line}: internal target does not resolve: ${reference.target}`,
      );
      continue;
    }

    if (fragment) {
      let decodedFragment = fragment;
      try {
        decodedFragment = decodeURIComponent(fragment);
      } catch {
        addError(
          errors,
          sourcePath,
          'fragment',
          `line ${reference.line}: fragment is not valid URL encoding: #${fragment}`,
        );
        continue;
      }
      if (!fragmentLookup.get(candidate)?.has(decodedFragment)) {
        addError(
          errors,
          sourcePath,
          'fragment',
          `line ${reference.line}: #${decodedFragment} is absent from ${candidate}`,
        );
      }
    }
  }

  const markdownWithoutCode = stripCode(markdown).join('\n');
  for (const match of markdownWithoutCode.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1];
    const alt = attributes.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim();
    if (!alt) addError(errors, sourcePath, 'image', 'HTML image alt text is empty or missing');
    const before = markdownWithoutCode.lastIndexOf('<figure', match.index);
    const after = markdownWithoutCode.indexOf('</figure>', match.index);
    const caption = markdownWithoutCode.indexOf('<figcaption', match.index);
    if (before < 0 || after < 0 || caption < 0 || caption > after) {
      addError(errors, sourcePath, 'image', 'HTML image must be wrapped in a figure with a figcaption');
    }
  }
}

function validateInventoryEntry(errors, entry, sourcePath, sourceData, sourceIndex) {
  const requiredStrings = ['title', 'description', 'slug', 'collection', 'section', 'status'];
  for (const field of requiredStrings) {
    if (typeof entry?.source?.[field] !== 'string' || !entry.source[field].trim()) {
      addError(errors, sourcePath, 'schema', `inventory source.${field} must be a non-empty string`);
    }
  }
  if (!Number.isInteger(entry?.source?.order)) {
    addError(errors, sourcePath, 'schema', 'inventory source.order must be an integer');
  }

  const expected = {
    slug: deriveSlugFromSource(sourcePath, sourceData),
    collection: deriveCollection(sourceData),
    section: deriveSection(sourceData),
    status: deriveStatus(sourceData),
    order: deriveOrder(sourceData, sourceIndex + 1),
  };
  for (const [field, value] of Object.entries(expected)) {
    if (entry?.source?.[field] !== value) {
      addError(
        errors,
        sourcePath,
        'schema',
        `inventory source.${field} is ${JSON.stringify(entry?.source?.[field])}; expected ${JSON.stringify(value)}`,
      );
    }
  }

  const expectedTechnicalRoute = deriveAudienceRoute('technical', sourcePath, sourceData);
  const expectedSimpleRoute = deriveAudienceRoute('simple', sourcePath, sourceData);
  const expectedSimplePath = simplePathFromSource(sourcePath);
  const expectedDiagramPath = deriveDiagramPath(sourceData, sourcePath);
  const mappings = [
    ['source.path', entry?.source?.path, sourcePath],
    ['technical.sourcePath', entry?.technical?.sourcePath, sourcePath],
    ['technical.route', entry?.technical?.route, expectedTechnicalRoute],
    ['simple.sourcePath', entry?.simple?.sourcePath, expectedSimplePath],
    ['simple.route', entry?.simple?.route, expectedSimpleRoute],
    ['diagram.path', entry?.diagram?.path, expectedDiagramPath],
    ['diagram.exists', entry?.diagram?.exists, true],
  ];
  for (const [field, actual, value] of mappings) {
    if (actual !== value) {
      addError(
        errors,
        sourcePath,
        'inventory',
        `${field} is ${JSON.stringify(actual)}; expected ${JSON.stringify(value)}`,
      );
    }
  }
}

function validateUnique(errors, seen, value, sourcePath, label) {
  const key = typeof value === 'string' ? value.toLocaleLowerCase('en-US') : value;
  if (seen.has(key)) {
    addError(
      errors,
      sourcePath,
      'uniqueness',
      `duplicate ${label} ${JSON.stringify(value)} also used by ${seen.get(key)}`,
    );
  } else {
    seen.set(key, sourcePath);
  }
}

function configuredDiagramPath(frontmatter) {
  const configured = frontmatter?.wiki?.primary_diagram ?? frontmatter?.primary_diagram;
  if (typeof configured === 'string') return configured.replace(/\\/g, '/').trim();
  if (configured && typeof configured === 'object') {
    return `${configured.file || ''}`.replace(/\\/g, '/').trim();
  }
  return '';
}

function validateMirrorMetadata({
  errors,
  relativePath,
  document,
  technicalRoute,
  simpleRoute,
  diagramPath,
}) {
  if (!document) return;
  const data = document.data || {};
  if (typeof data.title !== 'string' || !data.title.trim()) {
    addError(errors, relativePath, 'mirror', 'mirror title must be a non-empty string');
  }
  const mappings = [
    ['wiki.source_route', normalizeRoute(data.wiki?.source_route), technicalRoute],
    ['wiki.simple_route', normalizeRoute(data.wiki?.simple_route), simpleRoute],
    ['wiki.primary_diagram', configuredDiagramPath(data), diagramPath],
  ];
  for (const [field, actual, expected] of mappings) {
    if (actual !== expected) {
      addError(
        errors,
        relativePath,
        'mirror',
        `${field} is ${JSON.stringify(actual)}; expected ${JSON.stringify(expected)}`,
      );
    }
  }
}

async function readMarkdown(repoRoot, relativePath, errors, invariant) {
  try {
    const raw = await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
    return { raw, ...parseMarkdownFrontmatter(raw) };
  } catch (error) {
    addError(errors, relativePath, invariant, `cannot read or parse Markdown: ${error.message}`);
    return null;
  }
}

export async function validateWikiContent({
  repoRoot,
  expectedSourceCount,
  minimumSourceCount,
  parseMermaid = async () => true,
} = {}) {
  if (!repoRoot) throw new Error('validateWikiContent requires repoRoot');
  const errors = [];
  const sources = await canonicalSourcePaths(repoRoot);
  const sourceLookup = new Map(
    sources.map((sourcePath) => [sourcePath.toLocaleLowerCase('en-US'), sourcePath]),
  );
  const documents = new Map();
  const simpleDocuments = new Map();

  let inventory = null;
  try {
    inventory = JSON.parse(await fs.readFile(path.join(repoRoot, INVENTORY_PATH), 'utf8'));
  } catch (error) {
    addError(errors, INVENTORY_PATH, 'inventory', `cannot read stable inventory: ${error.message}`);
  }

  if (expectedSourceCount !== undefined && sources.length !== expectedSourceCount) {
    addError(
      errors,
      'repository',
      'inventory',
      `found ${sources.length} canonical sources; expected ${expectedSourceCount}`,
    );
  }
  if (minimumSourceCount !== undefined && sources.length < minimumSourceCount) {
    addError(
      errors,
      'repository',
      'inventory',
      `found ${sources.length} canonical sources; expected at least ${minimumSourceCount}`,
    );
  }
  if (inventory) {
    if (inventory.contractVersion !== wikiContract.version) {
      addError(
        errors,
        INVENTORY_PATH,
        'inventory',
        `contract version is ${JSON.stringify(inventory.contractVersion)}; expected ${wikiContract.version}`,
      );
    }
    if (inventory.sourceCount !== sources.length) {
      addError(errors, INVENTORY_PATH, 'inventory', 'sourceCount does not match canonical sources');
    }
    if (JSON.stringify(inventory.sourcePaths) !== JSON.stringify(sources)) {
      addError(errors, INVENTORY_PATH, 'inventory', 'sourcePaths are missing, stale, or not sorted');
    }
    if (!Array.isArray(inventory.entries) || inventory.entries.length !== sources.length) {
      addError(errors, INVENTORY_PATH, 'inventory', 'entries do not map one-to-one to canonical sources');
    }
    if (!Array.isArray(inventory.warnings) || inventory.warnings.length > 0) {
      addError(errors, INVENTORY_PATH, 'inventory', 'warnings must be an empty array for publication');
    }
  }

  const inventoryEntries = new Map(
    (inventory?.entries || []).map((entry) => [entry?.source?.path, entry]),
  );
  const seenSlugs = new Map();
  const seenOrders = new Map();
  const seenRoutes = new Map();
  const expectedSimple = new Set();
  const expectedTechnical = new Set();
  const expectedDiagrams = new Set();
  const expectedReviewManifests = new Set();

  for (let index = 0; index < sources.length; index += 1) {
    const sourcePath = sources[index];
    const document = await readMarkdown(repoRoot, sourcePath, errors, 'schema');
    if (!document) continue;
    documents.set(sourcePath, document);
    const data = document.data || {};
    const simplePath = simplePathFromSource(sourcePath);
    const technicalPath = technicalMirrorPathFromSource(sourcePath);
    const diagramPath = deriveDiagramPath(data, sourcePath);
    const reviewPath = simplePath.replace(/\.md$/i, '.review.json');
    expectedSimple.add(simplePath);
    expectedTechnical.add(technicalPath);
    expectedDiagrams.add(diagramPath);
    expectedReviewManifests.add(reviewPath);
    if (
      !diagramPath.startsWith(`${wikiContract.paths.diagramRoot}/`)
      || !diagramPath.endsWith(wikiContract.markdown.diagramExtension)
      || diagramPath.includes('../')
    ) {
      addError(errors, sourcePath, 'schema', `diagram path is outside the canonical .mmd contract: ${diagramPath}`);
    }

    const entry = inventoryEntries.get(sourcePath);
    if (!entry) {
      addError(errors, sourcePath, 'inventory', 'canonical source has no inventory entry');
    } else {
      validateInventoryEntry(errors, entry, sourcePath, data, index);
    }

    const slug = deriveSlugFromSource(sourcePath, data);
    const order = deriveOrder(data, index + 1);
    const technicalRoute = normalizeRoute(deriveAudienceRoute('technical', sourcePath, data));
    const simpleRoute = normalizeRoute(deriveAudienceRoute('simple', sourcePath, data));
    validateUnique(errors, seenSlugs, slug, sourcePath, 'slug');
    validateUnique(errors, seenOrders, order, sourcePath, 'order');
    validateUnique(errors, seenRoutes, technicalRoute, sourcePath, 'Technical route');
    validateUnique(errors, seenRoutes, simpleRoute, sourcePath, 'Simple route');

    const collection = wikiContract.navigation.collections.find(
      (candidate) => candidate.id === deriveCollection(data),
    );
    if (!collection || !collection.sections.includes(deriveSection(data))) {
      addError(errors, sourcePath, 'schema', 'collection and section do not form an allowed navigation pair');
    }
    if (!wikiContract.statusValues.includes(deriveStatus(data))) {
      addError(errors, sourcePath, 'schema', `unsupported status ${JSON.stringify(deriveStatus(data))}`);
    }
    if (
      technicalRoute !== wikiContract.route.technicalPrefix
      && !technicalRoute.startsWith(`${wikiContract.route.technicalPrefix}/`)
    ) {
      addError(errors, sourcePath, 'schema', `Technical route is outside ${wikiContract.route.technicalPrefix}`);
    }
    if (
      simpleRoute !== wikiContract.route.simplePrefix
      && !simpleRoute.startsWith(`${wikiContract.route.simplePrefix}/`)
    ) {
      addError(errors, sourcePath, 'schema', `Simple route is outside ${wikiContract.route.simplePrefix}`);
    }

    const [simpleDocument, technicalDocument] = await Promise.all([
      readMarkdown(repoRoot, simplePath, errors, 'mirror'),
      readMarkdown(repoRoot, technicalPath, errors, 'mirror'),
    ]);
    if (simpleDocument) simpleDocuments.set(sourcePath, simpleDocument);
    validateMirrorMetadata({
      errors,
      relativePath: simplePath,
      document: simpleDocument,
      technicalRoute,
      simpleRoute,
      diagramPath,
    });
    validateMirrorMetadata({
      errors,
      relativePath: technicalPath,
      document: technicalDocument,
      technicalRoute,
      simpleRoute,
      diagramPath,
    });

    if (approvalContract.requiredForPublishing) {
      const expectedHash = expertSourceHash(document.raw);
      for (const [relativePath, mirrorDocument] of [
        [sourcePath, document],
        [simplePath, simpleDocument],
        [technicalPath, technicalDocument],
      ]) {
        if (!mirrorDocument) continue;
        const approval = mirrorDocument.data?.wiki?.approval;
        const issues = approvalErrors(approval, expectedHash);
        for (const issue of issues) addError(errors, relativePath, 'approval', issue);
      }

      if (simpleDocument && technicalDocument) {
        const approvals = [
          document.data?.wiki?.approval,
          simpleDocument.data?.wiki?.approval,
          technicalDocument.data?.wiki?.approval,
        ];
        if (JSON.stringify(approvals[0]) !== JSON.stringify(approvals[1])
          || JSON.stringify(approvals[0]) !== JSON.stringify(approvals[2])) {
          addError(errors, sourcePath, 'approval', 'source and mirror approval records differ');
        }
      }
    }

    try {
      const diagram = await fs.readFile(path.join(repoRoot, diagramPath), 'utf8');
      const accessibility = extractMermaidAccessibility(diagram);
      if (!accessibility.title || !accessibility.description) {
        addError(errors, diagramPath, 'diagram', 'Mermaid accTitle and accDescr are both required');
      }
      try {
        await parseMermaid(diagram, diagramPath);
      } catch (error) {
        addError(
          errors,
          diagramPath,
          'diagram',
          `Mermaid syntax is invalid: ${`${error?.message || error}`.split('\n')[0]}`,
        );
      }
    } catch {
      addError(errors, diagramPath, 'diagram', `missing diagram for ${sourcePath}`);
    }

    const reviewRaw = await fs.readFile(path.join(repoRoot, reviewPath), 'utf8').catch(() => null);
    if (reviewRaw !== null) {
      try {
        const review = JSON.parse(reviewRaw);
        if (
          approvalContract.requiredForPublishing
          && JSON.stringify(review.approval) !== JSON.stringify(document.data?.wiki?.approval)
        ) {
          addError(errors, reviewPath, 'approval', 'review manifest approval differs from source');
        }
      } catch (error) {
        addError(errors, reviewPath, 'schema', `review manifest is invalid JSON: ${error.message}`);
      }
    }
  }

  const actualSimple = new Set(await audienceMarkdownPaths(repoRoot, 'simple'));
  const actualTechnical = new Set(await audienceMarkdownPaths(repoRoot, 'technical'));
  const allDiagramFiles = await walkFiles(path.join(repoRoot, wikiContract.paths.diagramRoot));
  const actualDiagrams = new Set(
    allDiagramFiles
      .filter((relative) => relative.endsWith(wikiContract.markdown.diagramExtension))
      .map((relative) => `${wikiContract.paths.diagramRoot}/${relative}`),
  );
  const actualReviewManifests = new Set(
    (await walkFiles(path.join(repoRoot, wikiContract.paths.simpleSourceRoot)))
      .filter((relative) => relative.endsWith('.review.json'))
      .map((relative) => `${wikiContract.paths.simpleSourceRoot}/${relative}`),
  );

  for (const [label, expected, actual] of [
    ['Simple mirror', expectedSimple, actualSimple],
    ['Technical mirror', expectedTechnical, actualTechnical],
    ['diagram', expectedDiagrams, actualDiagrams],
  ]) {
    for (const relativePath of expected) {
      if (!actual.has(relativePath)) addError(errors, relativePath, 'mirror', `missing ${label}`);
    }
    for (const relativePath of actual) {
      if (!expected.has(relativePath)) addError(errors, relativePath, 'orphan', `orphan ${label}`);
    }
  }
  for (const relativePath of actualReviewManifests) {
    if (!expectedReviewManifests.has(relativePath)) {
      addError(errors, relativePath, 'orphan', 'orphan review manifest');
    }
  }
  for (const relativePath of allDiagramFiles) {
    if (relativePath.endsWith(wikiContract.markdown.fileExtension)) {
      addError(
        errors,
        `${wikiContract.paths.diagramRoot}/${relativePath}`,
        'orphan',
        'legacy Markdown diagram is outside the canonical .mmd inventory',
      );
    }
  }

  const technicalFragments = new Map(
    [...documents].map(([sourcePath, document]) => [sourcePath, headingFragments(document.content)]),
  );
  const simpleFragments = new Map(
    [...simpleDocuments].map(([sourcePath, document]) => [sourcePath, headingFragments(document.content)]),
  );
  for (const [sourcePath, document] of documents) {
    await validateDocumentReferences({
      errors,
      repoRoot,
      sourcePath,
      logicalSourcePath: sourcePath,
      markdown: document.content,
      sourceLookup,
      fragmentLookup: technicalFragments,
    });
  }
  for (const [sourcePath, document] of simpleDocuments) {
    await validateDocumentReferences({
      errors,
      repoRoot,
      sourcePath: simplePathFromSource(sourcePath),
      logicalSourcePath: sourcePath,
      markdown: document.content,
      sourceLookup,
      fragmentLookup: simpleFragments,
    });
  }

  return {
    errors: stableErrors(errors),
    counts: {
      canonicalSources: sources.length,
      simpleMirrors: actualSimple.size,
      technicalMirrors: actualTechnical.size,
      diagrams: actualDiagrams.size,
      reviewManifests: actualReviewManifests.size,
    },
  };
}

export function formatWikiContentReport(report, { limit = 80 } = {}) {
  if (report.errors.length === 0) {
    const counts = report.counts;
    return (
      `Complete wiki content contract passed: ${counts.canonicalSources} canonical sources, `
      + `${counts.simpleMirrors} Simple mirrors, ${counts.technicalMirrors} Technical mirrors, `
      + `${counts.diagrams} accessible diagrams, ${counts.reviewManifests} review manifests.`
    );
  }

  const groups = new Map();
  for (const error of report.errors) {
    if (!groups.has(error.source)) groups.set(error.source, []);
    groups.get(error.source).push(error);
  }

  const lines = [
    `Complete wiki content contract failed with ${report.errors.length} defect(s) across ${groups.size} source group(s):`,
  ];
  let emitted = 0;
  for (const [source, errors] of groups) {
    if (emitted >= limit) break;
    lines.push(`\n${source}`);
    for (const error of errors) {
      if (emitted >= limit) break;
      lines.push(`- [${error.invariant}] ${error.message}`);
      lines.push(`  Fix: ${error.remediation}`);
      emitted += 1;
    }
  }
  if (report.errors.length > emitted) {
    lines.push(`\n... and ${report.errors.length - emitted} more defect(s).`);
  }
  return lines.join('\n');
}

export function wikiContentExitCode(report) {
  return report.errors.length === 0 ? 0 : 1;
}
