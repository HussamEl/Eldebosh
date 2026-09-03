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

/** الطابع المرئي في الرأس — مؤقّت مثل مصدره. يتغيّر مع كل بناء بالضبط كبصمة
 *  الـ`meta`، فلولا تقنيعه لصار كل ملف HTML منحرفاً وسقطت البوابة.
 *  يُحذف مع `src/lib/build-stamp.ts` ولا يُحذف قبله. */
const VISIBLE_STAMP = /(<span class="build-stamp"[^>]*>)[^<]*(<\/span>)/g;

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
  return text.replace(STAMP, '<meta name="eldebosh-build" content="">').replace(VISIBLE_STAMP, '$1$2');
};

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const changed = git(['diff', '--name-only', 'HEAD', '--', 'site'])
  .split('\n').filter(Boolean);

if (!changed.length) {
  console.log('site/ är i synk med källan.');
  process.exit(0);
}

/* Pagefinds kompilerade index är inte vår utdata — det är verktygets.
 * Filnamnen hashas ur innehållet av en plattformsspecifik binär, så samma
 * källa ger olika namn på den här maskinen och på GitHubs runner. Att jämföra
 * dem byte för byte är att jämföra verktyget, inte sajten. Allt annat under
 * site/ jämförs som förut — inklusive varje HTML-sida, som är det drift-
 * vakten finns för.
 * Uteslutningen betalas med en existenskontroll längre ner: index och meta
 * måste finnas, annars är sökningen trasig och det ska stoppa bygget. */
const isPagefindIndex = (f) =>
  /^site\/pagefind\/(index|fragment)\//.test(f) ||
  /\.pf_meta$/.test(f) ||
  f === 'site/pagefind/pagefind-entry.json';

const drifted = [];
let stampOnly = 0;
let skippedIndex = 0;

for (const file of changed) {
  if (isPagefindIndex(file)) { skippedIndex++; continue; }
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
if (skippedIndex) console.log(`${skippedIndex} fil(er) i Pagefinds index hoppas över — verktygets utdata, inte vår.`);

/* Priset för uteslutningen: indexet måste faktiskt finnas. */
for (const [dir, ext] of [['site/pagefind/index', '.pf_index'], ['site/pagefind', '.pf_meta']]) {
  const found = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(ext));
  if (!found) {
    console.error(`\n✗ Pagefind saknar ${ext} under ${dir}/ — sökningen är trasig.`);
    process.exit(1);
  }
}

if (drifted.length) {
  console.error(`\nsite/ skiljer sig från ett rent bygge i ${drifted.length} fil(er):`);
  for (const f of drifted.slice(0, 20)) console.error('  ' + f);
  console.error('\nKör `npm run build` och committa resultatet.');
  process.exit(1);
}
console.log('Ingen drift: bygget motsvarar det incheckade site/.');
