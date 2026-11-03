import mongoose from 'mongoose';

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    code: { type: String, index: true }, // kennel reference, e.g. PN-GR-014
    breed: { type: String, required: true, index: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    dob: Date,
    color: String,
    size: { type: String, enum: ['toy', 'small', 'medium', 'large', 'giant'], default: 'medium', index: true },
    weightKg: Number,
    price: { type: Number, required: true, min: 0 },
    mrp: Number,
    images: [String],
    videoUrl: String,
    description: String,
    temperament: [String],
    goodWith: [String],
    energyLevel: { type: Number, min: 1, max: 5, default: 3 },
    vaccinated: { type: Boolean, default: true },
    vaccinations: [String],
    dewormed: { type: Boolean, default: true },
    microchipped: { type: Boolean, default: false },
    kciRegistered: { type: Boolean, default: false },
    vetChecked: { type: Boolean, default: true },
    healthGuaranteeMonths: { type: Number, default: 12 },
    parents: {
      sire: String,
      dam: String,
      sireImage: String,
      damImage: String,
    },
    included: [String], // what goes home with the puppy
    location: { type: String, default: 'Bengaluru' },
    readyToGoHome: Date,
    adoption: { type: Boolean, default: false, index: true },
    homeDelivery: { type: Boolean, default: true },
    status: { type: String, enum: ['available', 'reserved', 'sold', 'hidden'], default: 'available', index: true },
    featured: { type: Boolean, default: false, index: true },
    tags: [String],
    views: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 }, // admin only — breeder payout
    breeder: String, // admin only
  },
  { timestamps: true },
);

petSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Pet', petSchema);
