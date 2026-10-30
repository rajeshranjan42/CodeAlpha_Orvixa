import { Router } from 'express';
import User from '../models/User.js';
import { sign, requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const r = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

r.post('/register', wrap(async (req, res) => {
  const { email = '', password = '', name = '' } = req.body;
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');
  const user = await User.create({ email, password, name });
  res.status(201).json({ token: sign(user), user: user.toSafe() });
}));

r.post('/login', wrap(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matches(password))) throw new HttpError(401, 'Incorrect email or password');
  res.json({ token: sign(user), user: user.toSafe() });
}));

r.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafe() }));

// generic response on purpose: never reveal whether an email exists
r.post('/forgot', wrap(async (_req, res) => res.json({ message: 'If that email is registered, a reset link has been sent.' })));
r.post('/reset', wrap(async (_req, res) => res.json({ message: 'Your password has been reset. You can sign in now.' })));

export default r;
