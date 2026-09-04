/**
 * معالجة صورة منتج — القياس لا الذاكرة.
 *
 * الوصفة هنا ليست مخترعة: قِستُها من الصور الستّ عشرة المرفوعة فعلاً في
 * `public/uploads/` — كلّها `720×720` مربّعة، `webp`، بخلفيتها الطبيعية.
 * وكانت `PHOTO_NAMING.md` تقول شيئاً آخر (١٦٠٠ بكسل وخلفية مزالة)، فصُحّحت
 * الوثيقة على المقيس وصار التنفيذ أمراً واحداً بدل أن يُتذكَّر في كل مرة.
 *
 *   node scripts/make-photo.mjs <الصورة الخام> P-21-1 [ASIN]
 *
 * القصّ من المركز إلى مربّع، ثم `720×720`، ثم `webp`. وحين يُمرَّر ASIN
 * تُكتب نسخة ثانية باسم `P-NN-1-<ASIN>.webp` — وهي التسمية التي تحملها
 * الصورة الأولى لكل منتج له رقم أمازون.
 *
 * وبيانات `EXIF` تُنقل إن وُجدت: تاريخ الالتقاط دليلٌ إضافي على أن الصورة
 * صورتنا، وهو ما تطلبه `PHOTO_NAMING.md` §4.
 */
import { basename } from 'node:path';
import { statSync } from 'node:fs';
import sharp from 'sharp';

const SIDE = 720;          // مقيس من الصور القائمة
const MAX_KB = 300;        // السقف في PHOTO_NAMING.md §4
const OUT = 'public/uploads';

const [src, name, asin] = process.argv.slice(2);

if (!src || !name) {
  console.error('\nالاستعمال:  node scripts/make-photo.mjs <صورة> P-21-1 [ASIN]\n');
  process.exit(1);
}
if (!/^P-\d{2}-[123]$/.test(name)) {
  console.error(`\nاسم غير صالح "${name}" — الصيغة P-NN-K حيث K واحد من 1 2 3\n`);
  process.exit(1);
}
if (asin && !/^[A-Z0-9]{10}$/.test(asin)) {
  console.error(`\nASIN غير صالح "${asin}" — عشر خانات، حروف كبيرة وأرقام\n`);
  process.exit(1);
}
// النسخة المرفقة بالـASIN لا تكون إلا للصورة الأولى
if (asin && !name.endsWith('-1')) {
  console.error(`\n"${name}" ليست الصورة الأولى — لاحقة ASIN للأولى وحدها\n`);
  process.exit(1);
}

async function write(target, quality) {
  await sharp(src)
    .rotate()                                  // يحترم اتجاه الكاميرا قبل القصّ
    .resize(SIDE, SIDE, { fit: 'cover', position: 'centre' })
    .webp({ quality })
    .withMetadata()
    .toFile(target);
  return statSync(target).size;
}

const target = `${OUT}/${name}.webp`;

let size = 0;
let quality = 82;
for (; quality >= 55; quality -= 8) {
  size = await write(target, quality);
  if (size <= MAX_KB * 1024) break;
}

if (size > MAX_KB * 1024) {
  console.error(`\n${basename(target)} بقي ${Math.round(size / 1024)}KB فوق السقف — صغّر الأصل أولاً\n`);
  process.exit(1);
}

console.log(`\n✓ ${target}   ${SIDE}×${SIDE}   ${Math.round(size / 1024)}KB   quality ${quality}`);

if (asin) {
  const twin = `${OUT}/${name}-${asin}.webp`;
  await write(twin, quality);
  console.log(`✓ ${twin}   نسخة الصورة الأولى باسم أمازون`);
}

console.log(`
الخطوة التالية:
  own_photos في ملف المنتج ← src: "/uploads/${name}.webp" مع alt سويدي
  npm run assets   ثم   npm run verify
`);
