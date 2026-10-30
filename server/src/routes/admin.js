import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import Order, { STATUSES } from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { Banner, Page } from '../models/Content.js';
import { requireAdmin } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = Router();
r.use(requireAdmin);

// ---- image upload: stored on Cloudinary (survives Render restarts) ----
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Only JPEG, PNG or WebP images are allowed')),
});

const toCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'orvixa', resource_type: 'image' }, (err, result) => (err ? reject(err) : resolve(result)))
      .end(buffer);
  });

r.post('/upload', (req, res, next) =>
  upload.single('image')(req, res, async (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'Image must be 2 MB or smaller'));
    if (err) return next(err);
    if (!req.file) return next(new HttpError(400, 'No image received'));
    if (!process.env.CLOUDINARY_CLOUD_NAME) return next(new HttpError(503, 'Image storage is not set up yet'));
    try {
      const result = await toCloudinary(req.file.buffer);
      res.status(201).json({ url: result.secure_url });
    } catch {
      next(new HttpError(502, 'Image upload failed. Please try again.'));
    }
  }),
);

r.get('/stats', wrap(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 864e5);
  const live = { status: { $nin: ['Cancelled', 'Returned'] } };
  const [byStatus, daily, top, lowStock, totals, users] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: since }, ...live } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: live }, { $unwind: '$items' },
      { $group: { _id: '$items.product', title: { $first: '$items.title' }, units: { $sum: '$items.qty' } } }, { $sort: { units: -1 } }, { $limit: 5 }]),
    Product.find({ $expr: { $lte: ['$stock', '$lowStockAt'] } }).select('title stock lowStockAt').limit(10),
    Order.aggregate([{ $match: live }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    User.countDocuments({ role: 'customer' }),
  ]);
  res.json({ revenue: totals[0]?.revenue || 0, orders: totals[0]?.orders || 0, users, products: await Product.countDocuments(), byStatus, daily, top, lowStock });
}));

// generic CRUD helper
const crud = (path, Model, sort = '-createdAt') => {
  r.get(path, wrap(async (_req, res) => res.json(await Model.find().sort(sort))));
  r.post(path, wrap(async (req, res) => res.status(201).json(await Model.create(req.body))));
  r.put(`${path}/:id`, wrap(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) throw new HttpError(404, 'Not found');
    res.json(doc);
  }));
  r.delete(`${path}/:id`, wrap(async (req, res) => { await Model.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
};
crud('/products', Product);
crud('/coupons', Coupon);
crud('/banners', Banner, 'order');
crud('/pages', Page, 'slug');

r.post('/banners/reorder', wrap(async (req, res) => {
  await Promise.all((req.body.ids || []).map((id, i) => Banner.updateOne({ _id: id }, { order: i })));
  res.json(await Banner.find().sort('order'));
}));

r.get('/orders', wrap(async (_req, res) => res.json(await Order.find().sort('-createdAt').populate('user', 'email name'))));
r.patch('/orders/:id/status', wrap(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
  const o = await Order.findById(req.params.id);
  if (!o) throw new HttpError(404, 'Order not found');
  if (status === 'Cancelled' && o.status !== 'Cancelled') for (const i of o.items) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
  o.status = status; o.history.push({ status });
  if (status === 'Delivered') o.deliveredAt = new Date();
  await o.save();
  res.json(o);
}));
r.get('/orders.csv', wrap(async (_req, res) => {
  const orders = await Order.find().sort('-createdAt').populate('user', 'email');
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status'].join(',')].concat(
    orders.map((o) => [o._id, o.createdAt.toISOString(), o.user?.email, o.items.length, o.total, o.payment.method, o.status].map(q).join(',')));
  res.type('text/csv').attachment('orders.csv').send(rows.join('\n'));
}));

export default r;
