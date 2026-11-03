import mongoose from 'mongoose';

export { default as User } from './User.js';
export { default as Pet } from './Pet.js';

// ---------- Breeds (breed guide + filters) ----------
const breedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true },
    image: String,
    summary: String,
    description: String,
    size: { type: String, enum: ['toy', 'small', 'medium', 'large', 'giant'], default: 'medium' },
    origin: String,
    lifeSpan: String,
    weightRange: String,
    temperament: [String],
    goodWith: [String],
    energyLevel: { type: Number, min: 1, max: 5, default: 3 },
    shedding: { type: Number, min: 1, max: 5, default: 3 },
    grooming: { type: Number, min: 1, max: 5, default: 3 },
    trainability: { type: Number, min: 1, max: 5, default: 3 },
    apartmentFriendly: { type: Boolean, default: false },
    climateNote: String,
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const Breed = mongoose.model('Breed', breedSchema);

// ---------- Reservations / orders (one puppy per order) ----------
export const ORDER_STATUSES = ['placed', 'confirmed', 'vet_check', 'ready', 'completed', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', index: true },
    petSnapshot: { name: String, breed: String, image: String, slug: String, gender: String, price: Number },
    customer: { name: String, phone: String, email: String },
    paymentPlan: { type: String, enum: ['deposit', 'full'], default: 'deposit' },
    handover: { type: String, enum: ['pickup', 'home_delivery'], default: 'pickup' },
    handoverDate: Date,
    address: { line1: String, line2: String, city: String, state: String, pincode: String },
    petPrice: Number,
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: Number,
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    coupon: String,
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'cash'], default: 'upi' },
    paymentStatus: { type: String, enum: ['pending', 'partially_paid', 'paid', 'refunded'], default: 'pending' },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    timeline: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
    notes: String,
    adminNotes: String,
  },
  { timestamps: true },
);
orderSchema.index({ createdAt: -1 });
export const Order = mongoose.model('Order', orderSchema);

// ---------- Coupons ----------
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: ['percent', 'flat'], default: 'flat' },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: Number,
    expiresAt: Date,
    usageLimit: Number,
    used: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Coupon = mongoose.model('Coupon', couponSchema);

// ---------- Kennel visits & video calls ----------
export const VISIT_TYPES = [
  { key: 'kennel_visit', name: 'Visit the kennel', duration: '45 min', description: 'Meet the puppy and, where possible, the mother at our Indiranagar kennel.' },
  { key: 'video_call', name: 'Video call', duration: '20 min', description: 'A live WhatsApp video call with the puppy and our care team.' },
  { key: 'home_visit', name: 'Breed consultation', duration: '30 min', description: 'Not sure which breed fits your home? Talk it through with our team.' },
];

const bookingSchema = new mongoose.Schema(
  {
    bookingNo: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: VISIT_TYPES.map((v) => v.key), required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    petName: String,
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    date: { type: Date, required: true },
    slot: String,
    people: { type: Number, default: 1 },
    notes: String,
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending' },
  },
  { timestamps: true },
);
export const Booking = mongoose.model('Booking', bookingSchema);

// ---------- Enquiries ----------
const enquirySchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    petName: String,
    breed: String,
    name: String,
    phone: String,
    email: String,
    message: String,
    type: { type: String, enum: ['pet', 'breed_waitlist', 'general', 'adoption'], default: 'general' },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  },
  { timestamps: true },
);
export const Enquiry = mongoose.model('Enquiry', enquirySchema);

// ---------- Happy families (testimonials) ----------
const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: String,
    petName: String,
    breed: String,
    image: String,
    rating: { type: Number, min: 1, max: 5, default: 5 },
    quote: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const Testimonial = mongoose.model('Testimonial', testimonialSchema);

// ---------- Store settings ----------
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'site' },
    storeName: { type: String, default: 'PawNest' },
    tagline: String,
    announcement: String,
    heroTitle: String,
    heroSubtitle: String,
    heroImage: String,
    depositPercent: { type: Number, default: 10 },
    minDeposit: { type: Number, default: 5000 },
    homeDeliveryFee: { type: Number, default: 1500 },
    freeDeliveryCities: { type: [String], default: ['Bengaluru'] },
    outstationDeliveryFee: { type: Number, default: 6500 },
    healthGuaranteeMonths: { type: Number, default: 12 },
    visitSlots: { type: [String], default: ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM', '6:00 PM'] },
    contact: { phone: String, whatsapp: String, email: String, address: String, hours: String, mapUrl: String },
    social: { instagram: String, facebook: String, youtube: String },
  },
  { timestamps: true },
);
export const Setting = mongoose.model('Setting', settingSchema);

const subscriberSchema = new mongoose.Schema(
  { email: { type: String, unique: true, lowercase: true, trim: true } },
  { timestamps: true },
);
export const Subscriber = mongoose.model('Subscriber', subscriberSchema);

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = mongoose.model('Counter', counterSchema);

export const nextSeq = async (name) => {
  const c = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
};
