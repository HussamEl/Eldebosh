// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, writeFileSync, statSync, copyFileSync, createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeTile, isTile } from './scripts/lib/tile.mjs';

/* Pages published as skeletons (stage draft or written) are reachable but
   carry noindex, so they are kept out of the sitemap: a sitemap that invites
   a crawler to a page that forbids indexing contradicts itself. The sitemap
   integration cannot see content, so the frontmatter is read here directly. */
const notWrittenSlugs = new Set();
(function scan(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) scan(f);
    else if (/\.mdx?$/.test(e)) {
      const fm = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      if (!fm || !/^stage:\s*(?:draft|written)\s*$/m.test(fm[1])) continue;
      const slug = fm[1].match(/^slug:\s*"?([a-z0-9-]+)"?\s*$/m);
      if (slug) notWrittenSlugs.add(slug[1]);
    }
  }
})('./src/content');

/* The admin panel's CMS is shipped with the site from node_modules instead of
   being loaded from a public CDN at runtime: the panel keeps working if the CDN
   is down, the version is pinned in one place (package.json), and
   scripts/test-admin.mjs tests the exact file that is served.
   The filename must stay `sveltia-cms.js` — the CMS starts itself only when its
   <script src> ends with that name. */
const CMS_FILE = fileURLToPath(new URL('./node_modules/@sveltia/cms/dist/sveltia-cms.js', import.meta.url));
const adminCms = {
  name: 'eldebosh-admin-cms',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/admin/sveltia-cms.js', (_req, res) => {
        res.setHeader('content-type', 'text/javascript');
        createReadStream(CMS_FILE).pipe(res);
      });
    },
    'astro:build:done': ({ dir }) => {
      copyFileSync(CMS_FILE, fileURLToPath(new URL('admin/sveltia-cms.js', dir)));
    },
  },
};

/* Every product photo is served as a 720×720 tile in the site's house style
   (scripts/lib/tile.mjs). Photos already composed are left alone; any other
   upload — typically one added in the admin panel — is composed in the build
   output. The source file in public/uploads is never modified. */
const productTiles = {
  name: 'eldebosh-product-tiles',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const uploads = fileURLToPath(new URL('uploads/', dir));
      if (!existsSync(uploads)) return;
      for (const name of readdirSync(uploads)) {
        const ext = name.split('.').pop().toLowerCase();
        if (!['webp', 'jpg', 'jpeg', 'png'].includes(ext)) continue;
        const file = join(uploads, name);
        if (await isTile(file)) continue;
        writeFileSync(file, await composeTile(readFileSync(file), ext === 'jpg' ? 'jpeg' : ext));
        logger.info(`composed product tile: uploads/${name}`);
      }
    },
  },
};

export default defineConfig({
  site: 'https://eldebosh.com',
  output: 'static',
  // The preview build (scripts/make-preview.mjs) includes drafts, so it goes
  // to its own folder and can never overwrite the build that gets published.
  outDir: process.env.ELDEBOSH_PREVIEW === '1' ? './.preview-site' : './site',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en'],
    routing: { prefixDefaultLocale: true },
  },
  redirects: {
    '/': '/sv/',
    // An article changed topic and therefore its path; keep the old URL working.
    '/sv/blog/darfor-laddar-mobilen-samre-pa-vintern/': '/sv/blog/powerbank-i-kyla/',
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'sv', locales: { sv: 'sv-SE', en: 'en' } },
      filter: (page) => ![...notWrittenSlugs].some((s) => page.endsWith(`/${s}/`)),
    }),
    adminCms,
    productTiles,
  ],
  build: { format: 'directory' },
  compressHTML: true,
});
