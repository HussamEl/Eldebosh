/**
 * Review codes: the product code (P-01) beside the brand, and the photo code
 * (P-01-2) under each of our photos, so the owner can name exactly what he
 * sees on the live site. Approved in EB-015.
 *
 * Temporary: set SHOW_REVIEW_CODES to false before launch, together with
 * SHOW_BUILD_STAMP (docs/project/TASKS.md, L3).
 */
export const SHOW_REVIEW_CODES = true;

/** "/uploads/P-01-3-v2.webp" → "P-01-3"; null for a file without a code. */
export function photoCode(src: string): string | null {
  const m = src.match(/\/(P-\d+-\d+)(?=[-.])/);
  return m ? m[1] : null;
}
