// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
  },
  integrations: [mdx(), sitemap({ i18n: { defaultLocale: 'sv', locales: { sv: 'sv-SE', en: 'en' } } })],
  build: { format: 'directory' },
  compressHTML: true,
});
