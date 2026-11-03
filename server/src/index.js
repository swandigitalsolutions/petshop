// Entry point.
// - On Vercel (services): the exported Express app is run as a function. Vercel sends
//   requests with their full path, so routes stay mounted under /api.
// - Locally / on your own server: connects to MongoDB and listens on PORT.
import app from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';

if (!process.env.VERCEL) {
  connectDb()
    .then(() => app.listen(config.port, () => console.log(`[api] PawNest API running on http://localhost:${config.port}`)))
    .catch((err) => {
      console.error('[api] failed to start:', err.message);
      process.exit(1);
    });
}

export default app;
