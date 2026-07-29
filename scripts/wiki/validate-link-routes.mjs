import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeRoute, wikiContract } from './wiki-contract.mjs';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

const repoRoot = process.cwd();
const scriptPath = fileURLToPath(import.meta.url);
const isDirectRun = path.resolve(process.argv[1] || '') === scriptPath;
const docsRoot = path.join(repoRoot, wikiContract.generatedContentRoot);
const inventoryPath = path.join(repoRoot, 'scripts', 'wiki', 'wiki-inventory.generated.json');
const minimumProductionLinkCoverage = 426;
const audienceFixtureCases = 8;

const INTERNAL_ASSET = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico|pdf|zip|tar|gz|css|js|map|txt|json)$/i;
const EXTERNAL_LINK = /^(?:https?:\/\/|mailto:|tel:|ftp:\/\/|\/\/|#)/i;
const MARKDOWN_REFERENCE = /\.md(?:$|[?#])/i;

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function splitLinkTarget(rawTarget) {
  const target = rawTarget.replace(/^<(.+)>$/, '$1').trim();
  const marker = target.search(/[?#]/);
  if (marker < 0) {
    return { core: target, suffix: '' };
  }
  return { core: target.slice(0, marker), suffix: target.slice(marker) };
}

function collectLinks(content) {
  const inline = /(!?\[[^\]]*?\]\()(<[^>]+>|[^)\s]+)(\s+["'][^"']*["'])?\)/g;
  const reference = /^(\s*\[[^\]]+\]:\s+)(<[^>]+>|[^\s]+)(\s+"[^"]*")?$/gm;
  const links = [];
  const chunks = content.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) || [];
  let fenceCharacter = null;
  let fenceLength = 0;

  const collectSegment = (segment, line) => {
    for (const match of segment.matchAll(inline)) {
      links.push({ target: match[2], line });
    }
    for (const match of segment.matchAll(reference)) {
      links.push({ target: match[2], line });
    }
  };

  const collectOutsideInlineCode = (lineContent, lineNumber) => {
    const codeSpan = /(`+)([\s\S]*?)\1/g;
    let cursor = 0;
    for (const match of lineContent.matchAll(codeSpan)) {
      collectSegment(lineContent.slice(cursor, match.index), lineNumber);
      cursor = match.index + match[0].length;
    }
    collectSegment(lineContent.slice(cursor), lineNumber);
  };

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
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
      continue;
    }

    if (fenceCharacter || /^(?: {4}|\t)/.test(lineWithoutEnding)) {
      continue;
    }

    collectOutsideInlineCode(chunk, index + 1);
  }

  return links;
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }

  return out;
}

function routeFromGeneratedPath(filePath) {
  const relative = path.relative(docsRoot, filePath);
  const segments = relative.split(path.sep).map((segment) => segment.replace(/\.md$/i, ''));
  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }
  return normalizeRoute(`/${segments.join('/')}`);
}

function isIgnoredTarget(core) {
  return !core || EXTERNAL_LINK.test(core) || INTERNAL_ASSET.test(core);
}

function resolveGeneratedRoute(currentRoute, core) {
  if (core.startsWith('/')) {
    return normalizeRoute(core);
  }
  return normalizeRoute(path.posix.join(currentRoute, core));
}

function hasDescendantRoute(routeSet, route) {
  const prefix = `${normalizeRoute(route)}/`;
  return [...routeSet].some((candidate) => candidate.startsWith(prefix));
}

function resolveSourceReference(sourcePath, core) {
  const relative = core.startsWith('/')
    ? core.replace(/^\/+/, '')
    : path.posix.join(path.posix.dirname(sourcePath), core);
  return path.posix.normalize(relative).replace(/^\.\//, '');
}

export function expectedGeneratedDocumentCount(inventory) {
  return inventory.entries.length * wikiContract.audiences.length;
}

async function validateProductionSourceLinks(inventory, errors) {
  const sourceLookup = new Map(
    inventory.sourcePaths.map((sourcePath) => [sourcePath.toLowerCase(), sourcePath]),
  );
  let covered = 0;

  for (const sourcePath of inventory.sourcePaths) {
    const raw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const markdown = parseMarkdownFrontmatter(raw).content;
    for (const { target, line } of collectLinks(markdown)) {
      const { core } = splitLinkTarget(target);
      if (isIgnoredTarget(core)) {
        continue;
      }

      covered += 1;
      const resolved = resolveSourceReference(sourcePath, core);

      if (MARKDOWN_REFERENCE.test(target)) {
        if (!sourceLookup.has(resolved.toLowerCase())) {
          errors.push({
            source: sourcePath,
            line,
            target,
            reason: `unresolved source path ${resolved}`,
          });
        }
        continue;
      }

      const directoryPrefix = `${resolved.replace(/\/+$/, '')}/`.toLowerCase();
      if (
        !sourceLookup.has(resolved.toLowerCase())
        && ![...sourceLookup.keys()].some((candidate) => candidate.startsWith(directoryPrefix))
      ) {
        errors.push({
          source: sourcePath,
          line,
          target,
          reason: `unresolved internal target ${resolved}`,
        });
      }
    }
  }

  if (covered < minimumProductionLinkCoverage) {
    errors.push({
      source: 'production inventory',
      line: 0,
      target: `${covered} internal links`,
      reason: `expected coverage of at least ${minimumProductionLinkCoverage}`,
    });
  }

  return covered;
}

async function validateGeneratedLinks(inventory, errors) {
  const docs = await walkMarkdown(docsRoot);
  const routeSet = new Set(docs.map(routeFromGeneratedPath));
  for (const audience of wikiContract.audiences) {
    for (const item of wikiContract.navigation.rail) {
      routeSet.add(normalizeRoute(`/${audience}/collections/${item.id}`));
    }
  }
  let checked = 0;

  const expectedDocumentCount = expectedGeneratedDocumentCount(inventory);
  assert.equal(
    docs.length,
    expectedDocumentCount,
    `expected ${expectedDocumentCount} generated audience documents`,
  );

  for (const doc of docs) {
    const currentRoute = routeFromGeneratedPath(doc);
    const currentAudience = currentRoute.split('/').filter(Boolean)[0];
    const source = toPosix(path.relative(repoRoot, doc));
    const raw = await fs.readFile(doc, 'utf8');
    const markdown = parseMarkdownFrontmatter(raw).content;

    for (const { target, line } of collectLinks(markdown)) {
      const { core } = splitLinkTarget(target);
      if (isIgnoredTarget(core)) {
        continue;
      }

      checked += 1;
      if (MARKDOWN_REFERENCE.test(target)) {
        errors.push({
          source,
          line,
          target,
          reason: 'generated internal URL contains a .md suffix',
        });
        continue;
      }

      const resolved = resolveGeneratedRoute(currentRoute, core);
      const resolvedAudience = resolved.split('/').filter(Boolean)[0];
      if (
        ['simple', 'technical'].includes(resolvedAudience)
        && resolvedAudience !== currentAudience
      ) {
        errors.push({
          source,
          line,
          target,
          reason: `cross-audience route from ${currentAudience} to ${resolvedAudience}`,
        });
        continue;
      }

      if (!routeSet.has(resolved) && !hasDescendantRoute(routeSet, resolved)) {
        errors.push({
          source,
          line,
          target,
          reason: `unresolved generated route ${resolved}`,
        });
      }
    }
  }

  return { docs: docs.length, checked };
}

async function run() {
  const errors = [];
  const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
  const productionLinks = await validateProductionSourceLinks(inventory, errors);
  const generated = await validateGeneratedLinks(inventory, errors);

  if (errors.length > 0) {
    console.error(`Link validation found ${errors.length} error(s):`);
    for (const error of errors.slice(0, 80)) {
      const line = error.line ? `:${error.line}` : '';
      console.error(`- ${error.source}${line} -> ${error.target} (${error.reason})`);
    }
    if (errors.length > 80) {
      console.error(`- ... and ${errors.length - 80} more`);
    }
    process.exit(1);
  }

  console.log(
    `Internal route link validation passed: ${productionLinks} production source links covered, `
      + `${audienceFixtureCases} audience fixture cases, `
      + `${generated.checked} generated internal links checked across ${generated.docs} documents, `
      + 'zero generated .md URLs.',
  );
}

if (isDirectRun) {
  run().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
