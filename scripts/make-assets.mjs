/**
 * يولّد فهرس الأصول: رمز مرجعي لكل صورة في المشروع.
 *
 * الغرض: بدل إعادة رفع الصور في كل محادثة، يكتب صاحب المشروع الرمز فقط
 * فتُقرأ الصورة من المستودع مباشرة.
 *
 *   npm run assets
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const rel = (p) => p.replace(ROOT, '').replace(/\\/g, '/');
const kb = (p) => (statSync(p).size / 1024).toFixed(0) + ' KB';

/* ---------- صور المنتجات ---------- */
const prodDir = join(ROOT, 'src/data/products/sv');
const all = readdirSync(prodDir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => YAML.parse(readFileSync(join(prodDir, f), 'utf8')))
  .filter(Boolean);

// نفس ترتيب الجدول: الموثقة أولاً ثم الفئة ثم العلامة
all.sort((a, b) =>
  Number(Boolean(b.verified)) - Number(Boolean(a.verified)) ||
  String(a.category).localeCompare(String(b.category)) ||
  String(a.brand).localeCompare(String(b.brand))
);

const products = [];
all.forEach((d, idx) => {
  const code = d.code ?? `P-${String(idx + 1).padStart(2, '0')}`;
  const photos = (d.own_photos ?? []).slice(0, 3);
  photos.forEach((ph, k) => {
    const file = join(ROOT, 'public', ph.src.replace(/^\//, ''));
    if (!existsSync(file)) return;
    products.push({
      code: `${code}-${k + 1}`, product: code, name: d.name,
      src: ph.src, alt: ph.alt, file, slot: k + 1, total: photos.length,
    });
  });
  if (photos.length === 0) products.push({ code, product: code, name: d.name, src: '', missing: true });
});

/* ---------- أصول الهوية ---------- */
const brandFiles = ['favicon.svg', 'logo.svg', 'og-default.png', 'qr-card.png', 'qr-eldebosh.png']
  .map((f) => ({ name: f, file: join(ROOT, 'public', f) }))
  .filter((x) => existsSync(x.file));

/* ---------- الكتابة ---------- */
const code = (p, i) => `${p}-${String(i + 1).padStart(2, '0')}`;

const lines = [
  '# فهرس الأصول — الرموز المرجعية',
  '',
  '> **بدل إرسال صورة، اكتب رمزها.**',
  '> مثال: «عدّل بطاقة `P-03`» أو «الشعار `B-02` صغير جداً».',
  '> الصور موجودة في المستودع، وتُقرأ من مسارها بلا رفع ولا استهلاك.',
  '',
  `> يُولَّد آلياً بـ \`npm run assets\` · آخر تحديث: ${new Date().toISOString().slice(0, 10)}`,
  '',
  '---',
  '',
  '## P — صور المنتجات',
  '',
  '**التسمية:** `P-NN-K` — رقم المنتج ثم رقم الصورة. **من صورة إلى ثلاث لكل منتج.**',
  '',
  '| الرمز | المنتج | الملف | الصورة | الحجم |',
  '|---|---|---|---|---|',
  ...products.map((p) =>
    p.missing
      ? `| \`${p.code}\` | ${p.name} | — | **بلا صورة** | — |`
      : `| \`${p.code}\` | ${p.name} | \`${p.src.split('/').pop()}\` | ${p.slot} من ${p.total} | ${kb(p.file)} |`
  ),
  '',
  '## B — أصول الهوية',
  '',
  '| الرمز | العنصر | المسار | الحجم |',
  '|---|---|---|---|',
  ...brandFiles.map((b, i) => `| \`${code('B', i)}\` | ${b.name} | \`/${b.name}\` | ${kb(b.file)} |`),
  '',
  '## S — لقطات الشاشة',
  '',
  'المكان المخصص للقطات التي يرسلها صاحب المشروع.',
  '',
  '**القاعدة:** كل لقطة تُحفظ في `assets/screens/` باسم رمزها، وتُضاف هنا بسطر واحد.',
  '',
  '| الرمز | ما تُظهره | التاريخ | الحالة |',
  '|---|---|---|---|',
  '| — | لا يوجد بعد | — | — |',
  '',
  '---',
  '',
  '## كيف يعمل هذا',
  '',
  '**١.** ترسل الحزمة مرة واحدة في بداية المحادثة.',
  '',
  '**٢.** بعدها تكتب الرمز بدل إرفاق الصورة:',
  '',
  '```',
  'P-03-1 الصورة مائلة قليلاً',
  'P-07 أضفت له صورتين',
  'B-02 الشعار صغير على الجوال',
  '```',
  '',
  '**٣.** تُقرأ الصورة من مسارها في المستودع.',
  '',
  '## للقطات الجديدة',
  '',
  'إن أردت إرسال لقطة شاشة جديدة:',
  '',
  '**احفظها في** `assets/screens/S-01.png` **وأضف سطراً في جدول `S`** ثم أرسل الحزمة.',
  '',
  'أو أرسلها مباشرة في المحادثة — **مرة واحدة فقط** — واطلب حفظها بالرمز.',
  '',
];

writeFileSync(join(ROOT, 'docs/project/ASSETS.md'), lines.join('\n'), 'utf8');
const withPhoto = products.filter((p) => !p.missing).length;
const without = products.filter((p) => p.missing).length;
console.log(`\n✓ فهرس الأصول: ${withPhoto} صورة · ${without} منتج بلا صورة · ${brandFiles.length} أصل هوية\n  ASSETS.md\n`);
