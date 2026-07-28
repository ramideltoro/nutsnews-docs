import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import { rehypeWikiArticle } from './scripts/wiki/rehype-wiki-article.mjs';

function normalizeBase(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

const site = process.env.WIKI_SITE_URL?.trim() || 'https://wiki.nutsnews.com';
const base = normalizeBase(process.env.WIKI_BASE_PATH || '/');
const siteUrl = new URL(site);

if (!['http:', 'https:'].includes(siteUrl.protocol)) {
  throw new Error('WIKI_SITE_URL must use http or https');
}

export default defineConfig({
  site: siteUrl.toString(),
  base,
  output: 'static',
  outDir: '_site',
  trailingSlash: 'always',
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeWikiArticle],
    }),
  },
  integrations: [
    starlight({
      title: 'NutsNews Wiki',
      description: 'NutsNews technical and reader documentation',
      disable404Route: true,
      logo: {
        src: './src/assets/nutsnews-logo.png',
        alt: 'NutsNews chestnut logo',
        replacesTitle: false,
      },
      customCss: ['./src/styles/wiki.css'],
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Footer: './src/components/SourceFooter.astro',
        MarkdownContent: './src/components/ArticleBody.astro',
        MobileMenuToggle: './src/components/MobileMenuToggle.astro',
        PageTitle: './src/components/ArticleHeader.astro',
        Pagination: './src/components/ArticlePagination.astro',
        Search: './src/components/AudienceSearch.astro',
        Sidebar: './src/components/CollectionRail.astro',
      },
      sidebar: [
        {
          label: 'Technical',
          items: [
            {
              autogenerate: {
                directory: 'technical',
                collapsed: true,
              },
            },
          ],
        },
        {
          label: 'Simple',
          items: [
            {
              autogenerate: {
                directory: 'simple',
                collapsed: true,
              },
            },
          ],
        },
      ],
      lastUpdated: false,
    }),
  ],
});
