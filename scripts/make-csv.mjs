/**
 * يولّد جداول CSV للعمل عليها في Excel أو Google Sheets.
 *
 * لماذا CSV لا XLSX: قياس فعلي أظهر أن استخراج XLSX يصل بحجم
 * ثلاثة أضعاف النص نفسه — حشو الجداول و NaN لكل خانة فارغة.
 *
 *   npm run csv
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'csv');
mkdirSync(OUT, { recursive: true });

const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const write = (name, rows) =>
  writeFileSync(join(OUT, name), '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n') + '\n', 'utf8');

/* ---------- المنتجات ---------- */
const dir = join(ROOT, 'src/data/products/sv');
const products = readdirSync(dir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => YAML.parse(readFileSync(join(dir, f), 'utf8')))
  .filter(Boolean);

products.sort((a, b) =>
  Number(Boolean(b.verified)) - Number(Boolean(a.verified)) ||
  String(a.category).localeCompare(String(b.category)) ||
  String(a.brand).localeCompare(String(b.brand))
);

const code = (p, i) => p.code ?? `P-${String(i + 1).padStart(2, '0')}`;

const prodRows = [[
  'nr', 'kod', 'bilder', 'asin', 'namn', 'varumarke', 'id',
  'kategori', 'prisniva', 'agd', 'testad', 'verifierad', 'kalla', 'anteckning',
]];
products.forEach((p, i) => {
  const n = (p.own_photos ?? []).length;
  prodRows.push([
    i + 1, code(p, i), n, p.asin ?? '', p.name, p.brand, p.id,
    p.category, p.price_band,
    p.owned ? 'ja' : 'nej', p.tested ? 'ja' : 'nej', p.verified ? 'ja' : 'nej',
    p.source_url ?? '', '',
  ]);
});
write('produkter.csv', prodRows);

/* ---------- الصور: سطر لكل صورة، وسطر لكل خانة شاغرة ---------- */
const imgRows = [['kod', 'filnamn', 'produkt', 'plats', 'status', 'visar']];
products.forEach((p, i) => {
  const photos = (p.own_photos ?? []).slice(0, 3);
  for (let k = 0; k < 3; k++) {
    const kod = `${code(p, i)}-${k + 1}`;
    const ph = photos[k];
    if (ph) {
      imgRows.push([kod, ph.src.split('/').pop(), p.name, k + 1, 'finns', ph.alt ?? '']);
    } else if (k === 0) {
      imgRows.push([kod, `${kod}.jpg`, p.name, 1, 'SAKNAS', '']);
    } else if (k === photos.length) {
      imgRows.push([kod, `${kod}.jpg`, p.name, k + 1, 'ledig', '']);
    }
  }
});
write('bilder.csv', imgRows);

const filled = imgRows.filter((r) => r[4] === 'finns').length;
const missing = imgRows.filter((r) => r[4] === 'SAKNAS').length;
console.log(`\n✓ csv/  ${products.length} منتج · ${filled} صورة · ${missing} بلا صورة\n`);
