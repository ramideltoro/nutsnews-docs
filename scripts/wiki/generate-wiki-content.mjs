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
  normalizeRoute,
  simplePathFromSource,
  validateMirrorInventory,
  wikiContract,
} from './wiki-contract.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

const repoRoot = process.cwd();
const GENERATED_DOCS_ROOT = path.join(repoRoot, wikiContract.generatedContentRoot);
const INVENTORY_PATH = path.join(repoRoot, 'scripts', 'wiki', 'wiki-inventory.generated.json');
const FALLBACK_DIAGRAM = path.join(wikiContract.paths.diagramRoot, `README${wikiContract.markdown.diagramExtension}`);
const args = new Set(process.argv.slice(2));

const runOptions = {
  failOnUnresolvedLinks: !args.has('--allow-unresolved-links'),
  failOnMissingDiagrams: args.has('--strict') || args.has('--fail-on-missing-diagrams'),
};

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

function normalizeCandidate(rawPath) {
  return rawPath
    .replace(/\.md$/i, '')
    .replace(/\\+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/+/g, '/')
    .toLowerCase();
}

function splitLinkTarget(rawTarget) {
  const target = rawTarget.replace(/^<(.+)>$/, '$1').trim();
  const q = target.indexOf('?');
  const h = target.indexOf('#');
  const next = [q, h].filter((idx) => idx >= 0).sort((x, y) => x - y)[0];

  if (next === undefined) {
    return { core: target, query: '', fragment: '' };
  }

  const core = target.slice(0, next);
  const suffix = target.slice(next);

  if (suffix.startsWith('?')) {
    const hashAt = suffix.indexOf('#');
    if (hashAt >= 0) {
      return { core, query: suffix.slice(0, hashAt), fragment: suffix.slice(hashAt) };
    }
    return { core, query: suffix, fragment: '' };
  }

  return { core, query: '', fragment: suffix };
}

function isExternal(rawHref) {
  return /^(?:mailto:|tel:|https?:\/\/|ftp:\/\/|\/\/|#)/i.test(rawHref);
}

function isLikelyAsset(rawHref) {
  return /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico|pdf|zip|tar|gz|css|js|map)$/i.test(rawHref);
}

function isMarkdownReference(rawHref) {
  return /\.md(\?|#|$)/i.test(rawHref);
}

function markdownToPlainText(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<((?:https?:\/\/|mailto:)[^>]+)>/gi, '$1')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/`+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveDescription(frontmatter, markdownContent, simpleFrontmatter, maxLength = 170) {
  if (typeof frontmatter?.description === 'string' && frontmatter.description.trim()) {
    const explicit = markdownToPlainText(frontmatter.description);
    return explicit.length > maxLength ? `${explicit.slice(0, maxLength - 1)}…` : explicit;
  }

  const contentSource = markdownContent || '';
  const lines = contentSource
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('['));

  const first = markdownToPlainText(lines[0]
    || simpleFrontmatter?.description
    || wikiContract.defaults.description);
  return first.length > maxLength ? `${first.slice(0, maxLength - 1)}…` : first;
}

function toYaml(value) {
  if (typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value ?? '');
}

function frontmatterText(fields) {
  const rows = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }
    rows.push(`${key}: ${toYaml(value)}`);
  }
  rows.push('---');
  return `${rows.join('\n')}\n`;
}

async function fileExists(relativePath) {
  try {
    const stat = await fs.stat(path.join(repoRoot, relativePath));
    return stat.isFile();
  } catch {
    return false;
  }
}

async function walkMarkdown(root, current = '') {
  const absolute = path.join(root, current);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (wikiContract.exclusions.ignoreDirs.has(entry.name)) {
      continue;
    }

    const next = path.join(current, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(root, next)));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(wikiContract.markdown.fileExtension)) {
      continue;
    }

    if (wikiContract.exclusions.ignoreFiles.has(entry.name)) {
      continue;
    }

    out.push(next);
  }

  return out;
}

function addCandidate(map, key, entry) {
  const normalized = normalizeCandidate(key);
  if (!normalized) {
    return;
  }
  const bucket = map.get(normalized) || [];
  const alreadyExists = bucket.some((existing) => existing.source.path === entry.source.path);
  if (!alreadyExists) {
    bucket.push(entry);
  }
  map.set(normalized, bucket);
}

function buildCandidateMap(entries) {
  const map = new Map();

  for (const entry of entries) {
    addCandidate(map, entry.source.path, entry);
    addCandidate(map, entry.source.path.replace(/\.md$/i, ''), entry);
    addCandidate(map, entry.technical.route, entry);
    addCandidate(map, entry.simple.route, entry);
    addCandidate(map, entry.technical.route.replace(/^\/?technical\/?/, ''), entry);
    addCandidate(map, entry.simple.route.replace(/^\/?simple\/?/, ''), entry);
  }

  return map;
}

function resolveCandidate(map, normalizedCandidate) {
  const bucket = map.get(normalizeCandidate(normalizedCandidate));
  if (!bucket || bucket.length === 0) {
    return { candidate: null, ambiguous: false };
  }
  if (bucket.length > 1) {
    return {
      candidate: null,
      ambiguous: true,
      alternatives: [...new Set(bucket.map((entry) => entry.source.path))],
    };
  }

  return { candidate: bucket[0], ambiguous: false };
}

function routeFor(entry, audience) {
  return audience === 'technical' ? entry.technical.route : entry.simple.route;
}

function resolveMarkdownRoute(audience, currentSourceRel, rawTarget, candidateMap, unresolved, sourceFile, lineNumber) {
  const { core, query, fragment } = splitLinkTarget(rawTarget);

  if (!core || isExternal(core) || isLikelyAsset(core) || core === '#') {
    return rawTarget;
  }

  if (!isMarkdownReference(core)) {
    return rawTarget;
  }

  if (core.startsWith('/technical/') || core.startsWith('/simple/')) {
    return `${core}${query}${fragment}`;
  }

  const currentDir = path.posix.dirname(currentSourceRel);
  const resolvedRaw = core.startsWith('/')
    ? `/${core.replace(/^\/+/, '')}`
    : path.posix.join(currentDir, core);
  const resolved = normalizeCandidate(path.posix.normalize(resolvedRaw).replace(/\.md$/i, ''));

  let candidate = resolveCandidate(candidateMap, resolved);
  if (!candidate.candidate && !candidate.ambiguous && !resolved.endsWith('/index')) {
    candidate = resolveCandidate(candidateMap, resolved.replace(/\/index$/, ''));
  }

  if (candidate.candidate && !candidate.ambiguous) {
    return `${routeFor(candidate.candidate, audience)}${query}${fragment}`;
  }

  unresolved.push({
    source: sourceFile,
    line: lineNumber,
    target: core,
    resolvedCandidate: resolved,
    reason: candidate.ambiguous ? `ambiguous internal reference: ${candidate.alternatives.join(', ')}` : 'unresolved',
  });

  return rawTarget;
}

function rewriteMarkdownBody(content, currentSourceRel, audience, candidateMap, sourceFile, unresolved) {
  const inline = /(!?\[[^\]]*?\]\()(<[^>]+>|[^\)\s]+)(\s+["'][^"']*["'])?\)/g;
  const reference = /^(\s*\[[^\]]+\]:\s+)(<[^>]+>|[^\s]+)(\s+\"[^\"]*\")?$/gm;

  const rewriteSegment = (segment, line) => {
    const replaceInline = (_match, left, target, title) => {
      const rewritten = resolveMarkdownRoute(
        audience,
        currentSourceRel,
        target,
        candidateMap,
        unresolved,
        sourceFile,
        line,
      );
      return `${left}${rewritten}${title || ''})`;
    };

    const replaceReference = (_match, left, target, suffix) => {
      const rewritten = resolveMarkdownRoute(
        audience,
        currentSourceRel,
        target,
        candidateMap,
        unresolved,
        sourceFile,
        line,
      );
      return `${left}${rewritten}${suffix || ''}`;
    };

    return segment.replace(inline, replaceInline).replace(reference, replaceReference);
  };

  const rewriteOutsideInlineCode = (lineContent, lineNumber) => {
    const codeSpan = /(`+)([\s\S]*?)\1/g;
    let cursor = 0;
    let output = '';

    for (const match of lineContent.matchAll(codeSpan)) {
      output += rewriteSegment(lineContent.slice(cursor, match.index), lineNumber);
      output += match[0];
      cursor = match.index + match[0].length;
    }

    output += rewriteSegment(lineContent.slice(cursor), lineNumber);
    return output;
  };

  const chunks = content.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) || [];
  let fenceCharacter = null;
  let fenceLength = 0;

  return chunks.map((chunk, index) => {
    const lineNumber = index + 1;
    const lineWithoutEnding = chunk.replace(/\r?\n$/, '');
    const fence = lineWithoutEnding.match(/^\s{0,3}(`{3,}|~{3,})/);

    if (fence) {
      const marker = fence[1];
      if (!fenceCharacter) {
        fenceCharacter = marker[0];
        fenceLength = marker.length;
      } else if (marker[0] === fenceCharacter && marker.length >= fenceLength) {
        fenceCharacter = null;
        fenceLength = 0;
      }
      return chunk;
    }

    if (fenceCharacter || /^(?: {4}|\t)/.test(lineWithoutEnding)) {
      return chunk;
    }

    return rewriteOutsideInlineCode(chunk, lineNumber);
  }).join('');
}

function validateLinkRewriteFixtures() {
  const fixtureEntries = [
    {
      source: { path: 'ROOT.md' },
      technical: { route: '/technical/root' },
      simple: { route: '/simple/root' },
    },
    {
      source: { path: 'updates/ONE.md' },
      technical: { route: '/technical/updates/one' },
      simple: { route: '/simple/updates/one' },
    },
    {
      source: { path: 'updates/TWO.md' },
      technical: { route: '/technical/updates/two' },
      simple: { route: '/simple/updates/two' },
    },
  ];
  const candidateMap = buildCandidateMap(fixtureEntries);

  for (const audience of wikiContract.audiences) {
    const unresolved = [];
    const rootOutput = rewriteMarkdownBody(
      '[nested](updates/ONE.md#details)\n',
      'ROOT.md',
      audience,
      candidateMap,
      'ROOT.md',
      unresolved,
    );
    const nestedOutput = rewriteMarkdownBody(
      [
        '[root](../ROOT.md)',
        '[sibling](TWO.md)',
        '`[inline code](TWO.md)`',
        '```md',
        '[fenced code](TWO.md)',
        '```',
        '    [indented code](TWO.md)',
        '',
      ].join('\n'),
      'updates/ONE.md',
      audience,
      candidateMap,
      'updates/ONE.md',
      unresolved,
    );

    assert.equal(
      rootOutput,
      `[nested](/${audience}/updates/one#details)\n`,
      `${audience} root-to-nested fixture`,
    );
    assert.match(nestedOutput, new RegExp(`\\[root\\]\\(/${audience}/root\\)`));
    assert.match(nestedOutput, new RegExp(`\\[sibling\\]\\(/${audience}/updates/two\\)`));
    assert.match(nestedOutput, /`\[inline code\]\(TWO\.md\)`/);
    assert.match(nestedOutput, /\[fenced code\]\(TWO\.md\)/);
    assert.match(nestedOutput, /    \[indented code\]\(TWO\.md\)/);
    assert.deepEqual(unresolved, []);
  }

  const missing = [];
  rewriteMarkdownBody(
    '\n\n[missing](MISSING.md)\n',
    'ROOT.md',
    'technical',
    candidateMap,
    'ROOT.md',
    missing,
  );
  assert.equal(missing[0]?.source, 'ROOT.md');
  assert.equal(missing[0]?.line, 3);
  assert.equal(missing[0]?.target, 'MISSING.md');

  const ambiguousMap = buildCandidateMap([
    {
      source: { path: 'updates/GUIDE.md' },
      technical: { route: '/technical/updates/guide-a' },
      simple: { route: '/simple/updates/guide-a' },
    },
    {
      source: { path: 'updates/guide.md' },
      technical: { route: '/technical/updates/guide-b' },
      simple: { route: '/simple/updates/guide-b' },
    },
  ]);
  const ambiguous = [];
  rewriteMarkdownBody(
    '[ambiguous](updates/GUIDE.md)\n',
    'ROOT.md',
    'simple',
    ambiguousMap,
    'ROOT.md',
    ambiguous,
  );
  assert.match(ambiguous[0]?.reason || '', /ambiguous internal reference/);
}

function routeToGeneratedPath(audience, route) {
  const normalized = normalizeRoute(route);
  const prefix = normalizeCandidate(wikiContract.route[`${audience}Prefix`]);
  const cleaned = normalized.replace(/^\//, '').replace(/\/+$/, '');

  if (!cleaned || cleaned === prefix) {
    return `${audience}.md`;
  }

  const remainder = cleaned.startsWith(`${prefix}/`) ? cleaned.slice(prefix.length + 1) : cleaned;
  return `${audience}/${remainder}/index.md`;
}

async function buildSourceInventory() {
  const sourcePaths = (await walkMarkdown(path.join(repoRoot)))
    .filter((item) => item !== 'index.md' && !item.startsWith('audiences/'))
    .sort((left, right) => left.localeCompare(right));
  const simplePaths = (await walkMarkdown(
    path.join(repoRoot, wikiContract.paths.simpleSourceRoot),
  )).sort((left, right) => left.localeCompare(right));
  const errors = validateMirrorInventory(sourcePaths, simplePaths);
  const warnings = [];
  const seenRoutes = new Map();
  const seenSlugs = new Map();
  const seenOrders = new Map();
  const entries = [];

  for (let index = 0; index < sourcePaths.length; index += 1) {
    const sourcePath = sourcePaths[index];
    const sourceRaw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const sourceParsed = parseMarkdownFrontmatter(sourceRaw);
    const sourceData = sourceParsed.data || {};
    const sourceBody = sourceParsed.content || '';
    let sourceArea;

    try {
      sourceArea = classifySourcePath(sourcePath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }

    const technicalRoute = deriveAudienceRoute('technical', sourcePath, sourceData);
    const simpleSourcePath = simplePathFromSource(sourcePath);
    const simpleExists = await fileExists(simpleSourcePath);
    if (!simpleExists) {
      continue;
    }

    const simpleRaw = await fs.readFile(path.join(repoRoot, simpleSourcePath), 'utf8');
    const simpleParsed = parseMarkdownFrontmatter(simpleRaw);
    const simpleData = simpleParsed.data || {};

    const simpleRoute = deriveAudienceRoute('simple', sourcePath, sourceData);

    if (seenRoutes.has(normalizeRoute(technicalRoute))) {
      errors.push(
        `duplicate technical route ${technicalRoute}: `
          + `${seenRoutes.get(normalizeRoute(technicalRoute))} and ${sourcePath}`,
      );
    }
    if (seenRoutes.has(normalizeRoute(simpleRoute))) {
      errors.push(
        `duplicate simple route ${simpleRoute}: `
          + `${seenRoutes.get(normalizeRoute(simpleRoute))} and ${sourcePath}`,
      );
    }
    seenRoutes.set(normalizeRoute(technicalRoute), sourcePath);
    seenRoutes.set(normalizeRoute(simpleRoute), sourcePath);

    const slug = deriveSlugFromSource(sourcePath, sourceData);
    const order = deriveOrder(sourceData, index + 1);
    if (seenSlugs.has(slug) && seenSlugs.get(slug) !== sourcePath) {
      errors.push(`duplicate slug ${slug}: ${seenSlugs.get(slug)} and ${sourcePath}`);
    } else {
      seenSlugs.set(slug, sourcePath);
    }

    if (seenOrders.has(order) && seenOrders.get(order) !== sourcePath) {
      errors.push(`duplicate order ${order}: ${seenOrders.get(order)} and ${sourcePath}`);
    } else {
      seenOrders.set(order, sourcePath);
    }

    if (!sourceData.title && !simpleData.title) {
      errors.push(`missing title in both source and simple docs: ${sourcePath}`);
    }

    const diagram = deriveDiagramPath(sourceData, sourcePath);
    let diagramExists = await fileExists(diagram);
    let diagramPath = diagram;

    if (!diagramExists) {
      const fallbackExists = await fileExists(FALLBACK_DIAGRAM);
      if (!runOptions.failOnMissingDiagrams && fallbackExists) {
        warnings.push(`missing diagram for ${sourcePath}; using fallback ${FALLBACK_DIAGRAM}`);
        diagramPath = FALLBACK_DIAGRAM;
        diagramExists = true;
      } else {
        errors.push(`missing diagram for ${sourcePath}: ${diagram}`);
      }
    }

    entries.push({
      source: {
        path: toPosix(sourcePath),
        area: sourceArea,
        title: sourceData.title || simpleData.title || wikiContract.defaults.title,
        description: deriveDescription(sourceData, sourceBody, simpleData, 180),
        slug,
        collection: deriveCollection(sourceData),
        section: deriveSection(sourceData),
        status: deriveStatus(sourceData),
        order,
        route: technicalRoute,
        routeWithoutAudience: normalizeCandidate(sourcePath.replace(/\.md$/i, '')),
      },
      technical: {
        route: technicalRoute,
        sourcePath: toPosix(sourcePath),
      },
      simple: {
        route: simpleRoute,
        sourcePath: toPosix(simpleSourcePath),
      },
      diagram: {
        path: diagramPath,
        exists: diagramExists,
      },
      sourceParsed,
      simpleParsed,
      sourceContent: sourceBody,
      simpleContent: simpleParsed.content || '',
    });
  }

  return { entries, errors, warnings, sourceCount: sourcePaths.length };
}

function writeInventory(entries, warnings) {
  return fs.writeFile(
    INVENTORY_PATH,
    JSON.stringify(
      {
        contractVersion: wikiContract.version,
        sourceCount: entries.length,
        sourcePaths: entries.map((entry) => entry.source.path),
        warnings,
        entries: entries.map((entry) => ({
          source: entry.source,
          technical: entry.technical,
          simple: entry.simple,
          diagram: entry.diagram,
        })),
      },
      null,
      2,
    ),
    'utf8',
  );
}

async function writeGeneratedPages(entries, candidateMap) {
  const unresolved = [];
  const generatedFiles = [];

  for (const entry of entries) {
    const sourceBody = entry.sourceParsed ? entry.sourceParsed.content : entry.sourceContent;
    const simpleBody = entry.simpleParsed ? entry.simpleParsed.content : entry.simpleContent;
    const sourceRel = entry.source.path;
    const currentSourceForLinks = sourceRel.replace(/\.md$/i, '');
    const technicalMarkdown = rewriteMarkdownBody(
      sourceBody,
      currentSourceForLinks,
      'technical',
      candidateMap,
      sourceRel,
      unresolved,
    );
    const simpleMarkdown = rewriteMarkdownBody(
      simpleBody,
      currentSourceForLinks,
      'simple',
      candidateMap,
      sourceRel,
      unresolved,
    );

    const sharedMeta = {
      draft: false,
      title: entry.source.title,
      description: entry.source.description,
      slug: entry.source.slug,
      collection: entry.source.collection,
      section: entry.source.section,
      status: entry.source.status,
      order: entry.source.order,
      source_route: entry.technical.route,
      simple_route: entry.simple.route,
      source_path: entry.source.path,
      diagram: entry.diagram.path,
    };

    const technicalOutput = `${frontmatterText({
      ...sharedMeta,
      audience: 'technical',
      generated_for: entry.technical.route,
      paired_route: entry.simple.route,
    })}${technicalMarkdown}`;
    const simpleOutput = `${frontmatterText({
      ...sharedMeta,
      audience: 'simple',
      generated_for: entry.simple.route,
      paired_route: entry.technical.route,
    })}${simpleMarkdown}`;

    const technicalOut = path.join(GENERATED_DOCS_ROOT, routeToGeneratedPath('technical', entry.technical.route));
    const simpleOut = path.join(GENERATED_DOCS_ROOT, routeToGeneratedPath('simple', entry.simple.route));

    await fs.mkdir(path.dirname(technicalOut), { recursive: true });
    await fs.mkdir(path.dirname(simpleOut), { recursive: true });

    await Promise.all([
      fs.writeFile(technicalOut, technicalOutput, 'utf8'),
      fs.writeFile(simpleOut, simpleOutput, 'utf8'),
    ]);

    generatedFiles.push(technicalOut, simpleOut);
  }

  return { generatedFiles, unresolved };
}

function reportItems(title, items) {
  if (!items.length) {
    return;
  }

  console.log(title);
  for (const item of items.slice(0, 40)) {
    console.log(`- ${item}`);
  }
  if (items.length > 40) {
    console.log(`- ... and ${items.length - 40} more`);
  }
}

export async function run() {
  validateLinkRewriteFixtures();
  await fs.rm(GENERATED_DOCS_ROOT, { recursive: true, force: true });
  await fs.mkdir(GENERATED_DOCS_ROOT, { recursive: true });

  const { entries, errors, warnings, sourceCount } = await buildSourceInventory();
  reportItems('Contract warnings:', warnings);
  reportItems('Contract errors:', errors);

  if (errors.length > 0) {
    process.exitCode = 1;
    return { sourceCount, warnings, errors };
  }

  const candidateMap = buildCandidateMap(entries);
  const { generatedFiles, unresolved } = await writeGeneratedPages(entries, candidateMap);

  for (const item of unresolved) {
    const line = item.line ? `:${item.line}` : '';
    console.error(`unresolved link in ${item.source}${line}: ${item.target} -> ${item.resolvedCandidate || item.source} (${item.reason})`);
  }

  if (unresolved.length > 0 && runOptions.failOnUnresolvedLinks) {
    process.exitCode = 1;
  }

  await writeInventory(entries, warnings);
  console.log(`Generated ${sourceCount} source entries.`);
  console.log(`Generated document files: ${generatedFiles.length}`);
  console.log(`Contract inventory: ${INVENTORY_PATH}`);

  return { sourceCount, generatedFiles, warnings, errors, unresolved };
}

run().catch((error) => {
  console.error(error?.message || 'Failed to prepare wiki content.');
  process.exit(1);
});
