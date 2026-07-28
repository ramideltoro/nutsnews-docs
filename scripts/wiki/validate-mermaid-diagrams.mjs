import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import { deriveSlugFromSource, wikiContract } from './wiki-contract.mjs';

const repoRoot = process.cwd();
const expectedSourceCount = 227;
const expectedDiagramCount = expectedSourceCount;

const knownDiagramStarters = new Set([
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'stateDiagram',
  'erDiagram',
  'journey',
  'gantt',
  'gitGraph',
  'pie',
  'mindmap',
  'timeline',
  'quadrantChart',
  'requirementDiagram',
  'C4Context',
]);

const candidateDiagramExtensions = ['.md', '.mmd'];

function normalizeLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function diagramSourceFromFrontmatter(frontmatter, sourcePath) {
  const wiki = frontmatter?.wiki || {};
  const configured = wiki.primary_diagram;

  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim();
  }

  if (configured && typeof configured === 'object' && configured.file) {
    return configured.file;
  }

  return `${wikiContract.paths.diagramRoot}/${deriveSlugFromSource(sourcePath)}${wikiContract.markdown.diagramExtension}`;
}

function looksLikeMermaid(content) {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const meaningful = lines.filter((line) => line && !line.startsWith('%%') && line !== '%%}');

  if (meaningful.length === 0) {
    return { valid: false, reason: 'file is empty' };
  }

  for (const line of meaningful) {
    if (line === '%%}') {
      continue;
    }

    const starter = normalizeLine(line).split(/[\s(]/)[0];
    if (knownDiagramStarters.has(starter)) {
      return { valid: true };
    }
  }

  return { valid: false, reason: 'missing Mermaid diagram starter token' };
}

async function walkSourceMarkdown(dir = '') {
  const out = [];
  const entries = await fs.readdir(path.join(repoRoot, dir), { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (wikiContract.exclusions.ignoreDirs.has(entry.name)) {
        continue;
      }

      out.push(...(await walkSourceMarkdown(full)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name === 'index.md') {
      continue;
    }

    if (!entry.name.endsWith(wikiContract.markdown.fileExtension)) {
      continue;
    }

    if (wikiContract.exclusions.ignoreFiles.has(entry.name)) {
      continue;
    }

    if (full.startsWith(`audiences${path.sep}`)) {
      continue;
    }

    out.push(full.split(path.sep).join('/'));
  }

  return out;
}

async function resolveDiagramPath(rawDiagramPath, sourcePath) {
  const normalized = (rawDiagramPath || '').trim().replace(/^\/+/, '').replace(/\\/g, '/');
  const candidates = [];
  const sourceBase = sourcePath.replace(/\.md$/i, '').replace(/\\/g, '/');
  const slugBase = `${wikiContract.paths.diagramRoot}/${deriveSlugFromSource(sourcePath)}`;

  const addWithExtensions = (base) => {
    if (!base) {
      return;
    }

    const hasExt = path.extname(base);
    if (hasExt) {
      candidates.push(base);
      return;
    }

    for (const extension of candidateDiagramExtensions) {
      candidates.push(`${base}${extension}`);
    }
  };

  if (normalized) {
    addWithExtensions(normalized);
  }

  addWithExtensions(`${wikiContract.paths.diagramRoot}/${sourceBase}`);
  addWithExtensions(slugBase);

  const uniqueCandidates = [...new Set(candidates)];
  for (const candidate of uniqueCandidates) {
    const absoluteCandidate = path.join(repoRoot, candidate);
    const stat = await fs.stat(absoluteCandidate).catch(() => null);
    if (stat && stat.isFile()) {
      return { candidate, hasFallback: false };
    }
  }

  const directSourceDiagram = sourcePath.replace(/\.md$/i, `.${wikiContract.markdown.diagramExtension}`);
  const sourceFallback = path.join(wikiContract.paths.diagramRoot, path.basename(directSourceDiagram));
  const sourceFallbackAlt = sourceFallback.replace(/\.mmd$/i, '.md');

  const fallbackStat = await fs.stat(path.join(repoRoot, sourceFallback)).catch(() => null);
  if (fallbackStat && fallbackStat.isFile()) {
    return { candidate: sourceFallback, hasFallback: true };
  }

  const fallbackStatAlt = await fs.stat(path.join(repoRoot, sourceFallbackAlt)).catch(() => null);
  if (fallbackStatAlt && fallbackStatAlt.isFile()) {
    return { candidate: sourceFallbackAlt, hasFallback: true };
  }

  return null;
}

async function validateDiagramSyntax(mermaid, diagramPath) {
  const text = await fs.readFile(path.join(repoRoot, diagramPath), 'utf8');
  const trimmed = text.trim();

  if (!trimmed) {
    return { valid: false, reason: 'diagram is empty' };
  }

  const shape = looksLikeMermaid(trimmed);
  if (!shape.valid) {
    return shape;
  }

  try {
    await mermaid.parse(trimmed, { suppressErrors: false });
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `${error?.message || error}`.split('\n')[0],
    };
  }
}

(async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.SVGElement = dom.window.SVGElement;
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
  });
  await assert.rejects(
    () => mermaid.parse('flowchart TD\n  A["unterminated', { suppressErrors: false }),
    /(?:Lexical|Parse) error/i,
    'Mermaid parser must reject invalid syntax',
  );

  const [rendererSource, packageSource] = await Promise.all([
    fs.readFile(path.join(repoRoot, 'src/components/ArticleHeader.astro'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'),
  ]);
  assert.match(rendererSource, /data-render-diagram/, 'diagram rendering must require a manual action');
  assert.match(rendererSource, /import\('mermaid'\)/, 'Mermaid must be bundled as a local lazy import');
  assert.match(rendererSource, /securityLevel:\s*'strict'/, 'Mermaid security must be strict');
  assert.match(rendererSource, /startOnLoad:\s*false/, 'Mermaid must not render automatically');
  assert.match(rendererSource, /fallback\.open = true/, 'render failure must reveal the text fallback');
  assert.match(rendererSource, /data-wiki-mermaid-source/, 'diagram text fallback must stay in the page');
  assert.match(rendererSource, /data-pagefind-ignore/, 'diagram source must not pollute search results');
  assert.doesNotMatch(rendererSource, /https?:\/\//, 'diagram rendering must not use a CDN');
  assert.equal(JSON.parse(packageSource).dependencies.mermaid, '^11.16.0');

  const sourcePaths = await walkSourceMarkdown('');
  const errors = [];
  const diagramPaths = [];
  const diagramCountByPath = new Map();

  for (const sourcePath of sourcePaths) {
    const parsed = parseMarkdownFrontmatter(await fs.readFile(path.join(repoRoot, sourcePath), 'utf8'));
    const diagramPathConfig = diagramSourceFromFrontmatter(parsed.data || {}, sourcePath);
    const resolved = await resolveDiagramPath(diagramPathConfig, sourcePath);

    if (!resolved) {
      errors.push(`missing diagram for ${sourcePath}: ${diagramPathConfig}`);
      continue;
    }

    const resolvedPath = resolved.candidate;
    diagramPaths.push(resolvedPath);
    diagramCountByPath.set(resolvedPath, (diagramCountByPath.get(resolvedPath) || 0) + 1);

    const result = await validateDiagramSyntax(mermaid, resolvedPath);
    if (!result.valid) {
      errors.push(`invalid mermaid syntax in ${resolvedPath}: ${result.reason}`);
    }
  }

  if (sourcePaths.length !== expectedSourceCount) {
    errors.push(`expected ${expectedSourceCount} source documents, found ${sourcePaths.length}`);
  }

  if (diagramPaths.length !== expectedDiagramCount) {
    errors.push(`expected ${expectedDiagramCount} canonical diagrams, found ${diagramPaths.length}`);
  }

  if (new Set(diagramPaths).size !== expectedDiagramCount) {
    errors.push(`expected ${expectedDiagramCount} unique canonical diagrams, found ${new Set(diagramPaths).size}`);
  }

  for (const [pathValue, count] of diagramCountByPath.entries()) {
    if (count > 1) {
      errors.push(`diagram reused across source documents: ${pathValue} (${count}x)`);
    }
  }

  for (const value of diagramPaths) {
    if (value.startsWith('diagrams/audiences/')) {
      errors.push(`unexpected audience duplicate diagram path: ${value}`);
      break;
    }
  }

  if (errors.length > 0) {
    console.error(`Mermaid diagram validation failed with ${errors.length} issue(s):`);
    for (const issue of errors.slice(0, 80)) {
      console.error(`- ${issue}`);
    }

    if (errors.length > 80) {
      console.error(`- ... and ${errors.length - 80} more`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`Mermaid diagram validation passed for ${sourcePaths.length} source documents.`);
  console.log(`Canonical diagram references: ${new Set(diagramPaths).size}`);
  console.log(`Canonical diagram checks: ${diagramPaths.length}`);
  dom.window.close();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
