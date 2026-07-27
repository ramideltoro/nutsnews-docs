import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://wiki.nutsnews.com',
  output: 'static',
  outDir: '_site',
  integrations: [
    starlight({
      title: 'NutsNews Wiki',
      description: 'NutsNews technical and reader documentation',
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
