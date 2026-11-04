import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, ShieldCheck, Tag, Trash2, Bookmark, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useCartQuote, useSettings } from '../lib/queries.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Img, Price, Empty, Rating } from '../components/ui.jsx';
import { money, ageLabel, deliveryInfo } from '../lib/api.js';

export function PriceDetails({ quote, count, children }) {
  return (
    <section className="rounded-2xl bg-white">
      <h2 className="border-b border-line px-5 py-3.5 text-sm font-bold tracking-wide text-ink-soft">PRICE DETAILS</h2>
      <dl className="space-y-3 px-5 py-4 text-[15px]">
        <div className="flex justify-between"><dt>Price ({count} {count === 1 ? 'puppy' : 'puppies'})</dt><dd>{money(quote?.mrpTotal)}</dd></div>
        {quote?.mrpDiscount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="text-leaf">− {money(quote.mrpDiscount)}</dd></div>}
        {quote?.couponDiscount > 0 && <div className="flex justify-between"><dt>Coupon ({quote.coupon})</dt><dd className="text-leaf">− {money(quote.couponDiscount)}</dd></div>}
        <div className="flex justify-between"><dt>Delivery charges</dt><dd>{quote?.delivery ? money(quote.delivery) : <span className="text-leaf">FREE</span>}</dd></div>
        <div className="flex justify-between border-t border-dashed border-line pt-3 text-lg font-bold"><dt>Total amount</dt><dd>{money(quote?.total)}</dd></div>
      </dl>
      {quote?.savings > 0 && <p className="border-t border-line px-5 py-3 text-sm font-semibold text-leaf">You will save {money(quote.savings)} on this order</p>}
      {children}
    </section>
  );
}

export function CouponBox({ value, onApply, error }) {
  const [code, setCode] = useState(value || '');
  useEffect(() => setCode(value || ''), [value]);
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold"><Tag className="size-4 text-leaf" />Apply coupon</p>
      {value && !error ? (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-leaf-soft px-3 py-2 text-sm"><span className="font-semibold text-leaf">{value} applied</span><button type="button" onClick={() => onApply('')} className="font-semibold underline">Remove</button></div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); onApply(code.trim().toUpperCase()); }} className="mt-2 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input py-2" aria-label="Coupon code" />
          <button className="btn btn-outline btn-sm" disabled={!code.trim()}>Apply</button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <p className="mt-2 text-xs text-ink-soft">Try <button type="button" className="font-semibold underline" onClick={() => onApply('FIRSTPUP')}>FIRSTPUP</button> for ₹2,000 off or <button type="button" className="font-semibold underline" onClick={() => onApply('PAWNEST10')}>PAWNEST10</button> for 10% off above ₹60,000</p>
    </div>
  );
}

export const COUPON_KEY = 'pn_coupon';

export default function Cart() {
  const cart = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: settings } = useSettings();
  const [coupon, setCoupon] = useState(() => { try { return sessionStorage.getItem(COUPON_KEY) || ''; } catch { return ''; } });
  const [pin, setPin] = useState(cart.pincode);
  useEffect(() => { try { sessionStorage.setItem(COUPON_KEY, coupon); } catch { /* ignore */ } }, [coupon]);
  const eta = deliveryInfo(cart.pincode, settings?.outstationDeliveryFee);
  const city = eta ? (eta.local ? 'Bengaluru' : 'Outstation') : undefined;
  const ids = cart.items.map((i) => i._id);
  const { data: quote } = useCartQuote({ items: ids, coupon: coupon || undefined, city }, { enabled: ids.length > 0 });
  const soldOut = new Set((quote?.unavailable || []).map((u) => String(u._id)));

  if (!cart.items.length) {
    return (
      <div className="wrap py-6">
        <Empty icon={ShoppingCart} title="Your cart is empty" text="Add a puppy you love to your cart. Delivery is free across Bengaluru." action={<Link to="/shop" className="btn btn-primary">Shop puppies</Link>} />
        {cart.saved.length > 0 && <SavedList />}
      </div>
    );
  }

  const checkout = () => nav(user ? '/checkout' : '/login', { state: { from: '/checkout' } });

  return (
    <div className="wrap py-4 pb-24 md:pb-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
              <h1 className="text-xl font-bold">My cart ({cart.count})</h1>
              <form onSubmit={(e) => { e.preventDefault(); if (/^\d{6}$/.test(pin)) cart.setPincode(pin); }} className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-ink-soft" /><span className="text-ink-soft">Deliver to</span>
                <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Pincode" className="w-20 rounded-lg border border-line px-2 py-1 font-semibold" aria-label="Delivery pincode" />
                <button className="font-bold text-[#3b5bdb]">Check</button>
              </form>
            </div>
            <ul className="divide-y divide-line">
              {cart.items.map((it) => {
                const gone = soldOut.has(it._id);
                return (
                  <li key={it._id} className="flex gap-4 p-4 sm:p-5">
                    <Link to={`/puppies/${it.slug}`} className="shrink-0"><Img src={it.image} alt={it.name} width={240} className={`size-24 rounded-xl object-cover sm:size-28 ${gone ? 'opacity-50 grayscale' : ''}`} /></Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/puppies/${it.slug}`} className="block font-semibold hover:underline">{it.name} – {it.breed.replace(' (Indian Pariah)', '')} puppy</Link>
                      <p className="text-sm text-ink-soft">{it.gender === 'male' ? 'Male' : 'Female'}, {ageLabel(it.dob)}{it.color ? ` · ${it.color}` : ''}</p>
                      <div className="mt-1"><Rating rating={it.rating} count={it.numReviews} /></div>
                      <div className="mt-1.5"><Price price={it.price} mrp={it.mrp} free={it.adoption} /></div>
                      {gone ? (
                        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-coral"><AlertCircle className="size-4" />Sold out. Remove it to continue.</p>
                      ) : eta && <p className="mt-1 text-sm">Delivery by <span className="font-semibold">{eta.label}</span> · {eta.fee ? money(eta.fee) : <span className="font-semibold text-leaf">FREE</span>}</p>}
                      <div className="mt-3 flex gap-4 text-sm font-bold">
                        {!gone && <button type="button" onClick={() => cart.saveForLater(it._id)} className="inline-flex items-center gap-1 hover:text-[#3b5bdb]"><Bookmark className="size-4" />SAVE FOR LATER</button>}
                        <button type="button" onClick={() => cart.remove(it._id)} className="inline-flex items-center gap-1 hover:text-coral"><Trash2 className="size-4" />REMOVE</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="sticky bottom-0 hidden justify-end border-t border-line bg-white px-5 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] md:flex">
              <button type="button" onClick={checkout} disabled={soldOut.size > 0} className="btn btn-primary h-12 rounded-xl px-10 text-base">PLACE ORDER</button>
            </div>
          </section>
          {cart.saved.length > 0 && <SavedList />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <CouponBox value={coupon} error={coupon ? quote?.couponError : null} onApply={setCoupon} />
          <PriceDetails quote={quote} count={quote?.items?.length ?? cart.count} />
          <p className="flex items-center gap-2 px-2 text-sm text-ink-soft"><ShieldCheck className="size-5 shrink-0" />Safe and secure payments. 12-month health guarantee on every puppy.</p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[57px] z-30 flex items-center justify-between border-t border-line bg-white px-4 py-2.5 md:hidden">
        <div><p className="text-xs text-ink-soft line-through">{quote?.mrpTotal > quote?.total ? money(quote.mrpTotal) : ''}</p><p className="text-lg font-bold">{money(quote?.total ?? cart.priceTotal)}</p></div>
        <button type="button" onClick={checkout} disabled={soldOut.size > 0} className="btn btn-primary h-12 rounded-xl px-8">Place order</button>
      </div>
    </div>
  );
}

function SavedList() {
  const cart = useCart();
  return (
    <section className="mt-4 rounded-2xl bg-white">
      <h2 className="border-b border-line px-5 py-3 text-lg font-bold">Saved for later ({cart.saved.length})</h2>
      <ul className="divide-y divide-line">
        {cart.saved.map((it) => (
          <li key={it._id} className="flex items-center gap-4 p-4">
            <Img src={it.image} alt={it.name} width={160} className="size-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{it.name} – {it.breed}</p><p className="text-sm font-bold">{it.adoption ? 'Free' : money(it.price)}</p></div>
            <button type="button" onClick={() => cart.moveToCart(it._id)} className="text-sm font-bold text-[#3b5bdb]">MOVE TO CART</button>
            <button type="button" onClick={() => cart.removeSaved(it._id)} className="text-sm font-bold text-ink-soft" aria-label={`Remove ${it.name}`}><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
