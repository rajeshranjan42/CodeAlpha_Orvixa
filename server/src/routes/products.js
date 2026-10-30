import { Router } from 'express';
import Product from '../models/Product.js';
import { HttpError, wrap } from '../middleware/error.js';

const r = Router();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

r.get('/', wrap(async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, minRating, minDiscount, sort = 'featured', page = 1, limit = 24, section } = req.query;
  const f = {};
  if (q) { const re = new RegExp(esc(q.trim()), 'i'); f.$or = [{ title: re }, { brand: re }, { category: re }, { description: re }]; }
  if (category && category !== 'All') f.category = category;
  if (brand) f.brand = { $in: String(brand).split(',') };
  if (minPrice || maxPrice) f.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) }; // inclusive
  if (minRating) f.rating = { $gte: +minRating };
  if (section === 'featured') f.featured = true;
  if (section === 'bestsellers') f.bestSeller = true;
  let docs = Product.find(f);
  if (minDiscount) {
    const ids = (await Product.find(f)).filter((p) => p.discount >= +minDiscount).map((p) => p._id);
    docs = Product.find({ _id: { $in: ids } });
  }
  if (section === 'deals') {
    const ids = (await Product.find(f)).filter((p) => p.discount >= 10).map((p) => p._id);
    docs = Product.find({ _id: { $in: ids } });
  }
  const sorts = { 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, rating: { rating: -1 }, newest: { createdAt: -1 }, featured: { featured: -1, bestSeller: -1, _id: 1 } };
  const total = await Product.countDocuments(docs.getFilter());
  const lim = Math.min(+limit || 24, 60);
  const items = await docs.sort(sorts[sort] || sorts.featured).skip((Math.max(+page, 1) - 1) * lim).limit(lim);
  const brands = await Product.distinct('brand', f.category ? { category: f.category } : {});
  res.json({ items, total, page: +page, pages: Math.ceil(total / lim), brands });
}));

r.get('/meta', wrap(async (_req, res) => res.json({ categories: await Product.distinct('category') })));

r.get('/suggest', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  const items = await Product.find({ title: new RegExp(esc(q), 'i') }).limit(6).select('title category');
  res.json(items);
}));

r.get('/by-ids', wrap(async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean).slice(0, 20);
  res.json(await Product.find({ _id: { $in: ids } }));
}));

r.get('/:id', wrap(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new HttpError(404, 'Product not found');
  const related = await Product.find({ category: p.category, _id: { $ne: p._id } }).limit(10);
  res.json({ product: p, related });
}));

export default r;
