import { Router } from 'express';
import { Banner, Page } from '../models/Content.js';
import { HttpError, wrap } from '../middleware/error.js';

const r = Router();
r.get('/banners', wrap(async (_req, res) => res.json(await Banner.find().sort('order'))));
r.get('/pages/:slug', wrap(async (req, res) => {
  const p = await Page.findOne({ slug: req.params.slug });
  if (!p) throw new HttpError(404, 'Page not found');
  res.json(p);
}));
export default r;
