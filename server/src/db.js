import mongoose from 'mongoose';
import { config } from './config.js';
import { Pet, Counter } from './models/index.js';
import { seed } from './seed/seed.js';

// One shared connection per process. On Vercel each function instance reuses it
// across requests instead of reconnecting every time.
let connecting = null;

const autoSeed = async () => {
  if (await Pet.estimatedDocumentCount()) return;
  // Several cold starts can hit an empty database at once; only the one that
  // creates the lock document seeds, the others carry on.
  try {
    await Counter.create({ _id: 'seed-lock', seq: Date.now() });
  } catch (err) {
    if (err.code === 11000) return;
    throw err;
  }
  console.log('[seed] empty database detected — loading demo store data…');
  try {
    await seed({ silent: true });
  } catch (err) {
    await Counter.deleteOne({ _id: 'seed-lock' });
    throw err;
  }
};

export const connectDb = () => {
  if (!connecting) {
    connecting = (async () => {
      if (!config.mongoUri) throw new Error('MONGO_URI is not set');
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log(`[db] connected ${mongoose.connection.host}/${mongoose.connection.name}`);
      await autoSeed();
    })().catch((err) => {
      connecting = null; // let the next request retry
      throw err;
    });
  }
  return connecting;
};
