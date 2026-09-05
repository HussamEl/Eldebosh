/* فحص الروابط الداخلية بين الوثائق.
 *
 * العطب الذي أنتجه: في تنظيف `2026-09-05` حُذفت عشر وثائق، فبقيت اثنتا عشرة
 * إشارة إليها في الفهارس والسجلات — روابط تقود إلى لا شيء. ولم يكن في البوابة
 * ما يراها، فوُجدت باليد وحدها.
 *
 * ووثيقةٌ تحيل إلى ملف محذوف أسوأ من وثيقة ناقصة: القارئ يظن أن الجواب موجود
 * ويضيع وقته في البحث عنه. وهذا يؤذي أكثر منذ صار المستودع الذاكرة الوحيدة.
 *
 * يفحص: كل رابط Markdown نسبي في الوثائق ‏— ويتجاهل الروابط الخارجية
 * والمراسي (#) وأي مسار داخل site/ لأنه مولَّد.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKIP_DIRS = new Set(['node_modules', '.git', 'site', '.astro', '.preview-site']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const files = walk(ROOT);
const broken = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const [, target] of text.matchAll(LINK)) {
    const path = target.split('#')[0];
    if (!path) continue;                                  // مرساة في الصفحة نفسها
    if (/^(https?:|mailto:)/.test(path)) continue;        // رابط خارجي
    if (!existsSync(normalize(join(dirname(file), path)))) {
      broken.push([relative(ROOT, file), target]);
    }
  }
}

console.log(`\nفحص الروابط: ${files.length} وثيقة\n`);

if (broken.length) {
  for (const [file, target] of broken) console.log(`  ✗ ${file} → ${target}`);
  console.log(`\n✗ ${broken.length} رابطاً يقود إلى ملف غير موجود\n`);
  process.exit(1);
}

console.log('✓ كل رابط داخلي يقود إلى ملف موجود\n');
