import { getCollection, type CollectionEntry } from 'astro:content';
import { type Lang, DEFAULT_LANG, SEGMENTS } from '../i18n/ui';
import { amazonUrl, AMAZON } from './affiliate';
import { PREVIEW } from './preview';

/* ================= URLs =================
   The single place every site path is built. Components never write a path
   by hand. Changing a pattern after publishing breaks links and search
   rankings — it needs the owner's decision. */

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

/* ================= content ================= */

type DocCollection = 'solutions' | 'guides' | 'comparisons' | 'posts';

/** Published entries only; unpublished ones are not built, except in preview mode. */
export async function docs<C extends DocCollection>(collection: C, lang: Lang) {
  const all = await getCollection(collection);
  return all
    .filter((e: any) => e.data.lang === lang && (PREVIEW || e.data.published === true))
    // The order must not depend on the order files are read from disk: pages
    // share dates, and ties would sort differently on different machines,
    // making builds non-reproducible. The slug breaks ties: unique and stable.
    .sort((a: any, b: any) =>
      +b.data.updated - +a.data.updated || String(a.data.slug).localeCompare(String(b.data.slug)),
    ) as CollectionEntry<C>[];
}

/** Published pages per subcategory, so empty subcategories can be hidden. */
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
    .sort((a, b) => a.data.order - b.data.order || String(a.data.id).localeCompare(String(b.data.id)))
    .map((c) => ({
      id: c.data.id,
      group: c.data.group,
      icon: c.data.icon,
      name: c.data.names[lang] ?? c.data.names[DEFAULT_LANG],
      slug: c.data.slugs[lang] ?? c.data.slugs[DEFAULT_LANG],
      description: c.data.descriptions[lang] ?? c.data.descriptions[DEFAULT_LANG],
      // A subcategory with no published content is never shown: a link to an empty page costs more trust than no link.
      subcategories: c.data.subcategories
        .filter((s) => (counts.get(s.id) ?? 0) > 0)
        .map((s) => ({
          id: s.id,
          name: s.names[lang] ?? s.names[DEFAULT_LANG],
          slug: s.slugs[lang] ?? s.slugs[DEFAULT_LANG],
        })),
    }));
}

/* ================= products ================= */

export type Product = CollectionEntry<'products'>['data'];

let cache: Product[] | null = null;
async function allProducts() {
  if (!cache) cache = (await getCollection('products')).map((p) => p.data);
  return cache;
}

/**
 * A product in the page's language, falling back to Swedish when there is no
 * translation. Binding rule: a product with verified: false is never shown.
 */
export async function getProduct(id: string, lang: Lang): Promise<Product | null> {
  const list = await allProducts();
  const hit = list.find((p) => p.id === id && p.lang === lang) ?? list.find((p) => p.id === id && p.lang === DEFAULT_LANG);
  if (!hit) return null;
  if (!hit.verified) return null;
  return hit;
}

/** Products for the home page grid. */
export async function verifiedProducts(lang: Lang, limit = 24): Promise<Product[]> {
  const list = await allProducts();
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    if (seen.has(p.id)) continue;
    if (p.lang !== lang && p.lang !== DEFAULT_LANG) continue;

    // Shown if verified, or if we own it and have our own photo of it: the
    // second case makes no claim that needs a source — our photo and a name.
    const showable = p.verified || (p.owned && p.own_photos.length > 0);
    if (!showable) continue;

    seen.add(p.id);
    out.push(p);
  }
  // those with a buy link first, then photographed ones still waiting for one
  out.sort(
    (a, b) =>
      Number(Boolean(b.asin)) - Number(Boolean(a.asin)) || String(a.id).localeCompare(String(b.id)),
  );
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
 * The affiliate link is built here and nowhere else — never typed into a page.
 * An explicit URL (for a non-Amazon network) first, else generated from the ASIN.
 */
export function affiliateHref(p: Product): string | null {
  if (p.affiliate?.url) return p.affiliate.url;
  if (p.asin) return amazonUrl(p.asin);
  return null;
}

/** Network name for the data-network tracking attribute. */
export function affiliateNetwork(p: Product): string | null {
  if (p.affiliate?.network) return p.affiliate.network;
  if (p.asin) return `amazon-${AMAZON.market.toLowerCase()}`;
  return null;
}

/** Does the page link to products? Decides whether the disclosure shows at the top. */
export function isCommercial(products: Product[]): boolean {
  return products.some((p) => Boolean(p.affiliate?.url || p.asin));
}
