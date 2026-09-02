/**
 * حالات اختبار قاعدة ادعاء التجربة.
 *
 * الجمل الأربع الأولى كتبها `Claude Project` — وهو من يكتب النصوص التي تحكم
 * عليها القاعدة، فحالاته هي المرجع لا اقتراح. البقية من نص الموقع المنشور.
 *
 *   node scripts/test-claim-rule.mjs
 */
import { findUnbackedClaim, findOwnedOnlyUseClaim, findBannedPhrase } from './lib/claim-rule.mjs';
import { findOverclaimedCount } from '../src/lib/overclaim.mjs';

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

/* ---- العبارة الممنوعة: تُمنع إلا في نفيها ---- */
const banned = [
  ['fail', 'Den här powerbanken är bäst i test.'],
  ['fail', 'Bäst i test av specifikationer'],
  ['pass', 'Vi skriver aldrig "bäst i test".'],
  ['pass', 'Vi använder inte uttrycket bäst i test.'],
  ['pass', 'Vi jämför specifikationer och anger källa.'],
];

/* ---- سلسلة «مملوك غير مُختبَر» لا تدّعي استخدامه ---- */
const ownedOnly = [
  ['fail', 'Vi äger och använder den här produkten.'],
  ['fail', 'We own and use this product.'],
  ['pass', 'Vi äger den här produkten men har ännu inte använt den tillräckligt för att skriva om erfarenheten.'],
  ['pass', 'We own this product but have not yet used it enough to write about the experience.'],
  ['pass', 'Vi äger inte den här produkten. Bedömningen bygger på dokumenterade källor.'],
];

/* ---- الادعاء الجماعي: الكذب في العدد لا في الفعل ---- */
const counted = [
  // أربعة منتجات، اثنان مُختبَران
  ['fail', 'Vi äger och använder alla fyra modellerna nedan.', { total: 4, tested: 2 }],
  ['fail', 'Bästa powerbanken — fyra modeller vi använder själva', { total: 4, tested: 2 }],
  ['fail', 'Vi kör alla tre dagligen.', { total: 3, tested: 1 }],
  // الصياغة الصادقة: ملكية للكل، استخدام لبعضهم
  ['pass', 'Vi äger alla fyra modellerna nedan.', { total: 4, tested: 2 }],
  ['pass', 'Två av dem har vi använt tillräckligt länge för att skriva om erfarenheten.', { total: 4, tested: 2 }],
  ['pass', 'Vi äger alla tre modellerna nedan. Två av dem har vi använt länge.', { total: 3, tested: 2 }],
  // المجموعة مُختبَرة بالكامل — الادعاء صادق
  ['pass', 'Vi äger och använder alla fyra modellerna nedan.', { total: 4, tested: 4 }],
];

let failed = 0;
for (const [want, sentence] of banned) {
  const hit = findBannedPhrase(sentence);
  const got = hit ? 'fail' : 'pass';
  const ok = got === want;
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} [${want.padEnd(4)}] ${sentence.slice(0, 68)}${hit ? `  ← "${hit}"` : ''}`);
}

for (const [want, sentence] of ownedOnly) {
  const hit = findOwnedOnlyUseClaim(sentence);
  const got = hit ? 'fail' : 'pass';
  const ok = got === want;
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} [${want.padEnd(4)}] ${sentence.slice(0, 68)}${hit ? `  ← "${hit}"` : ''}`);
}

for (const [want, sentence, counts] of counted) {
  const hit = findOverclaimedCount(sentence, counts);
  const got = hit ? 'fail' : 'pass';
  const ok = got === want;
  if (!ok) failed++;
  console.log(
    `  ${ok ? '✓' : '✗'} [${want.padEnd(4)}] ${sentence.slice(0, 62)}` +
      `  (${counts.tested}/${counts.total})${hit ? `  ← "${hit.text}"` : ''}`,
  );
}

for (const [want, sentence] of cases) {
  const hit = findUnbackedClaim(sentence);
  const got = hit ? 'fail' : 'pass';
  const ok = got === want;
  if (!ok) failed++;
  const mark = ok ? '✓' : '✗';
  const why = hit ? `  ← ${hit.kind}: "${hit.text}"` : '';
  console.log(`  ${mark} [${want.padEnd(4)}] ${sentence.slice(0, 72)}${why}`);
}

const total = cases.length + counted.length + ownedOnly.length + banned.length;
console.log(
  failed
    ? `\n✗ ${failed} من ${total} حالة لم تتصرّف كما يجب\n`
    : `\n✓ ${total}/${total} حالة\n`,
);
process.exit(failed ? 1 : 0);
