/**
 * Test cases for the experience-claim rules (scripts/lib/claim-rule.mjs,
 * src/lib/overclaim.mjs).
 *
 * The first cases were written by the content writer, whose texts the rule
 * judges; the rest come from published pages. Each case is a sentence and the
 * expected verdict: `fail` must be caught, `pass` must be allowed.
 *
 *   npm run test:claims
 */
import { findUnbackedClaim, findOwnedOnlyUseClaim, findBannedPhrase } from './lib/claim-rule.mjs';
import { findOverclaimedCount } from '../src/lib/overclaim.mjs';

const cases = [
  // ---- must be caught: a claim of experience with nothing behind it ----
  ['fail', 'Vi påstår aldrig något vi inte kan belägga, men den här powerbanken har vi testat i tre veckor.'],
  ['fail', 'Vi har inte mätt effekten, men vi har testat laddtiden med tidtagarur.'],
  ['fail', 'Ingen annan sajt har testat den lika länge som vi.'],
  ['fail', 'Vi har testat den i tre veckor.'],
  ['fail', 'I vårt test av tre powerbanks vann den här.'],
  ['fail', 'We tested it for a month.'],
  // present tense in an implied comparison
  ['fail', 'Ingen testar laddare så noggrant som vi.'],

  // ---- must pass: a denial is not a claim ----
  ['pass', 'Vi har aldrig testat den här modellen.'],
  ['pass', 'Vi påstår aldrig att vi har testat en produkt vi inte har använt.'],
  ['pass', 'Vi har inte mätt effekt, laddtider eller verkligt uttag med instrument.'],
  ['pass', 'Vi hittar inte på testresultat eller egna mätvärden.'],
  ['pass', 'Sidan bygger på dokumenterade specifikationer från tillverkaren.'],
  // a statement, then a denial after "men": must pass, or the rule is too strict
  ['pass', 'Vi äger och använder modellerna nedan, men vi har inte använt dem genom en hel svensk vinter i sträng kyla.'],
  ['pass', 'Det som står ovan är hur litiumbatterier fungerar, inte ett resultat vi har mätt.'],

  // ---- a denial does not reach into the next sentence ----
  ['fail', 'Vi mäter inte med instrument. Vi har testat den i kyla.'],
  ['pass', 'Vi har testat ingenting än. Allt bygger på källor.'],
];

/* ---- the banned phrase: caught, except when denied ---- */
const banned = [
  ['fail', 'Den här powerbanken är bäst i test.'],
  ['fail', 'Bäst i test av specifikationer'],
  ['pass', 'Vi skriver aldrig "bäst i test".'],
  ['pass', 'Vi använder inte uttrycket bäst i test.'],
  ['pass', 'Vi jämför specifikationer och anger källa.'],
];

/* ---- the "owned, not tested" strings claim no use ---- */
const ownedOnly = [
  ['fail', 'Vi äger och använder den här produkten.'],
  ['fail', 'We own and use this product.'],
  ['pass', 'Vi äger den här produkten men har ännu inte använt den tillräckligt för att skriva om erfarenheten.'],
  ['pass', 'We own this product but have not yet used it enough to write about the experience.'],
  ['pass', 'Vi äger inte den här produkten. Bedömningen bygger på dokumenterade källor.'],
];

/* ---- group claims: the lie is in the count, not the verb ---- */
const counted = [
  // four products, two tested
  ['fail', 'Vi äger och använder alla fyra modellerna nedan.', { total: 4, tested: 2 }],
  ['fail', 'Bästa powerbanken — fyra modeller vi använder själva', { total: 4, tested: 2 }],
  ['fail', 'Vi kör alla tre dagligen.', { total: 3, tested: 1 }],
  // the honest wording: ownership of all, use of some
  ['pass', 'Vi äger alla fyra modellerna nedan.', { total: 4, tested: 2 }],
  ['pass', 'Två av dem har vi använt tillräckligt länge för att skriva om erfarenheten.', { total: 4, tested: 2 }],
  ['pass', 'Vi äger alla tre modellerna nedan. Två av dem har vi använt länge.', { total: 3, tested: 2 }],
  // the whole group is tested — the claim is true
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
    ? `\n✗ ${failed} of ${total} cases did not behave as expected\n`
    : `\n✓ ${total}/${total} cases\n`,
);
process.exit(failed ? 1 : 0);
