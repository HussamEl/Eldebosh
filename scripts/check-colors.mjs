/**
 * No colour outside the design system.
 *
 * src/styles/global.css is the source of truth for colour, but files outside
 * the stylesheet — the admin page, SVG brand assets, inline styles in
 * components — pass through no CSS tooling, and can quietly keep a retired
 * colour while the built CSS looks correct.
 *
 * Allowed: the :root tokens, colours written literally in global.css, and the
 * logo palette (its gradients are not CSS tokens; they are read from
 * brand/src/build_logo.py so the two lists cannot drift). Retired colours are
 * refused everywhere, global.css included.
 *
 *   npm run check:colors
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- 1. design-system tokens ---------- */
const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const tokens = new Map();
for (const [, name, value] of rootBlock.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)) {
  tokens.set(value.toLowerCase(), name);
}

// Literal colours inside global.css are still inside the system: the sheet is
// the source of truth. Tokens are preferred, but a literal there is not drift.
const literals = new Set(
  [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()));

// The retired palette: refused in every file, global.css included.
const RETIRED = new Map([
  ['#c4f04e', 'old lime'], ['#b6e63f', 'old lime hover'],
  ['#1e4d8f', 'old navy'], ['#2563eb', 'old blue'],
  ['#2a63ab', 'old hero'], ['#2f6fbd', 'old hero'], ['#4a86cc', 'old hero bar'],
  ['#eff5fe', 'old brand-soft'], ['#dbe9fb', 'old brand-tint'],
  ['#dce2e9', 'old line'], ['#c5cedb', 'old line-2'],
  ['#f4f6f8', 'old mist'], ['#e8edf2', 'old mist-2'],
]);

/* ---------- 2. logo palette, read from its generator ---------- */
const logoSrc = readFileSync(join(ROOT, 'brand/src/build_logo.py'), 'utf8');
const brand = new Set();
for (const [, value] of logoSrc.matchAll(/#([0-9A-Fa-f]{6})/g)) brand.add('#' + value.toLowerCase());
// Black and white are always allowed.
for (const v of ['#fff', '#ffffff', '#000', '#000000']) brand.add(v);

const allowed = new Set([...tokens.keys(), ...literals, ...brand]);

/* ---------- 3. hand-written files ----------
   Everything in public/ (admin page, brand assets) and in src/ (components can
   carry style="…#hex", content can too, and .ts can build a colour string). */
const EXT = /\.(html|svg|yml|yaml|css|astro|mdx|ts|js|mjs)$/;
const SKIP_DIRS = ['uploads', 'fonts', 'pagefind', 'node_modules'];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (SKIP_DIRS.includes(entry)) continue;
      walk(p, out);
    } else if (EXT.test(entry)) out.push(p);
  }
  return out;
};
const files = [...walk(join(ROOT, 'public')), ...walk(join(ROOT, 'src'))];

/* ---------- 4. check ---------- */
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
    // #RRGGBBAA is judged by its colour part
    const base = value.length === 9 ? value.slice(0, 7) : value;
    if (seen.has(value)) continue;
    seen.add(value);
    if (RETIRED.has(base)) {
      offences.push({ file: relative(ROOT, file), value,
                      hint: `retired colour (${RETIRED.get(base)}) — left over from the old palette` });
      continue;
    }
    if (allowed.has(value) || allowed.has(base)) continue;
    offences.push({ file: relative(ROOT, file), value, hint: `not a :root token, not in global.css, not in the logo palette — nearest: ${nearest(base)}` });
  }
}

console.log(`\nColours: ${files.length} files (public + src) · ${tokens.size} :root tokens · ${literals.size} colours in global.css\n`);

if (!offences.length) {
  console.log('✓ No colour outside the design system\n');
  process.exit(0);
}

for (const o of offences) {
  console.error(`✗ ${o.file}\n    ${o.value} — ${o.hint}`);
}
console.error(`\n${offences.length} colour(s) outside the system. Use a :root token, or add one there first.\n`);
process.exit(1);
