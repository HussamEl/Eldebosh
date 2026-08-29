/**
 * توليد روابط الأفلييت من البيانات.
 * القاعدة: لا رابط مكتوب يدوياً. المحرر يدخل ASIN فقط، والنظام يبني الرابط.
 * هذا يمنع أخطاء نسيان الوسم، ويجعل تغيير الوسم تعديلاً في سطر واحد.
 */

export const AMAZON = {
  tag: 'electro066-21',      // معرّف المنتسب — يظهر في كل رابط، ليس سراً
  domain: 'www.amazon.se',
  market: 'SE',
} as const;

/** رابط منتج أمازون من ASIN. */
export function amazonUrl(asin: string): string {
  return `https://${AMAZON.domain}/dp/${encodeURIComponent(asin)}?tag=${AMAZON.tag}&linkCode=ll1&language=sv_SE`;
}

/** رابط بحث أمازون — يُستخدم عند فقدان ASIN فقط. */
export function amazonSearchUrl(query: string): string {
  return `https://${AMAZON.domain}/s?k=${encodeURIComponent(query)}&tag=${AMAZON.tag}`;
}

export function isAmazonAsin(asin: string): boolean {
  return /^[A-Z0-9]{10}$/.test(asin);
}
