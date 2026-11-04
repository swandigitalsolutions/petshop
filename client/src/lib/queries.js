import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from './api.js';

export const useHome = () => useQuery({ queryKey: ['home'], queryFn: () => api('/home', { auth: false }) });
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => api('/settings', { auth: false }), staleTime: 15 * 60 * 1000 });
export const useBreeds = () => useQuery({ queryKey: ['breeds'], queryFn: () => api('/breeds', { auth: false }), staleTime: 15 * 60 * 1000 });

export const usePets = (params, opts = {}) =>
  useQuery({ queryKey: ['pets', params], queryFn: () => api(`/pets${qs(params)}`, { auth: false }), placeholderData: (prev) => prev, ...opts });
export const usePet = (slug) => useQuery({ queryKey: ['pet', slug], queryFn: () => api(`/pets/${slug}`, { auth: false }), enabled: Boolean(slug) });

export const useReviews = (params, opts = {}) =>
  useQuery({ queryKey: ['reviews', params], queryFn: () => api(`/reviews${qs(params)}`, { auth: false }), placeholderData: (prev) => prev, ...opts });

export const useTestimonials = () => useQuery({ queryKey: ['testimonials'], queryFn: () => api('/testimonials', { auth: false }) });

export const useCartQuote = (body, opts = {}) =>
  useQuery({ queryKey: ['cart-quote', body], queryFn: () => api('/cart/quote', { method: 'POST', body, auth: false }), placeholderData: (prev) => prev, staleTime: 0, ...opts });

// Hover/focus prefetch so product pages open instantly.
export const usePrefetch = () => {
  const qc = useQueryClient();
  return (slug) => qc.prefetchQuery({ queryKey: ['pet', slug], queryFn: () => api(`/pets/${slug}`, { auth: false }), staleTime: 5 * 60 * 1000 });
};

export const useWishlist = (enabled) => useQuery({ queryKey: ['me', 'wishlist'], queryFn: () => api('/auth/me/wishlist'), enabled });
export const useMyOrders = (enabled = true) => useQuery({ queryKey: ['me', 'orders'], queryFn: () => api('/orders/mine'), enabled });
