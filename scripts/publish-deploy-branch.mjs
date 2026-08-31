/**
 * ينشر محتويات `site/` في جذر فرع `deploy`.
 *
 * لماذا فرع منفصل: الاستضافة تسحب من Git، وهي تريد الموقع في جذر المجلد لا
 * داخل `site/`. وفرع `main` يحمل المصدر كله، فلا يصلح للسحب المباشر.
 *
 * لماذا لا force-push: الاستضافة تسحب (`git pull`)، والدفع القسري يجعل السحب
 * غير قابل للتقديم فيفشل. لذلك كل نشر commit ابن لسابقه — تاريخ خطّي دائماً.
 *
 * لا يلمس شجرة العمل: يبني الفهرس في ملف مؤقت.
 *
 *   node scripts/publish-deploy-branch.mjs [--remote origin] [--branch deploy]
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const REMOTE = arg('remote', 'origin');
const BRANCH = arg('branch', 'deploy');

const git = (args, env = {}) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env } }).trim();

const head = git(['rev-parse', '--short', 'HEAD']);

// فهرس منفصل حتى لا يُلمس ما هو مُجهَّز للـcommit في شجرة العمل
const indexFile = join(mkdtempSync(join(tmpdir(), 'deploy-index-')), 'index');
const env = { GIT_INDEX_FILE: indexFile };

git(['--work-tree=site', 'add', '-A', '.'], env);
const tree = git(['write-tree'], env);

let parent = null;
try {
  git(['fetch', '-q', REMOTE, BRANCH]);
  parent = git(['rev-parse', 'FETCH_HEAD']);
} catch {
  console.log(`الفرع ${BRANCH} غير موجود على ${REMOTE} — سيُنشأ.`);
}

if (parent) {
  const parentTree = git(['rev-parse', `${parent}^{tree}`]);
  if (parentTree === tree) {
    console.log(`\nلا تغيير في الموقع منذ آخر نشر — لا commit جديد.\n`);
    process.exit(0);
  }
}

const message = `Deploy site built from ${head}\n\nContents of site/ at the repository root, for a host that pulls.`;
const args = ['commit-tree', tree, '-m', message];
if (parent) args.push('-p', parent);
const commit = git(args, env);

git(['push', REMOTE, `${commit}:refs/heads/${BRANCH}`]);

console.log(`\n✓ نُشر ${commit.slice(0, 7)} على ${REMOTE}/${BRANCH} — من بناء ${head}\n`);
