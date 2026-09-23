/**
 * Integrity of src/styles/global.css.
 *
 * Automated text edits can corrupt a stylesheet without breaking the build:
 * a lost brace swallows the rules after it, a stray selector line applies to
 * nothing. This catches unbalanced braces, selectors without a block,
 * duplicated rules, classes nothing uses, and var(--x) on an undefined token
 * (which silently inherits a colour instead of failing).
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

/* 1. balanced braces */
const open = (body.match(/{/g) || []).length;
const close = (body.match(/}/g) || []).length;
if (open !== close) problems.push(`unbalanced braces: ${open} open · ${close} close`);

/* 2. a selector line with no block — the mark of a corrupted edit */
for (const line of body.split('\n')) {
  const t = line.trim();
  if (!t || /[{};:,%]/.test(t)) continue;
  if (/^(@|}|--|from|to)/.test(t)) continue;
  problems.push(`selector without a block: ${t}`);
}

/* 3. the same top-level rule twice */
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
for (const [r, n] of seen) if (n > 1) problems.push(`duplicated rule ×${n}: ${r.slice(0, 60)}`);

/* 4. classes defined but used nowhere */
const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
/* public/js counts too: the UI script adds classes at runtime */
const src = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'public/js'))]
  .filter((f) => /\.(astro|ts|mdx?|js)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const classes = [...new Set([...raw.matchAll(/\.([a-z][a-z0-9-]{2,})/g)].map((m) => m[1]))];
const unused = classes.filter((c) => !src.includes(c));
for (const c of unused) problems.push(`unused class: .${c}`);

/* 5. var() on an undefined token — it fails silently by inheriting */
{
  // Some tokens are set from templates (style={`--i:${i}`}), so every source
  // file counts as a definition, not only the stylesheet.
  const sources = [raw];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const f = join(dir, e);
      if (statSync(f).isDirectory()) walk(f);
      else if (/\.(astro|ts|js|mjs|css)$/.test(e)) sources.push(readFileSync(f, 'utf8'));
    }
  };
  walk(join(ROOT, 'src'));
  walk(join(ROOT, 'public'));
  const defined = new Set(
    sources.flatMap((t) => [...t.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])),
  );
  const missing = new Map();
  for (const m of body.matchAll(/var\(\s*(--[\w-]+)\s*(,|\))/g)) {
    // a var() with a fallback is intentional
    if (m[2] === ',') continue;
    if (!defined.has(m[1])) missing.set(m[1], (missing.get(m[1]) || 0) + 1);
  }
  for (const [name, n] of missing) {
    problems.push(`undefined token: var(${name})${n > 1 ? ` ×${n}` : ''}`);
  }
}

console.log(`\n${'-'.repeat(40)}\nStylesheet · ${rules.length} rules · ${classes.length} classes\n${'-'.repeat(40)}`);
if (!problems.length) {
  console.log('✓ Stylesheet is sound\n');
  process.exit(0);
}
for (const p of problems) console.log('  • ' + p);
console.log(`\n✗ ${problems.length} problem(s)\n`);
process.exit(1);
