/**
 * فحص سلامة ملف الأنماط.
 *
 * أُضيف بعد أن أفسد الاستبدال النصي القواعد مرتين — انظر الدرس 6.4.
 * يكشف: أقواساً غير متوازنة، ومحددات بلا كتلة، وقواعد مكررة، وأنماطاً غير مستخدمة.
 *
 *   npm run check:css
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const raw = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
const body = raw.replace(/\/\*[\s\S]*?\*\//g, '');

const problems = [];

/* 1. توازن الأقواس */
const open = (body.match(/{/g) || []).length;
const close = (body.match(/}/g) || []).length;
if (open !== close) problems.push(`أقواس غير متوازنة: ${open} مفتوح · ${close} مغلق`);

/* 2. محدد بلا كتلة — أثر استبدال نصي فاسد */
for (const line of body.split('\n')) {
  const t = line.trim();
  if (!t || /[{};:,%]/.test(t)) continue;
  if (/^(@|}|--|from|to)/.test(t)) continue;
  problems.push(`محدد بلا كتلة: ${t}`);
}

/* 3. قواعد مكررة في المستوى الأعلى */
const stack = [];
const rules = [];
for (const m of body.matchAll(/([^{}]*)([{}])/g)) {
  if (m[2] === '{') stack.push(m[1].trim());
  else if (stack.length) {
    const s = stack.pop();
    if (!stack.length && !s.startsWith('@')) rules.push(s);
  }
}
const seen = new Map();
for (const r of rules) seen.set(r, (seen.get(r) ?? 0) + 1);
for (const [r, n] of seen) if (n > 1) problems.push(`قاعدة مكررة ×${n}: ${r.slice(0, 60)}`);

/* 4. أنماط معرَّفة ولا تُستخدم */
const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
/* يشمل public/js لأن السكربت المشترك يضيف أصنافاً برمجياً */
const src = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'public/js'))]
  .filter((f) => /\.(astro|ts|mdx?|js)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const classes = [...new Set([...raw.matchAll(/\.([a-z][a-z0-9-]{2,})/g)].map((m) => m[1]))];
const unused = classes.filter((c) => !src.includes(c));
for (const c of unused) problems.push(`نمط غير مستخدم: .${c}`);

console.log(`\n${'-'.repeat(40)}\nفحص الأنماط · ${rules.length} قاعدة · ${classes.length} صنف\n${'-'.repeat(40)}`);
if (!problems.length) {
  console.log('✓ ملف الأنماط سليم\n');
  process.exit(0);
}
for (const p of problems) console.log('  • ' + p);
console.log(`\n✗ ${problems.length} ملاحظة\n`);
process.exit(1);
