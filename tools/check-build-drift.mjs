/**
 * Har site/ glidit ifrån källan?
 *
 * Kör efter `npm run build`: jämför varje ändrad fil under site/ mot den
 * incheckade versionen. Byggstämpeln (<meta name="eldebosh-build">) byter värde
 * varje minut med flit — den ska skilja ett färskt bygge från ett gammalt — så
 * den normaliseras bort före jämförelsen. Allt annat som skiljer är drift.
 *
 *   node tools/check-build-drift.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const STAMP = /<meta name="eldebosh-build" content="[^"]*">/g;

/** Pagefind serialiserar sin entry-JSON i hash-ordning — samma data, olika
 *  nyckelordning mellan körningar. Kanonisera i stället för att flagga det. */
const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
    : v;

const norm = (text, file) => {
  if (file.endsWith('.json')) {
    try { return JSON.stringify(sortKeys(JSON.parse(text))); } catch { /* faller igenom */ }
  }
  return text.replace(STAMP, '<meta name="eldebosh-build" content="">');
};

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const changed = git(['diff', '--name-only', 'HEAD', '--', 'site'])
  .split('\n').filter(Boolean);

if (!changed.length) {
  console.log('site/ är i synk med källan.');
  process.exit(0);
}

const drifted = [];
let stampOnly = 0;

for (const file of changed) {
  let committed = '';
  try {
    committed = git(['show', `HEAD:${file}`]);
  } catch {
    drifted.push(`${file} (ny fil)`);
    continue;
  }
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === null) { drifted.push(`${file} (borttagen)`); continue; }
  if (norm(current, file) === norm(committed, file)) stampOnly++;
  else drifted.push(file);
}

if (stampOnly) console.log(`${stampOnly} fil(er) skiljer sig bara i byggstämpel eller nyckelordning — ok.`);

if (drifted.length) {
  console.error(`\nsite/ skiljer sig från ett rent bygge i ${drifted.length} fil(er):`);
  for (const f of drifted.slice(0, 20)) console.error('  ' + f);
  console.error('\nKör `npm run build` och committa resultatet.');
  process.exit(1);
}
console.log('Ingen drift: bygget motsvarar det incheckade site/.');
