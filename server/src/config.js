import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pawnest',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  origins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  publicUrl: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@pawnest.in',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
};
