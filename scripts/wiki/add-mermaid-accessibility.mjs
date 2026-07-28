import { promises as fs } from 'node:fs';
import path from 'node:path';

import { mermaidAccessibilityDirectives } from './mermaid-accessibility.mjs';

const repoRoot = process.cwd();
const inventoryPath = path.join(repoRoot, 'scripts/wiki/wiki-inventory.generated.json');
const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
const diagramRoot = path.resolve(repoRoot, 'diagrams');

function removeExistingDirectives(source) {
  return source
    .replace(/^[ \t]*accTitle:[^\n]*(?:\r?\n)?/m, '')
    .replace(/^[ \t]*accDescr:[^\n]*(?:\r?\n)?/m, '')
    .replace(
      /^[ \t]*accDescr[ \t]*\{[ \t]*\r?\n[\s\S]*?^[ \t]*\}[ \t]*(?:\r?\n)?/m,
      '',
    );
}

let updated = 0;
for (const entry of inventory.entries) {
  const diagramPath = path.resolve(repoRoot, entry.diagram.path);
  if (
    diagramPath === diagramRoot
    || !diagramPath.startsWith(`${diagramRoot}${path.sep}`)
    || path.extname(diagramPath) !== '.mmd'
  ) {
    throw new Error(`Invalid canonical diagram path: ${entry.diagram.path}`);
  }

  const source = removeExistingDirectives(await fs.readFile(diagramPath, 'utf8')).trimEnd();
  const lines = source.split(/\r?\n/);
  const frontmatterEnd = lines[0]?.trim() === '---'
    ? lines.findIndex((line, index) => index > 0 && line.trim() === '---')
    : -1;
  const searchFrom = frontmatterEnd >= 0 ? frontmatterEnd + 1 : 0;
  const declarationIndex = lines.findIndex(
    (line, index) => index >= searchFrom && line.trim(),
  );
  if (declarationIndex < 0) {
    throw new Error(`Diagram is missing its body: ${entry.diagram.path}`);
  }
  const firstBodyIndex = lines.findIndex(
    (line, index) => index > declarationIndex && line.trim(),
  );
  if (firstBodyIndex >= 0 && !/^\s/.test(lines[firstBodyIndex])) {
    lines[firstBodyIndex] = `  ${lines[firstBodyIndex]}`;
  }

  const directives = mermaidAccessibilityDirectives(
    entry.source.title,
    entry.source.description,
  );
  lines.splice(declarationIndex + 1, 0, ...directives.split('\n'));
  const nextSource = `${lines.join('\n')}\n`;
  await fs.writeFile(diagramPath, nextSource, 'utf8');
  updated += 1;
}

console.log(`Mermaid accessibility metadata updated for ${updated} canonical diagrams.`);
