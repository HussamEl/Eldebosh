/**
 * حارس المسودّات المنشورة.
 *
 * صفحة تحمل `published: true` ونصّها لا يزال مسودّة هي أسوأ من صفحة غائبة:
 * الزائر يصل إليها من التذييل، ويقرأ سياسة خصوصية تقول عن نفسها إنها ناقصة.
 * وهذا ليس خطأً تحريرياً فقط — الإفصاح التجاري وسياسة الخصوصية حجّتك أمام
 * القانون السويدي، وإفصاح موسوم بأنه غير مراجَع يضعف نفسه.
 *
 * كان يبلّغ ولا يُفشل، لأن إفشاله كان يمنع نشر المحتوى الذي يصلحه. **وفي
 * 2026-09-04 وصلت النصوص الأربعة، فقُلب إلى فاشل.** لا صفحة منشورة تحمل نصّ
 * مسودّة اليوم، وأي عودة إلى ذلك تُسقط البناء بدل أن تمرّ صامتة عشرة أسابيع
 * كما مرّت (`I-021`).
 *
 *   node scripts/check-drafts.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES = join(ROOT, 'src/content/pages');

/** صار `true` في 2026-09-04 بعد كتابة النصوص الأربعة. */
const FATAL = true;

const DRAFT = /UTKAST|Fylls i\.|\bTBD\b|لم يُكتب بعد/;

function mdx(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) mdx(p, out);
    else if (e.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const flagged = [];

for (const file of mdx(PAGES)) {
  const text = readFileSync(file, 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) continue;
  const [, front, body] = fm;
  if (!/^published:\s*true\s*$/m.test(front)) continue;
  // الهيكل المعلَن لا يعرض متنه أصلاً — القالب يستبدله بصفحة تقول إنه لم
  // يُكتب. المقصود هنا صفحة تدّعي أنها تامّة ونصّها مسوّدة.
  if (/^stage:\s*draft\s*$/m.test(front)) continue;

  const hits = body.split('\n').filter((l) => DRAFT.test(l));
  if (!hits.length) continue;

  // عدد الكلمات الفعلية، بلا أسطر المسودّة نفسها
  const words = body
    .split('\n')
    .filter((l) => !DRAFT.test(l))
    .join(' ')
    .replace(/[#>*_`\[\]()|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  flagged.push({ rel: file.replace(ROOT, ''), words, marker: hits[0].trim().slice(0, 64) });
}

if (!flagged.length) {
  console.log('\n✓ لا صفحة منشورة تحمل نص مسودّة\n');
  process.exit(0);
}

console.log('\n⚠ صفحات منشورة ونصّها مسودّة — يراها الزائر اليوم:\n');
for (const f of flagged) {
  console.log(`  ${f.rel}`);
  console.log(`    كلمات فعلية: ${f.words}   ·   ${f.marker}`);
}
console.log(
  `\n  المجموع: ${flagged.length}. ` +
    (FATAL
      ? 'البناء يفشل.\n'
      : 'الحارس يبلّغ ولا يُفشل — اقلب FATAL إلى true يوم تصل النصوص.\n'),
);

process.exit(FATAL ? 1 : 0);
