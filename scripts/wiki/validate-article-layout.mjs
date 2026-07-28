import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const buildRoot = path.join(repoRoot, '_site');
const componentRoot = path.join(repoRoot, 'src', 'components');
const longFixture = {
  source: path.join(repoRoot, 'src', 'content', 'docs', 'technical', 'nutsnews-dual-target-web-deployment', 'index.md'),
  output: path.join(buildRoot, 'technical', 'nutsnews-dual-target-web-deployment', 'index.html'),
};
const shortFixture = {
  source: path.join(repoRoot, 'src', 'content', 'docs', 'technical', 'ios', 'card-date-source-bottom-readme', 'index.md'),
  output: path.join(buildRoot, 'technical', 'ios', 'card-date-source-bottom-readme', 'index.html'),
};

function lineCount(source) {
  return source.split(/\r?\n/).length;
}

function openDetailsCount(html) {
  return [...html.matchAll(/<details[^>]*\sopen(?:\s|>|=)/g)].length;
}

function assertPattern(value, pattern, message) {
  if (!pattern.test(value)) {
    throw new Error(message);
  }
}

async function run() {
  const [
    header,
    body,
    pagination,
    rehype,
    styles,
    longSource,
    shortSource,
    longHtml,
    shortHtml,
  ] = await Promise.all([
    fs.readFile(path.join(componentRoot, 'ArticleHeader.astro'), 'utf8'),
    fs.readFile(path.join(componentRoot, 'ArticleBody.astro'), 'utf8'),
    fs.readFile(path.join(componentRoot, 'ArticlePagination.astro'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'scripts', 'wiki', 'rehype-wiki-article.mjs'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'src', 'styles', 'wiki.css'), 'utf8'),
    fs.readFile(longFixture.source, 'utf8'),
    fs.readFile(shortFixture.source, 'utf8'),
    fs.readFile(longFixture.output, 'utf8'),
    fs.readFile(shortFixture.output, 'utf8'),
  ]);

  assert.ok(lineCount(longSource) >= 1_000, 'Long article fixture must contain at least 1,000 lines.');
  assert.ok(lineCount(shortSource) <= 30, 'Short article fixture must contain at most 30 lines.');

  assert.match(header, /<nav class="article-breadcrumbs" aria-label="Breadcrumb">/);
  assert.match(header, /<h1 id="_top">/);
  assert.match(header, /class="article-description"/);
  assert.match(header, /data-wiki-diagram-slot/);
  assert.match(header, /data-wiki-mermaid-source/);
  assert.match(header, /resolvedDiagramPath\.startsWith/);
  assert.match(body, /<article class="sl-markdown-content" data-article-body aria-labelledby="_top">/);
  assert.match(pagination, /aria-label="Article navigation"/);
  assert.match(pagination, /rel="prev"/);
  assert.match(pagination, /rel="next"/);
  assert.match(rehype, /node\.properties\.tabIndex = 0/);
  assert.match(rehype, /Scrollable data table/);
  assert.match(rehype, /Scrollable code block/);
  assert.match(styles, /> \.sl-heading-wrapper\.level-h1:first-child[\s\S]*display: none/);
  assert.match(styles, /:is\(pre, table\)[\s\S]*overflow-x: auto/);
  assert.match(styles, /table :is\(th, td\)[\s\S]*min-width:/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(styles, /max-width: 100%/);

  for (const html of [shortHtml, longHtml]) {
    assertPattern(
      html,
      /<a[^>]*class="[^"]*\bsl-skip-link\b[^"]*"[^>]*href="#_top">/,
      'Article fixture is missing the skip-to-content link.',
    );
    assertPattern(html, /<main[^>]*data-pagefind-body/, 'Article fixture is missing the main landmark.');
    assertPattern(
      html,
      /<nav[^>]*class="[^"]*\barticle-breadcrumbs\b[^"]*"[^>]*aria-label="Breadcrumb"/,
      'Article fixture is missing breadcrumb navigation.',
    );
    assertPattern(
      html,
      /<header[^>]*class="[^"]*\barticle-header\b[^"]*"[^>]*data-article-header/,
      'Article fixture is missing its semantic header.',
    );
    assertPattern(html, /<h1[^>]*id="_top"/, 'Article fixture is missing the canonical page title.');
    assertPattern(
      html,
      /<section[^>]*class="[^"]*\bdiagram-slot\b[^"]*"[^>]*data-wiki-diagram-slot/,
      'Article fixture is missing the primary diagram slot.',
    );
    assertPattern(
      html,
      /<article[^>]*class="[^"]*\bsl-markdown-content\b[^"]*"[^>]*data-article-body[^>]*aria-labelledby="_top"/,
      'Article fixture is missing the semantic body.',
    );
    assertPattern(
      html,
      /<footer[^>]*class="[^"]*\bsl-flex\b[^"]*"/,
      'Article fixture is missing the footer landmark.',
    );
  }
  assert.equal(openDetailsCount(longHtml), 0, 'Current article History groups must start closed.');
  assert.equal(
    openDetailsCount(shortHtml),
    1,
    'A historical article must open only its containing History group.',
  );

  assertPattern(
    longHtml,
    /aria-labelledby="starlight__on-this-page"/,
    'Long article fixture is missing its table of contents.',
  );
  assertPattern(
    longHtml,
    /<nav[^>]*class="[^"]*\barticle-pagination\b[^"]*"[^>]*aria-label="Article navigation"/,
    'Long article fixture is missing previous/next navigation.',
  );
  assertPattern(longHtml, /<table/, 'Long article fixture must preserve Markdown tables.');
  assertPattern(longHtml, /<pre/, 'Long article fixture must preserve code blocks.');
  assertPattern(
    longHtml,
    /<table[^>]*tabindex="0"[^>]*aria-label="Scrollable data table"/,
    'Scrollable tables must be keyboard focusable.',
  );
  assertPattern(
    longHtml,
    /<pre[^>]*data-language=/,
    'Long article fixture must retain enhanced code-block semantics.',
  );
  assertPattern(longHtml, /id="[^"]+"/, 'Long article fixture must preserve heading anchors.');
  const renderedDescription = longHtml.match(
    /<p class="article-description[^"]*"[^>]*>([^<]*)<\/p>/,
  )?.[1];
  assert.ok(renderedDescription, 'Long article fixture must render its description.');
  assert.doesNotMatch(renderedDescription, /`/, 'Rendered descriptions must use plain text.');

  console.log(
    `Article layout validation passed: short=${lineCount(shortSource)} lines, `
      + `long=${lineCount(longSource)} lines; breadcrumbs, title/description, diagram slot, `
      + 'TOC, semantic article/footer navigation, anchors, and overflow containment present.',
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
