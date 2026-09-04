import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const LANGS = ['sv', 'en'] as const;

/* ---------- قواعد مشتركة ---------- */

/** مصدر خارجي مستشهد به. الاستشهاد مسموح؛ الاختلاق ممنوع.
 *  كل عنصر يجب أن يحمل اسم الجهة ورابطها وتاريخ الاطلاع. */
const externalSource = z.object({
  type: z.enum(['test', 'rating', 'price', 'spec', 'regulation']),
  publisher: z.string(),          // Råd & Rön · Testfakta · Prisjakt · Kjell …
  url: z.string().url(),
  accessed: z.coerce.date(),
  published: z.coerce.date().optional(),
  claim: z.string(),              // ما يقوله المصدر — بصياغتنا، لا نسخاً
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
  /* خط الإنتاج: draft ← written ← reviewed ← published
     draft    الهيكل فقط
     written  النص مكتوب، ينتظر مراجعة سويدية
     reviewed تمت المراجعة، جاهز للنشر
     published منشور — يجب أن يوافق published: true */
  stage: z.enum(['draft', 'written', 'reviewed', 'published']).default('draft'),
  noindex: z.boolean().default(false),
  hero_image: z.string().optional(),
  hero_image_alt: z.string().optional(),
  sources: z.array(externalSource).default([]),
  /** true فقط إذا كانت الصفحة تستند إلى منتج بحوزتنا استُخدم فعلياً. */
  hands_on: z.boolean().default(false),
});

/* ---------- المنتجات — كيان بيانات، لا صفحات ---------- */

const products = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/data/products' }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /* رمز مرجعي ثابت — يُسنَد مرة ولا يتغيّر. أسماء الصور مبنية عليه. */
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
    // لا يوجد حقل سعر ثابت — القاعدة 2.3
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

    /* ===== الملكية والتجربة الفعلية =====
       owned = المنتج بحوزتنا فعلاً · tested = استُخدم فعلياً ويجوز الكتابة بصيغة التجربة.
       tested=true يفرض: صورة واحدة على الأقل من تصويرنا + تاريخ الاقتناء + مدة الاستخدام. */
    owned: z.boolean().default(false),
    tested: z.boolean().default(false),
    owned_since: z.coerce.date().optional(),
    usage_period: z.string().optional().or(z.literal('')),      // "6 månader" · "en vinter"
    /* من صورة إلى ثلاث. الأولى هي الأساسية، والبقية تتبدّل معها تلقائياً. */
    own_photos: z
      .array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
      .max(3, 'ثلاث صور كحد أقصى لكل منتج')
      .default([]),
    /* مصدر المواصفة حين لا تكون صفحة مصنّع: صورةٌ من تصويرنا تُظهر المطبوع
       على الجهاز أو علبته. تحمل `src` إحدى صور `own_photos` نفسها.
       أقوى من صفحة المصنّع في موضع واحد: المصنّع يصف طرازاً، وصورتنا تصف
       الجهاز الذي بحوزتنا بعينه. القاعدة `2b` في validate.mjs. */
    spec_photo: z.string().optional(),
    /* تحقّق المالك: فتح صفحة البائع وقارنها بالجهاز الذي بيده وأكّد أنهما
       واحد، بتاريخه. مصدرٌ مسمّى ومسؤولٌ عنه شخص — وقد أثبت قيمته يوم كشف
       أنّ ASIN في P-03 كان لطراز آخر. القاعدة `2b`. */
    owner_checked: z.coerce.date().optional(),
    hands_on: z.array(z.string()).default([]),   // ملاحظات من الاستخدام الفعلي
    hands_on_limits: z.array(z.string()).default([]), // حدود التجربة — إلزامي للنزاهة
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

/* ---------- الفئات ---------- */

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

/* ---------- صفحات الحلول — المحور الأساسي ---------- */

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

/* ---------- أدلة الشراء ---------- */

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: baseDoc.extend({
    solution: z.string(), // إلزامي — كل دليل يعود إلى صفحة حل
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

/* ---------- المقارنات ---------- */

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/comparisons' }),
  schema: baseDoc.extend({
    solution: z.string(),
    products: z.array(z.string()).default([]),
    verdict: z.string(),
  }),
});

/* ---------- المقالات ---------- */

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: baseDoc.extend({
    solution: z.string(),
    products: z.array(z.string()).default([]),
  }),
});

/* ---------- الصفحات الثابتة والقانونية ---------- */

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

/* ---------- بيانات التواجد في الساحة ---------- */

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
