/**
 * Preview mode.
 *
 * `published: false` means "not built, not seen" — right for the site, but it
 * made drafts impossible to review anywhere but in git.
 *
 * With ELDEBOSH_PREVIEW=1, drafts are built too — into a separate folder
 * (.preview-site), so the published build is never touched. Only
 * scripts/make-preview.mjs sets it, and the publish script refuses to run
 * with it.
 */
export const PREVIEW = process.env.ELDEBOSH_PREVIEW === '1';
