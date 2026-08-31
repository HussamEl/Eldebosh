/**
 * حارس إصدارات الوثائق الحاكمة.
 *
 * الوثائق الثلاث تعيش في مكانين: `docs/project/` في المستودع، وخانتَي الإعدادات
 * عند `Claude Project`. النسخة الثانية تُزامَن يدوياً، ولا شيء يصرخ عند افتراقها.
 * وهذه حرفياً بنية العطب نفسها التي كلّفتنا يوماً كاملاً: طرف يكتب في مكان،
 * وطرف يقرأ من مكان آخر.
 *
 * الحارس يفعل شيئين:
 *   ١. يطبع الإصدارات الثلاثة ليعلنها `Claude Code` ويطابقها `Claude Project`.
 *   ٢. يفشل إن عُدّلت وثيقة دون رفع رقمها — فالرقم يبقى صادقاً بالإكراه.
 *
 *   node scripts/check-docs.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = ['INSTRUCTIONS.md', 'CONTEXT.md', 'BRIEFING.md']
  .map((f) => `docs/project/${f}`);

// > **الإصدار:** `v1.1` · 2026-08-29 · …
const STAMP = /^>\s*\*\*الإصدار:\*\*\s*`(v[\d.]+)`\s*·\s*(\d{4}-\d{2}-\d{2})/m;

const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;   // خارج مستودع، أو الملف جديد
  }
};

const problems = [];
const versions = [];

for (const rel of DOCS) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { problems.push(`${rel} — الملف مفقود`); continue; }

  const text = readFileSync(abs, 'utf8');
  const stamp = text.match(STAMP);
  if (!stamp) {
    problems.push(`${rel} — لا سطر إصدار في أعلى الملف\n    المطلوب: > **الإصدار:** \`v1.1\` · YYYY-MM-DD · …`);
    continue;
  }
  const [, version, date] = stamp;
  versions.push({ rel, version, date });

  // عُدّل المحتوى ولم يتغيّر الرقم؟
  const committed = git(['show', `HEAD:${rel}`]);
  if (committed === null) continue;
  if (committed === text) continue;

  const old = committed.match(STAMP);
  if (old && old[1] === version) {
    problems.push(`${rel} — عُدّلت وبقي الإصدار \`${version}\`\n    ارفع الرقم وحدّث التاريخ، وإلا قرأ الطرف الآخر نسخة يظنها هي نفسها`);
  }
}

// السجل يتغيّر مع كل رسالة، فلا يخضع لقاعدة رفع الإصدار — لكن رقمه الأخير
// هو ما يحتاجه كل طرف ليعرف من أين يبدأ.
const logPath = join(ROOT, 'docs/project/LOG.md');
let lastEntry = null;
if (existsSync(logPath)) {
  const rows = readFileSync(logPath, 'utf8').match(/^\|\s*(EB-\d{3})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm);
  if (rows && rows.length) {
    const [, id, who, when] = rows[rows.length - 1].match(/^\|\s*(EB-\d{3})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    lastEntry = { id, who, when };
  }
}

console.log('\nإصدارات الوثائق الحاكمة:\n');
for (const v of versions) {
  console.log(`  ${v.version.padEnd(6)} ${v.date}   ${v.rel}`);
}

if (problems.length) {
  console.error('\n✗ ' + problems.join('\n✗ ') + '\n');
  process.exit(1);
}
// الساعة التي تُكتب في السجل هي ساعة حسام في كارلستاد، لا ساعة الخادم.
// الخادم يعمل بالـUTC، فطُبعت مرة ساعةٌ متأخرة ساعتين عمّا يراه — وهو ما أربكه.
const now = new Date();
const karlstad = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm', dateStyle: 'short', timeStyle: 'short',
}).format(now).replace(' ', ' ');

if (!lastEntry) {
  const karlstadNow = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', dateStyle: 'short', timeStyle: 'short',
  }).format(new Date());
  console.log(`\nالسجل فارغ — العدّاد مُصفَّر.`);
  console.log(`الرسالة التالية:      EB-001 · ${karlstadNow} (كارلستاد)`);
}

if (lastEntry) {
  console.log(`\nآخر رسالة في السجل: ${lastEntry.id} · ${lastEntry.who} · ${lastEntry.when}`);
  console.log(`الرسالة التالية:      EB-${String(Number(lastEntry.id.slice(3)) + 1).padStart(3, '0')} · ${karlstad} (كارلستاد)`);
}

console.log('\n✓ الأرقام حاضرة ومتّسقة — أعلنها في أول كل محادثة\n');
