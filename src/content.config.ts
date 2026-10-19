import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    seo_title: z.string(),
    seo_description: z.string(),
    draft: z.boolean().default(false),
    // Tile and cover image path from frontmatter. Without this field Zod
    // strips it and blog tiles fall back to /images/blog/<id>.png, which
    // breaks for every post whose image is .jpg or .webp.
    image: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    updated_date: z.coerce.date().optional(),
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
  }),
});

export const collections = { blog, insights };
