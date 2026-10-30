import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);

r.patch('/', wrap(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user.toSafe() });
}));

r.post('/password', wrap(async (req, res) => {
  const { current = '', next = '' } = req.body;
  const u = await User.findById(req.user._id).select('+password');
  if (!(await u.matches(current))) throw new HttpError(400, 'Current password is incorrect');
  if (next.length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  u.password = next; await u.save();
  res.json({ message: 'Password updated' });
}));

const single = (u, id) => { u.addresses.forEach((a) => { a.isDefault = String(a._id) === String(id); }); };

r.post('/addresses', wrap(async (req, res) => {
  const first = req.user.addresses.length === 0;
  req.user.addresses.push({ ...req.body, isDefault: false });
  const added = req.user.addresses[req.user.addresses.length - 1];
  if (first || req.body.isDefault) single(req.user, added._id);
  await req.user.save();
  res.status(201).json({ user: req.user.toSafe() });
}));

r.put('/addresses/:id', wrap(async (req, res) => {
  const a = req.user.addresses.id(req.params.id);
  if (!a) throw new HttpError(404, 'Address not found');
  const { isDefault, ...rest } = req.body;
  a.set(rest);
  if (isDefault) single(req.user, a._id);
  await req.user.save();
  res.json({ user: req.user.toSafe() });
}));

r.delete('/addresses/:id', wrap(async (req, res) => {
  const a = req.user.addresses.id(req.params.id);
  if (!a) throw new HttpError(404, 'Address not found');
  const wasDefault = a.isDefault;
  a.deleteOne();
  if (wasDefault && req.user.addresses[0]) req.user.addresses[0].isDefault = true;
  await req.user.save();
  res.json({ user: req.user.toSafe() });
}));

export default r;
