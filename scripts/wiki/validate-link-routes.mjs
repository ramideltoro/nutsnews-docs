import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'src', 'content', 'docs');

const INTERNAL_ASSET_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico|pdf|zip|tar|gz|css|js|map|txt|json|mdx?)$/i;
const EXTERNAL_LINK = /^(?:https?:\/\/|mailto:|tel:|ftp:\/\/|\/\/|#)/i;
const INTERNAL_MARKDOWN_LINK = /\.md(?:[?#]|$)/i;

function normalizeRoute(route) {
  return route
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .replace(/\/+/, '/');
}

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

function splitLinkTarget(rawTarget) {
  const target = rawTarget.replace(/^<(.+)>$/, '$1').trim();
  const marker = target.search(/[?#]/);
  return marker >= 0 ? target.slice(0, marker) : target;
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }

  return out;
}

function routeFromPath(filePath) {
  const relative = path.relative(docsRoot, filePath);
  const segments = relative.split(path.sep);
  const withoutIndex = segments.map((segment) => segment.replace(/\.md$/i, ''));

  if (withoutIndex[withoutIndex.length - 1] === 'index') {
    withoutIndex.pop();
  }

  return `/${withoutIndex.join('/')}`;
}

function fileRouteFromPath(filePath) {
  return normalizeRoute(routeFromPath(filePath));
}

function resolveLink(currentRoute, rawTarget) {
  const core = splitLinkTarget(rawTarget);
  if (!core || core === '#') {
    return null;
  }

  if (EXTERNAL_LINK.test(core)) {
    return null;
  }

  if (INTERNAL_ASSET_EXTENSIONS.test(core)) {
    return null;
  }

  const linkCore = core.replace(/\/+$/, '');
  const normalizedCurrent = normalizeRoute(currentRoute);
  const segments = normalizedCurrent.split('/').filter(Boolean);
  const base = segments.length <= 1 ? normalizedCurrent : path.posix.dirname(normalizedCurrent.endsWith('/') ? normalizedCurrent : `${normalizedCurrent}/`);
  const route = linkCore.startsWith('/')
    ? normalizeRoute(linkCore)
    : normalizeRoute(path.posix.join(base, linkCore));

  if (!route || route === '/') {
    return '/';
  }

  return route;
}

function hasDescendantRoute(routeSet, route) {
  const expectedPrefix = `${route}/`;
  for (const value of routeSet) {
    if (value.startsWith(expectedPrefix)) {
      return true;
    }
  }
  return false;
}

function collectLinks(content) {
  const inline = /(!?\[[^\]]*\]\()(<[^>]+>|[^)\s]+)(\s+['"][^'"]*['"])?\)/g;
  const reference = /(^\s*\[[^\]]+\]:\s+)(<[^>]+>|[^\s]+)(\s+"[^"]*")?$/gm;

  const out = [];

  for (const match of content.matchAll(inline)) {
    out.push({ target: match[2], offset: match.index || 0 });
  }

  for (const match of content.matchAll(reference)) {
    out.push({ target: match[2], offset: match.index || 0 });
  }

  return out;
}

function lineNumberForOffset(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

(async () => {
  const docs = await walkMarkdown(docsRoot);
  const routeSet = new Set(docs.map(fileRouteFromPath));
  const routeWithTrailingSlashSet = new Set([...routeSet].map((route) => `${route}/`));
  const unresolved = [];

  for (const doc of docs) {
    const route = fileRouteFromPath(doc);
    const source = toPosix(path.relative(repoRoot, doc));
    const raw = await fs.readFile(doc, 'utf8');
    const links = collectLinks(raw);

    for (const { target, offset } of links) {
      const resolved = resolveLink(route, target);
      if (!resolved) {
        continue;
      }

      if (INTERNAL_MARKDOWN_LINK.test(target)) {
        unresolved.push({
          source,
          target,
          resolved,
          reason: 'markdown extension leak',
          line: lineNumberForOffset(raw, offset),
        });
        continue;
      }

      const normalizedCore = splitLinkTarget(target).replace(/\.md$/i, '');
      if (!normalizedCore || normalizedCore.startsWith('#')) {
        continue;
      }

      const candidate = resolveLink(route, `${normalizedCore}/index`);

      if (
        routeSet.has(resolved)
        || routeWithTrailingSlashSet.has(resolved)
        || (candidate && (routeSet.has(candidate) || routeWithTrailingSlashSet.has(candidate)))
        || hasDescendantRoute(routeSet, resolved)
      ) {
        continue;
      }

      unresolved.push({
        source,
        target,
        resolved,
        line: lineNumberForOffset(raw, offset),
      });
    }
  }

  if (unresolved.length > 0) {
    console.error(`Link validation found ${unresolved.length} issue(s):`);
    for (const issue of unresolved.slice(0, 80)) {
      const reason = issue.reason ? ` [${issue.reason}]` : '';
      console.error(`- ${issue.source}:${issue.line} -> ${issue.target} (resolved: ${issue.resolved})${reason}`);
    }

    if (unresolved.length > 80) {
      console.error(`- ... and ${unresolved.length - 80} more`);
    }

    process.exitCode = 1;
    return;
  }

  if (docs.length === 0) {
    console.error('No generated markdown documents found under src/content/docs.');
    process.exitCode = 1;
    return;
  }

  console.log(`Internal route link validation passed for ${docs.length} generated documents.`);
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
