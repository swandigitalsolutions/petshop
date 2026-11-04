import { Router } from 'express';
import mongoose from 'mongoose';
import { Order, Pet, Coupon, Setting, User, nextSeq, ORDER_STATUSES } from '../models/index.js';
import { breedStats, withRating } from '../utils/ratings.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError, paginate, escapeRegex } from '../utils/helpers.js';

const router = Router();

const couponDiscount = (coupon, base) => {
  if (!coupon || !coupon.active) return { error: 'Invalid coupon code' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: 'This coupon has expired' };
  if (coupon.usageLimit && coupon.used >= coupon.usageLimit) return { error: 'This coupon has reached its usage limit' };
  if (base <= 0) return { error: 'Coupons cannot be used on free adoptions' };
  if (base < (coupon.minOrder || 0)) return { error: `This coupon needs a puppy priced at ₹${coupon.minOrder.toLocaleString('en-IN')} or more` };
  let d = coupon.type === 'percent' ? Math.round((base * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return { discount: Math.min(d, base) };
};

// Server-side pricing — the client never sets its own amounts.
const quote = async ({ petId, paymentPlan = 'deposit', handover = 'pickup', city, coupon: code }) => {
  if (!mongoose.isValidObjectId(petId)) throw new HttpError(400, 'Choose a puppy to reserve');
  const pet = await Pet.findById(petId).lean();
  if (!pet || pet.status === 'hidden') throw new HttpError(404, 'This puppy is no longer listed');
  const s = (await Setting.findOne({ key: 'site' }).lean()) || {};
  let deliveryFee = 0;
  if (handover === 'home_delivery') {
    if (pet.homeDelivery === false) throw new HttpError(400, 'Home delivery is not available for this puppy');
    const local = (s.freeDeliveryCities || ['Bengaluru']).some((c) => c.toLowerCase() === String(city || '').trim().toLowerCase());
    deliveryFee = local ? 0 : s.outstationDeliveryFee ?? 6500;
  }
  let discount = 0;
  let couponError;
  let couponDoc;
  if (code) {
    couponDoc = await Coupon.findOne({ code: String(code).toUpperCase() });
    const r = couponDiscount(couponDoc, pet.price);
    couponError = r.error;
    discount = r.discount || 0;
  }
  const total = pet.price - discount + deliveryFee;
  const pct = s.depositPercent ?? 10;
  const deposit = pet.adoption || pet.price === 0
    ? 0
    : Math.min(total, Math.max(s.minDeposit ?? 5000, Math.round((pet.price * pct) / 100 / 500) * 500));
  const payNow = paymentPlan === 'full' ? total : deposit;
  return { pet, petPrice: pet.price, deliveryFee, discount, total, deposit, payNow, balance: total - payNow, couponError, couponDoc };
};

// ---------- Cart (each puppy is unique, so quantity is always 1) ----------
export const cartQuote = async ({ items = [], coupon, city }) => {
  const ids = [...new Set((Array.isArray(items) ? items : []).map(String))].filter((id) => mongoose.isValidObjectId(id));
  const found = await Pet.find({ _id: { $in: ids } }).select('-costPrice -breeder').lean();
  const ok = found.filter((p) => p.status === 'available');
  const unavailable = [
    ...found.filter((p) => p.status !== 'available').map((p) => ({ _id: p._id, name: p.name })),
    ...ids.filter((id) => !found.some((p) => String(p._id) === id)).map((id) => ({ _id: id, name: 'A puppy' })),
  ];
  const mrpTotal = ok.reduce((x, p) => x + Math.max(p.mrp || 0, p.price), 0);
  const priceTotal = ok.reduce((x, p) => x + p.price, 0);
  let cDisc = 0; let couponError; let couponDoc;
  if (coupon) {
    couponDoc = await Coupon.findOne({ code: String(coupon).toUpperCase().trim() });
    const r = couponDiscount(couponDoc, priceTotal);
    couponError = r.error;
    cDisc = r.discount || 0;
  }
  const s = (await Setting.findOne({ key: 'site' }).lean()) || {};
  const local = !city || (s.freeDeliveryCities || ['Bengaluru']).some((c) => c.toLowerCase() === String(city).trim().toLowerCase());
  const delivery = ok.length && !local ? s.outstationDeliveryFee ?? 6500 : 0;
  const stats = await breedStats();
  return {
    items: ok.map((p) => withRating(stats)({ ...p, images: (p.images || []).slice(0, 1) })), unavailable, mrpTotal, priceTotal, mrpDiscount: mrpTotal - priceTotal,
    couponDiscount: cDisc, couponError, coupon: couponError ? undefined : couponDoc?.code, couponDoc: couponError ? undefined : couponDoc,
    delivery, total: priceTotal - cDisc + delivery, savings: mrpTotal - priceTotal + cDisc,
  };
};

router.post(
  '/checkout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items, address, paymentMethod = 'upi', coupon, notes } = req.body;
    if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Your cart is empty');
    if (!address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.pincode) throw new HttpError(400, 'Please add a complete delivery address');
    if (!/^\d{6}$/.test(String(address.pincode).trim())) throw new HttpError(400, 'Enter a valid 6-digit pincode');
    if (!/^[+\d\s-]{10,15}$/.test(String(address.phone))) throw new HttpError(400, 'Enter a valid 10-digit mobile number');
    if (!['upi', 'card', 'netbanking', 'cod'].includes(paymentMethod)) throw new HttpError(400, 'Choose a payment method');
    const q = await cartQuote({ items, coupon, city: address.city });
    if (q.unavailable.length) throw new HttpError(409, `${q.unavailable.map((x) => x.name).join(', ')} just sold out. Remove ${q.unavailable.length > 1 ? 'them' : 'it'} from your cart to continue.`);
    if (!q.items.length) throw new HttpError(400, 'Your cart is empty');
    if (coupon && q.couponError) throw new HttpError(400, q.couponError);

    // Lock every puppy atomically; undo if any was bought a moment ago by someone else.
    const locked = [];
    for (const p of q.items) {
      // eslint-disable-next-line no-await-in-loop
      const r = await Pet.updateOne({ _id: p._id, status: 'available' }, { status: 'reserved' });
      if (!r.modifiedCount) {
        await Pet.updateMany({ _id: { $in: locked } }, { status: 'available' });
        throw new HttpError(409, `${p.name} was just bought by another family. Remove it from your cart to continue.`);
      }
      locked.push(p._id);
    }

    try {
      const cod = paymentMethod === 'cod';
      const groupNo = `OD${26110000 + (await nextSeq('group'))}`;
      const eta = new Date(Date.now() + (q.delivery ? 4 : 2) * 864e5);
      const addr = { name: address.name, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, pincode: String(address.pincode).trim() };
      let discountLeft = q.couponDiscount;
      const orders = [];
      for (let i = 0; i < q.items.length; i += 1) {
        const pet = q.items[i];
        const share = i === q.items.length - 1 ? discountLeft : Math.round((q.couponDiscount * pet.price) / (q.priceTotal || 1));
        discountLeft -= share;
        const deliveryFee = i === 0 ? q.delivery : 0;
        const total = pet.price - share + deliveryFee;
        const paid = cod ? 0 : total;
        // eslint-disable-next-line no-await-in-loop
        const seq = await nextSeq('order');
        // eslint-disable-next-line no-await-in-loop
        orders.push(await Order.create({
          orderNo: `PN${100000 + seq}`, groupNo, user: req.user._id, pet: pet._id,
          petSnapshot: { name: pet.name, breed: pet.breed, image: pet.images?.[0], slug: pet.slug, gender: pet.gender, price: pet.price, mrp: pet.mrp },
          customer: { name: addr.name, phone: addr.phone, email: req.user.email },
          paymentPlan: 'full', handover: 'home_delivery', handoverDate: eta, address: addr,
          petPrice: pet.price, deliveryFee, discount: share, total, amountPaid: paid, balanceDue: total - paid, coupon: q.coupon,
          paymentMethod: cod ? 'cash' : paymentMethod, paymentStatus: total === 0 || paid >= total ? 'paid' : 'pending', notes,
          timeline: [{ status: 'placed', note: pet.adoption ? 'Adoption request received. We will call you for a short home check.' : cod ? 'Order placed. Pay on delivery.' : 'Order placed. Payment received.' }],
        }));
      }
      if (q.couponDoc) await Coupon.updateOne({ _id: q.couponDoc._id }, { $inc: { used: 1 } });
      const user = await User.findById(req.user._id);
      if (!user.addresses.some((a) => a.line1 === addr.line1 && a.pincode === addr.pincode)) {
        user.addresses.forEach((a) => { a.isDefault = false; });
        user.addresses.unshift({ label: 'Home', ...addr, isDefault: true });
        await user.save();
      }
      res.status(201).json({ groupNo, orders, total: orders.reduce((x, o) => x + o.total, 0), paymentMethod });
    } catch (err) {
      await Pet.updateMany({ _id: { $in: locked } }, { status: 'available' });
      throw err;
    }
  }),
);

router.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const q = await quote(req.body);
    const { pet, couponDoc, ...rest } = q;
    res.json({ ...rest, available: pet.status === 'available', petName: pet.name });
  }),
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { petId, paymentPlan = 'deposit', handover = 'pickup', handoverDate, address, customer, paymentMethod = 'upi', coupon, notes } = req.body;
    if (!customer?.name || !customer?.phone) throw new HttpError(400, 'Please add your name and phone number');
    if (handover === 'home_delivery' && (!address?.line1 || !address?.city || !address?.pincode)) {
      throw new HttpError(400, 'Please add the full delivery address for your puppy');
    }
    const q = await quote({ petId, paymentPlan, handover, city: address?.city, coupon });
    if (q.couponError) throw new HttpError(400, q.couponError);

    // Atomically reserve so two families can't book the same puppy.
    const locked = await Pet.updateOne({ _id: q.pet._id, status: 'available' }, { status: 'reserved' });
    if (!locked.modifiedCount) throw new HttpError(409, `${q.pet.name} has just been reserved by another family. Explore similar puppies below.`);

    try {
      const seq = await nextSeq('order');
      const order = await Order.create({
        orderNo: `PN${100000 + seq}`,
        user: req.user._id,
        pet: q.pet._id,
        petSnapshot: { name: q.pet.name, breed: q.pet.breed, image: q.pet.images?.[0], slug: q.pet.slug, gender: q.pet.gender, price: q.pet.price },
        customer: { name: customer.name, phone: customer.phone, email: customer.email || req.user.email },
        paymentPlan: q.payNow >= q.total ? 'full' : paymentPlan,
        handover,
        handoverDate: handoverDate ? new Date(handoverDate) : undefined,
        address: handover === 'home_delivery' ? address : undefined,
        petPrice: q.petPrice,
        deliveryFee: q.deliveryFee,
        discount: q.discount,
        total: q.total,
        amountPaid: q.payNow, // online payment simulated as successful in this demo
        balanceDue: q.balance,
        coupon: q.couponDoc?.code,
        paymentMethod,
        paymentStatus: q.payNow >= q.total ? 'paid' : q.payNow > 0 ? 'partially_paid' : 'pending',
        notes,
        timeline: [{ status: 'placed', note: q.pet.adoption ? 'Adoption request received. We will call you for a short home check.' : `Reservation placed. ${q.payNow ? `₹${q.payNow.toLocaleString('en-IN')} received.` : ''}` }],
      });
      if (q.couponDoc) await Coupon.updateOne({ _id: q.couponDoc._id }, { $inc: { used: 1 } });
      res.status(201).json(order);
    } catch (err) {
      await Pet.updateOne({ _id: q.pet._id }, { status: 'available' });
      throw err;
    }
  }),
);

router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean());
  }),
);

router.get(
  '/mine/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { orderNo: req.params.id };
    const order = await Order.findOne({ ...q, user: req.user._id }).lean();
    if (!order) throw new HttpError(404, 'Reservation not found');
    res.json(order);
  }),
);

router.post(
  '/mine/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) throw new HttpError(404, 'Reservation not found');
    if (!['placed', 'confirmed'].includes(order.status)) throw new HttpError(400, 'This reservation is past the vet-check stage. Please call us to make changes.');
    await Pet.updateOne({ _id: order.pet, status: 'reserved' }, { status: 'available' });
    order.status = 'cancelled';
    order.timeline.push({ status: 'cancelled', note: req.body.reason ? `Cancelled by customer: ${String(req.body.reason).slice(0, 200)}` : 'Cancelled by customer. Refund initiated.' });
    if (order.amountPaid > 0) order.paymentStatus = 'refunded';
    await order.save();
    res.json(order);
  }),
);

// ---------- Admin ----------
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req, { defaultLimit: 20, maxLimit: 100 });
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(req.query.q), 'i');
      filter.$or = [{ orderNo: rx }, { 'customer.name': rx }, { 'customer.phone': rx }, { 'petSnapshot.name': rx }, { 'petSnapshot.breed': rx }];
    }
    const [items, total, counts] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit), counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
  }),
);

router.get(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone createdAt').populate('pet', 'name slug code breed images status costPrice breeder').lean();
    if (!order) throw new HttpError(404, 'Reservation not found');
    res.json(order);
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, 'Reservation not found');
    const { status, note, recordPayment, handoverDate, adminNotes } = req.body;
    if (status && status !== order.status) {
      if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
      if (status === 'cancelled') {
        await Pet.updateOne({ _id: order.pet, status: 'reserved' }, { status: 'available' });
        if (order.amountPaid > 0) order.paymentStatus = 'refunded';
      } else if (order.status === 'cancelled') {
        const r = await Pet.updateOne({ _id: order.pet, status: 'available' }, { status: 'reserved' });
        if (!r.modifiedCount) throw new HttpError(409, 'This puppy has been reserved by someone else since');
      }
      if (status === 'completed') {
        await Pet.updateOne({ _id: order.pet }, { status: 'sold' });
        order.amountPaid = order.total;
        order.balanceDue = 0;
        order.paymentStatus = 'paid';
      }
      order.status = status;
      order.timeline.push({ status, note: note || undefined });
    } else if (note) {
      order.timeline.push({ status: order.status, note });
    }
    if (recordPayment) {
      const amt = Math.max(0, Math.min(Number(recordPayment) || 0, order.balanceDue));
      order.amountPaid += amt;
      order.balanceDue -= amt;
      order.paymentStatus = order.balanceDue <= 0 ? 'paid' : 'partially_paid';
      order.timeline.push({ status: order.status, note: `Payment of ₹${amt.toLocaleString('en-IN')} recorded` });
    }
    if (handoverDate) order.handoverDate = new Date(handoverDate);
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    await order.save();
    res.json(order);
  }),
);

export default router;
