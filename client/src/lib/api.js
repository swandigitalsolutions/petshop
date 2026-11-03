const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'pn_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function api(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = {};
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.message || 'Something went wrong. Please try again.');
  return data;
}

export const qs = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null && v !== false)).toString();
  return s ? `?${s}` : '';
};

export const FALLBACK_IMG = `${API}/static/dog-fallback.svg`;

// Resolves relative API image paths and asks Unsplash for right-sized, compressed images.
export const imageUrl = (src, width = 600) => {
  if (!src) return FALLBACK_IMG;
  if (src.startsWith('/')) return `${API}${src}`;
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '70');
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  }
  return src;
};

export const srcSet = (src, widths = [320, 480, 720, 1000]) =>
  src && src.includes('images.unsplash.com') ? widths.map((w) => `${imageUrl(src, w)} ${w}w`).join(', ') : undefined;

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (n) => inr.format(Number(n) || 0);

export const discountPct = (price, mrp) => (mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const ageLabel = (dob) => {
  if (!dob) return '';
  const weeks = Math.floor((Date.now() - new Date(dob).getTime()) / (7 * 864e5));
  if (weeks < 16) return `${weeks} weeks`;
  const months = Math.floor(weeks / 4.345);
  return `${months} months`;
};

export const formatDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(d)) : '';

export const STATUS_LABEL = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};
