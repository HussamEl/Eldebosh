/**
 * The filter buttons above the product grid on the home page.
 *
 * These are display groups, not data categories: "Laddare" (chargers) covers
 * both `snabbladdare` and `billaddning`, because a visitor looking for a
 * charger does not distinguish them, and one button per single product is
 * clutter. Products in no group appear under "Alla" (all) only — deliberately
 * no catch-all button.
 *
 * Labels live in src/i18n/ui.ts as `filter.group.<id>`.
 */

export const GEAR_GROUPS = [
  { id: 'kablar', subcategories: ['kablar'] },
  { id: 'laddare', subcategories: ['snabbladdare', 'billaddning'] },
  { id: 'powerbanks', subcategories: ['powerbanks'] },
] as const;

export type GearGroupId = (typeof GEAR_GROUPS)[number]['id'];

/** The product's filter group, or null if it has no button. */
export function gearGroup(product: { subcategory?: string }): GearGroupId | null {
  const sub = product.subcategory;
  if (!sub) return null;
  const hit = GEAR_GROUPS.find((g) => (g.subcategories as readonly string[]).includes(sub));
  return hit ? hit.id : null;
}

/** Groups that contain at least one product, with their counts. */
export function gearGroupCounts(products: readonly { subcategory?: string }[]) {
  return GEAR_GROUPS.map((g) => ({
    id: g.id,
    count: products.filter((p) => gearGroup(p) === g.id).length,
  })).filter((g) => g.count > 0);
}
