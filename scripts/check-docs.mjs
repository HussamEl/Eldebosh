/**
 * The collaboration documents stay consistent.
 *
 * The reviewer (Gemini) reads docs/project/INSTRUCTIONS.md from its raw GitHub
 * URL at the start of each conversation; the version number is how everyone
 * knows which rules are current.
 *
 *   1. Each versioned document has a version line at the top:
 *        > **Version:** `v1.0` · YYYY-MM-DD · …
 *   2. A document changed since the last commit must have a raised version,
 *      or be reset to v1.0 with a new date (checked locally before
 *      committing; in CI the tree equals HEAD).
 *   3. The message log (docs/project/LOG.md) numbers run EB-001, EB-002, …
 *      without gaps; prints the next number and the time in Karlstad.
 *
 *   npm run check:docs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/repo.mjs';
import { now } from '../src/lib/clock.mjs';

const VERSIONED = ['docs/project/INSTRUCTIONS.md'];
const STAMP = /^>\s*\*\*Version:\*\*\s*`(v\d+\.\d+)`\s*·\s*(\d{4}-\d{2}-\d{2})/m;
const LOG = 'docs/project/LOG.md';
const ROW = /^\|\s*EB-(\d{3})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;

const committed = (rel) => {
  try {
    return execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null; // new file, or not a git checkout
  }
};

const problems = [];
const raised = [];

console.log(`\n${'─'.repeat(52)}\nCollaboration documents\n${'─'.repeat(52)}`);

for (const rel of VERSIONED) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) { problems.push(`${rel}: missing`); continue; }
  const text = readFileSync(file, 'utf8');
  const stamp = text.match(STAMP);
  if (!stamp) {
    problems.push(`${rel}: no version line — expected  > **Version:** \`v1.0\` · YYYY-MM-DD · …`);
    continue;
  }
  const [, version, date] = stamp;
  console.log(`  ${version.padEnd(6)} ${date}   ${rel}`);

  const before = committed(rel);
  if (before === null || before === text) continue;
  const [, old, oldDate] = before.match(STAMP) ?? [];
  // A fresh start is v1.0 with a new date; anything else must raise the number.
  const reset = version === 'v1.0' && date !== oldDate;
  if (old === version && !reset) problems.push(`${rel}: changed but still ${version} — raise the version and the date`);
  else if (old) raised.push({ rel, old: `${old} ${oldDate}`, version: `${version} ${date}` });
}

for (const r of raised) console.log(`\n  ⚠ ${r.rel}: ${r.old} → ${r.version} — name the new version in the reply`);

/* ---------- message counter ---------- */
let last = null;
if (existsSync(join(ROOT, LOG))) {
  const rows = [...readFileSync(join(ROOT, LOG), 'utf8').matchAll(ROW)];
  rows.forEach((m, i) => {
    const n = Number(m[1]);
    if (n !== i + 1) problems.push(`${LOG}: row ${i + 1} is EB-${m[1]} — numbers run from EB-001 without gaps`);
  });
  if (rows.length) last = { id: `EB-${rows.at(-1)[1]}`, who: rows.at(-1)[2], when: rows.at(-1)[3], n: rows.length };
} else {
  problems.push(`${LOG}: missing`);
}

const next = `EB-${String((last?.n ?? 0) + 1).padStart(3, '0')}`;
console.log(`\n  last message:  ${last ? `${last.id} · ${last.who} · ${last.when}` : '(none)'}`);
console.log(`  next message:  ${next} · ${now()} (Karlstad)`);

if (problems.length) {
  console.log('');
  for (const p of problems) console.log(`  • ${p}`);
  console.log(`\n✗ ${problems.length} problem(s)\n`);
  process.exit(1);
}
console.log('\n✓ Documents are consistent\n');
