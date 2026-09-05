/**
 * فحص بصري/منطقي آلي لكل صفحات الموقع.
 *
 * يكشف ما لا يظهر في فحص البنية:
 *  - قيود عرض ثابتة تكسر النص بلا داعٍ
 *  - أنماط مضمّنة متسربة
 *  - نصوص بديلة ناقصة على الصور
 *  - عناوين مكررة أو مفقودة
 *  - روابط أفلييت بلا rel صحيح
 *  - صور بلا أبعاد (تسبب قفز التخطيط)
 *
 *   npm run audit
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'site');

function pages(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === 'pagefind' || e === '_astro' || e === 'admin') continue;
      pages(p, out);
    } else if (e === 'index.html') out.push(p);
  }
  return out;
}

const problems = [];
const note = (page, msg) => problems.push(`${page.replace(DIST, '')}: ${msg}`);

// صفحة الجذر مجرد إعادة توجيه، ولوحة التحرير ليست صفحة عامة.
// وكل صفحة إعادة توجيه مثلها: `meta refresh` بلا عنوان ولا وصف، وليست
// محتوى يُدقَّق. أُضيف بعد أن غيّر مقال مساره فولّد صفحة كهذه.
const isRedirect = (file) =>
  /<meta[^>]+http-equiv=["']?refresh/i.test(readFileSync(file, 'utf8'));

const list = pages(DIST)
  .filter((f) => f !== join(DIST, 'index.html'))
  .filter((f) => !isRedirect(f));

// خريطة المسارات المولّدة فعلاً — لفحص الروابط الداخلية
const generated = new Set(
  pages(DIST).map((f) => f.replace(DIST, '').replace(/index\.html$/, ''))
);
generated.add('/');
console.log(`\n${'─'.repeat(52)}\nفحص ${list.length} صفحة\n${'─'.repeat(52)}`);

for (const file of list) {
  const short = file;
  const html = readFileSync(file, 'utf8');
  const d = new JSDOM(html).window.document;

  // 1. قيود عرض ثابتة بوحدة ch — تكسر النص بلا داعٍ
  for (const el of d.querySelectorAll('[style*="ch"]')) {
    if (/max-width\s*:\s*\d+ch/.test(el.getAttribute('style') || '')) {
      note(short, `قيد عرض ثابت (${el.tagName.toLowerCase()}) — يجب أن يكون مسؤولاً`);
    }
  }

  // 2. أنماط مضمّنة تخص التخطيط
  for (const el of d.querySelectorAll('[style]')) {
    const st = el.getAttribute('style') || '';
    if (/(padding|margin|font-size|max-width)/.test(st) && !st.includes('--fill')) {
      note(short, `نمط تخطيط مضمّن على <${el.tagName.toLowerCase()}>: ${st.slice(0, 42)}`);
    }
  }

  // 3. الصور: نص بديل وأبعاد
  for (const img of d.querySelectorAll('img')) {
    // alt="" مقبول فقط مع aria-hidden — صورة زخرفية ضمن وحدة بصرية
    const decorative = img.getAttribute('aria-hidden') === 'true' && img.getAttribute('alt') === '';
    if (!img.getAttribute('alt') && !decorative) {
      note(short, `صورة بلا alt: ${img.getAttribute('src')}`);
    }
    if (!img.getAttribute('width') || !img.getAttribute('height')) {
      note(short, `صورة بلا أبعاد (تسبب قفز التخطيط): ${img.getAttribute('src')}`);
    }
  }

  // 4. عنوان واحد فقط من المستوى الأول
  const h1s = d.querySelectorAll('h1');
  if (h1s.length !== 1) note(short, `عدد h1 = ${h1s.length} (المطلوب 1)`);

  // 5. روابط الأفلييت
  for (const a of d.querySelectorAll('a[data-affiliate]')) {
    const rel = a.getAttribute('rel') || '';
    if (!rel.includes('sponsored') || !rel.includes('nofollow') || !rel.includes('noopener')) {
      note(short, `رابط أفلييت بـrel ناقص: ${rel || '(فارغ)'}`);
    }
    if (!(a.getAttribute('href') || '').includes('tag=')) {
      note(short, 'رابط أفلييت بلا وسم تتبع');
    }
  }

  // 6. الميتا
  if (!d.querySelector('link[rel="canonical"]')) note(short, 'لا يوجد canonical');
  const desc = d.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  if (desc.length < 50 || desc.length > 165) note(short, `طول description = ${desc.length}`);

  // 7. روابط داخلية تقود إلى صفحات غير موجودة
  for (const a of d.querySelectorAll('a[href^="/"]')) {
    const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
    if (!href || href.startsWith('//')) continue;
    if (/\.(css|js|png|jpg|jpeg|webp|svg|xml|txt|ico|woff2?)$/i.test(href)) continue;
    const norm = href.endsWith('/') ? href : href + '/';
    if (!generated.has(norm) && !generated.has(href)) {
      note(short, `رابط داخلي مكسور: ${href}`);
    }
  }

  // 8. ملف تنسيق واحد فقط لكل صفحة
  const sheets = [...d.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => l.getAttribute('href') || '')
    .filter((h) => h.includes('_astro'));
  if (sheets.length > 1) note(short, `أكثر من ملف تنسيق: ${sheets.length}`);

  // 9. أزرار بلا اسم مقروء
  for (const b of d.querySelectorAll('button')) {
    const label = (b.textContent || '').trim() || b.getAttribute('aria-label');
    if (!label) note(short, 'زر بلا اسم مقروء');
  }

  // 10. أصل بمسار ثابت وبلا بصمة — `I-025`
  //
  // `.htaccess` يخزّن كل `.js` و`.css` سنةً كاملة. وهذا صحيح لملفات `_astro/*`
  // لأن البصمة في اسمها، وكارثيّ لمسار ثابت: الزائر يستلم صفحةً جديدة وسكربتاً
  // قديماً — ظهرت أزرار التصفية ولم تعمل، ولم يكن في البوابة ما يراه.
  //
  // فالقاعدة: كل أصل مخدوم من `public/` يحمل بصمته في الرابط.
  const assets = [
    ...[...d.querySelectorAll('script[src]')].map((el) => el.getAttribute('src') || ''),
    ...[...d.querySelectorAll('link[rel="stylesheet"]')].map((el) => el.getAttribute('href') || ''),
  ];
  for (const src of assets) {
    if (!src.startsWith('/') || src.startsWith('//')) continue;
    // `_astro/*` اسمها مبصوم. و`pagefind/*` يولّدها `Pagefind` نفسه في `site/`
    // فلا سبيل إلى بصمها من هنا، ومحتواها لا يتغيّر إلا بترقية الاعتمادية.
    if (src.startsWith('/_astro/') || src.startsWith('/pagefind/')) continue;
    if (!/[?&]v=[0-9a-f]{6,}/.test(src)) {
      note(short, `أصل بمسار ثابت بلا بصمة (يبقى في المتصفح سنة): ${src}`);
    }
  }
}

console.log(problems.length ? '' : '✓ لا توجد ملاحظات\n');
const seen = new Map();
for (const p of problems) {
  const key = p.split(':').slice(1).join(':').slice(0, 60);
  seen.set(key, (seen.get(key) || 0) + 1);
}
for (const [msg, n] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  • ${msg.trim()}${n > 1 ? `  ×${n}` : ''}`);
}
if (problems.length) console.log(`\nالمجموع: ${problems.length} ملاحظة\n`);
process.exit(problems.length ? 1 : 0);
