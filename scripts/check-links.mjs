/**
 * Every relative link in the Markdown documents leads to a file that exists.
 *
 * A document pointing at a deleted file is worse than a missing one: the
 * reader believes the answer exists and spends time looking for it.
 * External links and in-page anchors are not checked; site/ is build output.
 *
 *   npm run check:links
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
    if (!path) continue; // anchor on the same page
    if (/^(https?:|mailto:)/.test(path)) continue; // external
    if (!existsSync(normalize(join(dirname(file), path)))) broken.push([relative(ROOT, file), target]);
  }
}

console.log(`\nDocument links: ${files.length} documents\n`);
if (broken.length) {
  for (const [file, target] of broken) console.log(`  ✗ ${file} → ${target}`);
  console.log(`\n✗ ${broken.length} link(s) lead to a missing file\n`);
  process.exit(1);
}
console.log('✓ Every relative link leads to an existing file\n');
