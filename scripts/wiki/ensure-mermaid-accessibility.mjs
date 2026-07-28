import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import { diagramFromSource, wikiContract, deriveSlugFromSource } from './wiki-contract.mjs';

const repoRoot = process.cwd();

const EXPECTED_SOURCE_COUNT = 227;
const ACCESSIBILITY_TITLE = 'accTitle';
const ACCESSIBILITY_DESCRIPTION = 'accDescr';

function toPosix(relPath) {
  if (typeof relPath !== 'string') {
    return String(relPath);
  }
  return relPath.split(path.sep).join('/');
}

function normalizeCandidate(rawPath) {
  if (typeof rawPath !== 'string') {
    return '';
  }
  return rawPath
    .replace(/\.md$/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/+/g, '/');
}

async function resolveDiagramPath(rawDiagramPath, sourcePath) {
  const normalized = normalizeCandidate(rawDiagramPath);
  const sourceSlugBase = deriveSlugFromSource(sourcePath);
  const slugBased = `${wikiContract.paths.diagramRoot}/${sourceSlugBase}`;
  const candidates = [];

  const addCandidate = (candidate) => {
    if (!candidate) {
      return;
    }
    const normalizedCandidate = candidate
      .replace(/\.md$/i, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .replace(/^diagrams\//, '')
      .replace(/^\.\//, '');

    candidates.push(`${wikiContract.paths.diagramRoot}/${normalizedCandidate}.mmd`);
    candidates.push(`${wikiContract.paths.diagramRoot}/${normalizedCandidate}.md`);
  };

  if (normalized) {
    addCandidate(normalized);
  }

  if (sourcePath) {
    addCandidate(sourcePath);
  }

  if (slugBased) {
    addCandidate(slugBased);
  }

  const unique = [...new Set(candidates)];
  for (const candidate of unique) {
    try {
      const stat = await fs.stat(path.join(repoRoot, candidate));
      if (stat.isFile()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function hasAccessibilityHeader(rawDiagram) {
  return {
    hasTitle: /(^|\n)\s*accTitle\s*:/i.test(rawDiagram),
    hasDescription: /(^|\n)\s*accDescr\s*:/i.test(rawDiagram),
  };
}

function deriveSourceDescription(sourceData, simpleData, sourceContent, fallback) {
  const body = sourceContent || '';
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('['));

  const first = sourceData?.description || simpleData?.description || lines[0] || fallback;
  const clean = first.replace(/\s+/g, ' ').trim();
  return clean.length > 140 ? `${clean.slice(0, 139)}…` : clean;
}

async function walkMarkdown(current = '') {
  const absolute = path.join(repoRoot, current);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (wikiContract.exclusions.ignoreDirs.has(entry.name)) {
      continue;
    }

    const next = path.join(current, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(next)));
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

async function updateDiagramFile(diagramPath, title, description, sourcePath) {
  const absolute = path.join(repoRoot, diagramPath);
  const raw = await fs.readFile(absolute, 'utf8');
  const markers = hasAccessibilityHeader(raw);

  if (markers.hasTitle && markers.hasDescription) {
    return false;
  }

  const prefix = [];
  if (!markers.hasTitle) {
    prefix.push(`${ACCESSIBILITY_TITLE}: ${JSON.stringify(title || deriveSlugFromSource(sourcePath).replace(/[-_]/g, ' '))}`);
  }

  if (!markers.hasDescription) {
    prefix.push(`${ACCESSIBILITY_DESCRIPTION}: ${JSON.stringify(description || `Diagram for ${sourcePath}`)}`);
  }

  const next = `${prefix.join('\n')}\n${raw}\n`;
  await fs.writeFile(absolute, next, 'utf8');
  return true;
}

async function run() {
  const sourcePaths = (await walkMarkdown()).filter((entry) => entry !== 'index.md' && !entry.startsWith('audiences/'));
  const touched = [];
  let processed = 0;

  for (const sourcePath of sourcePaths) {
    if (typeof sourcePath !== 'string') {
      continue;
    }

    const simpleSourcePath = path.join(wikiContract.paths.simpleSourceRoot, sourcePath);
    try {
      await fs.access(path.join(repoRoot, simpleSourcePath));
    } catch {
      continue;
    }

    const sourceRaw = await fs.readFile(path.join(repoRoot, sourcePath), 'utf8');
    const sourceParsed = parseMarkdownFrontmatter(sourceRaw);
    const sourceData = sourceParsed.data || {};
    const sourceContent = sourceParsed.content || '';

    const simpleRaw = await fs.readFile(path.join(repoRoot, simpleSourcePath), 'utf8');
    const simpleParsed = parseMarkdownFrontmatter(simpleRaw);
    const simpleData = simpleParsed.data || {};

    const configuredDiagramPath = diagramFromSource(sourceData, sourcePath);

    if (typeof configuredDiagramPath !== 'string') {
      continue;
    }

    const diagramPath = await resolveDiagramPath(configuredDiagramPath, sourcePath);
    if (!diagramPath) {
      continue;
    }

    const title = sourceData.title || simpleData.title || deriveSlugFromSource(sourcePath).replace(/-/g, ' ');
    const description = deriveSourceDescription(sourceData, simpleData, sourceContent, title);
    const touchedOne = await updateDiagramFile(diagramPath, title, description, sourcePath);
    if (touchedOne && typeof diagramPath === 'string') {
      touched.push(toPosix(diagramPath));
    }

    processed += 1;
  }

  if (processed !== EXPECTED_SOURCE_COUNT) {
    console.log(`Warning: expected ${EXPECTED_SOURCE_COUNT} sources while scanning ${sourcePaths.length}.`);
  }

  if (touched.length === 0) {
    console.log('No Mermaid accessibility headers required updates.');
    return;
  }

  console.log(`Updated ${touched.length} Mermaid diagram files with accessibility headers.`);
  for (const item of touched.slice(0, 30)) {
    console.log(`- ${item}`);
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
