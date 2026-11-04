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

export const DEMO = import.meta.env.VITE_DEMO === 'true';

export async function api(path, { method = 'GET', body, auth = true, signal } = {}) {
  if (DEMO) {
    // Static demo (e.g. Vercel): the whole backend runs in the browser.
    const { demoApi } = await import('../demo/backend.js');
    try {
      return await demoApi(path, { method, body, token: auth ? getToken() : null });
    } catch (e) {
      throw new ApiError(e.status || 500, e.message || 'Something went wrong. Please try again.');
    }
  }
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

// Resolves image paths. Our own build-time photos (/photos/*.webp) have a small variant
// (-sm.webp, 440px) used for cards and thumbnails, so lists download ~15 KB per image.
export const imageUrl = (src, width = 600) => {
  if (!src) return FALLBACK_IMG;
  if (src.startsWith('/photos/') && src.endsWith('.webp') && !src.endsWith('-sm.webp') && width <= 480) return src.replace(/\.webp$/, '-sm.webp');
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

export const srcSet = (src, widths = [320, 480, 720, 1000]) => {
  if (!src) return undefined;
  if (src.startsWith('/photos/') && src.endsWith('.webp') && !src.endsWith('-sm.webp')) return `${src.replace(/\.webp$/, '-sm.webp')} 440w, ${src} 900w`;
  return src.includes('images.unsplash.com') ? widths.map((w) => `${imageUrl(src, w)} ${w}w`).join(', ') : undefined;
};

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

// Customer-facing order steps (internal status → label)
export const ORDER_STEPS = [
  ['placed', 'Ordered'],
  ['confirmed', 'Confirmed'],
  ['vet_check', 'Health check done'],
  ['ready', 'Out for delivery'],
  ['completed', 'Delivered'],
];
export const STATUS_LABEL = { ...Object.fromEntries(ORDER_STEPS), cancelled: 'Cancelled' };

// Delivery promise shown on product pages and in the cart.
export const deliveryInfo = (pincode, outstationFee = 6500) => {
  const pin = String(pincode || '').trim();
  if (!/^\d{6}$/.test(pin)) return null;
  const local = pin.startsWith('560') || pin.startsWith('562');
  const days = local ? 2 : 4;
  const date = new Date(Date.now() + days * 864e5);
  return { local, fee: local ? 0 : outstationFee, date, label: formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' }) };
};
