/**
 * Review mode for the owner, until launch. Approved in EB-015 and EB-017.
 *
 * The site is not announced yet, and the owner reviews on the live site as a
 * visitor. Two switches make that possible:
 *
 *   SHOW_REVIEW_CODES        the product code (P-01) beside the brand, and the
 *                            photo code (P-01-2) under each of our photos, so he
 *                            can name exactly what he sees.
 *   SHOW_WRITTEN_FOR_REVIEW  a page at stage `written` shows its text under a
 *                            "waiting for review" banner, instead of the
 *                            skeleton. It stays noindex and out of the sitemap,
 *                            and it carries the disclosure like any page that
 *                            sells.
 *
 * Temporary: set both to false before launch, together with SHOW_BUILD_STAMP
 * (docs/project/TASKS.md, L3). The preview build shows written text anyway.
 */
import { PREVIEW } from './preview';

export const SHOW_REVIEW_CODES = true;
export const SHOW_WRITTEN_FOR_REVIEW = true;

/** "/uploads/P-01-3-v2.webp" → "P-01-3"; null for a file without a code. */
export function photoCode(src: string): string | null {
  const m = src.match(/\/(P-\d+-\d+)(?=[-.])/);
  return m ? m[1] : null;
}

/** A skeleton: the page says it is not written yet and sells nothing. */
export function isNotWritten(stage: string | undefined): boolean {
  if (stage === 'draft' || stage === undefined) return true;
  return stage === 'written' && !(PREVIEW || SHOW_WRITTEN_FOR_REVIEW);
}

/** Text shown before the owner has approved it: bannered and noindex. */
export function isAwaitingReview(stage: string | undefined): boolean {
  return stage === 'written' && !isNotWritten(stage);
}
