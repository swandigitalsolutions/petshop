import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from './api.js';

export const useHome = () => useQuery({ queryKey: ['home'], queryFn: () => api('/home', { auth: false }) });
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => api('/settings', { auth: false }), staleTime: 15 * 60 * 1000 });
export const useBreeds = () => useQuery({ queryKey: ['breeds'], queryFn: () => api('/breeds', { auth: false }), staleTime: 15 * 60 * 1000 });
export const useBreed = (slug) => useQuery({ queryKey: ['breed', slug], queryFn: () => api(`/breeds/${slug}`, { auth: false }), enabled: Boolean(slug) });

export const usePets = (params, opts = {}) =>
  useQuery({ queryKey: ['pets', params], queryFn: () => api(`/pets${qs(params)}`, { auth: false }), placeholderData: (prev) => prev, ...opts });
export const usePet = (slug) => useQuery({ queryKey: ['pet', slug], queryFn: () => api(`/pets/${slug}`, { auth: false }), enabled: Boolean(slug) });

export const useTestimonials = () => useQuery({ queryKey: ['testimonials'], queryFn: () => api('/testimonials', { auth: false }) });

// Hover/focus prefetch so the puppy page opens instantly.
export const usePrefetch = () => {
  const qc = useQueryClient();
  return (slug) => qc.prefetchQuery({ queryKey: ['pet', slug], queryFn: () => api(`/pets/${slug}`, { auth: false }), staleTime: 5 * 60 * 1000 });
};

export const useWishlist = (enabled) => useQuery({ queryKey: ['me', 'wishlist'], queryFn: () => api('/auth/me/wishlist'), enabled });
export const useMyOrders = (enabled = true) => useQuery({ queryKey: ['me', 'orders'], queryFn: () => api('/orders/mine'), enabled });
export const useMyVisits = (enabled = true) => useQuery({ queryKey: ['me', 'visits'], queryFn: () => api('/visits/mine'), enabled });
