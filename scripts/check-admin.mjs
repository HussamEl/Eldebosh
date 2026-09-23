/**
 * Does the admin panel's config match the content it edits?
 *
 * 1. Every field present in a content file must be defined in the panel.
 *    The CMS writes only the fields it knows, so a field missing from
 *    public/admin/config.yml is silently deleted the first time the owner
 *    saves that entry from the panel.
 *
 * 2. The `subcategory` dropdown must offer exactly the subcategories defined in
 *    src/data/categories. The options are a static list in the config; adding a
 *    subcategory to a category file without adding it there would make it
 *    impossible to pick, and a removed one would stay selectable.
 *
 * The field list is read from the files themselves, not from the schema, so
 * the check reflects what is actually on disk.
 *
 *   npm run check:admin
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** content folder → admin collection name */
const PAIRS = [
  ['src/data/products/sv', 'products_sv'],
  ['src/content/solutions/sv', 'solutions_sv'],
  ['src/content/guides/sv', 'guides_sv'],
  ['src/content/comparisons/sv', 'comparisons_sv'],
  ['src/content/posts/sv', 'posts_sv'],
  ['src/content/pages/sv', 'pages_sv'],
];

/** Fields handled by code, not by the panel. */
const EXEMPT = new Set(['body']);

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};

/** Top-level keys of a YAML file or of an MDX file's frontmatter. */
function topKeys(file) {
  const raw = readFileSync(file, 'utf8');
  const front = /\.(md|mdx)$/.test(file) ? (raw.match(/^---\n([\s\S]*?)\n---/) ?? [])[1] : raw;
  if (!front) return [];
  try {
    const data = YAML.parse(front);
    return data && typeof data === 'object' ? Object.keys(data) : [];
  } catch {
    return [];
  }
}

// YAML.parse resolves the config's anchors (&x / *x), so each collection sees
// its full field list.
const cfg = YAML.parse(readFileSync(join(ROOT, 'public/admin/config.yml'), 'utf8'));
const collections = new Map((cfg.collections ?? []).map((c) => [c.name, c]));
const topFields = (c) => [...(c.fields ?? []), ...(c.files ?? []).flatMap((f) => f.fields ?? [])];

const problems = [];

// 1. Fields on disk that the panel does not know
for (const [dir, name] of PAIRS) {
  const coll = collections.get(name);
  if (!coll) {
    problems.push(`${name}: collection missing from the admin config`);
    continue;
  }
  const known = new Set(topFields(coll).map((f) => f?.name));
  const seen = new Map();
  for (const file of walk(join(ROOT, dir))) {
    for (const k of topKeys(file)) if (!seen.has(k)) seen.set(k, file.replace(ROOT, ''));
  }
  for (const [field, file] of seen) {
    if (EXEMPT.has(field) || known.has(field)) continue;
    problems.push(`${name}: field "${field}" exists in files (e.g. ${file}) but not in the panel — the first save would delete it`);
  }
}

// 2. Subcategory options = subcategories in the data
const defined = new Set(
  walk(join(ROOT, 'src/data/categories'))
    .filter((f) => /\.ya?ml$/.test(f))
    .flatMap((f) => (YAML.parse(readFileSync(f, 'utf8'))?.subcategories ?? []).map((s) => s.id)),
);
for (const coll of collections.values()) {
  const field = topFields(coll).find((f) => f?.name === 'subcategory');
  if (!field) continue;
  if (field.widget !== 'select') {
    problems.push(`${coll.name}: subcategory must be a select — free text lets a typo hide a page or product`);
    continue;
  }
  const offered = new Set((field.options ?? []).map((o) => (typeof o === 'object' ? o.value : o)));
  for (const id of defined) if (!offered.has(id)) problems.push(`${coll.name}: subcategory "${id}" is defined in src/data/categories but cannot be picked in the panel`);
  for (const id of offered) if (!defined.has(id)) problems.push(`${coll.name}: subcategory "${id}" is offered in the panel but not defined in src/data/categories`);
}

if (!problems.length) {
  console.log('\n✓ The admin panel knows every field on disk, and its subcategory options match the data\n');
  process.exit(0);
}
console.log('\n✗ Admin panel config does not match the content:\n');
for (const p of problems) console.log('  • ' + p);
console.log('\n  Fix public/admin/config.yml\n');
process.exit(1);
