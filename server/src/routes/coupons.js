import { Router } from 'express';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/error.js';
import { applyCoupon, totals } from '../utils/pricing.js';

const r = Router();
// POST /api/coupons/apply { code } -> validates against the logged-in user's cart
r.post('/apply', requireAuth, wrap(async (req, res) => {
  await req.user.populate('cart.product');
  const items = req.user.cart.filter((l) => l.product).map((l) => ({ price: l.product.price, qty: l.qty }));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const coupon = await Coupon.findOne({ code: String(req.body.code || '').toUpperCase().trim() });
  const out = applyCoupon(coupon, subtotal);
  if (out.error) return res.status(400).json({ message: out.error });
  res.json({ code: coupon.code, ...totals(items, out.discount) });
}));
export default r;
