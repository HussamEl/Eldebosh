/**
 * مجموعات شريط التصفية في الصفحة الرئيسية.
 *
 * ليست فئات البيانات ولا الفئات الفرعية: زر «Laddare» يجمع `snabbladdare`
 * و`billaddning` لأن الزائر الذي يبحث عن شاحن لا يفرّق بينهما، وفي كلٍّ منهما
 * منتج واحد — زران بمنتج واحد لكلٍّ عبثٌ بصري. القرار `D-030`.
 *
 * وما لا مجموعة له يظهر تحت «الكل» وحدها. لا زرّ رابع — كثرة الخيارات تشتّت.
 */

export const GEAR_GROUPS = [
  { id: 'kablar', subcategories: ['kablar'] },
  { id: 'laddare', subcategories: ['snabbladdare', 'billaddning'] },
  { id: 'powerbanks', subcategories: ['powerbanks'] },
] as const;

export type GearGroupId = (typeof GEAR_GROUPS)[number]['id'];

/** مجموعة المنتج في الشريط، أو `null` إن لم يكن له زرّ. */
export function gearGroup(product: { subcategory?: string }): GearGroupId | null {
  const sub = product.subcategory;
  if (!sub) return null;
  const hit = GEAR_GROUPS.find((g) => (g.subcategories as readonly string[]).includes(sub));
  return hit ? hit.id : null;
}

/** المجموعات التي فيها منتج فعلاً، بعددها — لا رقم يُكتب بيد. */
export function gearGroupCounts(products: readonly { subcategory?: string }[]) {
  return GEAR_GROUPS.map((g) => ({
    id: g.id,
    count: products.filter((p) => gearGroup(p) === g.id).length,
  })).filter((g) => g.count > 0);
}
