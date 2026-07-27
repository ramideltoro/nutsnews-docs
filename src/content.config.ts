import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  loader: glob({
    base: './src/content/docs',
    pattern: '**/*.md',
    generateId: ({ entry }) => {
      if (entry.endsWith('/index.md')) {
        return entry.slice(0, -'/index.md'.length);
      }
      return entry.replace(/\.md$/i, '');
    },
  }),
  schema: docsSchema({
    extend: z.object({
      draft: z.boolean(),
      description: z.string(),
      slug: z.string(),
      collection: z.string(),
      section: z.string(),
      status: z.string(),
      order: z.number(),
      source_route: z.string(),
      simple_route: z.string(),
      source_path: z.string(),
      diagram: z.string(),
      paired_route: z.string(),
      generated_for: z.string(),
    }),
  }),
});

export const collections = { docs };
