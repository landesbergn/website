import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    // Path under /blog/ — preserves legacy Hugo URLs.
    // e.g. "post/building-my-website-with-blogdown" → /blog/post/building-my-website-with-blogdown/
    permalink: z.string(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
