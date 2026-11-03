import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import {
  User, Pet, Breed, Order, Coupon, Booking, Enquiry, Testimonial, Setting, Counter, VISIT_TYPES,
} from '../models/index.js';
import { slugify } from '../utils/helpers.js';
import { fetchBreedPhotos } from './images.js';
import * as data from './data.js';

// Deterministic pseudo-random so the demo looks the same on every machine.
let s = 42;
const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => Math.floor(a + rand() * (b - a + 1));

export const seed = async ({ silent = false } = {}) => {
  const log = (...a) => !silent && console.log(...a);
  s = 42;

  log('[seed] downloading real dog photos (first run only, ~1 minute)…');
  const photos = await fetchBreedPhotos(8, console.log);
  const cursor = {};
  const photosFor = (breed, n = 3) => {
    const list = photos[breed]?.length ? photos[breed] : data.FALLBACK_PHOTOS;
    const start = cursor[breed] || 0;
    cursor[breed] = start + n;
    return Array.from({ length: n }, (_, i) => list[(start + i) % list.length]);
  };

  await Promise.all([
    User.deleteMany({}), Pet.deleteMany({}), Breed.deleteMany({}), Order.deleteMany({}), Coupon.deleteMany({}),
    Booking.deleteMany({}), Enquiry.deleteMany({}), Testimonial.deleteMany({}), Setting.deleteMany({}), Counter.deleteMany({}),
  ]);

  await Setting.create({ ...data.settings, heroImage: photos['Golden Retriever']?.[0] || data.FALLBACK_PHOTOS[0] });
  await Breed.insertMany(data.breeds.map((b) => ({ ...b, slug: slugify(b.name), image: (photos[b.name] || data.FALLBACK_PHOTOS)[photos[b.name]?.length > 7 ? 7 : 0] })));
  await Coupon.insertMany(data.coupons.map((c) => ({ ...c, expiresAt: new Date(Date.now() + 90 * 864e5) })));

  const admin = await User.create({ name: 'Store Admin', email: config.adminEmail, password: config.adminPassword, role: 'admin', phone: '9900000000' });
  await User.create({ name: 'Riya (Kennel staff)', email: 'staff@pawnest.in', password: 'Staff@123', role: 'staff', phone: '9900000001' });
  const demo = await User.create({
    name: 'Demo Customer', email: 'demo@pawnest.in', password: 'Demo@123', phone: '9876543210',
    addresses: [{ label: 'Home', name: 'Demo Customer', phone: '9876543210', line1: '221, Prestige Lakeside Habitat', line2: 'Varthur Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560087', isDefault: true }],
    preferences: { breeds: ['Golden Retriever', 'Beagle'], homeType: 'apartment', hasKids: true, firstDog: true },
  });
  const customers = [demo];
  for (const c of data.customers) {
    // eslint-disable-next-line no-await-in-loop
    customers.push(await User.create({
      name: c.name, email: c.email, phone: c.phone, password: 'Demo@123',
      addresses: [{ label: 'Home', name: c.name, phone: c.phone, line1: `${between(10, 400)}, ${between(1, 18)}th Cross`, line2: c.area, city: 'Bengaluru', state: 'Karnataka', pincode: `5600${between(10, 99)}`, isDefault: true }],
    }));
  }

  // Puppies on sale
  const pets = await Pet.insertMany(
    data.pets.map((p, i) => ({
      ...p,
      slug: slugify(`${p.name}-${p.breed}`),
      images: photosFor(p.breed, 3),
      parents: { ...p.parents, ...(p.adoption ? {} : { sireImage: photosFor(p.breed, 1)[0], damImage: photosFor(p.breed, 1)[0] }) },
      views: between(40, 900),
      createdAt: new Date(Date.now() - (i + 1) * 36e5 * 9),
    })),
  );

  // Puppies already sold — powers order history and dashboard trends
  const sold = await Pet.insertMany(
    data.pastSales.map(([name, breed, price], i) => ({
      name, breed, price, gender: i % 2 ? 'female' : 'male', slug: slugify(`${name}-${breed}-sold-${i}`),
      code: `PN-S-${300 + i}`, dob: new Date(Date.now() - (14 + i) * 7 * 864e5), color: 'Mixed', status: 'sold',
      size: data.breeds.find((b) => b.name === breed)?.size || 'medium', images: photosFor(breed, 1), costPrice: Math.round(price * 0.62),
      description: `${name} has found a loving home.`,
    })),
  );

  const orders = [];
  let seq = 0;
  const mkOrder = ({ pet, cust, createdAt, status, plan = 'full', handover = 'pickup' }) => {
    seq += 1;
    const price = pet.price;
    const deliveryFee = handover === 'home_delivery' ? 0 : 0;
    const discount = rand() > 0.75 ? 2000 : 0;
    const total = price + deliveryFee - discount;
    const deposit = Math.max(5000, Math.round((price * 0.1) / 500) * 500);
    const amountPaid = status === 'completed' || plan === 'full' ? total : Math.min(deposit, total);
    const FLOW = ['placed', 'confirmed', 'vet_check', 'ready', 'completed'];
    const upto = status === 'cancelled' ? ['placed', 'cancelled'] : FLOW.slice(0, FLOW.indexOf(status) + 1);
    const notes = { confirmed: 'Payment received. Puppy reserved for you.', vet_check: 'Final vet check and vaccination update done.', ready: 'Ready to go home! We will call to fix the handover time.', completed: 'Welcome home! Enjoy your new family member.' };
    orders.push({
      orderNo: `PN${100000 + seq}`, user: cust._id, pet: pet._id,
      petSnapshot: { name: pet.name, breed: pet.breed, image: pet.images[0], slug: pet.slug, gender: pet.gender, price },
      customer: { name: cust.name, phone: cust.phone, email: cust.email },
      paymentPlan: plan, handover, handoverDate: new Date(createdAt.getTime() + between(3, 10) * 864e5),
      address: handover === 'home_delivery' ? { ...cust.addresses[0].toObject(), _id: undefined } : undefined,
      petPrice: price, deliveryFee, discount, total, amountPaid, balanceDue: Math.max(0, total - amountPaid),
      coupon: discount ? 'FIRSTPUP' : undefined, paymentMethod: pick(['upi', 'upi', 'card', 'netbanking']),
      paymentStatus: status === 'cancelled' ? 'refunded' : amountPaid >= total ? 'paid' : 'partially_paid',
      status,
      timeline: upto.map((st, i) => ({ status: st, at: new Date(createdAt.getTime() + i * 1.5 * 864e5), note: notes[st] })),
      createdAt, updatedAt: createdAt,
    });
  };

  sold.forEach((pet, i) => {
    const day = Math.floor((i / sold.length) * 28) + between(0, 1);
    mkOrder({ pet, cust: pick(customers), createdAt: new Date(Date.now() - (29 - day) * 864e5 - between(0, 8) * 36e5), status: i === 5 ? 'cancelled' : 'completed', handover: rand() > 0.5 ? 'home_delivery' : 'pickup' });
  });
  pets.filter((p) => p.status === 'reserved').forEach((pet, i) => {
    mkOrder({ pet, cust: i === 0 ? demo : customers[i + 2], createdAt: new Date(Date.now() - (i + 2) * 864e5), status: i === 0 ? 'vet_check' : 'confirmed', plan: 'deposit', handover: 'home_delivery' });
  });
  // A sold available-listing puppy (Ginger) for the demo customer's history
  const ginger = pets.find((p) => p.status === 'sold');
  if (ginger) mkOrder({ pet: ginger, cust: demo, createdAt: new Date(Date.now() - 20 * 864e5), status: 'completed' });

  await Order.insertMany(orders);
  await Counter.create({ _id: 'order', seq });

  // Kennel visits & video calls
  const slots = data.settings.contact ? ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM', '6:00 PM'] : [];
  const available = pets.filter((p) => p.status === 'available');
  const bookings = Array.from({ length: 16 }, (_, i) => {
    const cust = pick(customers);
    const type = pick(VISIT_TYPES).key;
    const pet = pick(available);
    const offset = between(-8, 10);
    return {
      bookingNo: `BK${5001 + i}`, user: cust._id, type, pet: pet._id, petName: `${pet.name} (${pet.breed})`,
      name: cust.name, phone: cust.phone, email: cust.email, people: between(1, 4),
      date: new Date(new Date().setHours(0, 0, 0, 0) + offset * 864e5), slot: pick(slots),
      status: offset < 0 ? pick(['completed', 'completed', 'no_show', 'cancelled']) : pick(['pending', 'confirmed', 'confirmed']),
    };
  });
  await Booking.insertMany(bookings);
  await Counter.create({ _id: 'booking', seq: bookings.length });

  await Enquiry.insertMany([
    { pet: pets[0]._id, petName: pets[0].name, breed: pets[0].breed, name: 'Nikhil Gowda', phone: '9886012345', email: 'nikhil@example.com', message: 'Can we visit this Saturday to meet Biscuit? Are both parents available to see?', type: 'pet' },
    { pet: pets[16]._id, petName: pets[16].name, breed: pets[16].breed, name: 'Sana Khan', phone: '9886054321', message: 'Is EMI available for the French Bulldog?', type: 'pet' },
    { breed: 'Golden Retriever', name: 'Rohit Shetty', phone: '9886098765', message: 'Please add me to the waitlist for the next Golden Retriever litter (female).', type: 'breed_waitlist', status: 'contacted' },
    { pet: pets.find((p) => p.adoption)._id, petName: 'Kaalu', breed: 'Indie (Indian Pariah)', name: 'Lakshmi Iyer', phone: '9886011223', message: 'We would love to adopt Kaalu. We have a small garden.', type: 'adoption' },
  ]);

  await Testimonial.insertMany(data.testimonials.map((t) => ({ ...t, approved: true, image: photosFor(t.breed === 'Indie' ? 'Indie (Indian Pariah)' : t.breed, 1)[0] })));

  log(`[seed] ✔ ${pets.length} puppies listed, ${sold.length} past sales, ${orders.length} reservations, ${bookings.length} visits, ${customers.length} customers`);
  log(`[seed] Admin portal login → ${admin.email} / ${config.adminPassword}`);
  log('[seed] Storefront demo login → demo@pawnest.in / Demo@123');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mongoose
    .connect(config.mongoUri)
    .then(() => seed())
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error(err); process.exit(1); });
}
