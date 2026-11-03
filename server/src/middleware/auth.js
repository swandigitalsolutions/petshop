import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/helpers.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, { expiresIn: '30d' });

const readUser = async (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return await User.findById(payload.id).select('-password');
  } catch {
    return null;
  }
};

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await readUser(req);
  next();
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await readUser(req);
  if (!user) throw new HttpError(401, 'Please sign in to continue');
  if (user.blocked) throw new HttpError(403, 'This account has been suspended');
  req.user = user;
  next();
});

export const requireAdmin = [
  requireAuth,
  (req, _res, next) => {
    if (!['admin', 'staff'].includes(req.user.role)) return next(new HttpError(403, 'Admin access only'));
    return next();
  },
];
