import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { applyCoupon, totals, PINCODE_RE } from '../utils/pricing.js';

const r = Router();
r.use(requireAuth);

const CANCELLABLE = ['Placed', 'Confirmed', 'Packed'];
const RETURN_DAYS = 7;
const decorate = (o) => {
  const obj = o.toObject();
  obj.canCancel = CANCELLABLE.includes(o.status);
  obj.canReturn = o.status === 'Delivered' && o.deliveredAt && Date.now() - o.deliveredAt <= RETURN_DAYS * 864e5;
  return obj;
};

r.post('/', wrap(async (req, res) => {
  const { address, payment = {}, couponCode } = req.body;
  if (!address || !PINCODE_RE.test(String(address.pincode))) throw new HttpError(400, 'Enter a valid 6-digit pincode');
  if (!['UPI', 'Card', 'COD'].includes(payment.method)) throw new HttpError(400, 'Choose a payment method');
  if (payment.simulateFail) throw new HttpError(402, 'Payment failed. Your cart is safe — please try again.');

  await req.user.populate('cart.product');
  const lines = req.user.cart.filter((l) => l.product);
  if (!lines.length) throw new HttpError(400, 'Your cart is empty');
  for (const l of lines) {
    if (l.product.stock < l.qty) throw new HttpError(409, `"${l.product.title}" is ${l.product.stock ? `only available in quantity ${l.product.stock}` : 'out of stock'}. Update your cart to continue.`);
  }
  const items = lines.map((l) => ({ product: l.product._id, title: l.product.title, image: l.product.images[0], price: l.product.price, qty: l.qty }));
  let discount = 0, code;
  if (couponCode) {
    const c = await Coupon.findOne({ code: couponCode.toUpperCase() });
    const out = applyCoupon(c, items.reduce((s, i) => s + i.price * i.qty, 0));
    if (out.error) throw new HttpError(400, out.error);
    discount = out.discount; code = c.code;
  }
  // reserve stock atomically; roll back if any line fails
  const done = [];
  try {
    for (const i of items) {
      const upd = await Product.updateOne({ _id: i.product, stock: { $gte: i.qty } }, { $inc: { stock: -i.qty } });
      if (!upd.modifiedCount) throw new HttpError(409, `"${i.title}" just went out of stock.`);
      done.push(i);
    }
  } catch (e) {
    for (const i of done) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
    throw e;
  }
  const t = totals(items, discount);
  const order = await Order.create({
    user: req.user._id, items, address, couponCode: code, ...t,
    payment: { method: payment.method, status: payment.method === 'COD' ? 'Pending' : 'Paid' },
    history: [{ status: 'Placed' }],
  });
  req.user.cart = [];
  await req.user.save();
  res.status(201).json({ order: decorate(order) });
}));

r.get('/', wrap(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ orders: orders.map(decorate) });
}));

r.get('/:id', wrap(async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!o) throw new HttpError(404, 'Order not found');
  res.json({ order: decorate(o) });
}));

r.post('/:id/cancel', wrap(async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!o) throw new HttpError(404, 'Order not found');
  if (!CANCELLABLE.includes(o.status)) throw new HttpError(400, 'This order can no longer be cancelled');
  for (const i of o.items) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
  o.status = 'Cancelled'; o.history.push({ status: 'Cancelled' });
  await o.save();
  res.json({ order: decorate(o) });
}));

r.post('/:id/return', wrap(async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!o) throw new HttpError(404, 'Order not found');
  if (!decorate(o).canReturn) throw new HttpError(400, `Returns are accepted within ${RETURN_DAYS} days of delivery`);
  o.status = 'Returned'; o.history.push({ status: 'Returned' });
  await o.save();
  res.json({ order: decorate(o) });
}));

export default r;
