import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError, wrap } from './error.js';

export const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

const load = async (req) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    return await User.findById(id);
  } catch { return null; }
};
export const optionalAuth = wrap(async (req, _res, next) => { req.user = await load(req); next(); });
export const requireAuth = wrap(async (req, _res, next) => {
  req.user = await load(req);
  if (!req.user) throw new HttpError(401, 'Please sign in');
  next();
});
export const requireAdmin = [requireAuth, (req, _res, next) =>
  req.user.role === 'admin' ? next() : next(new HttpError(403, 'Admin only'))];
