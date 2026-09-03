// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* الصفحات المعلَنة كهياكل تُبنى وتُزار، لكنها `noindex` — فلا مكان لها في
   `sitemap`. خريطة موقع تدعو محرّك البحث إلى صفحة تمنعه من فهرستها تناقض.
   تُقرأ من الواجهة الأمامية مباشرة لأن الـ`sitemap` لا يرى المحتوى. */
const notWrittenSlugs = new Set();
(function scan(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) scan(f);
    else if (/\.mdx?$/.test(e)) {
      const fm = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      if (!fm || !/^stage:\s*draft\s*$/m.test(fm[1])) continue;
      const slug = fm[1].match(/^slug:\s*"?([a-z0-9-]+)"?\s*$/m);
      if (slug) notWrittenSlugs.add(slug[1]);
    }
  }
})('./src/content');

// ملاحظة: عدّل site إلى الدومين النهائي قبل النشر.
export default defineConfig({
  site: 'https://eldebosh.com',
  output: 'static',
  // Byggresultatet heter site/ och versionshanteras — det är artefakten
  // som laddas upp manuellt så länge FTP-deployen är trasig.
  // المعاينة تبني إلى مجلّد آخر كي لا تلمس النسخة المنشورة أبداً
  outDir: process.env.ELDEBOSH_PREVIEW === '1' ? './.preview-site' : './site',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en'],
    routing: { prefixDefaultLocale: true },
  },
  redirects: {
    '/': '/sv/',
    // المقال غيّر موضوعه فغيّر مساره. لم يكن مفهرساً ولا يقصده رابط خارجي،
    // لكن سطراً واحداً أرخص من رابط مكسور إن كان أحدنا نسخ المسار في مكان.
    '/sv/blog/darfor-laddar-mobilen-samre-pa-vintern/': '/sv/blog/powerbank-i-kyla/',
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'sv', locales: { sv: 'sv-SE', en: 'en' } },
      filter: (page) => ![...notWrittenSlugs].some((s) => page.endsWith(`/${s}/`)),
    }),
  ],
  build: { format: 'directory' },
  compressHTML: true,
});
