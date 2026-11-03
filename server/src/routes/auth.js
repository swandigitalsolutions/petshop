import { Router } from 'express';
import { User, Pet } from '../models/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/helpers.js';

const router = Router();

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
    if (!EMAIL_RX.test(email)) throw new HttpError(400, 'Please enter a valid email');
    if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    if (await User.exists({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');
    const user = await User.create({ name, email, phone, password });
    res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, admin } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !(await user.matchPassword(String(password || '')))) throw new HttpError(401, 'Invalid email or password');
    if (user.blocked) throw new HttpError(403, 'This account has been suspended');
    if (admin && !['admin', 'staff'].includes(user.role)) throw new HttpError(403, 'This account does not have admin access');
    res.json({ token: signToken(user), user: user.toSafeJSON() });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  }),
);

router.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { name, phone, avatar, currentPassword, newPassword } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (newPassword) {
      if (!(await user.matchPassword(String(currentPassword || '')))) throw new HttpError(400, 'Current password is incorrect');
      if (String(newPassword).length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
      user.password = newPassword;
    }
    await user.save();
    res.json(user.toSafeJSON());
  }),
);

// Addresses
router.post(
  '/me/addresses',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const addr = req.body;
    if (!addr.line1 || !addr.city || !addr.pincode) throw new HttpError(400, 'Address line, city and pincode are required');
    if (addr.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      addr.isDefault = true;
    }
    user.addresses.push(addr);
    await user.save();
    res.status(201).json(user.addresses);
  }),
);

router.put(
  '/me/addresses/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) throw new HttpError(404, 'Address not found');
    if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
    addr.set(req.body);
    await user.save();
    res.json(user.addresses);
  }),
);

router.delete(
  '/me/addresses/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
    await user.save();
    res.json(user.addresses);
  }),
);

// Preferences (used for "puppies for you" on the account page)
router.put(
  '/me/preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { breeds, homeType, hasKids, firstDog } = req.body;
    user.preferences = { breeds: Array.isArray(breeds) ? breeds.slice(0, 10) : [], homeType, hasKids: Boolean(hasKids), firstDog: Boolean(firstDog) };
    await user.save();
    res.json(user.toSafeJSON());
  }),
);

// Wishlist (saved puppies)
router.get(
  '/me/wishlist',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name slug code breed gender dob size images price mrp status adoption location vaccinated kciRegistered microchipped')
      .lean();
    res.json(user.wishlist || []);
  }),
);

router.post(
  '/me/wishlist',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!(await Pet.exists({ _id: id }))) throw new HttpError(404, 'Puppy not found');
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex((x) => String(x) === String(id));
    if (idx >= 0) user.wishlist.splice(idx, 1);
    else user.wishlist.push(id);
    await user.save();
    res.json({ wishlist: user.wishlist, added: idx < 0 });
  }),
);

export default router;
