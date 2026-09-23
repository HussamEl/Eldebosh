/**
 * Publish the contents of site/ at the root of the `deploy` branch.
 *
 * Why a separate branch: the host pulls with git and wants the site at the
 * root of the checkout, while `main` holds the source.
 *
 * Why never force-push: the host runs `git pull`, which fails on a rewritten
 * history. Every publish is therefore a child commit of the previous one.
 *
 * The working tree and index are untouched: the tree is built in a temporary
 * index file. If the built site is identical to what is already published,
 * nothing is committed — builds are reproducible (see src/lib/build-stamp.ts),
 * so docs-only pushes do not produce empty deploys.
 *
 * In CI this runs after the verify job. Run by hand, it first runs the full
 * gate itself, so a manual publish can never bypass the checks.
 *
 *   node scripts/publish-deploy-branch.mjs [--remote origin] [--branch deploy]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The preview build includes unpublished drafts; it must never be deployed.
if (process.env.ELDEBOSH_PREVIEW === '1') {
  console.error('✗ ELDEBOSH_PREVIEW is set — preview builds are never published.');
  process.exit(1);
}

if (!process.env.GITHUB_ACTIONS) {
  const r = spawnSync(npm, ['run', 'verify'], { cwd: ROOT, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('\n✗ npm run verify failed — nothing published.\n');
    process.exit(1);
  }
}

if (!existsSync(join(ROOT, 'site', 'index.html')) || !existsSync(join(ROOT, 'site', '.htaccess'))) {
  console.error('✗ site/ is missing or incomplete (index.html or .htaccess) — nothing published.');
  process.exit(1);
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const REMOTE = arg('remote', 'origin');
const BRANCH = arg('branch', 'deploy');

const git = (args, env = {}) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env } }).trim();

const head = git(['rev-parse', '--short', 'HEAD']);

const indexFile = join(mkdtempSync(join(tmpdir(), 'deploy-index-')), 'index');
const env = { GIT_INDEX_FILE: indexFile };

git(['--work-tree=site', 'add', '-A', '.'], env);
const tree = git(['write-tree'], env);

let parent = null;
try {
  git(['fetch', '-q', REMOTE, BRANCH]);
  parent = git(['rev-parse', 'FETCH_HEAD']);
} catch {
  console.log(`Branch ${BRANCH} does not exist on ${REMOTE} yet — it will be created.`);
}

if (parent && git(['rev-parse', `${parent}^{tree}`]) === tree) {
  console.log('\nThe built site is identical to what is published — nothing to do.\n');
  process.exit(0);
}

const message = `Deploy site built from ${head}\n\nContents of site/ at the repository root, for a host that pulls.`;
const args = ['commit-tree', tree, '-m', message];
if (parent) args.push('-p', parent);
const commit = git(args, env);

git(['push', REMOTE, `${commit}:refs/heads/${BRANCH}`]);

console.log(`\n✓ Published ${commit.slice(0, 7)} to ${REMOTE}/${BRANCH} — built from ${head}\n`);
