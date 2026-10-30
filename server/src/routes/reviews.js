import { Router } from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const r = Router();

const recalc = async (productId) => {
  const rows = await Review.find({ product: productId });
  const n = rows.length;
  await Product.updateOne({ _id: productId }, { rating: n ? +(rows.reduce((s, x) => s + x.rating, 0) / n).toFixed(1) : 0, numReviews: n });
};

r.get('/:productId', wrap(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).sort('-createdAt');
  const histogram = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: reviews.filter((x) => x.rating === s).length }));
  res.json({ reviews, histogram });
}));

r.post('/:productId', requireAuth, wrap(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Rating must be between 1 and 5');
  if (await Review.exists({ product: req.params.productId, user: req.user._id })) throw new HttpError(409, 'You have already reviewed this product');
  const verified = !!(await Order.exists({ user: req.user._id, 'items.product': req.params.productId, status: { $nin: ['Cancelled'] } }));
  const review = await Review.create({
    product: req.params.productId, user: req.user._id, userName: req.user.name || req.user.email.split('@')[0],
    rating, title: req.body.title, body: req.body.body, verified,
  });
  await recalc(req.params.productId);
  res.status(201).json({ review });
}));

export default r;
