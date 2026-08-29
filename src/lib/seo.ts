import type { Lang } from '../i18n/ui';

const SITE = 'https://eldebosh.com';

export function abs(path: string) {
  return new URL(path, SITE).href;
}

export function hreflangs(paths: Partial<Record<Lang, string>>) {
  const out = Object.entries(paths).map(([lang, path]) => ({ lang, href: abs(path!) }));
  const sv = paths.sv ?? paths.en;
  if (sv) out.push({ lang: 'x-default', href: abs(sv) });
  return out;
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}

export function articleSchema(o: { title: string; description: string; updated: Date; url: string; lang: Lang }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: o.title,
    description: o.description,
    dateModified: o.updated.toISOString(),
    inLanguage: o.lang === 'sv' ? 'sv-SE' : 'en',
    mainEntityOfPage: abs(o.url),
    publisher: { '@type': 'Organization', name: 'Eldebosh', url: SITE },
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}
