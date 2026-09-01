/**
 * ادعاء جماعي على مجموعة غير مُختبَرة بالكامل.
 *
 * «نملك ونستخدم الأربعة كلها» على صفحة اثنان من منتجاتها `tested: false` ادعاءُ
 * استخدام كاذب. وقاعدة ادعاء التجربة لا تمسكه: لا فعل اختبار فيه — الكذب في
 * **العدد** لا في الفعل. فهذه قاعدة تقارن الكمّ بالبيانات لا بالكلمات.
 *
 * الاختبارات: node scripts/test-claim-rule.mjs
 */

/** كمّ يشمل المجموعة كلها. */
const ALL = '(?:alla|båda|samtliga|två|tre|fyra|fem|sex|\\d+)';

/** فعل استخدام بضمير المتكلّم. */
const USE = '(?:använder|använt|testat|testade|kör)';

const COLLECTIVE = new RegExp(
  `\\b${ALL}\\b(?!\\s+av\\b)[^.!?]{0,45}?\\b${USE}\\b|\\b${USE}\\b[^.!?]{0,25}?\\b${ALL}\\b(?!\\s+av\\b)`,
  'i',
);

/**
 * @param {string} text نصّ الصفحة، ويشمل العنوان.
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
