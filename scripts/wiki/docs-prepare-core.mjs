import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  classifySourcePath,
  deriveAudienceRoute,
  deriveCollection,
  deriveDiagramPath,
  deriveOrder,
  deriveSection,
  deriveStatus,
  normalizeSourcePath,
  simplePathFromSource,
} from './wiki-contract.mjs';

export const DOCS_PREPARE_MODEL = 'gpt-5.4-mini-2026-03-17';
export const DOCS_PREPARE_SCHEMA_NAME = 'nutsnews_wiki_author_draft';

export const docsPrepareSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'simple_title',
    'simple_description',
    'simple_markdown',
    'mermaid',
    'accessibility',
    'review_notes',
  ],
  properties: {
    simple_title: {
      type: 'string',
      description: 'A concise reader-facing title for the Simple article.',
    },
    simple_description: {
      type: 'string',
      description: 'A plain-language description of the Simple article.',
    },
    simple_markdown: {
      type: 'string',
      description: 'The complete Simple article body in Markdown, beginning with one H1.',
    },
    mermaid: {
      type: 'string',
      description: 'One complete Mermaid diagram without Markdown fences or accessibility directives.',
    },
    accessibility: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'description'],
      properties: {
        title: {
          type: 'string',
          description: 'A short title describing the primary diagram.',
        },
        description: {
          type: 'string',
          description: 'A concise text alternative describing the diagram flow and outcome.',
        },
      },
    },
    review_notes: {
      type: 'array',
      description: 'Specific facts, links, warnings, or wording a human reviewer should verify.',
      items: { type: 'string' },
    },
  },
};

const diagramStarters = [
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
];

const systemInstructions = `
You prepare unreviewed NutsNews Wiki authoring drafts from one canonical Technical Markdown source.

Return only the requested structured object. Preserve the source's factual meaning, operational
warnings, links, commands, code semantics, and uncertainty. Do not invent product behavior,
deployment state, credentials, approvals, or verification results.

The Simple Markdown must be a complete, useful plain-language article body with one H1 and clear
sections. It must not include YAML frontmatter, a Mermaid code fence, publication approval, or
claims that a human reviewed it.

The Mermaid value must be one focused primary diagram using valid Mermaid syntax. Do not wrap it
in Markdown fences and do not add accTitle or accDescr directives; those are applied
deterministically from the accessibility object.

Review notes must identify concrete items a human should verify before publication. The result is
always an unreviewed draft and must never claim otherwise.
`.trim();

function safeRelativeArtifactPath(rawPath, expectedRoot, extension) {
  const normalized = `${rawPath ?? ''}`
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '');
  if (
    !normalized
    || path.posix.isAbsolute(normalized)
    || normalized === '..'
    || normalized.startsWith('../')
    || normalized.includes('/../')
    || !normalized.startsWith(`${expectedRoot}/`)
    || !normalized.toLowerCase().endsWith(extension)
  ) {
    throw new Error(`invalid ${expectedRoot} artifact path: ${rawPath}`);
  }
  return normalized;
}

function reviewPathFromSimple(simplePath) {
  return simplePath.replace(/\.md$/i, '.review.json');
}

function sourceHash(rawSource) {
  return createHash('sha256').update(rawSource).digest('hex');
}

function oneLine(value, field) {
  assert.equal(typeof value, 'string', `${field} must be a string`);
  const normalized = value.replace(/\s+/g, ' ').trim();
  assert.ok(normalized, `${field} must not be empty`);
  return normalized;
}

function validateStructuredDraft(value) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'draft must be an object');
  const simpleTitle = oneLine(value.simple_title, 'simple_title');
  const simpleDescription = oneLine(value.simple_description, 'simple_description');
  const accessibilityTitle = oneLine(value.accessibility?.title, 'accessibility.title');
  const accessibilityDescription = oneLine(
    value.accessibility?.description,
    'accessibility.description',
  );
  assert.equal(typeof value.simple_markdown, 'string', 'simple_markdown must be a string');
  assert.equal(typeof value.mermaid, 'string', 'mermaid must be a string');
  assert.ok(Array.isArray(value.review_notes), 'review_notes must be an array');
  const reviewNotes = value.review_notes.map((note, index) => oneLine(note, `review_notes[${index}]`));
  assert.ok(reviewNotes.length > 0, 'review_notes must include at least one human review item');

  return {
    simple_title: simpleTitle,
    simple_description: simpleDescription,
    simple_markdown: value.simple_markdown,
    mermaid: value.mermaid,
    accessibility: {
      title: accessibilityTitle,
      description: accessibilityDescription,
    },
    review_notes: reviewNotes,
  };
}

function parseResponseDraft(response) {
  const outputText = response?.output_text;
  if (typeof outputText !== 'string' || !outputText.trim()) {
    throw new Error('OpenAI Responses API returned no structured draft');
  }
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error('OpenAI Responses API returned invalid structured JSON');
  }
  return validateStructuredDraft(parsed);
}

function requestInput(sourcePath, rawSource, correction) {
  const correctionText = correction
    ? `

The first Mermaid draft failed the local parser. Correct it once while preserving the article
draft and accessibility intent.

Parser summary:
${correction.error}

Invalid Mermaid draft:
${correction.mermaid}
`
    : '';
  return `
Canonical source path: ${sourcePath}

<canonical_technical_markdown>
${rawSource}
</canonical_technical_markdown>
${correctionText}
`.trim();
}

async function requestStructuredDraft(client, sourcePath, rawSource, correction) {
  const response = await client.responses.create({
    model: DOCS_PREPARE_MODEL,
    store: false,
    instructions: systemInstructions,
    input: requestInput(sourcePath, rawSource, correction),
    max_output_tokens: 24_000,
    text: {
      format: {
        type: 'json_schema',
        name: DOCS_PREPARE_SCHEMA_NAME,
        description: 'An unreviewed, publication-blocked NutsNews Wiki authoring draft.',
        strict: true,
        schema: docsPrepareSchema,
      },
    },
  });
  return parseResponseDraft(response);
}

function stripMermaidFences(rawMermaid) {
  const trimmed = rawMermaid.trim();
  const fenced = /^```(?:mermaid)?\s*\n([\s\S]*?)\n```$/i.exec(trimmed);
  return fenced ? fenced[1].trim() : trimmed;
}

function stripMermaidAccessibility(lines) {
  const filtered = [];
  let insideDescription = false;
  for (const line of lines) {
    if (insideDescription) {
      if (/^\s*}\s*$/.test(line)) insideDescription = false;
      continue;
    }
    if (/^\s*accTitle\s*:/i.test(line)) continue;
    if (/^\s*accDescr\s*\{/i.test(line)) {
      insideDescription = true;
      continue;
    }
    if (/^\s*accDescr\s*:/i.test(line)) continue;
    filtered.push(line);
  }
  return filtered;
}

function wrapText(value, width = 88) {
  const words = value.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function addMermaidAccessibility(rawMermaid, accessibility) {
  const title = oneLine(accessibility?.title, 'accessibility.title').replace(/[{}]/g, '');
  const description = oneLine(
    accessibility?.description,
    'accessibility.description',
  ).replace(/[{}]/g, '');
  const lines = stripMermaidAccessibility(
    stripMermaidFences(rawMermaid).split(/\r?\n/),
  );
  const starterPattern = new RegExp(`^\\s*(?:${diagramStarters.join('|')})(?:\\s|$)`);
  const declarationIndex = lines.findIndex((line) => starterPattern.test(line));
  if (declarationIndex < 0) {
    throw new Error('Mermaid draft is missing a supported diagram declaration');
  }
  const accessibilityLines = [
    `  accTitle: ${title}`,
    '  accDescr {',
    ...wrapText(description).map((line) => `    ${line}`),
    '  }',
  ];
  lines.splice(declarationIndex + 1, 0, ...accessibilityLines);
  return `${lines.join('\n').trim()}\n`;
}

let mermaidParserPromise;

async function mermaidParser() {
  if (!mermaidParserPromise) {
    mermaidParserPromise = (async () => {
      const { JSDOM } = await import('jsdom');
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
      return mermaid;
    })();
  }
  return mermaidParserPromise;
}

export async function validateMermaidDraft(mermaidSource) {
  const mermaid = await mermaidParser();
  await mermaid.parse(mermaidSource, { suppressErrors: false });
}

function simpleMarkdownBody(rawMarkdown) {
  let body = rawMarkdown.trim();
  if (body.startsWith('---')) {
    body = parseMarkdownFrontmatter(body).content.trim();
  }
  if (!/^#\s+\S/m.test(body)) {
    throw new Error('Simple Markdown draft must contain an H1 heading');
  }
  return `${body}\n`;
}

function mirrorFrontmatter(sourceData, draft, sourcePath, diagramPath, hash) {
  const sourceWiki = sourceData.wiki && typeof sourceData.wiki === 'object'
    ? sourceData.wiki
    : {};
  const sourceApproval = sourceWiki.approval && typeof sourceWiki.approval === 'object'
    ? sourceWiki.approval
    : {};
  return {
    ...sourceData,
    title: draft.simple_title,
    description: draft.simple_description,
    wiki: {
      ...sourceWiki,
      source_route: deriveAudienceRoute('technical', sourcePath, sourceData),
      simple_route: deriveAudienceRoute('simple', sourcePath, sourceData),
      primary_diagram: {
        file: diagramPath,
        accTitle: draft.accessibility.title,
        accDescr: draft.accessibility.description,
      },
      status: deriveStatus(sourceData),
      collection: deriveCollection(sourceData),
      section: deriveSection(sourceData),
      order: deriveOrder(sourceData),
      approval: {
        ...sourceApproval,
        state: 'unreviewed',
        publishing: 'blocked',
        reviewed_by: 'pending',
        reviewed_on: 'pending',
        technical_source_hash: hash,
      },
    },
  };
}

async function pathExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function writeArtifactsAtomically(repoRoot, artifacts, force) {
  const staged = [];
  const created = [];
  try {
    for (const artifact of artifacts) {
      const target = path.join(repoRoot, artifact.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`;
      await fs.writeFile(temporary, artifact.content, { flag: 'wx', mode: 0o644 });
      staged.push({ target, temporary });
    }

    for (const entry of staged) {
      if (force) {
        await fs.rename(entry.temporary, entry.target);
      } else {
        await fs.link(entry.temporary, entry.target);
        created.push(entry.target);
        await fs.unlink(entry.temporary);
      }
    }
  } catch (error) {
    await Promise.allSettled(staged.map(({ temporary }) => fs.unlink(temporary)));
    if (!force) {
      await Promise.allSettled(created.map((target) => fs.unlink(target)));
    }
    throw error;
  }
}

export async function prepareWikiDraft({
  repoRoot = process.cwd(),
  sourcePath: rawSourcePath,
  client,
  force = false,
  validateMermaid = validateMermaidDraft,
  now = () => new Date(),
}) {
  assert.ok(client?.responses?.create, 'an OpenAI Responses API client is required');
  const sourcePath = normalizeSourcePath(rawSourcePath);
  if (sourcePath.startsWith('audiences/') || sourcePath.startsWith('diagrams/')) {
    throw new Error(`docs:prepare requires a canonical Technical source: ${sourcePath}`);
  }
  classifySourcePath(sourcePath);

  const absoluteSourcePath = path.join(repoRoot, sourcePath);
  const sourceStat = await fs.stat(absoluteSourcePath).catch(() => null);
  if (!sourceStat?.isFile()) {
    throw new Error(`canonical Technical source not found: ${sourcePath}`);
  }
  const rawSource = await fs.readFile(absoluteSourcePath, 'utf8');
  const sourceDocument = parseMarkdownFrontmatter(rawSource);
  const simplePath = simplePathFromSource(sourcePath);
  const diagramPath = safeRelativeArtifactPath(
    deriveDiagramPath(sourceDocument.data, sourcePath),
    'diagrams',
    '.mmd',
  );
  const reviewPath = reviewPathFromSimple(simplePath);
  const targetPaths = [simplePath, diagramPath, reviewPath];
  const existing = (
    await Promise.all(
      targetPaths.map(async (targetPath) => ({
        targetPath,
        exists: await pathExists(path.join(repoRoot, targetPath)),
      })),
    )
  ).filter(({ exists }) => exists);
  if (existing.length && !force) {
    const error = new Error(
      `refusing to overwrite existing draft artifacts without --force: `
        + existing.map(({ targetPath }) => targetPath).join(', '),
    );
    error.code = 'EEXIST';
    throw error;
  }

  let draft = await requestStructuredDraft(client, sourcePath, rawSource);
  let mermaidSource;
  try {
    mermaidSource = addMermaidAccessibility(draft.mermaid, draft.accessibility);
    await validateMermaid(mermaidSource);
  } catch (firstError) {
    draft = await requestStructuredDraft(client, sourcePath, rawSource, {
      mermaid: draft.mermaid,
      error: `${firstError?.message || firstError}`.replace(/\s+/g, ' ').slice(0, 500),
    });
    try {
      mermaidSource = addMermaidAccessibility(draft.mermaid, draft.accessibility);
      await validateMermaid(mermaidSource);
    } catch (secondError) {
      throw new Error(
        `Mermaid draft remained invalid after one retry: `
          + `${secondError?.message || secondError}`.replace(/\s+/g, ' ').slice(0, 500),
      );
    }
  }

  const hash = sourceHash(rawSource);
  const simpleBody = simpleMarkdownBody(draft.simple_markdown);
  const simpleMarkdown = matter.stringify(
    simpleBody,
    mirrorFrontmatter(sourceDocument.data, draft, sourcePath, diagramPath, hash),
  );
  const generatedAt = now().toISOString();
  const reviewManifest = {
    schema_version: 1,
    state: 'unreviewed',
    publishing: 'blocked',
    generated_at: generatedAt,
    generator: {
      provider: 'openai',
      api: 'responses',
      model: DOCS_PREPARE_MODEL,
      store: false,
    },
    source: {
      path: sourcePath,
      sha256: hash,
    },
    artifacts: {
      simple_markdown: simplePath,
      primary_diagram: diagramPath,
      review_manifest: reviewPath,
    },
    accessibility: draft.accessibility,
    review_notes: draft.review_notes,
  };

  await writeArtifactsAtomically(
    repoRoot,
    [
      { path: simplePath, content: simpleMarkdown },
      { path: diagramPath, content: mermaidSource },
      { path: reviewPath, content: `${JSON.stringify(reviewManifest, null, 2)}\n` },
    ],
    force,
  );

  return {
    state: 'unreviewed',
    publishing: 'blocked',
    model: DOCS_PREPARE_MODEL,
    sourcePath,
    sourceHash: hash,
    paths: {
      simple: simplePath,
      diagram: diagramPath,
      review: reviewPath,
    },
    reviewNotes: draft.review_notes.length,
  };
}
