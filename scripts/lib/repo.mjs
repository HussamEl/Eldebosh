/**
 * Read the project's data straight from disk, for the scripts that generate
 * reports (STATE.md, ELDEBOSH-START.md) and scaffold new products.
 *
 * Deliberately independent of Astro: these scripts run without a build.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const PRODUCTS_DIR = join(ROOT, 'src/data/products/sv');

const yamlFiles = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).map((f) => join(dir, f)) : [];

/** Products, each with the path of its file. */
export function loadProducts() {
  return yamlFiles(PRODUCTS_DIR)
    .map((file) => ({ ...(YAML.parse(readFileSync(file, 'utf8')) ?? {}), _file: relative(ROOT, file) }))
    .filter((p) => p.id);
}

/** Categories in menu order, each with its subcategories. */
export function loadCategories() {
  return yamlFiles(join(ROOT, 'src/data/categories'))
    .map((f) => YAML.parse(readFileSync(f, 'utf8')))
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

/** Content pages of one collection, frontmatter only. */
export function loadDocs(collection, lang = 'sv') {
  const dir = join(ROOT, 'src/content', collection, lang);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => ['.md', '.mdx'].includes(extname(f)))
    .map((f) => {
      const m = readFileSync(join(dir, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) return null;
      try {
        return { ...YAML.parse(m[1]), _file: `src/content/${collection}/${lang}/${f}` };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** The next unused product code, e.g. `P-24`. Codes are never reused. */
export function nextProductCode(products = loadProducts()) {
  const used = products.map((p) => Number(String(p.code ?? '').replace(/^P-/, ''))).filter(Number.isFinite);
  return `P-${String(Math.max(0, ...used) + 1).padStart(2, '0')}`;
}

/**
 * What stops a product from being complete on the site, in the order the owner
 * would fix it. Mirrors the rules in scripts/validate.mjs.
 */
export function missingForProduct(p) {
  const out = [];
  if (!p.own_photos?.length) out.push('صورة');
  if (!p.asin) out.push('ASIN');
  if (!p.source_url) out.push('مصدر');
  if (!p.last_verified) out.push('تاريخ تحقّق');
  if (!p.brand || /^ok[äa]nt$/i.test(p.brand)) out.push('اسم العلامة');
  if (!p.pros?.length || !p.cons?.length || !p.best_for) out.push('مزايا وعيوب');
  return out;
}

/** `YYYY-MM-DD` of an ISO date plus a number of days. */
export function addDays(date, days) {
  const d = new Date(date);
  if (Number.isNaN(+d)) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
