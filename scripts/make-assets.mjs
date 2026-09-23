/**
 * docs/project/ASSETS.md — an index of every photo and brand asset, by code.
 *
 * Lets the owner and any assistant refer to a photo by its code ("P-03-1 is
 * tilted") instead of sending the image again: the file is in the repository.
 * Also reports uploads that no product references.
 *
 * Rewritten only when its content changes (see make-state.mjs for why).
 *
 *   npm run assets
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { today } from '../src/lib/clock.mjs';
import { ROOT, loadProducts } from './lib/repo.mjs';

const kb = (p) => `${(statSync(p).size / 1024).toFixed(0)} KB`;

/* ---------- product photos ---------- */
const all = loadProducts().sort((a, b) => String(a.code).localeCompare(String(b.code)));
const rows = [];
for (const p of all) {
  const photos = (p.own_photos ?? []).slice(0, 3);
  if (!photos.length) {
    rows.push(`| \`${p.code}\` | ${p.name} | — | **بلا صورة** | — |`);
    continue;
  }
  photos.forEach((ph, k) => {
    const file = join(ROOT, 'public', ph.src.replace(/^\//, ''));
    if (!existsSync(file)) return;
    rows.push(`| \`${p.code}-${k + 1}\` | ${p.name} | \`${ph.src.split('/').pop()}\` | ${k + 1} من ${photos.length} | ${kb(file)} |`);
  });
}

/* ---------- brand assets ---------- */
const brand = ['favicon.svg', 'logo.svg', 'og-default.png', 'qr-card.png', 'qr-eldebosh.png']
  .map((name) => ({ name, file: join(ROOT, 'public', name) }))
  .filter((x) => existsSync(x.file));

const body = [
  '# فهرس الصور — بالرموز',
  '',
  '> **مولَّد من المستودع — لا يُحرَّر يدوياً.** `npm run assets` · آخر تغيّر: __STAMP__',
  '>',
  '> اذكر الصورة برمزها بدل إرسالها ثانية: «`P-03-1` مائلة». الملف في المستودع.',
  '',
  '## P — صور المنتجات',
  '',
  '`P-NN-K`: رقم المنتج ثم رقم الصورة، من صورة إلى ثلاث.',
  '',
  '| الرمز | المنتج | الملف | الصورة | الحجم |',
  '|---|---|---|---|---|',
  ...rows,
  '',
  '## B — أصول الهوية',
  '',
  '| الرمز | الملف | الحجم |',
  '|---|---|---|',
  ...brand.map((b, i) => `| \`B-${String(i + 1).padStart(2, '0')}\` | \`/${b.name}\` | ${kb(b.file)} |`),
  '',
].join('\n');

const OUT = join(ROOT, 'docs/project/ASSETS.md');
const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
const prevStamp = (prev.match(/آخر تغيّر: (\S+)/) ?? [])[1];
if (!(prevStamp && prev === body.replace('__STAMP__', prevStamp))) {
  writeFileSync(OUT, body.replace('__STAMP__', today()), 'utf8');
}
const photos = rows.filter((r) => !r.includes('بلا صورة')).length;
console.log(`\n✓ ASSETS.md — ${photos} photos · ${rows.length - photos} products without a photo · ${brand.length} brand assets`);

/* ---------- orphaned uploads ----------
   A file in public/uploads that nothing references is published on every
   deploy and seen by nobody. Reported, not deleted: deleting is a decision. */
const referenced = new Set();
for (const p of all) {
  for (const ph of p.own_photos ?? []) if (ph?.src) referenced.add(ph.src.split('/').pop());
  for (const k of ['spec_photo', 'image', 'video_thumb']) if (p[k]) referenced.add(String(p[k]).split('/').pop());
}
const orphans = readdirSync(join(ROOT, 'public/uploads'))
  .filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f))
  .filter((f) => !referenced.has(f));
if (orphans.length) {
  console.log(`\n  ⚠ ${orphans.length} upload(s) no product references:`);
  for (const f of orphans) console.log(`      ${f}   ${kb(join(ROOT, 'public/uploads', f))}`);
  console.log('      Delete them or reference them.');
}
console.log('');
