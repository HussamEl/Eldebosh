/**
 * Behaviour test of the site's one interactive script, in a real DOM (jsdom).
 *
 * The product filter and the photo viewer have broken before in ways only
 * visible when the script runs: a script running before its elements existed,
 * and a `display: flex` rule beating the `hidden` attribute. This runs the
 * built home page with the real script and checks what a visitor would see.
 *
 *   npm run test:ui        (after npm run build)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGE = join(ROOT, 'site/sv/index.html');

if (!existsSync(PAGE)) {
  console.error('✗ No build found. Run npm run build first.');
  process.exit(1);
}

const html = readFileSync(PAGE, 'utf8')
  // jsdom does not fetch external scripts, so the real script is inlined
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
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
  if (!ok) fails.push(label);
};

const bar = q('[data-gearbar]');
if (!bar) {
  console.log('\n  — No interactive filter on the page: nothing to test.\n');
  process.exit(0);
}

console.log('\nProduct filter');
console.log('─'.repeat(40));

check('bar shows once the script runs', bar.hidden, false);

const total = shown();
check('all products visible at first', total > 0, true);

// each group button filters, then "all" restores
const allBtn = q('[data-filter="all"]');
const catBtns = [...d.querySelectorAll('[data-filter]')].filter((b) => b.dataset.filter !== 'all');
check('bar has group buttons', catBtns.length > 0, true);

for (const catBtn of catBtns) {
  const key = catBtn.dataset.filter;
  const expected = [...d.querySelectorAll('.tile')].filter((t) => t.dataset.category === key).length;
  catBtn.click();
  check(`filter "${key}"`, shown(), expected);
  check(`only "${key}" is highlighted`, [...d.querySelectorAll('.chip.is-on')].length, 1);
  check(`"${key}" is the highlighted one`, catBtn.classList.contains('is-on'), true);
  allBtn.click();
  check('back to all', shown(), total);
}

check('"all" is highlighted', allBtn.classList.contains('is-on'), true);

// the number printed on each button equals what it shows
for (const catBtn of catBtns) {
  const key = catBtn.dataset.filter;
  const printed = Number((catBtn.querySelector('.chip-n')?.textContent ?? '').trim());
  const real = [...d.querySelectorAll('.tile')].filter((t) => t.dataset.category === key).length;
  check(`count on "${key}"`, printed, real);
}
check('count on "all"', Number((allBtn.querySelector('.chip-n')?.textContent ?? '').trim()), total);

// live search (if present)
const search = q('[data-gear-search]');
if (search) {
  const term = (d.querySelector('.tile')?.dataset.name ?? '').split(' ')[0];
  if (term) {
    const expected = [...d.querySelectorAll('.tile')].filter((t) => (t.dataset.name ?? '').includes(term)).length;
    search.value = term;
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check(`search "${term}"`, shown(), expected);
  }
}

// result counter
const counter = q('[data-gear-count]');
check('counter shows a number', /\d/.test(counter?.textContent ?? ''), true);

// ---------- photo viewer ----------
console.log('\nPhoto viewer');
console.log('─'.repeat(40));

const viewers = [...d.querySelectorAll('.viewer')];
check('viewers moved out of the tiles', viewers.every((v) => v.parentElement === d.body), true);
check('every viewer is an accessible dialog', viewers.every((v) => v.getAttribute('role') === 'dialog'), true);

const opener = q('a.tile-face[href^="#v-"]');
if (opener) {
  opener.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  const opened = d.querySelector('.viewer.is-open');
  check('click opens the viewer', !!opened, true);
  check('page scroll is locked', d.body.classList.contains('viewer-open'), true);
  check('page is held at its offset', /^-?\d+px$/.test(d.body.style.top || '0px'), true);

  d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check('Escape closes the viewer', !d.querySelector('.viewer.is-open'), true);
  check('scroll is restored', !d.body.classList.contains('viewer-open'), true);
  check('offset is released', d.body.style.top === '', true);
}

console.log('─'.repeat(40));
if (fails.length) {
  console.error(`✗ ${fails.length} check(s) failed\n`);
  process.exit(1);
}
console.log('✓ The interactive script works\n');
