import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    image: z.string().optional(),
    // Topic tags used to compute "Related reading" (shared-tag scoring)
    // and to build the internal-link cluster between posts. Optional so
    // posts without tags simply fall back to recency-based relations.
    tags: z.array(z.string()).optional(),
    // Optional structured FAQs. When present, they're rendered at the
    // end of the post AND emitted as schema.org FAQPage so Google can
    // surface them as rich FAQ drop-downs in search results.
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
  }),
});

export const collections = { blog };
