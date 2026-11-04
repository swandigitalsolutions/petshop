import { Review } from '../models/index.js';
import { cache } from './cache.js';

// Average rating per breed, cached with the public response cache (cleared on any write).
export const breedStats = async () => {
  const hit = cache.get('__breed_stats');
  if (hit) return hit;
  const rows = await Review.aggregate([
    { $group: { _id: { breed: '$breed', rating: '$rating' }, n: { $sum: 1 } } },
  ]);
  const m = {};
  rows.forEach(({ _id, n }) => {
    const x = (m[_id.breed] ||= { sum: 0, count: 0, dist: [0, 0, 0, 0, 0] });
    x.sum += _id.rating * n; x.count += n; x.dist[_id.rating - 1] += n;
  });
  Object.values(m).forEach((x) => { x.avg = Math.round((x.sum / x.count) * 10) / 10; });
  cache.set('__breed_stats', m, 5 * 60 * 1000);
  return m;
};

export const withRating = (stats) => (p) => ({ ...p, rating: stats[p.breed]?.avg || 0, numReviews: stats[p.breed]?.count || 0 });
export const discountOf = (p) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
