import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const LANGS = ['sv', 'en'] as const;

/**
 * Content schema. Astro validates every file against it at build time.
 *
 * The binding content rules that a schema cannot express (sources, claims of
 * experience, skeleton deadlines…) are in scripts/validate.mjs, which runs
 * before the build. The admin panel's fields (public/admin/config.yml) must
 * match these; scripts/check-admin.mjs enforces it.
 */

/* ---------- shared ---------- */

/** A cited external source. Citing is allowed; inventing is not. Every source
 *  names its publisher, its URL and the date we read it. */
const externalSource = z.object({
  type: z.enum(['test', 'rating', 'price', 'spec', 'regulation']),
  publisher: z.string(),          // Råd & Rön · Testfakta · Prisjakt · Kjell …
  url: z.string().url(),
  accessed: z.coerce.date(),
  published: z.coerce.date().optional(),
  claim: z.string(),              // what the source says — in our words, never copied
});

const baseDoc = z.object({
  title: z.string().max(70),
  description: z.string(),
  lang: z.enum(LANGS),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string(),
  subcategory: z.string().optional(),
  updated: z.coerce.date(),
  published: z.boolean().default(false),
  /* How far the text has got — independent of `published` (is the URL live):
     draft      skeleton, heading only
     written    text complete, waiting for the owner's Swedish review
     reviewed   reviewed, not yet published
     published  text shown to visitors — requires published: true */
  stage: z.enum(['draft', 'written', 'reviewed', 'published']).default('draft'),
  noindex: z.boolean().default(false),
  hero_image: z.string().optional(),
  hero_image_alt: z.string().optional(),
  sources: z.array(externalSource).default([]),
  /** True only if the page rests on a product we own and have actually used. */
  hands_on: z.boolean().default(false),
});

/* ---------- products — data only; there are no product pages ---------- */

const products = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/data/products' }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /* Permanent reference code, assigned once. Photo filenames are built from it. */
    code: z.string().regex(/^P-\d{2}$/).optional(),
    lang: z.enum(LANGS),
    name: z.string(),
    brand: z.string(),
    category: z.string(),
    subcategory: z.string().optional(),
    problems_solved: z.array(z.string()).default([]),
    key_specs: z.record(z.string()).default({}),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    best_for: z.string().optional().or(z.literal('')),
    // no price field: prices only via the Amazon API, which is not active
    price_band: z.enum(['budget', 'mid', 'premium']),
    image: z.string().optional(),
    image_alt: z.string().optional(),
    affiliate: z
      .object({
        network: z.string(),
        url: z.string().url(),
        region: z.string().default('SE'),
      })
      .optional(),
    asin: z.string().optional().or(z.literal('')),

    /* ===== ownership and real use =====
       owned: we have it · tested: we have used it and may write from experience.
       tested requires our own photo, owned_since, usage_period and
       hands_on_limits (scripts/validate.mjs). */
    owned: z.boolean().default(false),
    tested: z.boolean().default(false),
    owned_since: z.coerce.date().optional(),
    usage_period: z.string().optional().or(z.literal('')),      // "6 månader" · "en vinter"
    /* One to three of our own photos. The first is the main one; the site cross-fades the rest. */
    own_photos: z
      .array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
      .max(3, 'at most three photos per product')
      .default([]),
    /* A specification source when there is no maker's page: one of own_photos
       showing the specification printed on the device or its box. It
       describes the very unit we own, not just a model. */
    spec_photo: z.string().optional(),
    /* The date the owner compared the retailer listing with the device in his
       hand and confirmed they are the same model. A named, dated source — it
       once caught an ASIN that pointed at a different model. */
    owner_checked: z.coerce.date().optional(),
    hands_on: z.array(z.string()).default([]),   // notes from real use
    hands_on_limits: z.array(z.string()).default([]), // what our use does not show — required with tested
    video_url: z.string().url().optional(),
    video_thumb: z.string().optional(),

    external_rating: z
      .object({
        publisher: z.string(),
        score: z.number(),
        scale: z.number().default(5),
        count: z.number(),
        url: z.string().url(),
        accessed: z.coerce.date(),
      })
      .optional(),
    source_url: z.string().url().optional().or(z.literal('')),
    last_verified: z.coerce.date().optional().nullable(),
    verified: z.boolean().default(false),
    demo: z.boolean().default(false),
  }),
});

/* ---------- categories ---------- */

const categories = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/data/categories' }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    group: z.enum(['daily', 'mobility', 'home']),
    active: z.boolean().default(false),
    order: z.number().default(99),
    icon: z.string().default('circle'),
    names: z.record(z.string()),
    slugs: z.record(z.string()),
    descriptions: z.record(z.string()),
    subcategories: z
      .array(
        z.object({
          id: z.string(),
          names: z.record(z.string()),
          slugs: z.record(z.string()),
        })
      )
      .default([]),
  }),
});

/* ---------- solution pages — the core of the site: a problem and its fix ---------- */

const solutions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/solutions' }),
  schema: baseDoc.extend({
    problem_id: z.string(),
    question: z.string(),
    symptoms: z.array(z.string()).min(1),
    icon: z.string().default('bolt'),
    products: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

/* ---------- buying guides ---------- */

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: baseDoc.extend({
    solution: z.string(), // required: every guide leads back to a solution page
    picks: z
      .array(
        z.object({
          product: z.string(),
          badge: z.enum(['best-overall', 'best-value', 'best-budget', 'best-specific', 'premium']),
          reason: z.string(),
        })
      )
      .default([]),
  }),
});

/* ---------- comparisons ---------- */

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/comparisons' }),
  schema: baseDoc.extend({
    solution: z.string(),
    products: z.array(z.string()).default([]),
    verdict: z.string(),
  }),
});

/* ---------- articles ---------- */

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: baseDoc.extend({
    solution: z.string(),
    products: z.array(z.string()).default([]),
  }),
});

/* ---------- fixed and legal pages ---------- */

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(LANGS),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    updated: z.coerce.date(),
    published: z.boolean().default(true),
    footer_group: z.enum(['legal', 'about', 'none']).default('none'),
    order: z.number().default(99),
  }),
});

/* ---------- market stall (Stora Torget, Karlstad) ---------- */

const torget = defineCollection({
  loader: glob({ pattern: '*.{yml,yaml}', base: './src/data/torget' }),
  schema: z.object({
    active: z.boolean().default(true),
    phone: z.string(),
    phone_display: z.string(),
    place: z.string(),
    city: z.string(),
    map_url: z.string().url().optional().or(z.literal('')),
    note: z.record(z.string()).default({}),
  }),
});

export const collections = { torget, products, categories, solutions, guides, comparisons, posts, pages };
