import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './ToastContext.jsx';

const CartCtx = createContext(null);
const CART_KEY = 'pn_cart_v2';
const SAVED_KEY = 'pn_saved_v2';
const PIN_KEY = 'pn_pincode';
const VIEWED_KEY = 'pn_viewed';

const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

// Keep only what the cart needs to render instantly; prices are re-checked by the server at checkout.
const slim = (p) => ({
  _id: p._id, slug: p.slug, name: p.name, breed: p.breed, gender: p.gender, dob: p.dob, color: p.color,
  image: p.image || p.images?.[0], price: p.price, mrp: p.mrp, adoption: p.adoption, rating: p.rating, numReviews: p.numReviews,
});

export function CartProvider({ children }) {
  const toast = useToast();
  const [items, setItems] = useState(() => read(CART_KEY, []));
  const [saved, setSaved] = useState(() => read(SAVED_KEY, []));
  const [pincode, setPincodeState] = useState(() => read(PIN_KEY, ''));
  const [viewed, setViewed] = useState(() => read(VIEWED_KEY, []));

  useEffect(() => write(CART_KEY, items), [items]);
  useEffect(() => write(SAVED_KEY, saved), [saved]);
  useEffect(() => write(VIEWED_KEY, viewed), [viewed]);

  const has = useCallback((id) => items.some((i) => i._id === id), [items]);

  const add = useCallback((pet, { silent } = {}) => {
    setItems((prev) => (prev.some((i) => i._id === pet._id) ? prev : [...prev, slim(pet)]));
    setSaved((prev) => prev.filter((i) => i._id !== pet._id));
    if (!silent) toast(`${pet.name} added to your cart`);
  }, [toast]);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i._id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const removeMany = useCallback((ids) => setItems((prev) => prev.filter((i) => !ids.includes(i._id))), []);

  const saveForLater = useCallback((id) => {
    setItems((prev) => {
      const it = prev.find((i) => i._id === id);
      if (it) setSaved((s) => [it, ...s.filter((x) => x._id !== id)]);
      return prev.filter((i) => i._id !== id);
    });
  }, []);
  const moveToCart = useCallback((id) => {
    setSaved((prev) => {
      const it = prev.find((i) => i._id === id);
      if (it) setItems((c) => (c.some((x) => x._id === id) ? c : [...c, it]));
      return prev.filter((i) => i._id !== id);
    });
  }, []);
  const removeSaved = useCallback((id) => setSaved((prev) => prev.filter((i) => i._id !== id)), []);

  const setPincode = useCallback((pin) => { setPincodeState(pin); write(PIN_KEY, pin); }, []);

  const addViewed = useCallback((pet) => {
    setViewed((prev) => [slim(pet), ...prev.filter((p) => p._id !== pet._id)].slice(0, 12));
  }, []);

  const value = useMemo(() => {
    const mrpTotal = items.reduce((s, i) => s + Math.max(i.mrp || 0, i.price), 0);
    const priceTotal = items.reduce((s, i) => s + i.price, 0);
    return {
      items, saved, count: items.length, mrpTotal, priceTotal, savings: mrpTotal - priceTotal,
      has, add, remove, clear, removeMany, saveForLater, moveToCart, removeSaved,
      pincode, setPincode, viewed, addViewed,
    };
  }, [items, saved, has, add, remove, clear, removeMany, saveForLater, moveToCart, removeSaved, pincode, setPincode, viewed, addViewed]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
