import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './ToastContext.jsx';

const Ctx = createContext(null);
const KEY = 'pn_compare';
const MAX = 3;

export function CompareProvider({ children }) {
  const toast = useToast();
  const [items, setItems] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const toggle = useCallback((pet) => {
    setItems((prev) => {
      if (prev.some((p) => p._id === pet._id)) return prev.filter((p) => p._id !== pet._id);
      if (prev.length >= MAX) {
        toast(`You can compare up to ${MAX} puppies at a time`, { type: 'error' });
        return prev;
      }
      return [...prev, { _id: pet._id, name: pet.name, slug: pet.slug, image: pet.images?.[0], breed: pet.breed }];
    });
  }, [toast]);

  const value = useMemo(() => ({
    items,
    toggle,
    has: (id) => items.some((p) => p._id === id),
    remove: (id) => setItems((prev) => prev.filter((p) => p._id !== id)),
    clear: () => setItems([]),
  }), [items, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCompare = () => useContext(Ctx);
