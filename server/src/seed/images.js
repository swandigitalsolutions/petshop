// Downloads real, breed-accurate dog photos for the demo store and saves them locally
// so the storefront serves them from our own server (fast + no hot-linking).
// Source: the free Dog CEO API (https://dog.ceo/dog-api/) — Stanford Dogs dataset photos.
import fs from 'node:fs';
import path from 'node:path';

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* optional */ }

const DIR = path.resolve('uploads', 'seed');

// Our breed name → Dog CEO breed path
export const DOG_CEO_PATHS = {
  'Golden Retriever': 'retriever/golden',
  'Labrador Retriever': 'labrador',
  'German Shepherd': 'germanshepherd',
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

const fetchJson = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

const download = async (url, file) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (sharp) {
    const out = `${file}.webp`;
    await sharp(buf).rotate().resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(DIR, out));
    return out;
  }
  const out = `${file}.jpg`;
  await fs.promises.writeFile(path.join(DIR, out), buf);
  return out;
};

/**
 * Returns { [breedName]: string[] } of local image URLs (/uploads/seed/...).
 * If the internet is unavailable, returns {} and the seed falls back to remote photos.
 */
export async function fetchBreedPhotos(perBreed = 8, log = () => {}) {
  fs.mkdirSync(DIR, { recursive: true });
  const result = {};
  const entries = Object.entries(DOG_CEO_PATHS);
  await Promise.all(
    entries.map(async ([breed, p]) => {
      const slug = p.replace('/', '-');
      // Reuse photos already downloaded on a previous seed run.
      const existing = fs.readdirSync(DIR).filter((f) => f.startsWith(`${slug}-`)).sort();
      if (existing.length >= perBreed) {
        result[breed] = existing.slice(0, perBreed).map((f) => `/uploads/seed/${f}`);
        return;
      }
      try {
        const { message: urls } = await fetchJson(`https://dog.ceo/api/breed/${p}/images/random/${perBreed}`);
        const unique = [...new Set(urls)];
        const files = [];
        for (let i = 0; i < unique.length; i += 1) {
          try {
            // eslint-disable-next-line no-await-in-loop
            files.push(await download(unique[i], `${slug}-${String(i + 1).padStart(2, '0')}`));
          } catch { /* skip a bad image */ }
        }
        if (files.length) result[breed] = files.map((f) => `/uploads/seed/${f}`);
      } catch (err) {
        log(`[seed] could not fetch photos for ${breed}: ${err.message}`);
      }
    }),
  );
  log(`[seed] real dog photos ready for ${Object.keys(result).length}/${entries.length} breeds`);
  return result;
}
