import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middleware/error.js';
import auth from './routes/auth.js';
import products from './routes/products.js';
import cart from './routes/cart.js';
import wishlist from './routes/wishlist.js';
import orders from './routes/orders.js';
import reviews from './routes/reviews.js';
import profile from './routes/profile.js';
import coupons from './routes/coupons.js';
import content from './routes/content.js';
import admin from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }), auth);
app.use('/api/products', products);
app.use('/api/cart', cart);
app.use('/api/wishlist', wishlist);
app.use('/api/orders', orders);
app.use('/api/reviews', reviews);
app.use('/api/profile', profile);
app.use('/api/coupons', coupons);
app.use('/api/content', content);
app.use('/api/admin', admin);
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orvixa')
  .then(() => app.listen(PORT, () => console.log(`Orvixa API on :${PORT}`)))
  .catch((e) => { console.error('Mongo connection failed:', e.message); process.exit(1); });
