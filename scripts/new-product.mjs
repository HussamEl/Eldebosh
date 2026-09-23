/**
 * Create a new product file with the next free code and a valid category.
 *
 *   npm run new:product -- --name "UGREEN Nexode 65W" --brand UGREEN --sub snabbladdare
 *   npm run new:product -- --name "…" --brand "…" --sub kablar --asin B0XXXXXXXX --owned
 *
 * Options
 *   --name    product name as printed on the product           (required)
 *   --brand   brand                                             (required)
 *   --sub     subcategory id; the category is derived from it   (required)
 *   --asin    Amazon ASIN, 10 characters
 *   --id      file id; derived from brand + name when omitted
 *   --owned   the owner has the product in hand
 *
 * The product starts hidden (verified: false). The file lists every field in
 * the same order as the admin panel's product form, so the next steps are the
 * empty fields from top to bottom. The owner can do the same from /admin/.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, PRODUCTS_DIR, loadProducts, loadCategories, nextProductCode } from './lib/repo.mjs';
import { today } from '../src/lib/clock.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(`--${name}`);
const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

const name = opt('name');
const brand = opt('brand');
const sub = opt('sub');
const asin = opt('asin') ?? '';
if (!name || !brand || !sub) {
  fail('Usage: npm run new:product -- --name "…" --brand "…" --sub <subcategory> [--asin …] [--owned]');
}

const categories = loadCategories();
const category = categories.find((c) => (c.subcategories ?? []).some((s) => s.id === sub));
if (!category) {
  const all = categories.flatMap((c) => (c.subcategories ?? []).map((s) => `${s.id} (${c.id})`));
  fail(`Unknown subcategory "${sub}". Choose one of:\n    ${all.join('\n    ')}`);
}
if (asin && !/^[A-Z0-9]{10}$/.test(asin)) fail(`ASIN "${asin}" must be 10 characters: capital letters and digits.`);

// Swedish letters fold to ASCII so the id is a clean URL-safe slug.
const slugify = (s) => s.toLowerCase()
  .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const id = opt('id') ?? slugify(name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`);
if (!/^[a-z0-9-]+$/.test(id)) fail(`Id "${id}" may contain only a–z, 0–9 and hyphens.`);

const products = loadProducts();
if (products.some((p) => p.id === id)) fail(`A product with id "${id}" already exists. Pass --id to choose another.`);
const file = join(PRODUCTS_DIR, `${id}.yaml`);
if (existsSync(file)) fail(`${relative(ROOT, file)} already exists.`);

const code = nextProductCode(products);
const q = (s) => JSON.stringify(s); // YAML accepts JSON strings; this quotes safely

const yaml = `lang: sv
name: ${q(name)}
brand: ${q(brand)}
code: ${code}
id: ${id}
category: ${category.id}
subcategory: ${sub}
problems_solved: []
price_band: mid
own_photos: []
owned: ${flag('owned')}
tested: false
key_specs: {}
pros: []
cons: []
best_for: ""
asin: ${q(asin)}
source_url: ""
last_verified: ${today()}
verified: false
`;

writeFileSync(file, yaml, 'utf8');
console.log(`
✓ ${relative(ROOT, file)}  —  ${code}  ·  ${name}

  Next, top to bottom (or open it in /admin/):
    1. photos      public/uploads/${code}-1.webp  (720×720, our own photo)
    2. specs       key_specs, from the maker's page or the print on the device
    3. text        pros · cons · best_for
    4. ASIN        ${asin ? 'set' : 'from the product page on amazon.se'}
    5. source      source_url, spec_photo or owner_checked
    6. verified    true — the build refuses it until 2–5 are in place

  Then: npm run verify
`);
