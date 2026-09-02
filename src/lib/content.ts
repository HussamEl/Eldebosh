import { getCollection, type CollectionEntry } from 'astro:content';
import { type Lang, DEFAULT_LANG, SEGMENTS } from '../i18n/ui';
import { amazonUrl, AMAZON } from './affiliate';
import { PREVIEW } from './preview';

/* ================= الروابط =================
   مصدر واحد لبناء كل مسار في الموقع.
   لا تكتب مسارات نصية يدوياً في أي مكون. */

export const url = {
  home: (l: Lang) => `/${l}/`,
  category: (l: Lang, slug: string) => `/${l}/${slug}/`,
  subcategory: (l: Lang, cat: string, sub: string) => `/${l}/${cat}/${sub}/`,
  solutions: (l: Lang) => `/${l}/${SEGMENTS[l].solutions}/`,
  solution: (l: Lang, slug: string) => `/${l}/${SEGMENTS[l].solutions}/${slug}/`,
  guides: (l: Lang) => `/${l}/${SEGMENTS[l].guides}/`,
  guide: (l: Lang, slug: string) => `/${l}/${SEGMENTS[l].guides}/${slug}/`,
  comparisons: (l: Lang) => `/${l}/${SEGMENTS[l].compare}/`,
  comparison: (l: Lang, slug: string) => `/${l}/${SEGMENTS[l].compare}/${slug}/`,
  blog: (l: Lang) => `/${l}/${SEGMENTS[l].blog}/`,
  post: (l: Lang, slug: string) => `/${l}/${SEGMENTS[l].blog}/${slug}/`,
  info: (l: Lang, slug: string) => `/${l}/${SEGMENTS[l].info}/${slug}/`,
  search: (l: Lang) => `/${l}/${SEGMENTS[l].search}/`,
};

/* ================= جلب المحتوى ================= */

type DocCollection = 'solutions' | 'guides' | 'comparisons' | 'posts';

/** المنشور فقط. غير المنشور لا يظهر ولا يُبنى — إلا في وضع المعاينة. */
export async function docs<C extends DocCollection>(collection: C, lang: Lang) {
  const all = await getCollection(collection);
  return all
    .filter((e: any) => e.data.lang === lang && (PREVIEW || e.data.published === true))
    .sort((a: any, b: any) => +b.data.updated - +a.data.updated) as CollectionEntry<C>[];
}

/** عدد الصفحات المنشورة في كل فئة فرعية — لإخفاء الفارغة. */
async function subcategoryCounts(lang: Lang): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const coll of ['solutions', 'guides', 'comparisons', 'posts'] as const) {
    for (const e of await docs(coll, lang)) {
      const sub = (e.data as { subcategory?: string }).subcategory;
      if (sub) counts.set(sub, (counts.get(sub) ?? 0) + 1);
    }
  }
  return counts;
}

export async function activeCategories(lang: Lang) {
  const counts = await subcategoryCounts(lang);
  const all = await getCollection('categories');
  return all
    .filter((c) => c.data.active)
    .sort((a, b) => a.data.order - b.data.order)
    .map((c) => ({
      id: c.data.id,
      group: c.data.group,
      icon: c.data.icon,
      name: c.data.names[lang] ?? c.data.names[DEFAULT_LANG],
      slug: c.data.slugs[lang] ?? c.data.slugs[DEFAULT_LANG],
      description: c.data.descriptions[lang] ?? c.data.descriptions[DEFAULT_LANG],
      // الفئة الفرعية بلا محتوى منشور لا تظهر إطلاقاً — لا في القائمة ولا في صفحة الفئة
      subcategories: c.data.subcategories
        .filter((s) => (counts.get(s.id) ?? 0) > 0)
        .map((s) => ({
          id: s.id,
          name: s.names[lang] ?? s.names[DEFAULT_LANG],
          slug: s.slugs[lang] ?? s.slugs[DEFAULT_LANG],
        })),
    }));
}

/* ================= المنتجات ================= */

export type Product = CollectionEntry<'products'>['data'];

let cache: Product[] | null = null;
async function allProducts() {
  if (!cache) cache = (await getCollection('products')).map((p) => p.data);
  return cache;
}

/**
 * المنتج بلغة الصفحة، مع رجوع تلقائي إلى السويدية إن لم تُترجم النسخة بعد.
 * القاعدة الملزمة: منتج غير موثق (verified=false) لا يُعرض إطلاقاً.
 */
export async function getProduct(id: string, lang: Lang): Promise<Product | null> {
  const list = await allProducts();
  const hit = list.find((p) => p.id === id && p.lang === lang) ?? list.find((p) => p.id === id && p.lang === DEFAULT_LANG);
  if (!hit) return null;
  if (!hit.verified) return null;
  return hit;
}

/** كل المنتجات الموثقة بلغة الصفحة — للشبكة أعلى الرئيسية. */
export async function verifiedProducts(lang: Lang, limit = 24): Promise<Product[]> {
  const list = await allProducts();
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    if (seen.has(p.id)) continue;
    if (p.lang !== lang && p.lang !== DEFAULT_LANG) continue;

    // يظهر إذا كان موثقاً بمصدر، أو إذا كان بحوزتنا وله صورة من تصويرنا.
    // الحالة الثانية لا تحمل أي ادعاء يحتاج مصدراً — صورة ملك لنا واسم فقط.
    const showable = p.verified || (p.owned && p.own_photos.length > 0);
    if (!showable) continue;

    seen.add(p.id);
    out.push(p);
  }
  // الموثق أولاً، ثم المصوَّر بانتظار الرابط
  out.sort((a, b) => Number(Boolean(b.asin)) - Number(Boolean(a.asin)));
  return out.slice(0, limit);
}

export async function getProducts(ids: string[], lang: Lang): Promise<Product[]> {
  const out: Product[] = [];
  for (const id of ids) {
    const p = await getProduct(id, lang);
    if (p) out.push(p);
  }
  return out;
}

/**
 * رابط الأفلييت يُبنى هنا فقط. لا رابط خام في أي مقال.
 * الأولوية: رابط صريح (لشبكات أخرى) ← ثم توليد تلقائي من ASIN لأمازون.
 */
export function affiliateHref(p: Product): string | null {
  if (p.affiliate?.url) return p.affiliate.url;
  if (p.asin) return amazonUrl(p.asin);
  return null;
}

/** اسم الشبكة المعروضة في سمة التتبع. */
export function affiliateNetwork(p: Product): string | null {
  if (p.affiliate?.network) return p.affiliate.network;
  if (p.asin) return `amazon-${AMAZON.market.toLowerCase()}`;
  return null;
}

/** هل الصفحة تجارية؟ يحدد ظهور شريط الإفصاح أعلى الصفحة. */
export function isCommercial(products: Product[]): boolean {
  return products.some((p) => Boolean(p.affiliate?.url || p.asin));
}
