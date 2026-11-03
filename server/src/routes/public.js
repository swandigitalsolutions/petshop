import { Router } from 'express';
import { Setting, Pet, Breed, Booking, Enquiry, Subscriber, Coupon, Testimonial, Order, VISIT_TYPES, nextSeq } from '../models/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { cached } from '../utils/cache.js';
import { asyncHandler, HttpError, escapeRegex } from '../utils/helpers.js';

const router = Router();

const PET_CARD = 'name slug code breed gender dob size price mrp images status featured adoption location vaccinated kciRegistered microchipped readyToGoHome';
const LIVE = { status: { $in: ['available', 'reserved'] } };

// One request powers the whole homepage — fewer round trips, faster first paint.
router.get(
  '/home',
  cached(60 * 1000),
  asyncHandler(async (_req, res) => {
    const [settings, featured, latest, adoption, breedCounts, breeds, testimonials, families, available] = await Promise.all([
      Setting.findOne({ key: 'site' }).lean(),
      Pet.find({ ...LIVE, featured: true, adoption: { $ne: true } }).select(PET_CARD).slice('images', 2).sort({ status: 1, createdAt: -1 }).limit(8).lean(),
      Pet.find({ status: 'available', adoption: { $ne: true } }).select(PET_CARD).slice('images', 2).sort({ createdAt: -1 }).limit(8).lean(),
      Pet.find({ status: 'available', adoption: true }).select(PET_CARD).slice('images', 1).limit(3).lean(),
      Pet.aggregate([
        { $match: LIVE },
        { $group: { _id: '$breed', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
      ]),
      Breed.find().select('name slug image size summary featured order').sort({ order: 1 }).lean(),
      Testimonial.find({ approved: true, featured: true }).sort({ createdAt: -1 }).limit(6).lean(),
      Order.countDocuments({ status: 'completed' }),
      Pet.countDocuments({ status: 'available' }),
    ]);
    const counts = Object.fromEntries(breedCounts.map((b) => [b._id, b]));
    res.json({
      settings,
      featured,
      latest,
      adoption,
      breeds: breeds.map((b) => ({ ...b, count: counts[b.name]?.count || 0, minPrice: counts[b.name]?.minPrice })),
      testimonials,
      stats: { families, available, breeds: breedCounts.length },
      visitTypes: VISIT_TYPES,
    });
  }),
);

router.get('/settings', cached(), asyncHandler(async (_req, res) => {
  const s = (await Setting.findOne({ key: 'site' }).lean()) || {};
  res.json({ ...s, visitTypes: VISIT_TYPES });
}));

// Breed guide
router.get('/breeds', cached(), asyncHandler(async (_req, res) => {
  const [breeds, counts] = await Promise.all([
    Breed.find().sort({ order: 1, name: 1 }).lean(),
    Pet.aggregate([{ $match: LIVE }, { $group: { _id: '$breed', count: { $sum: 1 }, minPrice: { $min: '$price' } } }]),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x._id, x]));
  res.json(breeds.map((b) => ({ ...b, count: c[b.name]?.count || 0, minPrice: c[b.name]?.minPrice })));
}));

router.get('/breeds/:slug', cached(), asyncHandler(async (req, res) => {
  const breed = await Breed.findOne({ slug: req.params.slug }).lean();
  if (!breed) throw new HttpError(404, 'Breed not found');
  const puppies = await Pet.find({ ...LIVE, breed: breed.name }).select(PET_CARD).slice('images', 2).sort({ status: 1, createdAt: -1 }).lean();
  res.json({ breed, puppies });
}));

router.get('/testimonials', cached(), asyncHandler(async (_req, res) => {
  res.json(await Testimonial.find({ approved: true }).sort({ featured: -1, createdAt: -1 }).limit(30).lean());
}));

router.post('/testimonials', requireAuth, asyncHandler(async (req, res) => {
  const { quote, rating, petName, breed, city } = req.body;
  if (!quote || String(quote).length < 20) throw new HttpError(400, 'Please write at least a couple of sentences about your experience');
  const bought = await Order.exists({ user: req.user._id, status: { $in: ['completed', 'ready', 'vet_check', 'confirmed'] } });
  if (!bought) throw new HttpError(403, 'Stories can be shared by families who have reserved a puppy with us');
  await Testimonial.create({ name: req.user.name, user: req.user._id, quote: String(quote).slice(0, 1000), rating: Math.min(5, Math.max(1, Number(rating) || 5)), petName, breed, city });
  res.status(201).json({ ok: true });
}));

router.get('/search', cached(30 * 1000), asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ pets: [], breeds: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [pets, breeds] = await Promise.all([
    Pet.find({ ...LIVE, $or: [{ name: rx }, { breed: rx }, { color: rx }] }).select('name slug breed gender images price adoption status').slice('images', 1).limit(6).lean(),
    Breed.find({ $or: [{ name: rx }, { temperament: rx }] }).select('name slug image size').limit(4).lean(),
  ]);
  return res.json({ pets, breeds });
}));

router.post('/coupons/validate', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: String(req.body.code || '').toUpperCase(), active: true }).lean();
  if (!coupon) throw new HttpError(404, 'Invalid coupon code');
  res.json({ code: coupon.code, description: coupon.description });
}));

router.get('/coupons/public', cached(), asyncHandler(async (_req, res) => {
  res.json(await Coupon.find({ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).select('code description minOrder').lean());
}));

// Kennel visits, video calls, breed consultations
router.get('/visits/slots', asyncHandler(async (req, res) => {
  const date = new Date(req.query.date);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Invalid date');
  const start = new Date(date.toDateString());
  const end = new Date(start.getTime() + 864e5);
  const s = (await Setting.findOne({ key: 'site' }).lean()) || {};
  const slots = s.visitSlots?.length ? s.visitSlots : ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM', '6:00 PM'];
  const taken = await Booking.aggregate([
    { $match: { date: { $gte: start, $lt: end }, status: { $in: ['pending', 'confirmed'] } } },
    { $group: { _id: '$slot', n: { $sum: 1 } } },
  ]);
  const full = new Set(taken.filter((t) => t.n >= 3).map((t) => t._id));
  res.json(slots.map((slot) => ({ slot, available: !full.has(slot) })));
}));

router.post('/visits', optionalAuth, asyncHandler(async (req, res) => {
  const { type, pet, name, phone, email, date, slot, people, notes } = req.body;
  if (!VISIT_TYPES.some((v) => v.key === type)) throw new HttpError(400, 'Choose how you would like to meet');
  if (!name || !phone || !date || !slot) throw new HttpError(400, 'Name, phone, date and time are required');
  if (!/^[+\d\s-]{10,15}$/.test(phone)) throw new HttpError(400, 'Enter a valid phone number');
  const d = new Date(date);
  if (Number.isNaN(d.getTime()) || d < new Date(new Date().toDateString())) throw new HttpError(400, 'Choose today or a future date');
  let petName;
  if (pet) {
    const p = await Pet.findById(pet).select('name breed').lean();
    petName = p ? `${p.name} (${p.breed})` : undefined;
  }
  const seq = await nextSeq('booking');
  const booking = await Booking.create({
    bookingNo: `BK${5000 + seq}`, user: req.user?._id, type, pet: pet || undefined, petName,
    name, phone, email, date: d, slot, people: Math.min(6, Math.max(1, Number(people) || 1)), notes,
  });
  res.status(201).json(booking);
}));

router.get('/visits/mine', requireAuth, asyncHandler(async (req, res) => {
  res.json(await Booking.find({ user: req.user._id }).sort({ date: -1 }).limit(50).lean());
}));

router.post('/visits/mine/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const b = await Booking.findOneAndUpdate({ _id: req.params.id, user: req.user._id, status: { $in: ['pending', 'confirmed'] } }, { status: 'cancelled' }, { new: true });
  if (!b) throw new HttpError(404, 'Visit not found or already closed');
  res.json(b);
}));

router.post('/enquiries', optionalAuth, asyncHandler(async (req, res) => {
  const { name, phone, email, message, pet, breed, type } = req.body;
  if (!name || !phone) throw new HttpError(400, 'Name and phone are required');
  let petName;
  if (pet) petName = (await Pet.findById(pet).select('name').lean())?.name;
  const e = await Enquiry.create({ name, phone, email, message, pet: pet || undefined, petName, breed, type: type || (pet ? 'pet' : 'general') });
  res.status(201).json({ ok: true, id: e._id });
}));

router.post('/newsletter', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Please enter a valid email');
  await Subscriber.updateOne({ email }, { email }, { upsert: true });
  res.json({ ok: true });
}));

export default router;
