/**
 * The binding content rules, enforced before every build.
 *
 * `npm run build` runs this first and stops on any error, so a rule violation
 * can never reach the live site. docs/RULES.md explains each rule and why it
 * exists; this file is where they are enforced.
 *
 * Errors fail the build. Warnings are printed and do not.
 *
 *   npm run check
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { findUnbackedClaim, findOwnedOnlyUseClaim, findBannedPhrase } from './lib/claim-rule.mjs';
import { findOverclaimedCount } from '../src/lib/overclaim.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const errors = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function frontmatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { errors.push(`${file}: no frontmatter`); return { data: null, body: raw }; }
  try {
    return { data: YAML.parse(m[1]), body: raw.slice(m[0].length) };
  } catch (err) {
    errors.push(`${file}: invalid frontmatter — ${err.message}`);
    return { data: null, body: '' };
  }
}

/* ---------- load ---------- */

const productFiles = (await walk(join(ROOT, 'src/data/products'))).filter((f) => /\.ya?ml$/.test(f));
const products = [];
for (const f of productFiles) {
  const data = YAML.parse(await readFile(f, 'utf8'));
  if (data) products.push({ file: f, data });
}

const docs = [];
for (const coll of ['solutions', 'guides', 'comparisons', 'posts', 'pages']) {
  for (const f of (await walk(join(ROOT, 'src/content', coll))).filter((f) => ['.md', '.mdx'].includes(extname(f)))) {
    const raw = await readFile(f, 'utf8');
    const { data, body } = frontmatter(raw, f);
    if (data) docs.push({ file: f, coll, data, body });
  }
}

const categories = [];
for (const f of (await walk(join(ROOT, 'src/data/categories'))).filter((f) => /\.ya?ml$/.test(f))) {
  categories.push({ file: f, data: YAML.parse(await readFile(f, 'utf8')) });
}

/* ---------- category slugs must not collide with fixed routes ----------
   Category pages live at /<lang>/<slug>/, beside the fixed sections. A category
   named like a section would shadow it. Keep in sync with RESERVED in
   src/i18n/ui.ts. */
const RESERVED = new Set(['solutions', 'guides', 'compare', 'blog', 'info', 'sok', 'search', 'admin', 'sv', 'en', 'pagefind']);
for (const c of categories) {
  for (const [lang, slug] of Object.entries(c.data.slugs ?? {})) {
    if (RESERVED.has(slug)) errors.push(`${c.file}: slug "${slug}" (${lang}) is reserved and would collide with a fixed route`);
  }
}

/* ---------- categories and subcategories must exist ----------
   A misspelt subcategory (`powerbank` for `powerbanks`) would otherwise pass:
   the item would vanish from every filter and category page while staying
   live, with nothing reporting it. The admin panel offers a dropdown; this
   catches files edited by hand or by an assistant. */
{
  const catIds = new Set(categories.map((c) => c.data.id));
  const subIds = new Map(categories.map((c) => [c.data.id, new Set((c.data.subcategories ?? []).map((s) => s.id))]));
  const near = (want, pool) => [...pool].find((x) => x.startsWith(String(want).slice(0, 4))) ?? [...pool][0];

  for (const p of [...products, ...docs.filter((x) => x.coll !== 'pages')]) {
    const d = p.data;
    if (!catIds.has(d.category)) {
      errors.push(`${p.file}: unknown category "${d.category}" — available: ${[...catIds].join(' · ')}`);
      continue;
    }
    const subs = subIds.get(d.category) ?? new Set();
    if (d.subcategory && !subs.has(d.subcategory)) {
      errors.push(
        `${p.file}: unknown subcategory "${d.subcategory}" under "${d.category}"` +
          ` — did you mean "${near(d.subcategory, subs)}"? available: ${[...subs].join(' · ')}`,
      );
    }
  }
}

/* ---------- product code and id are unique ----------
   Photo filenames are built from the code. Two products sharing a code would
   share photos, showing one product under another's name. */
{
  const seenCode = new Map();
  const seenId = new Map();
  for (const p of products) {
    if (p.data.code) {
      const k = `${p.data.lang}:${p.data.code}`;
      if (seenCode.has(k)) errors.push(`${p.file}: code "${p.data.code}" is already used by ${seenCode.get(k)} — codes are assigned once`);
      else seenCode.set(k, p.file);
    }
    const k = `${p.data.lang}:${p.data.id}`;
    if (seenId.has(k)) errors.push(`${p.file}: id "${p.data.id}" is already used by ${seenId.get(k)}`);
    else seenId.set(k, p.file);
  }
}

/* ---------- every referenced photo exists, and is ours ----------
   A photo path is free text. One that points at a file never uploaded passes
   the build and shows a broken image on the live site. */
{
  const PUBLIC = join(ROOT, 'public');
  for (const p of products) {
    for (const ph of p.data.own_photos ?? []) {
      if (!ph?.src) continue;
      if (/^https?:/i.test(ph.src)) {
        errors.push(`${p.file}: photo "${ph.src}" is on another domain — only our own photos, from public/uploads/`);
        continue;
      }
      if (!existsSync(join(PUBLIC, ph.src.replace(/^\//, '')))) {
        errors.push(`${p.file}: photo "${ph.src}" has no file — upload it to public/uploads/ first`);
      }
    }
    if (p.data.image && !/^https?:/i.test(p.data.image) && !existsSync(join(PUBLIC, p.data.image.replace(/^\//, '')))) {
      errors.push(`${p.file}: image "${p.data.image}" has no file`);
    }
  }
}

/* ---------- products: sources, links, tested ----------
   A visible product (verified: true) needs a source for its specifications
   and a verification date. A listing title on a retailer page is written by
   the seller, not the maker, so a retailer page alone only warns. It is
   enough together with either:
     spec_photo     our own photo of the specification printed on the device
     owner_checked  the date the owner compared the listing with the device
   The last one is the owner's dated statement, not something others can
   check — which is why the date is recorded. */
const RETAILER = /^(?:www\.)?(?:amazon\.[a-z.]+|amzn\.to|ebay\.[a-z.]+|cdon\.[a-z.]+|komplett\.se|netonnet\.se|elgiganten\.se|webhallen\.com)$/i;

for (const p of products) {
  const d = p.data;
  if (d.verified === true) {
    if (!d.source_url) errors.push(`${p.file}: verified without source_url`);
    if (!d.last_verified) errors.push(`${p.file}: verified without last_verified`);
    if (d.source_url && !d.spec_photo && !d.owner_checked) {
      let host = '';
      try { host = new URL(String(d.source_url)).hostname; } catch { host = ''; }
      if (host && RETAILER.test(host)) {
        warnings.push(`${p.file}: specification source is a retailer page (${host}) — add a maker's page, spec_photo or owner_checked`);
      }
    }
  }
  // The specification photo must be one of our photos, or it is a claim without a file.
  if (d.spec_photo && !(d.own_photos ?? []).some((ph) => ph.src === d.spec_photo)) {
    errors.push(`${p.file}: spec_photo "${d.spec_photo}" is not one of own_photos`);
  }
  // Prices are only allowed from the Amazon API, which is not active.
  if ('price' in d) errors.push(`${p.file}: price is not allowed — use price_band`);

  // The buy link is built from the ASIN; a malformed one breaks it.
  if (d.asin && !/^[A-Z0-9]{10}$/.test(d.asin)) {
    errors.push(`${p.file}: invalid ASIN "${d.asin}" — 10 characters, capital letters and digits`);
  }
  if (d.verified === true && !d.asin && !d.affiliate?.url) {
    warnings.push(`${p.file}: visible product without ASIN — it shows no buy button`);
  }
  // Amazon links are generated from the ASIN with our tag; a pasted one is refused.
  if (d.affiliate?.url && /amazon\./i.test(d.affiliate.url)) {
    errors.push(`${p.file}: hand-pasted Amazon link — use the asin field so the link carries the correct tag`);
  }

  // A claim of use needs evidence, not a flag.
  if (d.tested === true) {
    if (d.owned !== true) errors.push(`${p.file}: tested without owned — we cannot claim use of a product we do not own`);
    if (!d.owned_since) errors.push(`${p.file}: tested without owned_since`);
    if (!d.usage_period) errors.push(`${p.file}: tested without usage_period`);
    if (!Array.isArray(d.own_photos) || d.own_photos.length === 0) {
      errors.push(`${p.file}: tested without one of our own photos (own_photos)`);
    }
    if (!Array.isArray(d.hands_on_limits) || d.hands_on_limits.length === 0) {
      errors.push(`${p.file}: tested without hands_on_limits — state what our use does not show`);
    }
  }
}

/* ---------- every commercial page belongs to a solution page ----------
   The site leads from a problem to a solution to a product. A guide,
   comparison or article without a parent solution is a sales page with no
   problem behind it. Fixed pages (legal, about, contact) are exempt. */
const solutionIds = new Set(docs.filter((d) => d.coll === 'solutions').map((d) => `${d.data.lang}:${d.data.problem_id}`));
for (const d of docs) {
  if (d.coll === 'solutions' || d.coll === 'pages') continue;
  if (!d.data.solution) { errors.push(`${d.file}: missing solution — every page leads back to a solution page`); continue; }
  if (!solutionIds.has(`${d.data.lang}:${d.data.solution}`)) {
    errors.push(`${d.file}: solution "${d.data.solution}" has no solution page in ${d.data.lang}`);
  }
}

/* ---------- referenced products exist and are visible ---------- */
const byId = new Map();
for (const p of products) byId.set(`${p.data.lang}:${p.data.id}`, p.data);
const svById = new Map(products.filter((p) => p.data.lang === 'sv').map((p) => [p.data.id, p.data]));

function checkProductRef(id, d) {
  const hit = byId.get(`${d.data.lang}:${id}`) ?? svById.get(id);
  if (!hit) { errors.push(`${d.file}: refers to unknown product "${id}"`); return; }
  if (!hit.verified) errors.push(`${d.file}: refers to product "${id}", which is not visible (verified: false)`);
}
for (const d of docs) {
  if (d.data.published !== true) continue;
  for (const id of d.data.products ?? []) checkProductRef(id, d);
  for (const pick of d.data.picks ?? []) checkProductRef(pick.product, d);
  // A skeleton recommends and compares nothing; the counts apply to written text.
  if (d.data.stage === 'draft') continue;
  if (d.coll === 'guides' && (d.data.picks ?? []).length < 2) {
    errors.push(`${d.file}: published guide with fewer than two picks`);
  }
  if (d.coll === 'comparisons') {
    const n = (d.data.products ?? []).length;
    if (n < 2 || n > 4) errors.push(`${d.file}: published comparison with ${n} products (2–4 required)`);
  }
}

/* ---------- no raw affiliate links in page text ----------
   Buy links live in product files and are rendered with rel="sponsored" and
   the disclosure. A link typed into an article bypasses both. */
const RAW = /\((https?:\/\/[^)]*?(?:tag=|aff(?:iliate)?|[?&]ref=|adtraction|awin|tradedoubler|amzn\.to)[^)]*)\)/i;
for (const d of docs) {
  const m = d.body.match(RAW);
  if (m) errors.push(`${d.file}: raw affiliate link in the text (${m[1].slice(0, 60)}…) — links live in product files`);
}

/* ---------- `published` and `stage` agree ----------
   Two independent fields:
     published  is the URL live?
     stage      how far has the text got? draft → written → reviewed → published
   draft and written may be live as announced skeletons: the page says it is
   not written yet, is noindex, and shows no products. Only stage `published`
   shows the text. `reviewed` is a short hand-over state and is never live. */
for (const d of docs) {
  const stage = d.data.stage ?? 'draft';
  const pub = d.data.published === true;
  if (pub && stage === 'reviewed') {
    errors.push(`${d.file}: published with stage "reviewed" — set stage to published once the owner approves, or keep it written`);
  }
  if (!pub && stage === 'published') {
    errors.push(`${d.file}: stage published but published is false`);
  }
}

const testedIds = new Set(products.filter((p) => p.data.tested === true).map((p) => p.data.id));

/* ---------- hands-on text is not copied between products ----------
   An identical line of experience in two products tells the reader nobody
   wrote it from experience. Dates and numbers are masked first, so a template
   with different dates still counts as the same line. Warning only: the owner
   rewrites these himself. */
{
  const MONTHS = /\b(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/g;
  const shape = (line) => line.trim().toLowerCase().replace(/\s+/g, ' ').replace(MONTHS, '§').replace(/\d+/g, '#');
  const seen = new Map();
  for (const p of products) {
    for (const line of p.data.hands_on ?? []) {
      const key = shape(line);
      (seen.get(key) ?? seen.set(key, []).get(key)).push(p.data.code ?? p.data.id);
    }
  }
  for (const [line, owners] of seen) {
    if (owners.length < 2) continue;
    warnings.push(`same hands-on text in ${owners.length} products (${owners.join(', ')}): "${line.slice(0, 60)}…" — experience is written once, about one product`);
  }
}

/* ---------- "Bäst i test" is banned everywhere ----------
   It claims a comparative test we did not run, which Swedish marketing law
   treats as misleading. Interface strings are scanned too. */
{
  const uiFile = join(ROOT, 'src/i18n/ui.ts');
  const scan = [
    ...docs.map((d) => [d.file, `${d.data.title ?? ''}\n${d.data.description ?? ''}\n${d.body}`]),
    ...products.map((p) => [p.file, JSON.stringify(p.data)]),
    [uiFile, await readFile(uiFile, 'utf8').catch(() => '')],
  ];
  for (const [file, text] of scan) {
    const hit = findBannedPhrase(text);
    if (hit) errors.push(`${file}: "${hit}" is banned`);
  }
}

/* ---------- the "owned, not tested" strings claim no use ----------
   These two strings are shown only under products with tested: false, so any
   claim of use in them is false by position. */
{
  const text = await readFile(join(ROOT, 'src/i18n/ui.ts'), 'utf8').catch(() => '');
  for (const key of ['handson.owned_only', 'handson.not_tested']) {
    for (const m of text.matchAll(new RegExp(`'${key}':\\s*'((?:[^'\\\\]|\\\\.)*)'`, 'g'))) {
      const hit = findOwnedOnlyUseClaim(m[1]);
      if (hit) errors.push(`src/i18n/ui.ts: "${key}" claims use of an untested product ("${hit}")`);
    }
  }
}

/* ---------- no claim of use over a group we did not all test ----------
   "We use all four" on a page where two of the four are tested. */
for (const d of docs) {
  const ids = [...(d.data.products ?? []), ...(d.data.picks ?? []).map((x) => x?.product)].filter(Boolean);
  if (!ids.length) continue;
  const tested = ids.filter((id) => testedIds.has(id)).length;
  const hit = findOverclaimedCount(`${d.data.title ?? ''}\n${d.body}`, { total: ids.length, tested });
  if (hit) {
    errors.push(`${d.file}: claims use of the whole group ("${hit.text}") but only ${hit.tested} of ${hit.total} are tested`);
  }
}

/* ---------- a skeleton is a promise with a date ----------
   A skeleton left unwritten for 90 days is no longer honest: it is written or
   unpublished. Measured from `updated`, the day it was published; changing
   that date to buy time defeats the rule. docs/project/STATE.md shows the
   deadlines. */
{
  const DAYS = 90;
  const today = new Date();
  for (const d of docs) {
    if (d.data.published !== true || (d.data.stage ?? 'draft') !== 'draft') continue;
    const since = d.data.updated ? new Date(d.data.updated) : null;
    if (!since || Number.isNaN(+since)) continue;
    const age = Math.floor((today - since) / 86400000);
    if (age > DAYS) {
      errors.push(`${d.file}: skeleton published ${age} days ago (limit ${DAYS}) — write it or unpublish it; do not move the date`);
    } else if (age > DAYS - 14) {
      warnings.push(`${d.file}: skeleton is ${age} days old — ${DAYS - age} days left`);
    }
  }
}

/* ---------- no claim of experience without a tested product ----------
   The phrase rules and their test cases: scripts/lib/claim-rule.mjs and
   scripts/test-claim-rule.mjs. */
function pageHasTestedProduct(d) {
  const ids = [...(d.data.products ?? []), ...(d.data.picks ?? []).map((x) => x?.product)].filter(Boolean);
  return ids.some((id) => testedIds.has(id));
}
for (const d of docs) {
  const hit = findUnbackedClaim(d.body);
  if (!hit) continue;
  if (d.data.hands_on === true && pageHasTestedProduct(d)) continue;
  errors.push(
    hit.kind === 'comparative'
      ? `${d.file}: comparison implies we tested ("${hit.text}") — the negation lands on others, the claim on us`
      : `${d.file}: claim of experience ("${hit.text}") without backing — set hands_on: true and link a tested product, or cite a source instead`,
  );
}

/* ---------- external sources are complete and point at the source ----------
   Pages cannot be fetched from CI, so the check is on form: a search engine,
   proxy or translator URL, or a URL that wraps another URL, is not the source
   itself. */
const WRAPPER = /^(?:www\.)?(?:google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.[a-z.]+|r\.jina\.ai|webcache\.googleusercontent\.com|translate\.google\.[a-z.]+|.*\.translate\.goog)$/i;

function linkProblem(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return 'not a valid URL';
  }
  if (!/^https?:$/.test(u.protocol)) return `unsupported protocol (${u.protocol})`;
  if (WRAPPER.test(u.hostname)) return `a search engine or proxy, not the source (${u.hostname})`;
  for (const [, v] of u.searchParams) {
    if (/^https?:\/\//i.test(v)) return 'wraps another URL in its query';
  }
  return null;
}

for (const d of docs) {
  for (const [i, src] of (d.data.sources ?? []).entries()) {
    if (!src?.publisher || !src?.url || !src?.accessed) {
      errors.push(`${d.file}: source ${i + 1} is incomplete — publisher, url and accessed are required`);
      continue;
    }
    const bad = linkProblem(String(src.url));
    if (bad) errors.push(`${d.file}: source ${i + 1} — ${bad}: ${String(src.url).slice(0, 70)}`);
  }
}

/* ---------- description length (search result snippet) ---------- */
for (const d of docs) {
  const len = (d.data.description ?? '').length;
  if (len < 50 || len > 165) {
    const msg = `${d.file}: description is ${len} characters (50–165 required)`;
    if (d.data.published === true) errors.push(msg); else warnings.push(msg);
  }
}

/* ---------- market stall: a real phone number ----------
   The stall section shows call and SMS buttons; a placeholder number would
   publish a dead contact. */
try {
  const tor = YAML.parse(await readFile(join(ROOT, 'src/data/torget/torget.yaml'), 'utf8'));
  if (tor?.active) {
    if (!tor.phone || /0{6,}/.test(String(tor.phone))) {
      errors.push('src/data/torget/torget.yaml: placeholder phone number — set the real number or active: false');
    }
    if (!/^\+\d{8,15}$/.test(String(tor.phone || ''))) {
      errors.push('src/data/torget/torget.yaml: phone must be in international format, starting with +');
    }
  }
} catch { /* the file is optional */ }

/* ---------- result ---------- */
const line = '─'.repeat(52);
console.log(`\n${line}\nBinding rules\n${line}`);
console.log(`products: ${products.length} · pages: ${docs.length} · categories: ${categories.length}`);
for (const w of warnings) console.log(`  warning: ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} rule violation(s):`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`\n✓ All rules pass${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : ''}\n`);
