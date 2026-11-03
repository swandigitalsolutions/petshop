// Tiny in-memory response cache for public GET endpoints.
// Any admin write calls cache.clear() so customers always see fresh data.
const store = new Map();
const DEFAULT_TTL = 60 * 1000;

export const cache = {
  get(key) {
    const hit = store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      store.delete(key);
      return undefined;
    }
    return hit.value;
  },
  set(key, value, ttl = DEFAULT_TTL) {
    if (store.size > 500) store.clear();
    store.set(key, { value, expires: Date.now() + ttl });
  },
  clear() {
    store.clear();
  },
};

// Express middleware: caches JSON bodies of successful GET responses by URL.
export const cached = (ttl = DEFAULT_TTL) => (req, res, next) => {
  if (req.method !== 'GET' || req.headers.authorization) return next();
  const key = req.originalUrl;
  const hit = cache.get(key);
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  if (hit) {
    res.set('X-Cache', 'HIT');
    return res.json(hit);
  }
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) cache.set(key, body, ttl);
    res.set('X-Cache', 'MISS');
    return json(body);
  };
  return next();
};

// Clears cache after any successful mutating request.
export const invalidateOnWrite = (req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode < 400) cache.clear();
    });
  }
  next();
};
