/**
 * Karlstad time.
 *
 * Servers and CI run in UTC; the owner reads Swedish time. Every generated
 * timestamp goes through here, so nothing prints server time.
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

/** `YYYY-MM-DD`, Karlstad time. */
export function today(date) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** `YYYY-MM-DD HH:MM`, Karlstad time. */
export function now(date) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
