/**
 * قاعدة ادعاء التجربة — معزولة في وحدة لأن لها حالات اختبار.
 *
 * الموقع كله قائم على تمييز ثلاث حالات: جرّبناه، نملكه ولم نقيّمه، ولم نلمسه.
 * الجملة التي تدّعي تجربة لم تجرِ تهدم ذلك. لكن القاعدة التي تعاقب نفي الادعاء
 * تهدمه أيضاً — لأنها تعاقب أصدق ما يمكن أن يُكتب.
 *
 * ثلاث آليات، مرتّبة:
 *   ١. المقارنة الضمنية: «لم يختبرها أحد غيرنا بهذا الطول» تدّعي علينا بلا
 *      فعل مثبت. النفي فيها يقع على الغير، فلا يعفيها شيء.
 *   ٢. الادعاء الصريح.
 *   ٣. إعفاء النفي — وهو ضيّق عمداً: النفي يعفي فقط إن كان في الجزء نفسه من
 *      الجملة. «لم نقس القدرة، لكننا اختبرنا زمن الشحن» ادعاء، لا نفي.
 *
 * الاختبارات: node scripts/test-claim-rule.mjs
 */

/** جملة تدّعي تجربةً صراحةً. */
const CLAIM =
  /\b(vi har (?:\w+ )?testat|vi testat|vi provade|vårt test av|i vårt test|efter (?:att ha )?testat|we tested|our test(?:s|ing)? of|hands[- ]on test)\b/i;

/** مقارنة تدّعي التجربة ضمناً: فعل اختبار + ذيل مقارنة يعود إلينا. */
const COMPARATIVE = /\btest(?:at|ade|ат)?\b[^.!?]*\b(?:som|än)\s+vi\b|\b(?:than|as)\s+we\s+(?:have\s+)?tested\b/i;

/** أدوات النفي. */
const DENIAL = /\b(aldrig|inte|ingen|ingenting|inget|inga|utan att|never|not|nothing|without)\b/i;

/**
 * فواصل تقطع سلطة النفي: الفاصلة والشرطة، وأدوات الاستدراك.
 * ما بعد «لكن» جملة جديدة، ونفيُ ما قبلها لا يمتدّ إليها.
 */
const BREAK = /[,;:—–]|\b(men|utan att|but|however)\b/gi;

/** الجملة الأخيرة المنتهية عند `index`، بلا الجمل التي قبلها. */
function sentenceAt(text, index) {
  const start = Math.max(
    text.lastIndexOf('.', index - 1),
    text.lastIndexOf('!', index - 1),
    text.lastIndexOf('?', index - 1),
    text.lastIndexOf('\n', index - 1),
  );
  return { start: start + 1, text: text.slice(start + 1) };
}

/** هل يحكم نفيٌ هذا الادعاء فعلاً؟ */
function isDenied(sentence, matchStart, matchText) {
  // النفي داخل الادعاء نفسه: «لم نختبر هذا الطراز أبداً»
  if (DENIAL.test(matchText)) return true;

  // النفي يحكم جزءه من الجملة، قبل الفعل أو بعده. الفواصل هي الحدّ:
  // «اختبرناها، لكن ليس في البرد» ادعاءٌ مقيَّد، لا نفي.
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
 * السلسلتان المعروضتان تحت منتج غير مُختبَر لا يجوز أن تدّعيا استخدامه.
 *
 * حُذف ادعاء الاستخدام من بيانات المنتجين غير المُختبَرين، وبقي يُرسَم من ملف
 * الترجمة — أي من المكان الذي يراه الزائر فعلاً. هذه القاعدة تربط السلسلة
 * بشرط عرضها: مفتاحٌ لا يظهر إلا عند `tested: false` لا يقول «نستخدمها».
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
 * عبارة «Bäst i test» — ممنوعة بالمادة 6.2، إلا حين ننفي أننا نكتبها.
 *
 * صفحة المنهج تعِد القارئ بأننا **لا** نكتبها أبداً. قاعدةٌ تمنع ذكرها حتى في
 * الوعد بتركها تمنع الشفافية نفسها. النفي هنا يُعفي كما يُعفي في الادعاء.
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
