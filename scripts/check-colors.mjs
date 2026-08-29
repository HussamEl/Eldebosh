/**
 * الألوان المكتوبة يدوياً خارج نظام التصميم.
 *
 * `src/styles/global.css` هو مصدر الحقيقة للألوان، لكن بعض الملفات لا يمر عليها
 * أي فحص: لوحة التحرير صفحة HTML مكتوبة يدوياً، وأصول الهوية ملفات SVG مولّدة.
 * هذا هو بالضبط ما جعل ألوان اللوحة تبقى على الباليتة القديمة (#1e4d8f, #c4f04e)
 * بينما بدا CSS المبني مطابقاً تماماً.
 *
 * الفاحص يقرأ رموز :root، يضيف إليها باليتة الهوية (تدرّجات الشعار ليست رموزاً
 * في CSS)، ثم يرفض أي لون خارج الاثنين في الملفات المكتوبة يدوياً.
 *
 *   node scripts/check-colors.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- 1. رموز نظام التصميم ---------- */
const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const tokens = new Map();
for (const [, name, value] of rootBlock.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)) {
  tokens.set(value.toLowerCase(), name);
}

// ألوان مكتوبة حرفياً داخل global.css (لا رموزاً) — ما زالت داخل النظام،
// فالورقة نفسها هي مصدر الحقيقة. الرموز أفضل، لكن الحرفي ليس انحرافاً.
const literals = new Set(
  [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()));

// الباليتة المتقاعدة: مرفوضة في أي ملف، بما فيها global.css نفسها.
const RETIRED = new Map([
  ['#c4f04e', 'الليموني القديم'], ['#b6e63f', 'الليموني عند التمرير'],
  ['#1e4d8f', 'الكحلي القديم'], ['#2563eb', 'الأزرق القديم'],
  ['#2a63ab', 'هيرو قديم'], ['#2f6fbd', 'هيرو قديم'], ['#4a86cc', 'شريط هيرو قديم'],
  ['#eff5fe', 'brand-soft قديم'], ['#dbe9fb', 'brand-tint قديم'],
  ['#dce2e9', 'line قديم'], ['#c5cedb', 'line-2 قديم'],
  ['#f4f6f8', 'mist قديم'], ['#e8edf2', 'mist-2 قديم'],
]);

/* ---------- 2. باليتة الهوية ----------
   تدرّجات البricka وأسطحها ليست رموزاً في CSS — مصدرها brand/src/build_logo.py.
   تُقرأ من هناك حتى لا تنفصل القائمتان. */
const logoSrc = readFileSync(join(ROOT, 'brand/src/build_logo.py'), 'utf8');
const brand = new Set();
for (const [, value] of logoSrc.matchAll(/#([0-9A-Fa-f]{6})/g)) brand.add('#' + value.toLowerCase());
// الأبيض والشفاف مسموحان دائماً
for (const v of ['#fff', '#ffffff', '#000', '#000000']) brand.add(v);

const allowed = new Set([...tokens.keys(), ...literals, ...brand]);

/* ---------- 3. الملفات المكتوبة يدوياً ---------- */
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (['uploads', 'fonts', 'pagefind'].includes(entry)) continue;
      walk(p, out);
    } else if (/\.(html|svg|yml|yaml)$/.test(entry)) out.push(p);
  }
  return out;
};
const files = [...walk(join(ROOT, 'public')), join(ROOT, 'src/styles/global.css')];

/* ---------- 4. الفحص ---------- */
const nearest = (hex) => {
  const rgb = (h) => {
    const v = h.length === 4 ? h.slice(1).split('').map((c) => c + c).join('') : h.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const [r, g, b] = rgb(hex);
  let best = null, bestD = Infinity;
  for (const [value, name] of tokens) {
    const [r2, g2, b2] = rgb(value);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = `${name} (${value})`; }
  }
  return best;
};

const offences = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const seen = new Set();
  for (const [, hex] of text.matchAll(/(#[0-9a-fA-F]{3,8})\b/g)) {
    const value = hex.toLowerCase();
    // ألوان بقناة شفافية (#RRGGBBAA) تُقاس بجذعها
    const base = value.length === 9 ? value.slice(0, 7) : value;
    if (seen.has(value)) continue;
    seen.add(value);
    if (RETIRED.has(base)) {
      offences.push({ file: relative(ROOT, file), value,
                      hint: `لون متقاعد (${RETIRED.get(base)}) — الباليتة تغيّرت، هذا بقايا` });
      continue;
    }
    if (allowed.has(value) || allowed.has(base)) continue;
    offences.push({ file: relative(ROOT, file), value, hint: `ليس رمزاً في :root ولا حرفياً في global.css ولا في باليتة الهوية — الأقرب: ${nearest(base)}` });
  }
}

console.log(`\nفحص الألوان: ${files.length} ملفاً · ${tokens.size} رمزاً في :root · ${literals.size} لوناً في global.css\n`);

if (!offences.length) {
  console.log('✓ لا لون خارج نظام التصميم\n');
  process.exit(0);
}

for (const o of offences) {
  console.error(`✗ ${o.file}\n    ${o.value} — ${o.hint}`);
}
console.error(`\n${offences.length} لوناً خارج النظام. استخدم رمزاً من :root أو أضفه هناك أولاً.\n`);
process.exit(1);
