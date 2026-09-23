/**
 * Detect claims of experience that nothing backs.
 *
 * The site rests on telling three states apart: tested, owned but not
 * evaluated, and never handled. A sentence claiming a test that did not happen
 * breaks that. But a rule that also punished a denial ("we have never tested
 * this model") would punish the most honest thing a page can say.
 *
 * Three mechanisms, in order:
 *   1. Implied comparison: "nobody has tested it as long as we have" claims a
 *      test for us without stating one. The negation falls on others, so
 *      nothing exempts it.
 *   2. Explicit claim.
 *   3. Denial exemption — deliberately narrow: a denial exempts only within its
 *      own clause. "We did not measure the capacity, but we tested the charging
 *      time" is a claim, not a denial.
 *
 * Test cases: npm run test:claims (scripts/test-claim-rule.mjs)
 */

/** A sentence that explicitly claims a test. */
const CLAIM =
  /\b(vi har (?:\w+ )?testat|vi testat|vi provade|vårt test av|i vårt test|efter (?:att ha )?testat|we tested|our test(?:s|ing)? of|hands[- ]on test)\b/i;

/** An implied claim: a test verb followed by a comparison that points at us. */
const COMPARATIVE = /\btest(?:at|ade|ar)?\b[^.!?]*\b(?:som|än)\s+vi\b|\b(?:than|as)\s+we\s+(?:have\s+)?tested\b/i;

/** Negation words. */
const DENIAL = /\b(aldrig|inte|ingen|ingenting|inget|inga|utan att|never|not|nothing|without)\b/i;

/**
 * Clause breaks, which end a negation's reach: commas, dashes and contrast
 * words. What follows "but" is a new clause; a negation before it does not
 * carry over.
 */
const BREAK = /[,;:—–]|\b(men|utan att|but|however)\b/gi;

/** The sentence ending at `index`, without the sentences before it. */
function sentenceAt(text, index) {
  const start = Math.max(
    text.lastIndexOf('.', index - 1),
    text.lastIndexOf('!', index - 1),
    text.lastIndexOf('?', index - 1),
    text.lastIndexOf('\n', index - 1),
  );
  return { start: start + 1, text: text.slice(start + 1) };
}

/** Does a negation actually govern this match? */
function isDenied(sentence, matchStart, matchText) {
  // Negation inside the match itself: "never tested this model".
  if (DENIAL.test(matchText)) return true;

  // A negation governs its own clause, before or after the verb. Clause breaks
  // are the boundary: "we tested it, but not in the cold" is a qualified claim.
  const before = sentence.slice(0, matchStart);
  let cut = 0;
  BREAK.lastIndex = 0;
  for (let m; (m = BREAK.exec(before)); ) cut = m.index + m[0].length;
  if (DENIAL.test(before.slice(cut))) return true;

  const after = sentence.slice(matchStart + matchText.length);
  BREAK.lastIndex = 0;
  const stop = BREAK.exec(after);
  return DENIAL.test(after.slice(0, stop ? stop.index : undefined));
}

/**
 * @returns {{kind: 'comparative'|'claim', text: string} | null}
 */
export function findUnbackedClaim(body) {
  for (const raw of body.split(/(?<=[.!?])\s+|\n+/)) {
    const sentence = raw.trim();
    if (!sentence) continue;

    const comp = sentence.match(COMPARATIVE);
    if (comp) return { kind: 'comparative', text: comp[0].slice(0, 60) };

    const m = sentence.match(CLAIM);
    if (!m) continue;
    if (isDenied(sentence, m.index, m[0])) continue;
    return { kind: 'claim', text: m[0] };
  }
  return null;
}

/**
 * The interface strings shown under an untested product must not claim use.
 * They are displayed only when tested is false, so any claim of use in them
 * is false wherever it appears.
 */
const USE = /\b(använder|använt|använda|use|uses|used|using)\b/i;

export function findOwnedOnlyUseClaim(text) {
  for (const raw of text.split(/(?<=[.!?])\s+/)) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const m = sentence.match(USE);
    if (!m) continue;
    if (isDenied(sentence, m.index, m[0])) continue;
    return m[0];
  }
  return null;
}

/**
 * "Bäst i test" is banned — except where we state that we never write it.
 * The method page promises readers exactly that; a rule that forbade naming
 * the phrase even in that promise would forbid the transparency itself.
 */
const BANNED = /\bb[äa]st i test\b/i;

export function findBannedPhrase(text) {
  for (const raw of text.split(/(?<=[.!?])\s+|\n+/)) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const m = sentence.match(BANNED);
    if (!m) continue;
    if (isDenied(sentence, m.index, m[0])) continue;
    return m[0];
  }
  return null;
}

export const _internals = { CLAIM, COMPARATIVE, DENIAL, sentenceAt };
