/**
 * A claim of use over a group that is not entirely tested.
 *
 * "We own and use all four" on a page where two of the four products have
 * tested: false is a false claim of use. The experience-claim rule does not
 * catch it: there is no test verb, the lie is in the count. So this rule
 * compares the quantity in the sentence with the data.
 *
 * Test cases: npm run test:claims
 */

/** A quantifier covering the whole group. */
const ALL = '(?:alla|båda|samtliga|två|tre|fyra|fem|sex|\\d+)';

/** A first-person verb of use. */
const USE = '(?:använder|använt|testat|testade|kör)';

const COLLECTIVE = new RegExp(
  `\\b${ALL}\\b(?!\\s+av\\b)[^.!?]{0,45}?\\b${USE}\\b|\\b${USE}\\b[^.!?]{0,25}?\\b${ALL}\\b(?!\\s+av\\b)`,
  'i',
);

/**
 * @param {string} text the page text, including its title
 * @param {{total: number, tested: number}} counts
 * @returns {{text: string, total: number, tested: number} | null}
 */
export function findOverclaimedCount(text, { total, tested }) {
  if (total === 0 || tested >= total) return null;

  for (const raw of text.split(/(?<=[.!?])\s+|\n+/)) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const m = sentence.match(COLLECTIVE);
    if (m) return { text: m[0].slice(0, 60), total, tested };
  }
  return null;
}
