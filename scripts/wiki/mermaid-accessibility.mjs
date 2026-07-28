function normalizeText(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

export function extractMermaidAccessibility(source) {
  const title = source.match(/^\s*accTitle:\s*(.+?)\s*$/m)?.[1];
  const singleLineDescription = source.match(/^\s*accDescr:\s*(.+?)\s*$/m)?.[1];
  const multilineDescription = source.match(
    /^\s*accDescr\s*\{\s*\n([\s\S]*?)^\s*\}\s*$/m,
  )?.[1];

  return {
    title: normalizeText(title),
    description: normalizeText(singleLineDescription || multilineDescription),
  };
}

export function mermaidAccessibilityDirectives(title, description) {
  const safeTitle = normalizeText(title).replace(/[{}]/g, '');
  const safeDescription = normalizeText(description)
    .replace(/\{/g, '(')
    .replace(/\}/g, ')');

  if (!safeTitle || !safeDescription) {
    throw new Error('Mermaid accessibility title and description must be non-empty');
  }

  return [
    `  accTitle: ${safeTitle}`,
    '  accDescr {',
    `    ${safeDescription}`,
    '  }',
  ].join('\n');
}
