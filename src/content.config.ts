import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title:    z.string(),
    num:      z.string(),
    tags:     z.array(z.string()),
    status:   z.enum(['Live', 'Interactive demo', 'Research preview', 'In development', 'Planned']),
    featured: z.boolean().default(false),
    summary:  z.string(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title:   z.string(),
    num:     z.string(),
    status:  z.enum(['Published', 'First draft', 'Outlined', 'Researching']),
    tags:    z.array(z.string()),
    summary: z.string(),
    publishedDate: z.date().optional(),
  }),
});

const work = defineCollection({
  loader: glob({pattern: '**/*.md', base: './src/content/work'}),
  schema: z.object({title:z.string(),category:z.string(),role:z.string(),summary:z.string()}),
});
export const collections = { projects, writing, work };
