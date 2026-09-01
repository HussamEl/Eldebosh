/**
 * ساعة كارلستاد.
 *
 * الخوادم تعمل بـ`UTC`، وحسام يقرأ ساعته. طابع زمني بفارق ساعتين يجعل السجل
 * كذباً صغيراً متكرراً — وقد كلّفنا هذا تصحيحاً منه مرة. المولِّدات كلها
 * تمرّ من هنا، فلا يبقى مكان يطبع ساعة الخادم.
 */
const TZ = 'Europe/Stockholm';

function parts(date = new Date()) {
  const f = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
}

/** `YYYY-MM-DD` بتوقيت كارلستاد. */
export function today(date) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** `YYYY-MM-DD HH:MM` بتوقيت كارلستاد. */
export function now(date) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
