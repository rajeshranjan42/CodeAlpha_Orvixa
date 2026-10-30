import { Router } from 'express';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);

const view = async (user) => {
  await user.populate([{ path: 'cart.product' }, { path: 'saved.product' }]);
  const clean = (arr) => arr.filter((l) => l.product).map((l) => ({ product: l.product, qty: l.qty }));
  return { cart: clean(user.cart), saved: clean(user.saved) };
};
const clamp = async (productId, qty) => {
  const p = await Product.findById(productId);
  if (!p) throw new HttpError(404, 'Product not found');
  if (p.stock < 1) throw new HttpError(400, 'This item is out of stock');
  return Math.max(1, Math.min(qty, p.stock, 10));
};

r.get('/', wrap(async (req, res) => res.json(await view(req.user))));

r.post('/add', wrap(async (req, res) => {
  const { productId, qty = 1 } = req.body;
  const line = req.user.cart.find((l) => String(l.product) === productId);
  const next = await clamp(productId, (line?.qty || 0) + +qty);
  if (line) line.qty = next; else req.user.cart.push({ product: productId, qty: next });
  await req.user.save();
  res.json(await view(req.user));
}));

r.patch('/:productId', wrap(async (req, res) => {
  const line = req.user.cart.find((l) => String(l.product) === req.params.productId);
  if (!line) throw new HttpError(404, 'Item not in cart');
  line.qty = await clamp(req.params.productId, +req.body.qty);
  await req.user.save();
  res.json(await view(req.user));
}));

r.delete('/:productId', wrap(async (req, res) => {
  req.user.cart = req.user.cart.filter((l) => String(l.product) !== req.params.productId);
  await req.user.save();
  res.json(await view(req.user));
}));

r.post('/:productId/save', wrap(async (req, res) => {
  const line = req.user.cart.find((l) => String(l.product) === req.params.productId);
  if (line) {
    req.user.saved = req.user.saved.filter((l) => String(l.product) !== req.params.productId).concat([{ product: line.product, qty: line.qty }]);
    req.user.cart = req.user.cart.filter((l) => String(l.product) !== req.params.productId);
    await req.user.save();
  }
  res.json(await view(req.user));
}));

r.post('/:productId/move', wrap(async (req, res) => {
  const line = req.user.saved.find((l) => String(l.product) === req.params.productId);
  if (line) {
    const qty = await clamp(req.params.productId, line.qty);
    req.user.saved = req.user.saved.filter((l) => String(l.product) !== req.params.productId);
    const existing = req.user.cart.find((l) => String(l.product) === req.params.productId);
    if (existing) existing.qty = qty; else req.user.cart.push({ product: line.product, qty });
    await req.user.save();
  }
  res.json(await view(req.user));
}));

r.delete('/saved/:productId', wrap(async (req, res) => {
  req.user.saved = req.user.saved.filter((l) => String(l.product) !== req.params.productId);
  await req.user.save();
  res.json(await view(req.user));
}));

// merge the anonymous (localStorage) cart into the account cart after login
r.post('/merge', wrap(async (req, res) => {
  for (const { productId, qty } of req.body.items || []) {
    const p = await Product.findById(productId);
    if (!p || p.stock < 1) continue;
    const line = req.user.cart.find((l) => String(l.product) === productId);
    const next = Math.min((line?.qty || 0) + +qty, p.stock, 10);
    if (line) line.qty = next; else req.user.cart.push({ product: productId, qty: next });
  }
  await req.user.save();
  res.json(await view(req.user));
}));

export default r;
