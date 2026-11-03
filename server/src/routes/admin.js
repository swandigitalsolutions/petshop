import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import {
  User, Pet, Breed, Order, Coupon, Booking, Enquiry, Testimonial, Setting, Subscriber,
} from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError, paginate, escapeRegex, slugify, uniqueSlug } from '../utils/helpers.js';

const router = Router();
router.use(requireAdmin);

// ---------- Dashboard ----------
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    const live = { status: { $ne: 'cancelled' } };
    const [
      money, completedCount, activeReservations, customers, petsByStatus, recent, daily,
      breedSales, upcomingVisits, newEnquiries, pendingStories, statusCounts, readySoon,
    ] = await Promise.all([
      Order.aggregate([{ $match: live }, { $group: { _id: null, booked: { $sum: '$total' }, collected: { $sum: '$amountPaid' }, due: { $sum: '$balanceDue' }, avg: { $avg: '$petPrice' } } }]),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'vet_check', 'ready'] } }),
      User.countDocuments({ role: 'customer' }),
      Pet.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$price' }, cost: { $sum: '$costPrice' } } }]),
      Order.find().sort({ createdAt: -1 }).limit(8).lean(),
      Order.aggregate([
        { $match: { ...live, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: live },
        { $group: { _id: '$petSnapshot.breed', sold: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
      ]),
      Booking.find({ date: { $gte: new Date(new Date().toDateString()) }, status: { $in: ['pending', 'confirmed'] } }).sort({ date: 1 }).limit(6).lean(),
      Enquiry.countDocuments({ status: 'new' }),
      Testimonial.countDocuments({ approved: false }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find({ status: { $in: ['vet_check', 'ready'] } }).sort({ handoverDate: 1 }).limit(6).lean(),
    ]);

    const map = Object.fromEntries(daily.map((d) => [d._id, d]));
    const series = [];
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = fmt.format(d);
      series.push({ date: key, revenue: map[key]?.revenue || 0, orders: map[key]?.orders || 0 });
    }
    const pets = Object.fromEntries(petsByStatus.map((p) => [p._id, { count: p.count, value: p.value, cost: p.cost }]));
    const soldCompleted = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'pets', localField: 'pet', foreignField: '_id', as: 'p' } },
      { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, revenue: { $sum: '$total' }, cost: { $sum: { $ifNull: ['$p.costPrice', 0] } } } },
    ]);

    res.json({
      booked: money[0]?.booked || 0,
      collected: money[0]?.collected || 0,
      balanceDue: money[0]?.due || 0,
      avgPrice: Math.round(money[0]?.avg || 0),
      margin: (soldCompleted[0]?.revenue || 0) - (soldCompleted[0]?.cost || 0),
      completed: completedCount,
      activeReservations,
      customers,
      pets,
      recent,
      series,
      breedSales,
      upcomingVisits,
      readySoon,
      newEnquiries,
      pendingStories,
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
    });
  }),
);

// ---------- Image upload (auto-converted to compressed WebP) ----------
// On your own server photos are written to ./uploads. Vercel's filesystem is read-only,
// so there the compressed WebP is stored in MongoDB as a data URL instead.
const ON_VERCEL = Boolean(process.env.VERCEL);
const uploadDir = path.resolve('uploads');
if (!ON_VERCEL) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 12 }, // Vercel functions accept request bodies up to 4.5 MB
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/.test(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Only image files are allowed')),
});

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.warn('[upload] sharp not installed — images stored without compression'); }

const compress = (buf, width) => sharp(buf).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();

router.post(
  '/upload',
  upload.array('images', 12),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw new HttpError(400, 'No images received');
    const urls = [];
    for (const f of req.files) {
      if (ON_VERCEL) {
        // eslint-disable-next-line no-await-in-loop
        const out = sharp ? await compress(f.buffer, 1000) : f.buffer;
        urls.push(`data:${sharp ? 'image/webp' : f.mimetype};base64,${out.toString('base64')}`);
        continue;
      }
      const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
      const name = `${id}.${sharp ? 'webp' : (f.mimetype.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.writeFile(path.join(uploadDir, name), sharp ? await compress(f.buffer, 1400) : f.buffer);
      urls.push(`/uploads/${name}`);
    }
    res.status(201).json({ urls });
  }),
);

// ---------- Customers ----------
router.get('/users', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const spend = await Order.aggregate([
    { $match: { user: { $in: items.map((u) => u._id) }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$amountPaid' }, last: { $max: '$createdAt' } } },
  ]);
  const byId = Object.fromEntries(spend.map((s) => [String(s._id), s]));
  res.json({
    items: items.map((u) => ({ ...u, orders: byId[u._id]?.orders || 0, spent: byId[u._id]?.spent || 0, lastOrder: byId[u._id]?.last })),
    total, page, pages: Math.ceil(total / limit),
  });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('wishlist', 'name breed slug images price status').lean();
  if (!user) throw new HttpError(404, 'Customer not found');
  const [orders, visits, enquiries] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Booking.find({ user: user._id }).sort({ date: -1 }).limit(20).lean(),
    Enquiry.find({ phone: user.phone }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  res.json({ user, orders, visits, enquiries });
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id) && (req.body.blocked || (req.body.role && req.body.role !== 'admin'))) {
    throw new HttpError(400, 'You cannot block or demote your own account');
  }
  const update = {};
  if (req.body.blocked !== undefined) update.blocked = Boolean(req.body.blocked);
  if (req.body.role) {
    if (req.user.role !== 'admin') throw new HttpError(403, 'Only admins can change roles');
    update.role = req.body.role;
  }
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
  if (!user) throw new HttpError(404, 'Customer not found');
  res.json(user);
}));

// ---------- Breeds ----------
const BREED_FIELDS = ['name', 'image', 'summary', 'description', 'size', 'origin', 'lifeSpan', 'weightRange', 'temperament', 'goodWith', 'energyLevel', 'shedding', 'grooming', 'trainability', 'apartmentFriendly', 'climateNote', 'featured', 'order'];
const pickBreed = (b) => Object.fromEntries(BREED_FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));

router.get('/breeds', asyncHandler(async (_req, res) => {
  const [breeds, counts] = await Promise.all([
    Breed.find().sort({ order: 1, name: 1 }).lean(),
    Pet.aggregate([{ $group: { _id: { breed: '$breed', status: '$status' }, n: { $sum: 1 } } }]),
  ]);
  const c = {};
  counts.forEach(({ _id, n }) => { c[_id.breed] = { ...(c[_id.breed] || {}), [_id.status]: n }; });
  res.json(breeds.map((b) => ({ ...b, stock: c[b.name] || {} })));
}));

router.post('/breeds', asyncHandler(async (req, res) => {
  const data = pickBreed(req.body);
  if (!data.name) throw new HttpError(400, 'Breed name is required');
  data.slug = await uniqueSlug(Breed, data.name);
  res.status(201).json(await Breed.create(data));
}));

router.put('/breeds/:id', asyncHandler(async (req, res) => {
  const b = await Breed.findById(req.params.id);
  if (!b) throw new HttpError(404, 'Breed not found');
  const data = pickBreed(req.body);
  if (data.name && data.name !== b.name) {
    await Pet.updateMany({ breed: b.name }, { breed: data.name });
    data.slug = slugify(data.name);
  }
  b.set(data);
  await b.save();
  res.json(b);
}));

router.delete('/breeds/:id', asyncHandler(async (req, res) => {
  const b = await Breed.findById(req.params.id);
  if (!b) throw new HttpError(404, 'Breed not found');
  if (await Pet.exists({ breed: b.name, status: { $in: ['available', 'reserved'] } })) throw new HttpError(400, 'Remove or re-assign the puppies listed under this breed first');
  await b.deleteOne();
  res.json({ ok: true });
}));

// ---------- Coupons ----------
router.get('/coupons', asyncHandler(async (_req, res) => res.json(await Coupon.find().sort({ createdAt: -1 }).lean())));
router.post('/coupons', asyncHandler(async (req, res) => {
  if (!req.body.code || !req.body.value) throw new HttpError(400, 'Code and value are required');
  if (await Coupon.exists({ code: String(req.body.code).toUpperCase() })) throw new HttpError(409, 'Coupon code already exists');
  res.status(201).json(await Coupon.create(req.body));
}));
router.put('/coupons/:id', asyncHandler(async (req, res) => {
  const { _id, used, ...data } = req.body;
  const c = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json(c);
}));
router.delete('/coupons/:id', asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- Visits ----------
router.get('/visits', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, { defaultLimit: 30, maxLimit: 100 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  const upcoming = req.query.when !== 'past';
  filter.date = upcoming ? { $gte: new Date(new Date().toDateString()) } : { $lt: new Date(new Date().toDateString()) };
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ date: upcoming ? 1 : -1, slot: 1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));
router.patch('/visits/:id', asyncHandler(async (req, res) => {
  const update = {};
  ['status', 'slot', 'date'].forEach((k) => { if (req.body[k]) update[k] = req.body[k]; });
  const b = await Booking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!b) throw new HttpError(404, 'Visit not found');
  res.json(b);
}));

// ---------- Enquiries ----------
router.get('/enquiries', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  res.json(await Enquiry.find(filter).sort({ createdAt: -1 }).limit(300).lean());
}));
router.patch('/enquiries/:id', asyncHandler(async (req, res) => {
  const e = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!e) throw new HttpError(404, 'Enquiry not found');
  res.json(e);
}));

// ---------- Happy-family stories ----------
router.get('/testimonials', asyncHandler(async (_req, res) => res.json(await Testimonial.find().sort({ approved: 1, createdAt: -1 }).lean())));
router.post('/testimonials', asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.quote) throw new HttpError(400, 'Name and story are required');
  res.status(201).json(await Testimonial.create({ ...req.body, approved: req.body.approved ?? true }));
}));
router.put('/testimonials/:id', asyncHandler(async (req, res) => {
  const { _id, ...data } = req.body;
  const t = await Testimonial.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!t) throw new HttpError(404, 'Story not found');
  res.json(t);
}));
router.delete('/testimonials/:id', asyncHandler(async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- Store settings ----------
router.get('/settings', asyncHandler(async (_req, res) => res.json((await Setting.findOne({ key: 'site' }).lean()) || {})));
router.put('/settings', asyncHandler(async (req, res) => {
  const { _id, key, createdAt, updatedAt, __v, visitTypes, ...data } = req.body;
  res.json(await Setting.findOneAndUpdate({ key: 'site' }, data, { new: true, upsert: true, runValidators: true }));
}));

router.get('/subscribers', asyncHandler(async (_req, res) => res.json(await Subscriber.find().sort({ createdAt: -1 }).limit(1000).lean())));

export default router;
