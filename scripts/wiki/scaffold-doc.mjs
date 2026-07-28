import fs from 'node:fs/promises';
import path from 'node:path';
import { deriveSlugFromSource } from './wiki-contract.mjs';

const args = process.argv.slice(2);

function usage() {
  console.log(`Usage: node scripts/wiki/scaffold-doc.mjs <source-path> [options]

Options:
  --title <text>        Set the frontmatter title (defaults to filename)
  --description <text>   Set the top description
  --collection <slug>    Set wiki collection (default: start-here)
  --section <slug>      Set wiki section (default: overview)
  --status <value>      Set wiki status (default: active)
  --order <number>      Set wiki order (default: 0)
  --force               Overwrite existing files
`);
  process.exit(1);
}

function parseArgs(values) {
  const out = {
    force: false,
    title: null,
    description: null,
    collection: 'start-here',
    section: 'overview',
    status: 'active',
    order: 0,
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
    } else if (value === '--description') {
      out.description = next;
    } else if (value === '--collection') {
      out.collection = next;
    } else if (value === '--section') {
      out.section = next;
    } else if (value === '--status') {
      out.status = next;
    } else if (value === '--order') {
      const parsed = Number.parseInt(next, 10);
      out.order = Number.isFinite(parsed) ? parsed : 0;
    } else {
      usage();
    }

    i += 1;
  }

  const sourceInput = remaining[0];
  if (!sourceInput) {
    usage();
  }

  out.sourceInput = sourceInput;
  return out;
}

function normalizeSourcePath(raw) {
  const withFallback = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  const noLeadingAudience = withFallback.replace(/^audiences\/simple\//, '').replace(/^audiences\/technical\//, '');
  const pathWithExt = noLeadingAudience.endsWith('.md') ? noLeadingAudience : `${noLeadingAudience}.md`;
  const normalized = path.posix.normalize(pathWithExt);
  if (normalized.startsWith('..') || normalized.includes('/../')) {
    throw new Error('Source path escapes repository root.');
  }
  return normalized;
}

function buildSourceFrontmatter({ title, description, sourcePath, options }) {
  const slug = deriveSlugFromSource(sourcePath);
  const route = `/${slug}`;

  return `---\n` +
    `title: ${JSON.stringify(title)}\n` +
    `description: ${JSON.stringify(description)}\n` +
    `slug: ${JSON.stringify(slug)}\n` +
    `collection: ${JSON.stringify(options.collection)}\n` +
    `section: ${JSON.stringify(options.section)}\n` +
    `status: ${JSON.stringify(options.status)}\n` +
    `order: ${options.order}\n` +
    `source_route: /technical${route}\n` +
    `simple_route: /simple${route}\n` +
    `approval:\n` +
    `  reviewed_by: pending\n` +
    `  reviewed_on: pending\n` +
    `  technical_source_hash: pending\n` +
    `---\n\n` +
    `# ${title}\n\n` +
    `## What this doc covers\n\n` +
    `Add the technical version for the new wiki document here.\n`;
}

function buildSimpleFrontmatter({ title, description, sourcePath, options }) {
  const slug = deriveSlugFromSource(sourcePath);
  const route = `/${slug}`;

  return `---\n` +
    `title: ${JSON.stringify(`${title} (Simple)`)}\n` +
    `description: ${JSON.stringify(description)}\n` +
    `slug: ${JSON.stringify(slug)}\n` +
    `collection: ${JSON.stringify(options.collection)}\n` +
    `section: ${JSON.stringify(options.section)}\n` +
    `status: ${JSON.stringify(options.status)}\n` +
    `order: ${options.order}\n` +
    `source_route: /technical${route}\n` +
    `simple_route: /simple${route}\n` +
    `approval:\n` +
    `  reviewed_by: pending\n` +
    `  reviewed_on: pending\n` +
    `  technical_source_hash: pending\n` +
    `---\n\n` +
    `# ${title}\n\n` +
    `## Plain-language summary\n\n` +
    `This is the non-technical mirror for the same content in the repository source.\n`;
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
  const title = options.title || path.basename(sourcePath, '.md').replace(/[_]/g, ' ');
  const description = options.description || `Documentation for ${title}.`;

  const sourceTarget = path.join(process.cwd(), sourcePath);
  const simpleTarget = path.join(process.cwd(), 'audiences/simple', sourcePath);

  const sourceContent = buildSourceFrontmatter({
    title,
    description,
    sourcePath,
    options,
  });
  const simpleContent = buildSimpleFrontmatter({
    title,
    description,
    sourcePath,
    options,
  });

  await writeIfChanged(sourceTarget, sourceContent, options.force);
  await writeIfChanged(simpleTarget, simpleContent, options.force);

  console.log(`Created source scaffold: ${sourcePath}`);
  console.log(`Created Simple mirror: audiences/simple/${sourcePath}`);
  console.log('Next steps:');
  console.log(`- npm run wiki:prepare`);
  console.log(`- npm run validate:contracts`);
  console.log(`- npm run build`);
})();
