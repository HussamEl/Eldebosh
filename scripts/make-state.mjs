/**
 * docs/project/STATE.md — the project dashboard, computed from the repository.
 *
 * This is the only source of numbers. No other document states a count: a
 * hand-written number is right on the day it is written and wrong a week later,
 * and then the project has two sources that disagree.
 *
 * The file is rewritten only when its content changes, and its date is the
 * date of that change — so an unchanged project produces no diff, and a reader
 * never mistakes a fresh date for fresh data.
 *
 * Arabic: the owner reads it, and so does every party at the start of a
 * conversation (docs/project/INSTRUCTIONS.md links to its raw URL).
 *
 *   npm run state
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { now } from '../src/lib/clock.mjs';
import { ROOT, loadProducts, loadCategories, loadDocs, nextProductCode, missingForProduct, addDays } from './lib/repo.mjs';

const SKELETON_DAYS = 90; // must match rule 5g in scripts/validate.mjs

/* ---------- products ---------- */
const products = loadProducts().sort((a, b) => String(a.code).localeCompare(String(b.code)));
const P = {
  total: products.length,
  live: products.filter((p) => p.verified).length,
  buyable: products.filter((p) => p.verified && p.asin).length,
  tested: products.filter((p) => p.tested).length,
  photographed: products.filter((p) => p.own_photos?.length).length,
};
const incomplete = products
  .map((p) => ({ p, missing: missingForProduct(p) }))
  .filter(({ missing }) => missing.length);

/* ---------- content ---------- */
const COLLECTIONS = [
  ['solutions', 'صفحات الحلول'],
  ['guides', 'أدلة الشراء'],
  ['comparisons', 'المقارنات'],
  ['posts', 'المقالات'],
];
const docs = COLLECTIONS.flatMap(([c]) => loadDocs(c).map((d) => ({ ...d, _coll: c })));
const stage = (d) => d.stage ?? 'draft';
const count = (s) => docs.filter((d) => stage(d) === s).length;
const waitingReview = docs.filter((d) => ['written', 'reviewed'].includes(stage(d)));
const skeletons = docs
  .filter((d) => d.published === true && stage(d) === 'draft' && d.updated)
  .map((d) => ({ slug: d.slug, due: addDays(d.updated, SKELETON_DAYS) }))
  .sort((a, b) => a.due.localeCompare(b.due));

/* ---------- categories and the market stall ---------- */
const cats = loadCategories();
const activeCats = cats.filter((c) => c.active).length;
let torget = 'معطّلة';
if (existsSync(join(ROOT, 'src/data/torget/torget.yaml'))) {
  const t = YAML.parse(readFileSync(join(ROOT, 'src/data/torget/torget.yaml'), 'utf8'));
  if (t?.active) torget = /^\+\d{8,15}$/.test(String(t.phone ?? '')) ? 'مفعّلة' : 'مفعّلة برقم غير صالح';
}

/* ---------- write ---------- */
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

const body = `# لوحة الحالة

> **مولَّدة من المستودع — لا تُحرَّر يدوياً.** \`npm run state\`
> آخر تغيّر في الحالة: __STAMP__

## سطر الحالة

\`\`\`
منتجات ${P.total} (ظاهرة ${P.live} · قابلة للشراء ${P.buyable} · مجرَّبة ${P.tested}) ·
صفحات ${docs.length} (نصّها منشور ${count('published')} · تنتظر المراجعة ${waitingReview.length} · هيكل ${count('draft')}) ·
فئات مفعّلة ${activeCats}/${cats.length} · الساحة ${torget}
\`\`\`

## المنتج التالي

الرمز الحرّ التالي: **\`${nextProductCode(products)}\`** — يُسنَد مرة ولا يتغيّر.

## ما ينقص كل منتج ليكتمل

${incomplete.length ? table(['الرمز', 'المنتج', 'ظاهر', 'ينقصه'], incomplete.map(({ p, missing }) => [`\`${p.code}\``, p.name, p.verified ? '✓' : '—', missing.join(' · ')])) : '✓ كل المنتجات مكتملة.'}

«ظاهر» يعني \`verified: true\`: المنتج على الموقع. وبلا ASIN يظهر بلا زرّ شراء.

## المنتجات

${table(['البند', 'العدد'], [
  ['المجموع', P.total],
  ['ظاهرة في الموقع', P.live],
  ['ظاهرة ولها زرّ شراء', P.buyable],
  ['مصوَّرة من تصويرنا', P.photographed],
  ['مجرَّبة فعلياً', P.tested],
])}

## المحتوى

${table(['النوع', 'المجموع', 'نصّه منشور', 'مكتوب ينتظر', 'هيكل'], COLLECTIONS.map(([c, label]) => {
  const d = docs.filter((x) => x._coll === c);
  return [label, d.length, d.filter((x) => stage(x) === 'published').length, d.filter((x) => ['written', 'reviewed'].includes(stage(x))).length, d.filter((x) => stage(x) === 'draft').length];
}))}

${waitingReview.length ? `**تنتظر مراجعة حسام:**\n\n${waitingReview.map((d) => `- \`${d.slug}\` — ${d._coll}`).join('\n')}` : '✓ لا صفحة تنتظر المراجعة.'}

## مهلة الهياكل

الهيكل المنشور وعدٌ مهلته ${SKELETON_DAYS} يوماً: بعدها يُكتب أو يُسحب، والبناء يسقط.

${skeletons.length ? table(['آخر موعد', 'العدد', 'الصفحات'], [...Map.groupBy(skeletons, (s) => s.due)].map(([due, list]) => [`**${due}**`, list.length, list.map((s) => `\`${s.slug}\``).join(' · ')])) : '✓ لا هياكل منشورة.'}
`;

/* Only rewrite when something other than the date changed. */
const OUT = join(ROOT, 'docs/project/STATE.md');
const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
const prevStamp = (prev.match(/آخر تغيّر في الحالة: (.+)/) ?? [])[1];
if (prevStamp && prev === body.replace('__STAMP__', prevStamp)) {
  console.log(`\n✓ STATE.md — unchanged since ${prevStamp}\n`);
} else {
  writeFileSync(OUT, body.replace('__STAMP__', now()), 'utf8');
  console.log(`\n✓ STATE.md — products ${P.total} · live ${P.live} · pages ${docs.length}\n`);
}
