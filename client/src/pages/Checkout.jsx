import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ShieldCheck, Lock, Smartphone, CreditCard, Landmark, Banknote, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCartQuote } from '../lib/queries.js';
import { api, money, deliveryInfo } from '../lib/api.js';
import { Img, Field, Spinner } from '../components/ui.jsx';
import { PriceDetails, CouponBox, COUPON_KEY } from './Cart.jsx';

function Step({ n, title, done, active, summary, onEdit, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 ${active ? 'bg-ink text-white' : ''}`}>
        <span className={`grid size-6 place-items-center rounded-md text-xs font-bold ${active ? 'bg-white text-ink' : done ? 'bg-leaf text-white' : 'bg-mist text-ink-soft'}`}>{done && !active ? <Check className="size-4" /> : n}</span>
        <div className="min-w-0 flex-1">
          <h2 className={`text-sm font-bold tracking-wide ${active ? '' : done ? 'text-ink-soft' : 'text-ink-soft'}`}>{title}</h2>
          {done && !active && summary && <p className="truncate text-sm text-ink">{summary}</p>}
        </div>
        {done && !active && onEdit && <button type="button" onClick={onEdit} className="rounded-lg border border-line px-3 py-1 text-sm font-bold text-[#3b5bdb]">CHANGE</button>}
      </div>
      {active && <div className="p-4 sm:p-5">{children}</div>}
    </section>
  );
}

const EMPTY_ADDR = { name: '', phone: '', pincode: '', line1: '', line2: '', city: 'Bengaluru', state: 'Karnataka' };
const PAY = [
  ['upi', 'UPI', 'Google Pay, PhonePe, Paytm or any UPI app', Smartphone],
  ['card', 'Credit / Debit card', 'Visa, Mastercard, RuPay · No-cost EMI available', CreditCard],
  ['netbanking', 'Net banking', 'All major banks', Landmark],
  ['cod', 'Cash on delivery', 'Pay when your puppy is delivered', Banknote],
];

export default function Checkout() {
  const cart = useCart();
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const saved = user?.addresses || [];
  const [step, setStep] = useState(2);
  const [addrId, setAddrId] = useState(() => (saved.find((a) => a.isDefault) || saved[0])?._id || 'new');
  const [form, setForm] = useState({ ...EMPTY_ADDR, name: user?.name || '', phone: user?.phone || '', pincode: cart.pincode || '' });
  const [method, setMethod] = useState('upi');
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState({ number: '', exp: '', cvv: '' });
  const [bank, setBank] = useState('HDFC Bank');
  const [coupon, setCoupon] = useState(() => { try { return sessionStorage.getItem(COUPON_KEY) || ''; } catch { return ''; } });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const address = addrId === 'new' ? form : saved.find((a) => a._id === addrId);
  const eta = deliveryInfo(address?.pincode);
  const ids = cart.items.map((i) => i._id);
  const body = useMemo(() => ({ items: ids, coupon: coupon || undefined, city: address?.city }), [ids.join(), coupon, address?.city]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: quote } = useCartQuote(body, { enabled: ids.length > 0 });

  if (!cart.items.length) return <Navigate to="/cart" replace />;

  const addrOk = (a) => a && a.name && /^[+\d\s-]{10,15}$/.test(a.phone || '') && /^\d{6}$/.test(a.pincode || '') && a.line1 && a.city;
  const toSummary = () => {
    setErr('');
    if (!addrOk(address)) { setErr('Fill in name, a 10-digit mobile number, 6-digit pincode, address and city.'); return; }
    cart.setPincode(address.pincode);
    setStep(3);
  };

  const pay = async () => {
    setErr('');
    if (method === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(upi)) { setErr('Enter a valid UPI ID, for example name@okhdfcbank'); return; }
    if (method === 'card' && (card.number.replace(/\s/g, '').length < 15 || !/^\d{2}\/\d{2}$/.test(card.exp) || card.cvv.length < 3)) { setErr('Enter the card number, expiry (MM/YY) and CVV'); return; }
    setBusy(true);
    try {
      const res = await api('/orders/checkout', { method: 'POST', body: { items: ids, address: { name: address.name, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, pincode: address.pincode }, paymentMethod: method, coupon: coupon || undefined } });
      cart.removeMany(ids);
      try { sessionStorage.removeItem(COUPON_KEY); } catch { /* ignore */ }
      qc.invalidateQueries({ queryKey: ['pets'] });
      qc.invalidateQueries({ queryKey: ['pet'] });
      qc.invalidateQueries({ queryKey: ['home'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      refresh?.().catch(() => {});
      nav(`/order/${res.groupNo}`, { replace: true, state: res });
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  };

  const total = quote?.total ?? cart.priceTotal;

  return (
    <div className="wrap py-4 pb-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <Step n={1} title="LOGIN" done summary={`${user.name} · ${user.phone || user.email}`} />

          <Step n={2} title="DELIVERY ADDRESS" active={step === 2} done={step > 2} onEdit={() => setStep(2)} summary={address && `${address.name}, ${address.line1}, ${address.city} - ${address.pincode}`}>
            <div className="space-y-3">
              {saved.map((a) => (
                <label key={a._id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${addrId === a._id ? 'border-ink bg-mist' : 'border-line'}`}>
                  <input type="radio" name="addr" className="mt-1 size-4 accent-ink" checked={addrId === a._id} onChange={() => setAddrId(a._id)} />
                  <span className="text-sm"><span className="font-semibold">{a.name}</span> <span className="ml-1 rounded bg-white px-1.5 py-0.5 text-xs font-bold text-ink-soft">{a.label || 'HOME'}</span> <span className="ml-1 font-semibold">{a.phone}</span><br />{[a.line1, a.line2, a.city, a.state].filter(Boolean).join(', ')} - <span className="font-semibold">{a.pincode}</span></span>
                </label>
              ))}
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${addrId === 'new' ? 'border-ink bg-mist' : 'border-line'}`}>
                <input type="radio" name="addr" className="size-4 accent-ink" checked={addrId === 'new'} onChange={() => setAddrId('new')} />
                <span className="flex items-center gap-1 text-sm font-bold text-[#3b5bdb]"><Plus className="size-4" />Add a new address</span>
              </label>
              {addrId === 'new' && (
                <div className="grid gap-3 rounded-xl bg-mist p-3 sm:grid-cols-2">
                  <Field label="Full name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></Field>
                  <Field label="10-digit mobile number"><input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></Field>
                  <Field label="Pincode"><input className="input" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} autoComplete="postal-code" /></Field>
                  <Field label="Locality"><input className="input" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></Field>
                  <div className="sm:col-span-2"><Field label="Address (house no., building, street)"><textarea rows={2} className="input" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} autoComplete="street-address" /></Field></div>
                  <Field label="City"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
                  <Field label="State"><input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
                </div>
              )}
              {err && <p className="text-sm font-medium text-coral">{err}</p>}
              <button type="button" onClick={toSummary} className="btn btn-primary h-12 rounded-xl px-8">DELIVER HERE</button>
            </div>
          </Step>

          <Step n={3} title="ORDER SUMMARY" active={step === 3} done={step > 3} onEdit={() => setStep(3)} summary={`${cart.count} ${cart.count === 1 ? 'puppy' : 'puppies'}`}>
            <ul className="divide-y divide-line">
              {cart.items.map((it) => (
                <li key={it._id} className="flex gap-3 py-3">
                  <Img src={it.image} alt="" width={160} className="size-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{it.name} – {it.breed}</p>
                    <p className="text-sm"><span className="font-bold">{it.adoption ? 'Free' : money(it.price)}</span>{it.mrp > it.price && <span className="ml-2 text-ink-soft line-through">{money(it.mrp)}</span>}</p>
                    {eta && <p className="text-sm text-ink-soft">Delivery by <span className="font-semibold text-ink">{eta.label}</span></p>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <p className="text-sm text-ink-soft">Order confirmation will be sent to <span className="font-semibold text-ink">{user.email}</span></p>
              <button type="button" onClick={() => setStep(4)} className="btn btn-primary h-12 rounded-xl px-8">CONTINUE</button>
            </div>
          </Step>

          <Step n={4} title="PAYMENT OPTIONS" active={step === 4}>
            <div className="space-y-2">
              {PAY.map(([v, l, d, I]) => (
                <div key={v} className={`rounded-xl border ${method === v ? 'border-ink' : 'border-line'}`}>
                  <label className="flex cursor-pointer items-center gap-3 p-3">
                    <input type="radio" name="pay" className="size-4 accent-ink" checked={method === v} onChange={() => { setMethod(v); setErr(''); }} />
                    <I className="size-5 text-ink-soft" />
                    <span><span className="block font-semibold">{l}</span><span className="text-xs text-ink-soft">{d}</span></span>
                  </label>
                  {method === v && v === 'upi' && <div className="px-3 pb-3"><input className="input max-w-sm" placeholder="Enter UPI ID, e.g. name@okhdfcbank" value={upi} onChange={(e) => setUpi(e.target.value.trim())} /></div>}
                  {method === v && v === 'card' && (
                    <div className="grid max-w-md grid-cols-2 gap-2 px-3 pb-3">
                      <input className="input col-span-2" inputMode="numeric" placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d]/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} />
                      <input className="input" placeholder="MM/YY" value={card.exp} onChange={(e) => { let x = e.target.value.replace(/\D/g, '').slice(0, 4); if (x.length > 2) x = `${x.slice(0, 2)}/${x.slice(2)}`; setCard({ ...card, exp: x }); }} />
                      <input className="input" inputMode="numeric" placeholder="CVV" type="password" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                    </div>
                  )}
                  {method === v && v === 'netbanking' && (
                    <div className="px-3 pb-3"><select className="input max-w-sm" value={bank} onChange={(e) => setBank(e.target.value)}>{['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => <option key={b}>{b}</option>)}</select></div>
                  )}
                </div>
              ))}
            </div>
            {err && <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm font-medium text-coral">{err}</p>}
            <button type="button" onClick={pay} disabled={busy} className="btn btn-primary mt-4 h-12 w-full rounded-xl text-base sm:w-auto sm:px-10">
              {busy ? <Spinner /> : <><Lock className="size-4" />{method === 'cod' ? `Place order · ${money(total)}` : `Pay ${money(total)}`}</>}
            </button>
            <p className="mt-2 text-xs text-ink-soft">Demo store: no real payment is taken.</p>
          </Step>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <PriceDetails quote={quote} count={quote?.items?.length ?? cart.count} />
          <CouponBox value={coupon} error={coupon ? quote?.couponError : null} onApply={(c) => { setCoupon(c); try { sessionStorage.setItem(COUPON_KEY, c); } catch { /* ignore */ } }} />
          <p className="flex items-center gap-2 px-2 text-sm text-ink-soft"><ShieldCheck className="size-5 shrink-0" />Safe and secure payments. 100% authentic, vet-checked puppies.</p>
          <Link to="/cart" className="block px-2 text-sm font-semibold text-[#3b5bdb]">Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}
