import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);
const view = async (u) => { await u.populate('wishlist'); return { items: u.wishlist.filter(Boolean) }; };

r.get('/', wrap(async (req, res) => res.json(await view(req.user))));
r.post('/:productId', wrap(async (req, res) => {
  if (!req.user.wishlist.some((id) => String(id) === req.params.productId)) req.user.wishlist.push(req.params.productId); // no duplicates
  await req.user.save();
  res.json(await view(req.user));
}));
r.delete('/:productId', wrap(async (req, res) => {
  req.user.wishlist = req.user.wishlist.filter((id) => String(id) !== req.params.productId);
  await req.user.save();
  res.json(await view(req.user));
}));

export default r;
