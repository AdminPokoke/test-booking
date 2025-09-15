import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../db/mysql.js';

export function authRequired(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

export async function currentUser(req, res) {
  if (!req.user) return res.json(null);
  const user = await User.findByPk(req.user.id, { attributes: ['id','name','email','role'] });
  res.json(user);
}
