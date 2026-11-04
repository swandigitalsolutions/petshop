// Runs before every storefront build (npm "prebuild").
// Downloads real, breed-accurate dog photos from the free Dog CEO API, keeps the
// sharpest ones, compresses them to WebP and writes them to public/photos/ together
// with manifest.json. The store and admin then load every photo from our own domain
// (fast, cached by the CDN) instead of a third-party server.
// The script never fails the build: if anything goes wrong the apps fall back to
// loading photos from Dog CEO at runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'photos');
const PER_BREED = 10; // photos kept per breed
const CANDIDATES = 20; // photos downloaded per breed to choose from

const BREEDS = {
  'Golden Retriever': 'retriever/golden',
  'Labrador Retriever': 'labrador',
  'German Shepherd': 'german/shepherd',
  Beagle: 'beagle',
  'Shih Tzu': 'shihtzu',
  Pug: 'pug',
  'Siberian Husky': 'husky',
  'French Bulldog': 'bulldog/french',
  Pomeranian: 'pomeranian',
  Rottweiler: 'rottweiler',
  'Cocker Spaniel': 'spaniel/cocker',
  Dachshund: 'dachshund',
  Doberman: 'doberman',
  Maltese: 'maltese',
  'Lhasa Apso': 'lhasa',
  'Border Collie': 'collie/border',
  'Great Dane': 'dane/great',
  'Indie (Indian Pariah)': 'mix',
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const log = (...a) => console.log('[photos]', ...a);

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function getBuffer(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

// Simple concurrency limiter
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const n = i++;
      try { out[n] = await fn(items[n], n); } catch { out[n] = null; }
    }
  }));
  return out;
}

async function main() {
  if (process.env.SKIP_PHOTOS === '1') return log('skipped (SKIP_PHOTOS=1)');
  const manifestPath = path.join(OUT, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Object.keys(BREEDS).every((b) => m[b]?.length)) return log('already downloaded, reusing');
    } catch { /* rebuild */ }
  }

  let sharp = null;
  try { sharp = (await import('sharp')).default; } catch { log('sharp not installed: photos are kept as original JPEGs'); }

  fs.mkdirSync(OUT, { recursive: true });
  const started = Date.now();
  const manifest = {};

  for (const [breed, apiPath] of Object.entries(BREEDS)) {
    try {
      const { message: all } = await getJson(`https://dog.ceo/api/breed/${apiPath}/images`);
      // Spread the picks across the whole list for variety; deterministic between builds.
      const step = Math.max(1, Math.floor(all.length / CANDIDATES));
      const candidates = all.filter((_, i) => i % step === 0).slice(0, CANDIDATES);
      const scored = (await mapLimit(candidates, 10, async (url) => {
        const buf = await getBuffer(url);
        if (!sharp) return { buf, score: buf.length };
        const meta = await sharp(buf).metadata();
        const { width: w = 0, height: h = 0 } = meta;
        const ratio = w / h;
        if (Math.min(w, h) < 280) return null; // too small to look good
        const shapeOk = ratio > 0.7 && ratio < 1.7 ? 1 : 0.55;
        return { buf, score: Math.min(w, h) * shapeOk };
      })).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, PER_BREED);

      const name = slug(breed);
      const files = [];
      for (let i = 0; i < scored.length; i += 1) {
        const base = `${name}-${String(i + 1).padStart(2, '0')}`;
        if (sharp) {
          // eslint-disable-next-line no-await-in-loop
          await sharp(scored[i].buf).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(OUT, `${base}.webp`));
          // eslint-disable-next-line no-await-in-loop
          await sharp(scored[i].buf).rotate().resize({ width: 440, height: 440, fit: 'inside', withoutEnlargement: true }).webp({ quality: 70 }).toFile(path.join(OUT, `${base}-sm.webp`));
          files.push(`/photos/${base}.webp`);
        } else {
          fs.writeFileSync(path.join(OUT, `${base}.jpg`), scored[i].buf);
          files.push(`/photos/${base}.jpg`);
        }
      }
      if (files.length) manifest[breed] = files;
      log(`${breed}: ${files.length} photos`);
    } catch (e) {
      log(`${breed}: failed (${e.message})`);
    }
  }

  if (Object.keys(manifest).length) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    log(`done: ${Object.keys(manifest).length} breeds in ${Math.round((Date.now() - started) / 1000)}s`);
  } else {
    log('no photos downloaded; the store will load them from Dog CEO at runtime');
  }
}

main().catch((e) => log('error (build continues):', e.message)).finally(() => process.exit(0));
