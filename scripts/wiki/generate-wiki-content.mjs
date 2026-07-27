import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  diagramPathFromSource,
  deriveAudienceRoute,
  deriveSlugFromSource,
  normalizeRoute,
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

  if (next < 0) {
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

function deriveSection(frontmatter) {
  return frontmatter?.wiki?.section || frontmatter?.section || wikiContract.defaultSection;
}

function deriveCollection(frontmatter) {
  return frontmatter?.wiki?.collection || frontmatter?.collection || wikiContract.defaultCollection;
}

function deriveStatus(frontmatter) {
  const status = frontmatter?.wiki?.status || frontmatter?.status || wikiContract.defaults.status;
  return wikiContract.statusValues.includes(status) ? status : wikiContract.defaults.status;
}

function deriveOrder(frontmatter, fallback) {
  const rawOrder = frontmatter?.wiki?.order ?? frontmatter?.order;
  const parsed = Number.parseInt(rawOrder, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function deriveDiagram(frontmatter, sourcePath) {
  const configured = frontmatter?.wiki?.primary_diagram;
  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim();
  }

  if (configured && typeof configured === 'object' && configured.file) {
    return configured.file;
  }

  return diagramPathFromSource(sourcePath);
}

function deriveDescription(frontmatter, markdownContent, maxLength = 170) {
  const contentSource = markdownContent || frontmatter?.description || '';
  const lines = contentSource
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('['));

  const first = lines[0] || frontmatter?.description || 'NutsNews documentation page.';
  return first.length > maxLength ? `${first.slice(0, maxLength - 1)}…` : first;
}

function lineAt(content, offset) {
  return content.slice(0, offset).split('\n').length;
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
    return core;
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

  const replaceInline = (match, left, target, _title, offset) => {
    const line = lineAt(content, offset);
    const rewritten = resolveMarkdownRoute(
      audience,
      currentSourceRel,
      target,
      candidateMap,
      unresolved,
      sourceFile,
      line,
    );
    return match.replace(target, rewritten);
  };

  const replaceReference = (match, left, target, suffix, offset) => {
    const line = lineAt(content, offset);
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

  const firstPass = content.replace(inline, replaceInline);
  return firstPass.replace(reference, replaceReference);
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
  const sourcePaths = (await walkMarkdown(path.join(repoRoot))).filter(
    (item) => item !== 'index.md' && !item.startsWith('audiences/'),
  );
  const errors = [];
  const warnings = [];
  const seenRoutes = new Map();
  const seenSlugs = new Map();
  const entries = [];

  for (let index = 0; index < sourcePaths.length; index += 1) {
    const sourcePath = sourcePaths[index];
    const sourceRaw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const sourceParsed = parseMarkdownFrontmatter(sourceRaw);
    const sourceData = sourceParsed.data || {};
    const sourceBody = sourceParsed.content || '';

    const technicalRoute = deriveAudienceRoute('technical', sourcePath, sourceData);
    const simpleSourcePath = path.join(wikiContract.paths.simpleSourceRoot, sourcePath);
    const simpleExists = await fileExists(simpleSourcePath);
    if (!simpleExists) {
      errors.push(`missing simple mirror: audiences/simple/${sourcePath}`);
      continue;
    }

    const simpleRaw = await fs.readFile(path.join(repoRoot, simpleSourcePath), 'utf8');
    const simpleParsed = parseMarkdownFrontmatter(simpleRaw);
    const simpleData = simpleParsed.data || {};

    const simpleRoute = deriveAudienceRoute('simple', sourcePath, simpleData);

    if (seenRoutes.has(normalizeRoute(technicalRoute))) {
      errors.push(`duplicate technical route: ${technicalRoute}`);
    }
    if (seenRoutes.has(normalizeRoute(simpleRoute))) {
      errors.push(`duplicate simple route: ${simpleRoute}`);
    }
    seenRoutes.set(normalizeRoute(technicalRoute), sourcePath);
    seenRoutes.set(normalizeRoute(simpleRoute), sourcePath);

    const slug = deriveSlugFromSource(sourcePath);
    if (seenSlugs.has(slug) && seenSlugs.get(slug) !== sourcePath) {
      warnings.push(`duplicate slug: ${slug}`);
    } else {
      seenSlugs.set(slug, sourcePath);
    }

    if (!sourceData.title && !simpleData.title) {
      errors.push(`missing title in both source and simple docs: ${sourcePath}`);
    }

    const diagram = deriveDiagram(sourceData, sourcePath);
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
        title: sourceData.title || simpleData.title || 'NutsNews documentation',
        description: deriveDescription(sourceData, sourceBody, 180),
        slug,
        collection: deriveCollection(sourceData),
        section: deriveSection(sourceData),
        status: deriveStatus(sourceData),
        order: deriveOrder(sourceData, index + 1),
        route: technicalRoute,
        routeWithoutAudience: normalizeCandidate(sourcePath.replace(/\.md$/i, '')),
      },
      technical: {
        route: technicalRoute,
        sourcePath: toPosix(sourcePath),
      },
      simple: {
        route: simpleRoute,
        sourcePath: toPosix(sourcePath),
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
        generatedAtUtc: new Date().toISOString(),
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
      generated_for: entry.technical.route,
      paired_route: entry.simple.route,
    };

    const technicalOutput = `${frontmatterText({
      ...sharedMeta,
      generated_for: entry.technical.route,
    })}${technicalMarkdown}`;
    const simpleOutput = `${frontmatterText({
      ...sharedMeta,
      generated_for: entry.simple.route,
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
