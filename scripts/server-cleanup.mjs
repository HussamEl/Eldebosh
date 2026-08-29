/**
 * يولّد قائمة بالمسارات التي يجب حذفها من الخادم.
 *
 * السبب: الرفع فوق ملفات قديمة لا يحذف ما لم يعد يُولَّد.
 * صفحة قديمة باقية تعرض التصميم القديم وتُربك الزائر.
 *
 *   npm run cleanup
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'site');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p.replace(DIST, ''));
  }
  return out;
}

const files = walk(DIST).sort();
const dirs = [...new Set(files.map((f) => f.split('/').slice(0, -1).join('/') || '/'))].sort();

const report = [
  '# ملفات النسخة الحالية',
  '',
  `عدد الملفات: ${files.length}`,
  `تاريخ البناء: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
  '',
  '## القاعدة',
  '',
  'قبل أي رفع: **احذف كل محتويات المجلد العام على الخادم**، ثم ارفع.',
  'الرفع فوق القديم يترك صفحات لم تعد موجودة في المشروع، فتظهر بتصميم قديم.',
  '',
  '## المجلدات التي يجب أن توجد بعد الرفع',
  '',
  '```',
  ...dirs,
  '```',
  '',
  '## أي مجلد آخر على الخادم = بقايا قديمة يجب حذفها',
  '',
].join('\n');

writeFileSync(join(ROOT, 'docs/project/SERVER_FILES.md'), report, 'utf8');
console.log(`\n✓ كُتبت قائمة الملفات في SERVER_FILES.md`);
console.log(`  ${files.length} ملفاً · ${dirs.length} مجلداً\n`);
