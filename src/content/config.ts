import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    hero: z.string().optional(),
    canonicalUrl: z.string().url().optional()
  })
});

const certifications = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    provider: z.string(),
    examCode: z.string().optional(),
    status: z.enum(['planned', 'in-progress', 'completed']).default('planned'),
    draft: z.boolean().default(false)
  })
});

export const collections = { blog, certifications };
