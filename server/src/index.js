import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { invalidateOnWrite } from './utils/cache.js';
import { Pet } from './models/index.js';
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pets.js';
import orderRoutes from './routes/orders.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { seed } from './seed/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || config.origins.includes(origin) || config.origins.includes('*')),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static assets are fingerprinted / immutable — cache them hard.
const staticOpts = { maxAge: '30d', immutable: true };
app.use('/uploads', express.static(path.resolve('uploads'), staticOpts));
app.use('/static', express.static(path.join(__dirname, '..', 'public'), staticOpts));

app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));

app.use('/api', invalidateOnWrite);
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value already exists';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'Image is too large (max 8 MB)';
  }
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
});

const start = async () => {
  await mongoose.connect(config.mongoUri);
  console.log(`[db] connected ${mongoose.connection.host}/${mongoose.connection.name}`);
  if (!(await Pet.estimatedDocumentCount())) {
    console.log('[seed] empty database detected — loading demo store data…');
    await seed({ silent: true });
  }
  app.listen(config.port, () => console.log(`[api] PawNest API running on http://localhost:${config.port}`));
};

start().catch((err) => {
  console.error('[api] failed to start:', err.message);
  process.exit(1);
});
