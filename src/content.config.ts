import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faqSchema = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
  })
).default([]);

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      shortDescription: z.string(),
      icon: z.enum(['seo', 'website', 'ai-visibility']),
      heroImage: image(),
      heroImageAlt: z.string(),
      benefits: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      ),
      process: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      ),
      faq: faqSchema,
      metaTitle: z.string(),
      metaDescription: z.string(),
      order: z.number(),
    }),
});

const areas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/areas' }),
  schema: ({ image }) =>
    z.object({
      cityName: z.string(),
      region: z.string(),
      isPlaceholder: z.boolean().default(false),
      tagline: z.string(),
      heroImage: image(),
      heroImageAlt: z.string(),
      suburbs: z.array(z.string()),
      whyLocalPoints: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      ),
      proofStat: z.object({
        value: z.string(),
        label: z.string(),
      }),
      faq: faqSchema,
      metaTitle: z.string(),
      metaDescription: z.string(),
      // Address fields used for LocalBusiness schema (home base area only)
      addressLocality: z.string().optional(),
      addressRegion: z.string().optional(),
      postalCode: z.string().optional(),
      addressCountry: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
});

const locationServices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/location-services' }),
  schema: () =>
    z.object({
      area: z.string(), // slug of areas entry
      service: z.string(), // slug of services entry
      localAngle: z.string(), // unique paragraph: why this service matters in this area
      localProofStat: z.object({
        value: z.string(),
        label: z.string(),
      }),
      faq: faqSchema,
      metaTitle: z.string(),
      metaDescription: z.string(),
    }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      clientName: z.string(),
      industry: z.string(),
      service: z.string(), // slug of services entry
      area: z.string().optional(), // slug of areas entry
      isPlaceholder: z.boolean().default(true),
      headlineResult: z.string(),
      summary: z.string(),
      heroImage: image(),
      heroImageAlt: z.string(),
      metaTitle: z.string(),
      metaDescription: z.string(),
      publishDate: z.date(),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      publishDate: z.date(),
      author: z.string(),
      heroImage: image(),
      heroImageAlt: z.string(),
      tags: z.array(z.string()),
      relatedService: z.string().optional(),
      relatedArea: z.string().optional(),
      metaTitle: z.string(),
      metaDescription: z.string(),
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: () =>
    z.object({
      name: z.string(),
      role: z.string(),
      quote: z.string(),
      area: z.string().optional(),
      isPlaceholder: z.boolean().default(true),
    }),
});

export const collections = {
  services,
  areas,
  locationServices,
  caseStudies,
  blog,
  testimonials,
};
