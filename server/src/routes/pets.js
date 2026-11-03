import { Router } from 'express';
import mongoose from 'mongoose';
import { Pet, Breed } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { cached } from '../utils/cache.js';
import { asyncHandler, HttpError, uniqueSlug, paginate, csv, toNumber, escapeRegex } from '../utils/helpers.js';

const router = Router();

const PUBLIC_HIDE = '-costPrice -breeder';
const LIST_FIELDS =
  'name slug code breed gender dob size price mrp images status featured adoption location vaccinated kciRegistered microchipped color tags readyToGoHome createdAt';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { views: -1 },
  youngest: { dob: -1 },
};

const weeksAgo = (w) => new Date(Date.now() - w * 7 * 864e5);

const buildFilter = (q, { admin = false } = {}) => {
  const filter = {};
  const breeds = csv(q.breed);
  if (breeds.length) filter.breed = { $in: breeds };
  const sizes = csv(q.size);
  if (sizes.length) filter.size = { $in: sizes };
  if (q.gender) filter.gender = q.gender;
  if (q.status) filter.status = { $in: csv(q.status) };
  else if (!admin) filter.status = { $in: ['available', 'reserved'] };
  if (q.featured === 'true') filter.featured = true;
  if (q.adoption === 'true') filter.adoption = true;
  if (q.adoption === 'false') filter.adoption = { $ne: true };
  if (q.kci === 'true') filter.kciRegistered = true;
  if (q.microchipped === 'true') filter.microchipped = true;
  const min = toNumber(q.minPrice);
  const max = toNumber(q.maxPrice);
  if (min !== undefined || max !== undefined) {
    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }
  // age buckets in weeks, e.g. ageMax=10
  const ageMax = toNumber(q.ageMax);
  if (ageMax !== undefined) filter.dob = { $gte: weeksAgo(ageMax) };
  const goodWith = csv(q.goodWith);
  if (goodWith.length) filter.goodWith = { $all: goodWith };
  const ids = csv(q.ids).filter((id) => mongoose.isValidObjectId(id));
  if (ids.length) filter._id = { $in: ids };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ name: rx }, { breed: rx }, { color: rx }, { code: rx }];
  }
  return filter;
};

// GET /api/pets — public listing with filters + facets
router.get(
  '/',
  cached(),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req, { defaultLimit: 12 });
    const filter = buildFilter(req.query);
    const sort = SORTS[req.query.sort] || SORTS.newest;
    const [items, total, breeds, priceRange] = await Promise.all([
      Pet.find(filter).select(LIST_FIELDS).slice('images', 2).sort({ status: 1, ...sort }).skip(skip).limit(limit).lean(),
      Pet.countDocuments(filter),
      Pet.aggregate([
        { $match: { status: { $in: ['available', 'reserved'] } } },
        { $group: { _id: '$breed', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Pet.aggregate([
        { $match: { status: { $in: ['available', 'reserved'] }, price: { $gt: 0 } } },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
      ]),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit), facets: { breeds, priceRange: priceRange[0] || { min: 0, max: 0 } } });
  }),
);

// Admin listing (all statuses, includes cost/breeder)
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req, { defaultLimit: 20, maxLimit: 100 });
    const filter = buildFilter(req.query, { admin: true });
    const sort = SORTS[req.query.sort] || SORTS.newest;
    const [items, total, counts] = await Promise.all([
      Pet.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Pet.countDocuments(filter),
      Pet.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit), counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
  }),
);

router.get(
  '/admin/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const pet = await Pet.findById(req.params.id).lean();
    if (!pet) throw new HttpError(404, 'Puppy not found');
    res.json(pet);
  }),
);

// GET /api/pets/:slug — detail + breed info + similar puppies
router.get(
  '/:slug',
  cached(30 * 1000),
  asyncHandler(async (req, res) => {
    const pet = await Pet.findOne({ slug: req.params.slug, status: { $ne: 'hidden' } }).select(PUBLIC_HIDE).lean();
    if (!pet) throw new HttpError(404, 'This puppy is no longer listed');
    Pet.updateOne({ _id: pet._id }, { $inc: { views: 1 } }).catch(() => {});
    const [breed, similar, siblings] = await Promise.all([
      Breed.findOne({ name: pet.breed }).lean(),
      Pet.find({ _id: { $ne: pet._id }, status: 'available', $or: [{ breed: pet.breed }, { size: pet.size }] })
        .select(LIST_FIELDS).slice('images', 2).sort({ breed: pet.breed ? -1 : 1, createdAt: -1 }).limit(4).lean(),
      Pet.countDocuments({ _id: { $ne: pet._id }, breed: pet.breed, status: 'available' }),
    ]);
    res.json({ pet, breed, similar, siblings });
  }),
);

const PET_FIELDS = [
  'name', 'code', 'breed', 'gender', 'dob', 'color', 'size', 'weightKg', 'price', 'mrp', 'images', 'videoUrl',
  'description', 'temperament', 'goodWith', 'energyLevel', 'vaccinated', 'vaccinations', 'dewormed', 'microchipped',
  'kciRegistered', 'vetChecked', 'healthGuaranteeMonths', 'parents', 'included', 'location', 'readyToGoHome',
  'adoption', 'homeDelivery', 'status', 'featured', 'tags', 'costPrice', 'breeder',
];
const pick = (body) => Object.fromEntries(PET_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k] === '' ? undefined : body[k]]));

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = pick(req.body);
    if (!data.name || !data.breed || data.price === undefined || !data.gender) throw new HttpError(400, 'Name, breed, gender and price are required');
    if (data.adoption) data.price = 0;
    data.slug = await uniqueSlug(Pet, `${data.name}-${data.breed}`);
    if (!data.code) data.code = `PN-${String(Date.now()).slice(-5)}`;
    if (!data.size) data.size = (await Breed.findOne({ name: data.breed }).select('size').lean())?.size || 'medium';
    const pet = await Pet.create(data);
    res.status(201).json(pet);
  }),
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    if (!pet) throw new HttpError(404, 'Puppy not found');
    const data = pick(req.body);
    if (data.adoption) data.price = 0;
    if ((data.name && data.name !== pet.name) || (data.breed && data.breed !== pet.breed)) {
      data.slug = await uniqueSlug(Pet, `${data.name || pet.name}-${data.breed || pet.breed}`, pet._id);
    }
    pet.set(data);
    await pet.save();
    res.json(pet);
  }),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    if (!pet) throw new HttpError(404, 'Puppy not found');
    if (pet.status === 'reserved') throw new HttpError(400, 'This puppy has an active reservation. Cancel the reservation first.');
    await pet.deleteOne();
    res.json({ ok: true });
  }),
);

export default router;
