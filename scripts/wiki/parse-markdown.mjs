import matter from 'gray-matter';

const FRONT_MATTER_BOUNDARY = /^---\s*$/;

export function parseMarkdownFrontmatter(rawMarkdown) {
  try {
    return matter(rawMarkdown, {});
  } catch (error) {
    const repaired = repairFrontmatter(rawMarkdown);
    if (repaired === rawMarkdown) {
      throw error;
    }

    try {
      return matter(repaired, {});
    } catch {
      throw error;
    }
  }
}

function repairFrontmatter(rawMarkdown) {
  const lines = rawMarkdown.split(/\r?\n/);
  if (!lines.length || lines[0].trim() !== '---') {
    return rawMarkdown;
  }

  const closeIndex = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closeIndex < 0) {
    return rawMarkdown;
  }

  const absoluteCloseIndex = closeIndex + 1;
  const frontMatterLines = lines.slice(1, absoluteCloseIndex);
  let changed = false;

  const repairedFrontMatter = frontMatterLines.map((line) => {
    const match = /^(?<indent>\s*)(?<key>[^:\s#][^:]*?)\s*:\s*(?<value>.*)$/.exec(line);
    if (!match) {
      return line;
    }

    const { indent, key, value } = match.groups;
    const trimmed = value.trim();

    if (!trimmed || looksSafeYamlScalar(trimmed)) {
      return line;
    }

    changed = true;
    return `${indent}${key}: ${JSON.stringify(trimmed)}`;
  });

  if (!changed) {
    return rawMarkdown;
  }

  return [...lines.slice(0, 1), ...repairedFrontMatter, ...lines.slice(absoluteCloseIndex)].join('\n');
}

function looksSafeYamlScalar(value) {
  if (value.startsWith('"') || value.startsWith("'")) {
    return true;
  }

  const unquoted = value.toLowerCase();
  if (unquoted === 'true' || unquoted === 'false' || unquoted === 'null' || unquoted === '~') {
    return true;
  }

  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return true;
  }

  if (value.startsWith('[') || value.startsWith('{') || value.endsWith(']') || value.endsWith('}')) {
    return true;
  }

  return false;
}
