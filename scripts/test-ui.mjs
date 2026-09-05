/**
 * اختبار سلوكي للجزيرة التفاعلية — يشغّل صفحة الموقع في DOM حقيقي.
 *
 * السبب: لا يوجد متصفح في بيئة كتابة الكود، وقد تعطّل التصفية مرتين
 * لأسباب لا تظهر إلا عند التشغيل الفعلي. هذا الاختبار يمنع تكرار ذلك.
 *
 *   npm run test:ui        (بعد npm run build)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGE = join(ROOT, 'site/sv/index.html');

if (!existsSync(PAGE)) {
  console.error('✗ لا يوجد ملف مبني. شغّل npm run build أولاً.');
  process.exit(1);
}

const html = readFileSync(PAGE, 'utf8')
  // السكربت خارجي ولا تجلبه بيئة الاختبار — يُحقن مضمّناً
  .replace(
    /<script src="\/js\/eldebosh-ui\.js(\?[^"]*)?"[^>]*><\/script>/,
    `<script>${readFileSync(join(ROOT, 'public/js/eldebosh-ui.js'), 'utf8')}</script>`
  );

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
await new Promise((r) => dom.window.addEventListener('load', r));

const d = dom.window.document;
const q = (s) => d.querySelector(s);
const shown = () => [...d.querySelectorAll('.tile')].filter((t) => !t.hidden).length;

const fails = [];
const check = (label, actual, expected) => {
  const ok = actual === expected;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual}${ok ? '' : ` (المتوقع ${expected})`}`);
  if (!ok) fails.push(label);
};

const bar = q('[data-gearbar]');
if (!bar) {
  console.log('\n  — لا توجد جزيرة تفاعلية على الصفحة. الموقع صفر JavaScript.\n');
  process.exit(0);
}

console.log('\nاختبار جزيرة التصفية');
console.log('─'.repeat(40));

check('الشريط يظهر بعد تشغيل السكربت', bar.hidden, false);

const total = shown();
check('كل المنتجات ظاهرة ابتداءً', total > 0, true);

// تصفية حسب المجموعة — زرّ لكل مجموعة، ثم العودة إلى الكل
const allBtn = q('[data-filter="all"]');
const catBtns = [...d.querySelectorAll('[data-filter]')].filter((b) => b.dataset.filter !== 'all');
check('الشريط يحمل أزرار مجموعات', catBtns.length > 0, true);

for (const catBtn of catBtns) {
  const key = catBtn.dataset.filter;
  const expected = [...d.querySelectorAll('.tile')].filter((t) => t.dataset.category === key).length;
  catBtn.click();
  check(`تصفية "${key}"`, shown(), expected);
  check(`"${key}" يتلوّن وحده`, [...d.querySelectorAll('.chip.is-on')].length, 1);
  check(`"${key}" هو الملوَّن`, catBtn.classList.contains('is-on'), true);
  allBtn.click();
  check('العودة إلى الكل', shown(), total);
}

check('زر "الكل" يتلوّن', allBtn.classList.contains('is-on'), true);

// الرقم المكتوب على كل زر يساوي ما يعرضه فعلاً
for (const catBtn of catBtns) {
  const key = catBtn.dataset.filter;
  const printed = Number((catBtn.querySelector('.chip-n')?.textContent ?? '').trim());
  const real = [...d.querySelectorAll('.tile')].filter((t) => t.dataset.category === key).length;
  check(`عدّاد الزر "${key}"`, printed, real);
}
check('عدّاد "الكل"', Number((allBtn.querySelector('.chip-n')?.textContent ?? '').trim()), total);

// البحث الفوري
const search = q('[data-gear-search]');
if (search) {
  const term = (d.querySelector('.tile')?.dataset.name ?? '').split(' ')[0];
  if (term) {
    const expected = [...d.querySelectorAll('.tile')].filter((t) => (t.dataset.name ?? '').includes(term)).length;
    search.value = term;
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check(`البحث عن "${term}"`, shown(), expected);
  }
}

// العدّاد
const counter = q('[data-gear-count]');
check('العدّاد يعرض رقماً', /\d/.test(counter?.textContent ?? ''), true);

// ---------- عارض الصور ----------
console.log('\nاختبار عارض الصور');
console.log('─'.repeat(40));

const viewers = [...d.querySelectorAll('.viewer')];
check('العوارض خرجت من البطاقات', viewers.every((v) => v.parentElement === d.body), true);
check('كل عارض حوار قابل للوصول', viewers.every((v) => v.getAttribute('role') === 'dialog'), true);

const opener = q('a.tile-face[href^="#v-"]');
if (opener) {
  opener.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  const opened = d.querySelector('.viewer.is-open');
  check('النقر يفتح العارض', !!opened, true);
  check('تمرير الصفحة يتوقف', d.body.classList.contains('viewer-open'), true);
  check('الصفحة مثبّتة عند إزاحتها', /^-?\d+px$/.test(d.body.style.top || '0px'), true);

  d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check('Escape يغلق العارض', !d.querySelector('.viewer.is-open'), true);
  check('التمرير يعود', !d.body.classList.contains('viewer-open'), true);
  check('التثبيت يُرفع', d.body.style.top === '', true);
}

console.log('─'.repeat(40));
if (fails.length) {
  console.error(`✗ فشل ${fails.length} اختبار\n`);
  process.exit(1);
}
console.log('✓ الجزيرة التفاعلية تعمل\n');
