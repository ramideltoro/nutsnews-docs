import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { expertSourceHash } from './wiki-approval.mjs';
import {
  formatWikiContentReport,
  validateWikiContent,
  wikiContentExitCode,
} from './wiki-content-contract.mjs';

const reviewedOn = '2026-07-28T20:10:06.000Z';

function yamlString(value) {
  return JSON.stringify(value);
}

function approvalYaml(hash) {
  return [
    '  approval:',
    '    state: approved',
    '    publishing: allowed',
    '    reviewed_by: fixture-reviewer',
    `    reviewed_on: ${yamlString(reviewedOn)}`,
    `    technical_source_hash: ${hash}`,
  ].join('\n');
}

function canonicalWithoutApproval({
  title,
  description,
  slug,
  order,
  diagram,
  body,
}) {
  return [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    'wiki:',
    `  source_route: /technical/${slug}/`,
    `  simple_route: /simple/${slug}/`,
    `  primary_diagram: ${diagram}`,
    '  collection: start-here',
    '  section: overview',
    '  status: active',
    `  order: ${order}`,
    `  slug: ${slug}`,
    '---',
    '',
    body,
    '',
  ].join('\n');
}

function addApproval(markdown, hash) {
  return markdown.replace(/  slug: [^\n]+\n/, (line) => `${line}${approvalYaml(hash)}\n`);
}

function mirrorMarkdown({ title, slug, diagram, hash, body }) {
  return [
    '---',
    `title: ${yamlString(title)}`,
    'wiki:',
    `  source_route: /technical/${slug}/`,
    `  simple_route: /simple/${slug}/`,
    `  primary_diagram: ${diagram}`,
    '  collection: start-here',
    '  section: overview',
    '  status: active',
    `  slug: ${slug}`,
    approvalYaml(hash),
    '---',
    '',
    body,
    '',
  ].join('\n');
}

async function write(relativePath, content, repoRoot) {
  const absolutePath = path.join(repoRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');
}

async function makeFixture(t) {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-content-contract-'));
  t.after(() => fs.rm(repoRoot, { force: true, recursive: true }));

  const specs = [
    {
      sourcePath: 'GUIDE.md',
      title: 'Fixture guide',
      description: 'A fixture guide.',
      slug: 'guide',
      order: 1,
      body: [
        '# Fixture guide',
        '',
        '[Details](#details)',
        '',
        '[Other details](OTHER.md#other-details)',
        '',
        '![System status](public/wiki-assets/status.svg "System status overview")',
        '',
        '## Details',
        '',
        'The details.',
      ].join('\n'),
      simpleBody: [
        '# Fixture guide',
        '',
        '[Details](#details)',
        '',
        '[Other details](OTHER.md#other-details)',
        '',
        '![System status](public/wiki-assets/status.svg "System status overview")',
        '',
        '## Details',
        '',
        'Simple details.',
      ].join('\n'),
    },
    {
      sourcePath: 'OTHER.md',
      title: 'Other fixture',
      description: 'Another fixture guide.',
      slug: 'other',
      order: 2,
      body: '# Other fixture\n\n## Other details\n\nThe other details.',
      simpleBody: '# Other fixture\n\n## Other details\n\nSimple other details.',
    },
  ];

  const entries = [];
  for (const spec of specs) {
    const diagram = `diagrams/${spec.sourcePath.replace(/\.md$/, '.mmd')}`;
    const bare = canonicalWithoutApproval({ ...spec, diagram });
    const hash = expertSourceHash(bare);
    const canonical = addApproval(bare, hash);
    const technical = mirrorMarkdown({
      title: `${spec.title} (Technical)`,
      slug: spec.slug,
      diagram,
      hash,
      body: spec.body,
    });
    const simple = mirrorMarkdown({
      title: `${spec.title} (Simple)`,
      slug: spec.slug,
      diagram,
      hash,
      body: spec.simpleBody,
    });
    await Promise.all([
      write(spec.sourcePath, canonical, repoRoot),
      write(`audiences/simple/${spec.sourcePath}`, simple, repoRoot),
      write(`audiences/technical/${spec.sourcePath}`, technical, repoRoot),
      write(
        diagram,
        [
          'flowchart TD',
          `  accTitle: ${spec.title}`,
          '  accDescr {',
          `    ${spec.description}`,
          '  }',
          '  A["Start"] --> B["Finish"]',
          '',
        ].join('\n'),
        repoRoot,
      ),
    ]);
    entries.push({
      source: {
        path: spec.sourcePath,
        area: 'root',
        title: spec.title,
        description: spec.description,
        slug: spec.slug,
        collection: 'start-here',
        section: 'overview',
        status: 'active',
        order: spec.order,
        route: `/technical/${spec.slug}`,
        routeWithoutAudience: spec.slug,
      },
      technical: {
        route: `/technical/${spec.slug}`,
        sourcePath: spec.sourcePath,
      },
      simple: {
        route: `/simple/${spec.slug}`,
        sourcePath: `audiences/simple/${spec.sourcePath}`,
      },
      diagram: {
        path: diagram,
        exists: true,
      },
    });
  }

  await write(
    'scripts/wiki/wiki-inventory.generated.json',
    `${JSON.stringify({
      contractVersion: '1.4.0',
      sourceCount: entries.length,
      sourcePaths: specs.map(({ sourcePath }) => sourcePath),
      warnings: [],
      entries,
    }, null, 2)}\n`,
    repoRoot,
  );
  await write(
    'public/wiki-assets/status.svg',
    '<svg xmlns="http://www.w3.org/2000/svg" role="img"><title>Status</title></svg>\n',
    repoRoot,
  );
  return repoRoot;
}

const parseMermaid = async (diagram) => {
  if (diagram.includes('BROKEN')) throw new Error('fixture Mermaid parse error');
  return true;
};

async function validate(repoRoot) {
  return validateWikiContent({
    repoRoot,
    expectedSourceCount: 2,
    parseMermaid,
  });
}

function assertDefect(report, invariant) {
  assert.equal(wikiContentExitCode(report), 1, 'a defect must produce a nonzero exit code');
  assert.ok(
    report.errors.some((error) => error.invariant === invariant),
    `expected a ${invariant} defect; got ${formatWikiContentReport(report)}`,
  );
}

test('complete fixture passes deterministically', async (t) => {
  const repoRoot = await makeFixture(t);
  const first = await validate(repoRoot);
  const second = await validate(repoRoot);
  assert.deepEqual(second, first);
  assert.equal(wikiContentExitCode(first), 0);
  assert.equal(first.errors.length, 0, formatWikiContentReport(first));
  assert.match(formatWikiContentReport(first), /2 canonical sources, 2 Simple mirrors/);
});

const defectCases = [
  {
    name: 'inventory',
    invariant: 'inventory',
    mutate: async (repoRoot) => {
      const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');
      const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
      inventory.contractVersion = 'stale';
      await fs.writeFile(inventoryPath, JSON.stringify(inventory), 'utf8');
    },
  },
  {
    name: 'schema',
    invariant: 'schema',
    mutate: async (repoRoot) => {
      const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');
      const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
      inventory.entries[0].source.title = '';
      await fs.writeFile(inventoryPath, JSON.stringify(inventory), 'utf8');
    },
  },
  {
    name: 'missing mirror',
    invariant: 'mirror',
    mutate: (repoRoot) => fs.unlink(path.join(repoRoot, 'audiences/simple/GUIDE.md')),
  },
  {
    name: 'stale mirror metadata',
    invariant: 'mirror',
    mutate: async (repoRoot) => {
      const mirrorPath = path.join(repoRoot, 'audiences/technical/GUIDE.md');
      const mirror = await fs.readFile(mirrorPath, 'utf8');
      await fs.writeFile(mirrorPath, mirror.replace('/technical/guide/', '/technical/stale/'), 'utf8');
    },
  },
  {
    name: 'stale approval hash',
    invariant: 'approval',
    mutate: async (repoRoot) => {
      const sourcePath = path.join(repoRoot, 'GUIDE.md');
      await fs.appendFile(sourcePath, '\nSubstantive change.\n', 'utf8');
    },
  },
  {
    name: 'diagram accessibility',
    invariant: 'diagram',
    mutate: async (repoRoot) => {
      const diagramPath = path.join(repoRoot, 'diagrams/GUIDE.mmd');
      const diagram = await fs.readFile(diagramPath, 'utf8');
      await fs.writeFile(diagramPath, diagram.replace(/  accDescr \{[\s\S]*?  \}\n/, ''), 'utf8');
    },
  },
  {
    name: 'diagram syntax',
    invariant: 'diagram',
    mutate: (repoRoot) => fs.appendFile(path.join(repoRoot, 'diagrams/GUIDE.mmd'), 'BROKEN\n', 'utf8'),
  },
  {
    name: 'duplicate slug',
    invariant: 'uniqueness',
    mutate: async (repoRoot) => {
      const otherPath = path.join(repoRoot, 'OTHER.md');
      const other = await fs.readFile(otherPath, 'utf8');
      await fs.writeFile(otherPath, other.replace('  slug: other', '  slug: guide'), 'utf8');
    },
  },
  {
    name: 'duplicate order',
    invariant: 'uniqueness',
    mutate: async (repoRoot) => {
      const otherPath = path.join(repoRoot, 'OTHER.md');
      const other = await fs.readFile(otherPath, 'utf8');
      await fs.writeFile(otherPath, other.replace('  order: 2', '  order: 1'), 'utf8');
    },
  },
  {
    name: 'broken link',
    invariant: 'link',
    mutate: async (repoRoot) => {
      const sourcePath = path.join(repoRoot, 'GUIDE.md');
      const source = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(sourcePath, source.replace('OTHER.md#other-details', 'MISSING.md'), 'utf8');
    },
  },
  {
    name: 'broken fragment',
    invariant: 'fragment',
    mutate: async (repoRoot) => {
      const sourcePath = path.join(repoRoot, 'GUIDE.md');
      const source = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(sourcePath, source.replace('#details)', '#missing-heading)'), 'utf8');
    },
  },
  {
    name: 'missing image alt',
    invariant: 'image',
    mutate: async (repoRoot) => {
      const sourcePath = path.join(repoRoot, 'GUIDE.md');
      const source = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(sourcePath, source.replace('![System status]', '![]'), 'utf8');
    },
  },
  {
    name: 'missing image caption',
    invariant: 'image',
    mutate: async (repoRoot) => {
      const sourcePath = path.join(repoRoot, 'GUIDE.md');
      const source = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(
        sourcePath,
        source.replace('public/wiki-assets/status.svg "System status overview"', 'public/wiki-assets/status.svg'),
        'utf8',
      );
    },
  },
  {
    name: 'orphan artifact',
    invariant: 'orphan',
    mutate: (repoRoot) => write('audiences/simple/ORPHAN.md', '# Orphan\n', repoRoot),
  },
  {
    name: 'legacy diagram orphan',
    invariant: 'orphan',
    mutate: (repoRoot) => write('diagrams/LEGACY.md', 'flowchart TD\n  A --> B\n', repoRoot),
  },
];

for (const fixture of defectCases) {
  test(`${fixture.name} fixture fails with grouped remediation`, async (t) => {
    const repoRoot = await makeFixture(t);
    await fixture.mutate(repoRoot);
    const report = await validate(repoRoot);
    assertDefect(report, fixture.invariant);
    const output = formatWikiContentReport(report);
    assert.match(output, /Fix:/);
  });
}
