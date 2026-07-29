import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  classifySourcePath,
  deriveAudienceRoute,
  diagramPathFromSource,
  normalizeSlug,
  normalizeSourcePath,
  simplePathFromSource,
  technicalMirrorPathFromSource,
  wikiContract,
} from './wiki-contract.mjs';
import {
  approvalContract,
  expertSourceHash,
} from './wiki-approval.mjs';

const titleWords = new Map([
  ['api', 'API'],
  ['cdn', 'CDN'],
  ['ci', 'CI'],
  ['cpu', 'CPU'],
  ['dns', 'DNS'],
  ['github', 'GitHub'],
  ['ios', 'iOS'],
  ['qa', 'QA'],
  ['sdk', 'SDK'],
  ['ui', 'UI'],
  ['ux', 'UX'],
  ['vps', 'VPS'],
  ['nutsnews', 'NutsNews'],
]);

function titleFromSourcePath(sourcePath) {
  const basename = path.posix.basename(sourcePath).replace(/\.md$/i, '');
  return basename
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return titleWords.get(lower) || `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

function oneLine(value, field) {
  const normalized = `${value ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function yamlScalar(value) {
  return typeof value === 'number' ? `${value}` : JSON.stringify(value);
}

function frontmatter({
  title,
  description,
  technicalRoute,
  simpleRoute,
  diagramPath,
  slug,
  accessibilityTitle,
  accessibilityDescription,
  collection,
  section,
  order,
  approval,
}) {
  return [
    '---',
    `title: ${yamlScalar(title)}`,
    `description: ${yamlScalar(description)}`,
    'wiki:',
    `  source_route: ${yamlScalar(technicalRoute)}`,
    `  simple_route: ${yamlScalar(simpleRoute)}`,
    `  slug: ${yamlScalar(slug)}`,
    '  primary_diagram:',
    `    file: ${yamlScalar(diagramPath)}`,
    `    accTitle: ${yamlScalar(accessibilityTitle)}`,
    `    accDescr: ${yamlScalar(accessibilityDescription)}`,
    '  status: draft',
    `  collection: ${collection}`,
    `  section: ${section}`,
    `  order: ${order}`,
    '  approval:',
    `    state: ${approval.state}`,
    `    publishing: ${approval.publishing}`,
    `    reviewed_by: ${approval.reviewed_by}`,
    `    reviewed_on: ${approval.reviewed_on}`,
    `    technical_source_hash: ${approval.technical_source_hash}`,
    '---',
  ].join('\n');
}

function expertBody(title) {
  return [
    `# ${title}`,
    '',
    '> Draft scaffold: replace every TODO and verify all claims before publishing.',
    '',
    '## Purpose',
    '',
    'TODO: Explain the reader or operator outcome this document supports.',
    '',
    '## Scope',
    '',
    '### In scope',
    '',
    '- TODO: List the behavior, workflow, or system covered here.',
    '',
    '### Out of scope',
    '',
    '- TODO: Record an important boundary.',
    '',
    '## Technical details',
    '',
    'TODO: Document the implementation, dependencies, failure modes, and safety constraints.',
    '',
    '## Validation',
    '',
    '- [ ] Replace all TODO markers.',
    '- [ ] Verify links, commands, facts, and operational status.',
    '- [ ] Review the Simple draft and primary diagram.',
  ].join('\n');
}

function simpleBody(title) {
  return [
    `# ${title}`,
    '',
    '> Unreviewed Simple draft: verify its claims before publishing.',
    '',
    '## What this is',
    '',
    'TODO: Explain the topic in plain language.',
    '',
    '## What readers should know',
    '',
    '- TODO: Add the most important reader-facing fact.',
    '- TODO: Preserve any warning or safety boundary from the Technical source.',
    '',
    '## What happens next',
    '',
    'TODO: Describe the next step or expected outcome without adding unverified claims.',
  ].join('\n');
}

function diagramSource(title, accessibilityTitle, accessibilityDescription) {
  return [
    'flowchart TD',
    `  accTitle: ${accessibilityTitle}`,
    '  accDescr {',
    `    ${accessibilityDescription}`,
    '  }',
    '  expert["Expert source"] --> simple["Simple draft"]',
    '  expert --> diagram["Primary diagram"]',
    '  simple --> checks["Automated quality checks"]',
    '  diagram --> checks',
    '  checks --> published["Published wiki page"]',
    '',
  ].join('\n');
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function nextCommands(sourcePath) {
  const quotedPath = shellQuote(sourcePath);
  return [
    `npm run docs:prepare -- ${quotedPath} --force`,
    'npm run validate:content',
  ];
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function assertSafeArtifactParents(repoRoot, relativePath) {
  const segments = path.dirname(relativePath).split(/[\\/]+/).filter(Boolean);
  let current = repoRoot;
  for (const segment of segments) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current).catch(() => null);
    if (stat?.isSymbolicLink()) {
      throw new Error(`unsafe symlinked wiki artifact parent: ${relativePath}`);
    }
    if (stat && !stat.isDirectory()) {
      throw new Error(`unsafe non-directory wiki artifact parent: ${relativePath}`);
    }
  }
}

async function walkCanonicalSources(repoRoot, current = '') {
  const directory = path.join(repoRoot, current);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    const relative = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (wikiContract.exclusions.ignoreDirs.has(entry.name)) continue;
      sources.push(...await walkCanonicalSources(repoRoot, relative));
    } else if (
      entry.isFile()
      && entry.name.toLowerCase().endsWith('.md')
      && entry.name.toLowerCase() !== 'index.md'
    ) {
      sources.push(relative.split(path.sep).join('/'));
    }
  }
  return sources;
}

async function assertNoDuplicateRoute(repoRoot, sourcePath, sourceData) {
  const candidateRoutes = new Set([
    deriveAudienceRoute('technical', sourcePath, sourceData).toLowerCase(),
    deriveAudienceRoute('simple', sourcePath, sourceData).toLowerCase(),
  ]);
  const existingSources = await walkCanonicalSources(repoRoot);
  for (const existingPath of existingSources) {
    if (existingPath.toLowerCase() === sourcePath.toLowerCase()) {
      throw new Error(`wiki source path already exists: ${existingPath}`);
    }
    const existing = parseMarkdownFrontmatter(
      await fs.readFile(path.join(repoRoot, existingPath), 'utf8'),
    );
    for (const audience of ['technical', 'simple']) {
      const route = deriveAudienceRoute(audience, existingPath, existing.data).toLowerCase();
      if (candidateRoutes.has(route)) {
        throw new Error(`wiki route already exists: ${route} (${existingPath})`);
      }
    }
  }
}

async function createFilesAtomically(repoRoot, artifacts) {
  const transactionId = `${process.pid}-${randomUUID()}`;
  const staged = [];
  const created = [];
  try {
    for (const artifact of artifacts) {
      const target = path.join(repoRoot, artifact.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.tmp-${transactionId}`;
      await fs.writeFile(temporary, artifact.content, { flag: 'wx', mode: 0o644 });
      staged.push({ target, temporary });
    }
    for (const entry of staged) {
      await fs.link(entry.temporary, entry.target);
      created.push(entry.target);
      await fs.unlink(entry.temporary);
    }
  } catch (error) {
    await Promise.allSettled(staged.map(({ temporary }) => fs.unlink(temporary)));
    await Promise.allSettled(created.map((target) => fs.unlink(target)));
    throw error;
  }
}

export async function createWikiScaffold({
  repoRoot = process.cwd(),
  sourcePath: rawSourcePath,
  collection: rawCollection,
  section: rawSection,
  title: rawTitle,
  order: rawOrder = 0,
}) {
  const sourcePath = normalizeSourcePath(rawSourcePath);
  if (
    sourcePath.startsWith('audiences/')
    || sourcePath.startsWith('diagrams/')
    || path.posix.basename(sourcePath).toLowerCase() === 'index.md'
  ) {
    throw new Error(`unsafe canonical wiki source path: ${sourcePath}`);
  }
  classifySourcePath(sourcePath);

  const collection = oneLine(rawCollection, 'collection');
  const section = oneLine(rawSection, 'section');
  const collectionContract = wikiContract.navigation.collections.find(
    (candidate) => candidate.id === collection,
  );
  if (!collectionContract) {
    throw new Error(`unsupported wiki collection: ${collection}`);
  }
  if (!collectionContract.sections.includes(section)) {
    throw new Error(`section ${section} does not belong to collection ${collection}`);
  }
  const order = Number.parseInt(`${rawOrder}`, 10);
  if (!Number.isSafeInteger(order) || order < 0 || `${order}` !== `${rawOrder}`) {
    throw new Error('order must be a non-negative integer');
  }

  const title = rawTitle ? oneLine(rawTitle, 'title') : titleFromSourcePath(sourcePath);
  const description = `Draft documentation for ${title}.`;
  const slug = normalizeSlug(
    sourcePath.replace(/\.md$/i, '').replace(/\s+/g, '-'),
  );
  const simplePath = simplePathFromSource(sourcePath);
  const technicalMirrorPath = technicalMirrorPathFromSource(sourcePath);
  const diagramPath = diagramPathFromSource(sourcePath);
  const reviewPath = simplePath.replace(/\.md$/i, '.review.json');
  const sourceData = {
    wiki: {
      collection,
      section,
      slug,
    },
  };
  const technicalRoute = deriveAudienceRoute('technical', sourcePath, sourceData);
  const simpleRoute = deriveAudienceRoute('simple', sourcePath, sourceData);
  const accessibilityTitle = `${title} authoring flow`;
  const accessibilityDescription = `The expert source and primary diagram feed a Simple draft that passes automated quality checks before publication.`;
  const placeholderApproval = {
    state: approvalContract.unreviewedState,
    publishing: approvalContract.allowedPublishing,
    reviewed_by: approvalContract.pendingReviewer,
    reviewed_on: 'pending',
    technical_source_hash: 'pending',
  };
  const frontmatterFields = {
    title,
    description,
    technicalRoute,
    simpleRoute,
    diagramPath,
    slug,
    accessibilityTitle,
    accessibilityDescription,
    collection,
    section,
    order,
  };
  const placeholderExpert = `${frontmatter({
    ...frontmatterFields,
    approval: placeholderApproval,
  })}\n${expertBody(title)}\n`;
  const sourceHash = expertSourceHash(placeholderExpert);
  const approval = {
    ...placeholderApproval,
    technical_source_hash: sourceHash,
  };
  const canonicalMarkdown = `${frontmatter({
    ...frontmatterFields,
    approval,
  })}\n${expertBody(title)}\n`;
  const simpleMarkdown = `${frontmatter({
    ...frontmatterFields,
    title: `${title} (Simple)`,
    approval,
  })}\n${simpleBody(title)}\n`;
  const technicalMirrorMarkdown = `${frontmatter({
    ...frontmatterFields,
    title: `${title} (Technical)`,
    approval,
  })}\n${expertBody(title)}\n`;
  const commands = nextCommands(sourcePath);
  const reviewManifest = {
    schema_version: 1,
    state: approval.state,
    publishing: approval.publishing,
    source: {
      path: sourcePath,
      sha256: sourceHash,
    },
    artifacts: {
      canonical_expert: sourcePath,
      simple_markdown: simplePath,
      technical_mirror: technicalMirrorPath,
      primary_diagram: diagramPath,
      review_manifest: reviewPath,
    },
    accessibility: {
      title: accessibilityTitle,
      description: accessibilityDescription,
    },
    review_notes: [
      'Replace every TODO marker.',
      'Verify facts, links, commands, warnings, and operational status.',
      'Review the Simple draft and primary diagram for accuracy.',
    ],
    next_commands: commands,
  };
  const artifacts = [
    { path: sourcePath, content: canonicalMarkdown },
    { path: simplePath, content: simpleMarkdown },
    { path: technicalMirrorPath, content: technicalMirrorMarkdown },
    {
      path: diagramPath,
      content: diagramSource(title, accessibilityTitle, accessibilityDescription),
    },
    { path: reviewPath, content: `${JSON.stringify(reviewManifest, null, 2)}\n` },
  ];

  const existing = [];
  for (const artifact of artifacts) {
    await assertSafeArtifactParents(repoRoot, artifact.path);
    if (await pathExists(path.join(repoRoot, artifact.path))) existing.push(artifact.path);
  }
  if (existing.length) {
    throw new Error(`refusing to overwrite existing wiki artifacts: ${existing.join(', ')}`);
  }
  await assertNoDuplicateRoute(repoRoot, sourcePath, sourceData);
  await createFilesAtomically(repoRoot, artifacts);

  return {
    state: approval.state,
    publishing: approval.publishing,
    sourceHash,
    paths: {
      source: sourcePath,
      simple: simplePath,
      technicalMirror: technicalMirrorPath,
      diagram: diagramPath,
      review: reviewPath,
    },
    nextCommands: commands,
  };
}
