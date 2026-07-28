import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { deriveSlugFromSource } from './wiki-contract.mjs';

const args = process.argv.slice(2);

function usage() {
  console.log(`Usage: node scripts/wiki/draft-doc.mjs <source-path> [options]

Options:
  --title <text>         Set the title
  --topic <text>         One-line topic summary
  --force                Overwrite existing files
  --diagram <path>       Primary diagram file path (optional)
`);
  process.exit(1);
}

function parseArgs(values) {
  const out = {
    force: false,
    title: null,
    topic: 'pending draft topic',
    diagram: null,
  };

  const remaining = [];
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === '--force') {
      out.force = true;
      continue;
    }

    const next = values[i + 1];
    if (!value.startsWith('--')) {
      remaining.push(value);
      continue;
    }

    if (!next || next.startsWith('--')) {
      usage();
    }

    if (value === '--title') {
      out.title = next;
    } else if (value === '--topic') {
      out.topic = next;
    } else if (value === '--diagram') {
      out.diagram = next;
    } else {
      usage();
    }

    i += 1;
  }

  if (!remaining[0]) {
    usage();
  }

  out.sourceInput = remaining[0];
  return out;
}

function normalizeSourcePath(raw) {
  const withFallback = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  const pathWithExt = withFallback.endsWith('.md') ? withFallback : `${withFallback}.md`;
  const normalized = path.posix.normalize(pathWithExt);
  if (normalized.startsWith('..') || normalized.includes('/../')) {
    throw new Error('Source path escapes repository root.');
  }
  return normalized.replace(/^audiences\/simple\//, '').replace(/^audiences\/technical\//, '');
}

function draftSourceFrontmatter({ title, topic, route, sourcePath, diagram }) {
  const resolvedDiagram = diagram || `diagrams/${path.basename(sourcePath, '.md')}.mmd`;
  return `---\n` +
    `title: ${JSON.stringify(`${title} (Draft)`)}\n` +
    `description: ${JSON.stringify(topic)}\n` +
    `slug: ${JSON.stringify(deriveSlugFromSource(sourcePath))}\n` +
    `collection: "start-here"\n` +
    `section: "overview"\n` +
    `status: "draft"\n` +
    `order: 0\n` +
    `source_route: /technical${route}\n` +
    `simple_route: /simple${route}\n` +
    `diagram: ${JSON.stringify(resolvedDiagram)}\n` +
    `approval:\n` +
    `  reviewed_by: pending\n` +
    `  reviewed_on: pending\n` +
    `  technical_source_hash: pending\n` +
    `---\n\n` +
    `# ${title} (Draft)\n\n` +
    `## Plain-language draft\n\n` +
    `This file was created by the wiki draft command.\n\n` +
    `- Technical topic: ${topic}\n` +
    `- Planned diagram: ${resolvedDiagram}\n\n` +
    `## Draft body\n\n` +
    `Replace this section with human-reviewed plain-language language before removing draft status.\n\n`;
}

function draftSimpleFrontmatter({ title, route, sourcePath }) {
  return `---\n` +
    `title: ${JSON.stringify(`${title} (Simple)`)}\n` +
    `description: ${JSON.stringify('Simple-language draft placeholder') }\n` +
    `slug: ${JSON.stringify(deriveSlugFromSource(sourcePath))}\n` +
    `collection: "start-here"\n` +
    `section: "overview"\n` +
    `status: "draft"\n` +
    `order: 0\n` +
    `source_route: /technical${route}\n` +
    `simple_route: /simple${route}\n` +
    `approval:\n` +
    `  reviewed_by: pending\n` +
    `  reviewed_on: pending\n` +
    `  technical_source_hash: pending\n` +
    `---\n\n` +
    `# ${title} (Simple Draft)\n\n` +
    `## Plain-language draft\n\n` +
    `Keep this draft in a simplified style until human review is complete.\n`;
}

async function writeIfChanged(filePath, content, force) {
  try {
    if (!force) {
      await fs.access(filePath);
      throw new Error(`Refusing to overwrite existing file: ${filePath}`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

(async () => {
  const options = parseArgs(args);
  const sourcePath = normalizeSourcePath(options.sourceInput);
  const title = options.title || sourcePath.replace(/^.*\//, '').replace(/\.md$/i, '');
  const route = `/${deriveSlugFromSource(sourcePath)}`;

  const sourceTarget = path.join(process.cwd(), sourcePath);
  const simpleTarget = path.join(process.cwd(), 'audiences/simple', sourcePath);

  await writeIfChanged(
    sourceTarget,
    draftSourceFrontmatter({
      title,
      topic: options.topic,
      route,
      sourcePath,
      diagram: options.diagram,
    }),
    options.force,
  );
  await writeIfChanged(
    simpleTarget,
    draftSimpleFrontmatter({ title, route, sourcePath }),
    options.force,
  );

  const openaiKey = process.env.OPENAI_API_KEY;
  const hasLocalAI = process.env.LOCALAI_ENABLED === '1';
  if (!openaiKey && !hasLocalAI) {
    console.log('Draft created in protected mode: no OpenAI call executed.');
  }

  console.log(`Created draft source: ${sourcePath}`);
  console.log(`Created draft Simple mirror: audiences/simple/${sourcePath}`);
  console.log('This draft is blocked until review metadata is approved by a human.');
})();
