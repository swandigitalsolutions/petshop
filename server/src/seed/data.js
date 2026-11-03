// Demo data for PawNest — a puppy store in Bengaluru.
// Real breed photos are downloaded at seed time (see images.js). The Unsplash list below
// is only an offline fallback.

const u = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=70`;
export const FALLBACK_PHOTOS = [
  '1552053831-71594a27632d', '1587300003388-59208cc962cb', '1543466835-00a7907e9de1', '1517849845537-4d257902454a',
  '1583511655857-d19b40a7a54e', '1561037404-61cd46aa615b', '1548199973-03cce0bbc87b', '1537151625747-768eb6cf92b2',
  '1518717758536-85ae29035b6d', '1530281700549-e82e7bf110d6', '1507146426996-ef05306b995a', '1477884213360-7e9d7dcc1e48',
].map(u);

export const breeds = [
  { name: 'Golden Retriever', size: 'large', origin: 'Scotland', lifeSpan: '10–12 years', weightRange: '25–34 kg', temperament: ['Gentle', 'Friendly', 'Eager to please'], goodWith: ['kids', 'first-time owners', 'other dogs', 'cats'], energyLevel: 4, shedding: 4, grooming: 3, trainability: 5, apartmentFriendly: false, featured: true, summary: 'The family dog everyone falls for — patient with kids and endlessly cheerful.', climateNote: 'Thick double coat: needs AC or a cool room during Bengaluru summers.' },
  { name: 'Labrador Retriever', size: 'large', origin: 'Canada', lifeSpan: '10–12 years', weightRange: '25–36 kg', temperament: ['Outgoing', 'Loyal', 'Playful'], goodWith: ['kids', 'first-time owners', 'other dogs'], energyLevel: 5, shedding: 3, grooming: 2, trainability: 5, apartmentFriendly: false, featured: true, summary: "India's most-loved breed: easy to train, great with children, happiest with a job to do.", climateNote: 'Adapts well to Indian weather with shade and plenty of water.' },
  { name: 'German Shepherd', size: 'large', origin: 'Germany', lifeSpan: '9–13 years', weightRange: '22–40 kg', temperament: ['Protective', 'Intelligent', 'Devoted'], goodWith: ['kids', 'active families'], energyLevel: 5, shedding: 4, grooming: 3, trainability: 5, apartmentFriendly: false, featured: true, summary: 'A brilliant, loyal guardian that thrives on training and daily exercise.', climateNote: 'Heavy shedder twice a year; brush 3–4 times a week.' },
  { name: 'Beagle', size: 'medium', origin: 'England', lifeSpan: '12–15 years', weightRange: '9–11 kg', temperament: ['Curious', 'Merry', 'Food-motivated'], goodWith: ['kids', 'other dogs', 'apartments'], energyLevel: 4, shedding: 2, grooming: 1, trainability: 3, apartmentFriendly: true, featured: true, summary: 'A compact, happy-go-lucky hound with a big nose and an even bigger heart.', climateNote: 'Short coat handles heat well.' },
  { name: 'Shih Tzu', size: 'toy', origin: 'Tibet / China', lifeSpan: '10–16 years', weightRange: '4–7 kg', temperament: ['Affectionate', 'Charming', 'Outgoing'], goodWith: ['apartments', 'kids', 'seniors', 'first-time owners'], energyLevel: 2, shedding: 1, grooming: 5, trainability: 3, apartmentFriendly: true, featured: true, summary: 'A low-shedding lap dog made for apartment living and lots of cuddles.', climateNote: 'Flat face — keep indoors in peak afternoon heat.' },
  { name: 'Pug', size: 'small', origin: 'China', lifeSpan: '12–15 years', weightRange: '6–8 kg', temperament: ['Comical', 'Loving', 'Easy-going'], goodWith: ['apartments', 'kids', 'seniors', 'first-time owners'], energyLevel: 2, shedding: 3, grooming: 2, trainability: 3, apartmentFriendly: true, featured: true, summary: 'Big personality in a small body. Pugs live to make their family laugh.', climateNote: 'Brachycephalic breed: avoid exercise in the heat of the day.' },
  { name: 'Siberian Husky', size: 'large', origin: 'Siberia', lifeSpan: '12–14 years', weightRange: '16–27 kg', temperament: ['Adventurous', 'Vocal', 'Friendly'], goodWith: ['active families', 'other dogs'], energyLevel: 5, shedding: 5, grooming: 3, trainability: 2, apartmentFriendly: false, featured: true, summary: 'Striking, athletic and talkative. Best for experienced, active families.', climateNote: 'Must live in an air-conditioned home in India.' },
  { name: 'French Bulldog', size: 'small', origin: 'France', lifeSpan: '10–12 years', weightRange: '8–13 kg', temperament: ['Adaptable', 'Playful', 'Alert'], goodWith: ['apartments', 'first-time owners', 'seniors'], energyLevel: 2, shedding: 2, grooming: 1, trainability: 3, apartmentFriendly: true, featured: true, summary: 'The ultimate city dog: quiet, low-maintenance and full of charm.', climateNote: 'Needs AC in summer; short walks in the cool of the morning.' },
  { name: 'Pomeranian', size: 'toy', origin: 'Germany / Poland', lifeSpan: '12–16 years', weightRange: '1.5–3.5 kg', temperament: ['Lively', 'Bold', 'Inquisitive'], goodWith: ['apartments', 'seniors'], energyLevel: 3, shedding: 4, grooming: 4, trainability: 3, apartmentFriendly: true, summary: 'A tiny fluffball with the confidence of a big dog.' },
  { name: 'Rottweiler', size: 'large', origin: 'Germany', lifeSpan: '9–10 years', weightRange: '35–60 kg', temperament: ['Confident', 'Protective', 'Calm'], goodWith: ['experienced owners'], energyLevel: 4, shedding: 2, grooming: 1, trainability: 4, apartmentFriendly: false, summary: 'A calm, powerful protector who is a softie with family.' },
  { name: 'Cocker Spaniel', size: 'medium', origin: 'England', lifeSpan: '12–15 years', weightRange: '12–15 kg', temperament: ['Merry', 'Gentle', 'Affectionate'], goodWith: ['kids', 'apartments', 'first-time owners'], energyLevel: 3, shedding: 3, grooming: 4, trainability: 4, apartmentFriendly: true, summary: 'Soft-eyed and sweet-natured with a happily wagging tail.' },
  { name: 'Dachshund', size: 'small', origin: 'Germany', lifeSpan: '12–16 years', weightRange: '7–14 kg', temperament: ['Brave', 'Curious', 'Spunky'], goodWith: ['apartments', 'seniors'], energyLevel: 3, shedding: 2, grooming: 1, trainability: 2, apartmentFriendly: true, summary: 'The courageous little sausage dog with a huge personality.' },
  { name: 'Doberman', size: 'large', origin: 'Germany', lifeSpan: '10–13 years', weightRange: '27–45 kg', temperament: ['Fearless', 'Alert', 'Loyal'], goodWith: ['experienced owners', 'active families'], energyLevel: 5, shedding: 2, grooming: 1, trainability: 5, apartmentFriendly: false, summary: 'Sleek, athletic and deeply loyal: a superb family guardian.' },
  { name: 'Maltese', size: 'toy', origin: 'Malta', lifeSpan: '12–15 years', weightRange: '2–4 kg', temperament: ['Gentle', 'Playful', 'Fearless'], goodWith: ['apartments', 'seniors', 'first-time owners'], energyLevel: 2, shedding: 1, grooming: 5, trainability: 3, apartmentFriendly: true, summary: 'A silky white companion that barely sheds.' },
  { name: 'Lhasa Apso', size: 'small', origin: 'Tibet', lifeSpan: '12–15 years', weightRange: '5–8 kg', temperament: ['Independent', 'Alert', 'Affectionate'], goodWith: ['apartments', 'seniors'], energyLevel: 2, shedding: 1, grooming: 4, trainability: 2, apartmentFriendly: true, summary: 'An ancient watchdog breed: dignified, devoted and low-shedding.' },
  { name: 'Border Collie', size: 'medium', origin: 'Scotland / England', lifeSpan: '12–15 years', weightRange: '14–20 kg', temperament: ['Brilliant', 'Energetic', 'Trainable'], goodWith: ['active families', 'kids'], energyLevel: 5, shedding: 3, grooming: 3, trainability: 5, apartmentFriendly: false, summary: 'Widely considered the smartest dog breed. Needs a busy, active home.' },
  { name: 'Great Dane', size: 'giant', origin: 'Germany', lifeSpan: '8–10 years', weightRange: '50–80 kg', temperament: ['Gentle giant', 'Patient', 'Friendly'], goodWith: ['kids', 'experienced owners'], energyLevel: 3, shedding: 3, grooming: 1, trainability: 3, apartmentFriendly: false, summary: 'Majestic and surprisingly gentle: a true gentle giant.' },
  { name: 'Indie (Indian Pariah)', size: 'medium', origin: 'India', lifeSpan: '13–16 years', weightRange: '15–25 kg', temperament: ['Smart', 'Hardy', 'Loyal'], goodWith: ['kids', 'first-time owners', 'apartments'], energyLevel: 4, shedding: 2, grooming: 1, trainability: 4, apartmentFriendly: true, featured: true, summary: 'Healthy, clever and made for Indian weather. Adopt a rescued Indie free of cost.', climateNote: 'Perfectly suited to Indian climate.' },
].map((b, i) => ({
  ...b,
  order: i + 1,
  description: `${b.summary} ${b.name}s typically weigh ${b.weightRange} as adults and live ${b.lifeSpan}. They are known for being ${b.temperament.map((t) => t.toLowerCase()).join(', ')}.${b.climateNote ? ` ${b.climateNote}` : ''} Every ${b.name} puppy at PawNest is vet-checked, vaccinated for its age, dewormed, and comes with our health guarantee.`,
}));

const daysAgo = (d) => new Date(Date.now() - d * 864e5);
const weeksOld = (w) => daysAgo(w * 7);
const inDays = (d) => new Date(Date.now() + d * 864e5);

const VAX_8W = ['DHPPi — 1st dose', 'Deworming ×3'];
const VAX_12W = ['DHPPi — 1st & 2nd dose', 'Leptospirosis', 'Deworming ×4'];
const VAX_16W = ['DHPPi — 3 doses', 'Leptospirosis', 'Anti-rabies', 'Deworming ×4'];
const vaxFor = (w) => (w >= 15 ? VAX_16W : w >= 11 ? VAX_12W : VAX_8W);
const INCLUDED = ['Vet health certificate', 'Vaccination & deworming card', '7-day food pack', 'Blanket with mother\'s scent', 'Free first vet check-up', 'Lifetime care helpline'];

const p = (o) => ({ ...o, dob: weeksOld(o.weeks), vaccinations: vaxFor(o.weeks), readyToGoHome: o.weeks >= 8 ? undefined : inDays((8 - o.weeks) * 7) });

export const pets = [
  p({ name: 'Biscuit', breed: 'Golden Retriever', gender: 'male', weeks: 9, color: 'Light gold', size: 'large', weightKg: 6.2, price: 45000, mrp: 52000, temperament: ['Gentle', 'Playful', 'Eager to please'], goodWith: ['kids', 'first-time owners', 'other dogs'], energyLevel: 4, kciRegistered: true, microchipped: true, parents: { sire: 'Ch. Rocky (KCI)', dam: 'Daisy (KCI)' }, featured: true, tags: ['family favourite'], breeder: 'Sunshine Kennels, Hosur', costPrice: 30000 }),
  p({ name: 'Honey', breed: 'Golden Retriever', gender: 'female', weeks: 10, color: 'Cream', size: 'large', weightKg: 5.8, price: 48000, mrp: 55000, temperament: ['Affectionate', 'Calm', 'Smart'], goodWith: ['kids', 'first-time owners', 'cats'], energyLevel: 3, kciRegistered: true, microchipped: true, parents: { sire: 'Max (KCI)', dam: 'Bella (KCI)' }, featured: true, breeder: 'Sunshine Kennels, Hosur', costPrice: 32000 }),
  p({ name: 'Simba', breed: 'Golden Retriever', gender: 'male', weeks: 13, color: 'Dark gold', size: 'large', weightKg: 8.0, price: 42000, temperament: ['Happy', 'Social', 'Gentle'], goodWith: ['kids', 'first-time owners'], energyLevel: 4, kciRegistered: true, parents: { sire: 'Rocky', dam: 'Sunny' }, status: 'reserved', breeder: 'Sunshine Kennels, Hosur', costPrice: 28000 }),
  p({ name: 'Bruno', breed: 'Labrador Retriever', gender: 'male', weeks: 8, color: 'Yellow', size: 'large', weightKg: 5.5, price: 28000, mrp: 32000, temperament: ['Friendly', 'Outgoing', 'Loves water'], goodWith: ['kids', 'first-time owners', 'other dogs'], energyLevel: 5, kciRegistered: true, parents: { sire: 'Tiger', dam: 'Lucy' }, featured: true, breeder: 'Green Acres, Mysuru', costPrice: 18000 }),
  p({ name: 'Coco', breed: 'Labrador Retriever', gender: 'female', weeks: 11, color: 'Chocolate', size: 'large', weightKg: 7.1, price: 32000, mrp: 36000, temperament: ['Loyal', 'Playful', 'Gentle'], goodWith: ['kids', 'other dogs'], energyLevel: 4, kciRegistered: true, microchipped: true, parents: { sire: 'Hershey (KCI)', dam: 'Mocha (KCI)' }, breeder: 'Green Acres, Mysuru', costPrice: 20000 }),
  p({ name: 'Ebony', breed: 'Labrador Retriever', gender: 'female', weeks: 7, color: 'Black', size: 'large', weightKg: 4.6, price: 30000, temperament: ['Sweet', 'Eager', 'Gentle'], goodWith: ['kids', 'first-time owners'], energyLevel: 4, kciRegistered: true, parents: { sire: 'Jet', dam: 'Lucy' }, tags: ['pre-book'], breeder: 'Green Acres, Mysuru', costPrice: 19000 }),
  p({ name: 'Shadow', breed: 'German Shepherd', gender: 'male', weeks: 10, color: 'Black & tan', size: 'large', weightKg: 7.8, price: 38000, mrp: 45000, temperament: ['Protective', 'Intelligent', 'Loyal'], goodWith: ['kids', 'active families'], energyLevel: 5, kciRegistered: true, microchipped: true, parents: { sire: 'Rex (show line, KCI)', dam: 'Luna (KCI)' }, featured: true, tags: ['show line'], breeder: 'Vom Haus Kennels, Bengaluru', costPrice: 25000 }),
  p({ name: 'Zara', breed: 'German Shepherd', gender: 'female', weeks: 9, color: 'Sable', size: 'large', weightKg: 6.4, price: 36000, temperament: ['Alert', 'Smart', 'Devoted'], goodWith: ['active families'], energyLevel: 5, kciRegistered: true, parents: { sire: 'Rex', dam: 'Kiara' }, breeder: 'Vom Haus Kennels, Bengaluru', costPrice: 24000 }),
  p({ name: 'Milo', breed: 'Beagle', gender: 'male', weeks: 9, color: 'Tricolour', size: 'medium', weightKg: 3.4, price: 30000, mrp: 34000, temperament: ['Curious', 'Merry', 'Food-motivated'], goodWith: ['kids', 'other dogs', 'apartments'], energyLevel: 4, kciRegistered: true, parents: { sire: 'Snoopy', dam: 'Lola' }, featured: true, breeder: 'Happy Tails, Chennai', costPrice: 19000 }),
  p({ name: 'Ginger', breed: 'Beagle', gender: 'female', weeks: 12, color: 'Lemon & white', size: 'medium', weightKg: 3.8, price: 28000, temperament: ['Friendly', 'Curious', 'Gentle'], goodWith: ['kids', 'apartments'], energyLevel: 4, parents: { sire: 'Snoopy', dam: 'Rosie' }, status: 'sold', breeder: 'Happy Tails, Chennai', costPrice: 18000 }),
  p({ name: 'Mochi', breed: 'Shih Tzu', gender: 'female', weeks: 10, color: 'Gold & white', size: 'toy', weightKg: 1.6, price: 35000, mrp: 40000, temperament: ['Affectionate', 'Charming', 'Lap dog'], goodWith: ['apartments', 'kids', 'seniors', 'first-time owners'], energyLevel: 2, kciRegistered: true, microchipped: true, parents: { sire: 'Prince (imported line)', dam: 'Kiki' }, featured: true, tags: ['low shedding'], breeder: 'Royal Paws, Bengaluru', costPrice: 22000 }),
  p({ name: 'Teddy', breed: 'Shih Tzu', gender: 'male', weeks: 8, color: 'Black & white', size: 'toy', weightKg: 1.4, price: 32000, temperament: ['Playful', 'Sweet', 'Outgoing'], goodWith: ['apartments', 'kids', 'seniors'], energyLevel: 3, parents: { sire: 'Oreo', dam: 'Kiki' }, breeder: 'Royal Paws, Bengaluru', costPrice: 20000 }),
  p({ name: 'Peanut', breed: 'Pug', gender: 'male', weeks: 9, color: 'Fawn', size: 'small', weightKg: 2.1, price: 22000, mrp: 26000, temperament: ['Comical', 'Loving', 'Easy-going'], goodWith: ['apartments', 'kids', 'seniors', 'first-time owners'], energyLevel: 2, parents: { sire: 'Gizmo', dam: 'Pixie' }, featured: true, breeder: 'Royal Paws, Bengaluru', costPrice: 13000 }),
  p({ name: 'Olive', breed: 'Pug', gender: 'female', weeks: 11, color: 'Black', size: 'small', weightKg: 2.6, price: 24000, temperament: ['Sweet', 'Cuddly', 'Calm'], goodWith: ['apartments', 'seniors'], energyLevel: 2, parents: { sire: 'Gizmo', dam: 'Bubbles' }, breeder: 'Royal Paws, Bengaluru', costPrice: 14000 }),
  p({ name: 'Luna', breed: 'Siberian Husky', gender: 'female', weeks: 10, color: 'Grey & white, blue eyes', size: 'large', weightKg: 5.9, price: 55000, mrp: 65000, temperament: ['Adventurous', 'Vocal', 'Friendly'], goodWith: ['active families', 'other dogs'], energyLevel: 5, kciRegistered: true, microchipped: true, parents: { sire: 'Storm (imported)', dam: 'Nova (KCI)' }, featured: true, tags: ['blue eyes'], breeder: 'Northern Star, Ooty', costPrice: 38000 }),
  p({ name: 'Frost', breed: 'Siberian Husky', gender: 'male', weeks: 12, color: 'Black & white', size: 'large', weightKg: 7.5, price: 52000, temperament: ['Energetic', 'Mischievous', 'Social'], goodWith: ['active families', 'other dogs'], energyLevel: 5, kciRegistered: true, parents: { sire: 'Storm', dam: 'Aurora' }, status: 'reserved', breeder: 'Northern Star, Ooty', costPrice: 36000 }),
  p({ name: 'Pierre', breed: 'French Bulldog', gender: 'male', weeks: 11, color: 'Blue fawn', size: 'small', weightKg: 3.8, price: 95000, mrp: 110000, temperament: ['Adaptable', 'Playful', 'Clownish'], goodWith: ['apartments', 'first-time owners', 'seniors'], energyLevel: 2, kciRegistered: true, microchipped: true, parents: { sire: 'Bleu (imported)', dam: 'Coco Chanel' }, featured: true, tags: ['premium'], breeder: 'Maison Frenchie, Pune', costPrice: 70000 }),
  p({ name: 'Brie', breed: 'French Bulldog', gender: 'female', weeks: 10, color: 'Cream', size: 'small', weightKg: 3.3, price: 98000, temperament: ['Affectionate', 'Calm', 'Playful'], goodWith: ['apartments', 'seniors'], energyLevel: 2, kciRegistered: true, microchipped: true, parents: { sire: 'Bleu (imported)', dam: 'Margot' }, breeder: 'Maison Frenchie, Pune', costPrice: 72000 }),
  p({ name: 'Cotton', breed: 'Pomeranian', gender: 'female', weeks: 9, color: 'Orange sable', size: 'toy', weightKg: 1.1, price: 26000, mrp: 30000, temperament: ['Lively', 'Bold', 'Cuddly'], goodWith: ['apartments', 'seniors'], energyLevel: 3, parents: { sire: 'Fluffy', dam: 'Candy' }, featured: true, breeder: 'Royal Paws, Bengaluru', costPrice: 15000 }),
  p({ name: 'Tyson', breed: 'Rottweiler', gender: 'male', weeks: 10, color: 'Black & mahogany', size: 'large', weightKg: 8.4, price: 35000, mrp: 40000, temperament: ['Confident', 'Protective', 'Calm'], goodWith: ['experienced owners'], energyLevel: 4, kciRegistered: true, parents: { sire: 'Zeus (KCI)', dam: 'Athena (KCI)' }, breeder: 'Vom Haus Kennels, Bengaluru', costPrice: 22000 }),
  p({ name: 'Rosie', breed: 'Cocker Spaniel', gender: 'female', weeks: 9, color: 'Golden', size: 'medium', weightKg: 2.9, price: 34000, temperament: ['Merry', 'Gentle', 'Affectionate'], goodWith: ['kids', 'apartments', 'first-time owners'], energyLevel: 3, kciRegistered: true, parents: { sire: 'Duke', dam: 'Ruby' }, breeder: 'Happy Tails, Chennai', costPrice: 21000 }),
  p({ name: 'Oscar', breed: 'Dachshund', gender: 'male', weeks: 10, color: 'Red', size: 'small', weightKg: 2.4, price: 38000, mrp: 42000, temperament: ['Brave', 'Curious', 'Spunky'], goodWith: ['apartments', 'seniors'], energyLevel: 3, kciRegistered: true, parents: { sire: 'Frank', dam: 'Heidi' }, featured: true, breeder: 'Happy Tails, Chennai', costPrice: 25000 }),
  p({ name: 'Duke', breed: 'Doberman', gender: 'male', weeks: 11, color: 'Black & rust', size: 'large', weightKg: 8.0, price: 32000, temperament: ['Fearless', 'Alert', 'Loyal'], goodWith: ['experienced owners', 'active families'], energyLevel: 5, kciRegistered: true, parents: { sire: 'Baron', dam: 'Sasha' }, breeder: 'Vom Haus Kennels, Bengaluru', costPrice: 20000 }),
  p({ name: 'Snowy', breed: 'Maltese', gender: 'female', weeks: 10, color: 'Pure white', size: 'toy', weightKg: 1.2, price: 42000, mrp: 48000, temperament: ['Gentle', 'Playful', 'Fearless'], goodWith: ['apartments', 'seniors', 'first-time owners'], energyLevel: 2, kciRegistered: true, microchipped: true, parents: { sire: 'Angel', dam: 'Pearl' }, tags: ['low shedding'], breeder: 'Royal Paws, Bengaluru', costPrice: 28000 }),
  p({ name: 'Momo', breed: 'Lhasa Apso', gender: 'male', weeks: 9, color: 'Honey', size: 'small', weightKg: 1.9, price: 24000, temperament: ['Independent', 'Alert', 'Affectionate'], goodWith: ['apartments', 'seniors'], energyLevel: 2, parents: { sire: 'Tashi', dam: 'Dolma' }, breeder: 'Himalayan Kennels, Darjeeling', costPrice: 14000 }),
  p({ name: 'Scout', breed: 'Border Collie', gender: 'female', weeks: 10, color: 'Black & white', size: 'medium', weightKg: 4.2, price: 60000, mrp: 70000, temperament: ['Brilliant', 'Energetic', 'Trainable'], goodWith: ['active families', 'kids'], energyLevel: 5, kciRegistered: true, microchipped: true, parents: { sire: 'Flash (working line)', dam: 'Skye' }, tags: ['smartest breed'], breeder: 'Northern Star, Ooty', costPrice: 42000 }),
  p({ name: 'Apollo', breed: 'Great Dane', gender: 'male', weeks: 11, color: 'Harlequin', size: 'giant', weightKg: 12.0, price: 70000, mrp: 80000, temperament: ['Gentle giant', 'Patient', 'Friendly'], goodWith: ['kids', 'experienced owners'], energyLevel: 3, kciRegistered: true, microchipped: true, parents: { sire: 'Titan (KCI)', dam: 'Hera (KCI)' }, breeder: 'Vom Haus Kennels, Bengaluru', costPrice: 50000 }),
  p({ name: 'Kaalu', breed: 'Indie (Indian Pariah)', gender: 'male', weeks: 14, color: 'Fawn', size: 'medium', weightKg: 6.0, price: 0, adoption: true, temperament: ['Smart', 'Hardy', 'Loyal'], goodWith: ['kids', 'first-time owners', 'apartments'], energyLevel: 4, microchipped: true, description: "Kaalu was rescued from a construction site in Whitefield at four weeks old. He is fully vaccinated, dewormed and litter-trained, and loves a game of fetch. Adoption is completely free — we'll just do a short home check and ask you to sign our adoption pledge.", parents: { sire: 'Unknown', dam: 'Unknown' }, tags: ['rescue'], featured: true, breeder: 'PawNest Rescue' }),
  p({ name: 'Bindi', breed: 'Indie (Indian Pariah)', gender: 'female', weeks: 16, color: 'Black & tan', size: 'medium', weightKg: 6.5, price: 0, adoption: true, temperament: ['Gentle', 'Clever', 'Calm'], goodWith: ['kids', 'cats', 'first-time owners'], energyLevel: 3, description: 'Bindi is a calm, sweet girl who loves belly rubs and naps in the sun. She came to us from a feeder in Jayanagar. Free adoption with a home check; her spay surgery is covered by us.', parents: { sire: 'Unknown', dam: 'Unknown' }, tags: ['rescue'], breeder: 'PawNest Rescue' }),
  p({ name: 'Raja', breed: 'Indie (Indian Pariah)', gender: 'male', weeks: 18, color: 'Ginger', size: 'medium', weightKg: 8.2, price: 0, adoption: true, temperament: ['Playful', 'Loyal', 'Brave'], goodWith: ['kids', 'other dogs'], energyLevel: 4, description: 'Raja is an energetic boy who would love a home with a garden or a family that enjoys long walks. Fully vaccinated and neutered.', parents: { sire: 'Unknown', dam: 'Unknown' }, tags: ['rescue'], breeder: 'PawNest Rescue' }),
].map((pet, i) => {
  const { weeks, ...rest } = pet;
  const he = rest.gender === 'male' ? 'He' : 'She';
  const him = rest.gender === 'male' ? 'him' : 'her';
  const description = rest.description ||
    `Meet ${rest.name}, a ${rest.gender === 'male' ? 'handsome boy' : 'beautiful girl'} with a ${rest.color.toLowerCase()} coat. ${rest.name} was raised in a home environment by our partner breeder, handled daily, and is already used to children, pressure cookers and doorbells. ${he} has been examined by our vet and goes home with a full health certificate and our 12-month health guarantee. Book a visit to meet ${him} at our Indiranagar kennel, or ask for a live video call.`;
  const code = `PN-${rest.breed.split(/[\s(]/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}-${String(101 + i)}`;
  return { ...rest, description, code, included: INCLUDED, location: 'Bengaluru', healthGuaranteeMonths: rest.adoption ? 0 : 12 };
});

export const settings = {
  key: 'site',
  storeName: 'PawNest',
  tagline: 'Healthy, happy puppies from breeders we know by name.',
  announcement: 'Free home delivery of your puppy anywhere in Bengaluru. Every puppy comes with a 12-month health guarantee.',
  heroTitle: 'Bring home a puppy you can be sure of',
  heroSubtitle: 'Vet-checked, vaccinated puppies from ethical, home-raised litters. Meet them at our Indiranagar kennel or on a video call before you decide.',
  depositPercent: 10,
  minDeposit: 5000,
  homeDeliveryFee: 1500,
  freeDeliveryCities: ['Bengaluru'],
  outstationDeliveryFee: 6500,
  healthGuaranteeMonths: 12,
  contact: {
    phone: '+91 80 4567 8910',
    whatsapp: '+91 98450 12345',
    email: 'hello@pawnest.in',
    address: '42, 12th Main, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
    hours: 'Open every day, 10 AM to 8 PM',
    mapUrl: 'https://maps.google.com/?q=Indiranagar+Bengaluru',
  },
  social: { instagram: 'https://instagram.com', facebook: 'https://facebook.com', youtube: 'https://youtube.com' },
};

export const coupons = [
  { code: 'FIRSTPUP', description: '₹2,000 off your first puppy', type: 'flat', value: 2000, minOrder: 20000 },
  { code: 'DIWALI5', description: '5% off any puppy (up to ₹5,000)', type: 'percent', value: 5, minOrder: 25000, maxDiscount: 5000 },
  { code: 'FAMILY3K', description: '₹3,000 off for returning PawNest families', type: 'flat', value: 3000, minOrder: 30000 },
];

export const testimonials = [
  { name: 'Ananya & Rohit', city: 'Koramangala', petName: 'Leo', breed: 'Golden Retriever', rating: 5, quote: 'We visited three times before deciding and nobody rushed us. Leo came home with his vaccination card, food and even a blanket that smelled of his mum. Two years on, he is the healthiest, happiest boy.', featured: true },
  { name: 'Priya Sharma', city: 'Whitefield', petName: 'Momo', breed: 'Shih Tzu', rating: 5, quote: 'As a first-time owner I had a hundred questions. The PawNest team answered every one on WhatsApp, even at 11 PM. Momo is perfect for our apartment and barely sheds.', featured: true },
  { name: 'Karthik Nair', city: 'Indiranagar', petName: 'Kaiser', breed: 'German Shepherd', rating: 5, quote: 'They showed us both parents and the health papers. Kaiser had a small tummy issue in week two and they arranged the vet visit free of cost. That is what a real health guarantee looks like.', featured: true },
  { name: 'Meera Krishnan', city: 'Malleshwaram', petName: 'Tuffy', breed: 'Indie', rating: 5, quote: 'We adopted Tuffy through PawNest Rescue. The home check was friendly, and the team still calls to ask how he is doing. Adopting an Indie was the best decision we made.', featured: true },
  { name: 'Sana Khan', city: 'HSR Layout', petName: 'Pebble', breed: 'French Bulldog', rating: 5, quote: 'Pebble was delivered home in an AC car with a care person who stayed for an hour to settle her in. Worth every rupee.', featured: true },
  { name: 'Vikram Joshi', city: 'Hebbal', petName: 'Bolt', breed: 'Labrador Retriever', rating: 4, quote: 'Lovely, healthy pup and a smooth process. The reservation tracker made it easy to know when Bolt was ready to come home.', featured: true },
];

export const customers = [
  { name: 'Ananya Rao', email: 'ananya@example.com', phone: '9845011111', area: 'Koramangala' },
  { name: 'Rahul Mehta', email: 'rahul@example.com', phone: '9845022222', area: 'HSR Layout' },
  { name: 'Priya Sharma', email: 'priya@example.com', phone: '9845033333', area: 'Whitefield' },
  { name: 'Karthik Nair', email: 'karthik@example.com', phone: '9845044444', area: 'Indiranagar' },
  { name: 'Sneha Patil', email: 'sneha@example.com', phone: '9845055555', area: 'Jayanagar' },
  { name: 'Vikram Joshi', email: 'vikram@example.com', phone: '9845066666', area: 'Hebbal' },
  { name: 'Meera Krishnan', email: 'meera@example.com', phone: '9845077777', area: 'Malleshwaram' },
  { name: 'Arjun Thomas', email: 'arjun@example.com', phone: '9845088888', area: 'BTM Layout' },
];

// Sold puppies used to populate order history and dashboard trends.
export const pastSales = [
  ['Leo', 'Golden Retriever', 46000], ['Bolt', 'Labrador Retriever', 29000], ['Kaiser', 'German Shepherd', 37000],
  ['Pebble', 'French Bulldog', 92000], ['Daisy', 'Beagle', 29000], ['Fluffy', 'Pomeranian', 25000],
  ['Rani', 'Shih Tzu', 34000], ['Thor', 'Siberian Husky', 54000], ['Buddy', 'Labrador Retriever', 27000],
  ['Ruby', 'Cocker Spaniel', 33000], ['Ziggy', 'Pug', 22000], ['Bella', 'Golden Retriever', 47000],
  ['Rocky', 'Rottweiler', 34000], ['Chikki', 'Shih Tzu', 33000], ['Max', 'German Shepherd', 36000],
  ['Noodle', 'Dachshund', 37000], ['Sky', 'Siberian Husky', 53000], ['Muffin', 'Maltese', 41000],
  ['Oreo', 'Shih Tzu', 31000], ['Jack', 'Beagle', 30000], ['Ace', 'Doberman', 31000], ['Lily', 'Labrador Retriever', 30000],
];
