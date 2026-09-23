/**
 * Build affiliate links from data.
 * No link is written by hand: an editor enters the ASIN and the link is built
 * here. That rules out a link without our tag, and makes changing the tag a
 * one-line edit.
 */

export const AMAZON = {
  tag: 'electro066-21',      // Amazon Associates tag — appears in every link; not a secret
  domain: 'www.amazon.se',
  market: 'SE',
} as const;

/** Amazon product link from an ASIN. */
export function amazonUrl(asin: string): string {
  return `https://${AMAZON.domain}/dp/${encodeURIComponent(asin)}?tag=${AMAZON.tag}&linkCode=ll1&language=sv_SE`;
}

/** Amazon search link — only when there is no ASIN. */
export function amazonSearchUrl(query: string): string {
  return `https://${AMAZON.domain}/s?k=${encodeURIComponent(query)}&tag=${AMAZON.tag}`;
}

export function isAmazonAsin(asin: string): boolean {
  return /^[A-Z0-9]{10}$/.test(asin);
}
