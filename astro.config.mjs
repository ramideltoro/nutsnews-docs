import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

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
  integrations: [
    starlight({
      title: 'NutsNews Wiki',
      description: 'NutsNews technical and reader documentation',
      components: {
        Head: './src/components/Head.astro',
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
