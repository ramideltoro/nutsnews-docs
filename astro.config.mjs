import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: process.env.SITE_URL || 'https://wiki.nutsnews.com',
  output: 'static',
  outDir: '_site',
  integrations: [
    starlight({
      title: 'NutsNews Wiki',
      description: 'NutsNews technical and reader documentation',
      editLink: {
        baseUrl: undefined,
      },
      disable404Route: true,
      lastUpdated: false,
      customCss: ['/src/styles/wiki.css'],
      components: {
        Header: './src/components/Header.astro',
        Search: './src/components/Search.astro',
        Footer: './src/components/Footer.astro',
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
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ramideltoro/nutsnews-docs' }],
    }),
  ],
});
