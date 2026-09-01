/**
 * حالات اختبار قاعدة ادعاء التجربة.
 *
 * الجمل الأربع الأولى كتبها `Claude Project` — وهو من يكتب النصوص التي تحكم
 * عليها القاعدة، فحالاته هي المرجع لا اقتراح. البقية من نص الموقع المنشور.
 *
 *   node scripts/test-claim-rule.mjs
 */
import { findUnbackedClaim } from './lib/claim-rule.mjs';

const cases = [
  // ---- يجب أن تفشل: ادعاء تجربة بلا سند ----
  ['fail', 'Vi påstår aldrig något vi inte kan belägga, men den här powerbanken har vi testat i tre veckor.'],
  ['fail', 'Vi har inte mätt effekten, men vi har testat laddtiden med tidtagarur.'],
  ['fail', 'Ingen annan sajt har testat den lika länge som vi.'],
  ['fail', 'Vi har testat den i tre veckor.'],
  ['fail', 'I vårt test av tre powerbanks vann den här.'],
  ['fail', 'We tested it for a month.'],

  // ---- يجب أن تمرّ: نفيٌ للادعاء، لا ادعاء ----
  ['pass', 'Vi har aldrig testat den här modellen.'],
  ['pass', 'Vi påstår aldrig att vi har testat en produkt vi inte har använt.'],
  ['pass', 'Vi har inte mätt effekt, laddtider eller verkligt uttag med instrument.'],
  ['pass', 'Vi hittar inte på testresultat eller egna mätvärden.'],
  ['pass', 'Sidan bygger på dokumenterade specifikationer från tillverkaren.'],
  // إثبات ثم نفي بعد «men» — يجب أن تمرّ، وإلا فالحارس مفرط
  ['pass', 'Vi äger och använder modellerna nedan, men vi har inte använt dem genom en hel svensk vinter i sträng kyla.'],
  ['pass', 'Det som står ovan är hur litiumbatterier fungerar, inte ett resultat vi har mätt.'],

  // ---- النفي لا يعبر حدّ الجملة ----
  ['fail', 'Vi mäter inte med instrument. Vi har testat den i kyla.'],
  ['pass', 'Vi har testat ingenting än. Allt bygger på källor.'],
];

let failed = 0;
for (const [want, sentence] of cases) {
  const hit = findUnbackedClaim(sentence);
  const got = hit ? 'fail' : 'pass';
  const ok = got === want;
  if (!ok) failed++;
  const mark = ok ? '✓' : '✗';
  const why = hit ? `  ← ${hit.kind}: "${hit.text}"` : '';
  console.log(`  ${mark} [${want.padEnd(4)}] ${sentence.slice(0, 72)}${why}`);
}

console.log(
  failed
    ? `\n✗ ${failed} من ${cases.length} حالة لم تتصرّف كما يجب\n`
    : `\n✓ ${cases.length}/${cases.length} حالة\n`,
);
process.exit(failed ? 1 : 0);
