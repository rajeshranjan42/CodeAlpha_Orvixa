export const PINCODE_RE = /^[1-9]\d{5}$/;
export const FREE_DELIVERY_ABOVE = 499;
export const DELIVERY_FEE = 40;

export function applyCoupon(coupon, subtotal) {
  if (!coupon || !coupon.active) return { error: 'Invalid coupon code' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: 'This coupon has expired' };
  if (subtotal < coupon.minOrder) return { error: `Add items worth ₹${coupon.minOrder - subtotal} more to use this coupon` };
  let discount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return { discount: Math.min(discount, subtotal) };
}

export function totals(items, discount = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal - discount >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE;
  const gst = Math.round(((subtotal - discount) * 18) / 118); // GST included in price
  return { subtotal, discount, delivery, gst, total: subtotal - discount + delivery };
}
