export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const slugify = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const uniqueSlug = async (Model, base, excludeId) => {
  const root = slugify(base) || 'item';
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
};

export const toNumber = (v, fallback) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const paginate = (req, { defaultLimit = 12, maxLimit = 60 } = {}) => {
  const page = Math.max(1, toNumber(req.query.page, 1));
  const limit = Math.min(maxLimit, Math.max(1, toNumber(req.query.limit, defaultLimit)));
  return { page, limit, skip: (page - 1) * limit };
};

export const csv = (v) =>
  v === undefined || v === ''
    ? []
    : String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
