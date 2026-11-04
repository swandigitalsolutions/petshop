import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Zap, Tag, MapPin, Truck, ShieldCheck, Syringe, BadgeCheck, Cpu, Stethoscope, RotateCcw, Banknote, ThumbsUp, CheckCircle2, Store, X,
} from 'lucide-react';
import { usePet, useReviews, useSettings } from '../lib/queries.js';
import { Img, Price, RatingChip, Crumbs, Field, Spinner } from '../components/ui.jsx';
import Rail from '../components/Rail.jsx';
import WishButton from '../components/WishButton.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ageLabel, formatDate, deliveryInfo, money, discountPct } from '../lib/api.js';

function Gallery({ pet }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null);
  const imgs = pet.images?.length ? pet.images : [null];
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="scrollbar-none flex gap-2 overflow-x-auto sm:w-16 sm:flex-col">
        {imgs.map((src, n) => (
          <button type="button" key={`${src}-${n}`} onMouseEnter={() => setI(n)} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === n ? 'border-yolk-deep' : 'border-line'}`}>
            <Img src={src} alt="" width={160} className="size-full object-cover" />
          </button>
        ))}
      </div>
      <div
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-mist"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)}
      >
        <Img key={imgs[i]} src={imgs[i]} alt={`${pet.name}, ${pet.breed} puppy`} width={900} eager sizes="(min-width: 1024px) 40vw, 100vw" className="size-full object-cover" style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
        <WishButton id={pet._id} name={pet.name} className="absolute right-3 top-3" />
        {pet.status !== 'available' && <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-2 text-center text-sm font-bold text-white">SOLD OUT</span>}
      </div>
    </div>
  );
}

function ReviewForm({ breed, onClose }) {
  const [f, setF] = useState({ rating: 5, title: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api('/reviews', { method: 'POST', body: { breed, ...f } });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['pet'] });
      toast('Thanks! Your review is live.');
      onClose();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Write a review">
      <div className="fade-in absolute inset-0 bg-ink/50" onClick={onClose} />
      <form onSubmit={submit} className="toast-in relative w-full max-w-md rounded-3xl bg-white p-6">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid size-10 place-items-center" aria-label="Close"><X className="size-5" /></button>
        <h2 className="text-2xl font-bold">Rate your {breed.replace(' (Indian Pariah)', '')}</h2>
        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setF({ ...f, rating: n })} aria-label={`${n} stars`} className={`grid size-11 place-items-center rounded-xl text-xl font-bold ${n <= f.rating ? 'bg-yolk' : 'bg-mist text-ink-soft'}`}>★</button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Title"><input className="input" maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Healthy and playful" /></Field>
          <Field label="Your review"><textarea required minLength={15} rows={4} className="input" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} placeholder="How was the puppy and the delivery?" /></Field>
        </div>
        {err && <p className="mt-3 text-sm text-coral">{err}</p>}
        <button className="btn btn-dark mt-5 w-full" disabled={busy}>{busy ? <Spinner /> : 'Submit review'}</button>
      </form>
    </div>
  );
}

function Reviews({ breed, summary }) {
  const [sort, setSort] = useState('helpful');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();
  const { data } = useReviews({ breed, sort, page, limit: 6 });
  const [liked, setLiked] = useState({});
  const max = Math.max(1, ...(summary?.dist || [1]));
  return (
    <section id="reviews" className="rounded-2xl bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Ratings & reviews</h2>
        <button type="button" onClick={() => (user ? setForm(true) : nav('/login'))} className="btn btn-outline btn-sm">Write a review</button>
      </div>
      {summary?.count > 0 && (
        <div className="mt-4 grid gap-6 sm:grid-cols-[180px_1fr]">
          <div className="text-center sm:text-left">
            <p className="font-display text-5xl font-bold">{summary.avg.toFixed(1)}<span className="text-2xl text-yolk-deep">★</span></p>
            <p className="text-sm text-ink-soft">{summary.count} ratings for {breed.replace(' (Indian Pariah)', '')} puppies</p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <span className="w-6 font-semibold">{n}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist"><span className={`block h-full rounded-full ${n >= 4 ? 'bg-leaf' : n === 3 ? 'bg-[#e8a317]' : 'bg-coral'}`} style={{ width: `${(summary.dist[n - 1] / max) * 100}%` }} /></span>
                <span className="w-6 text-right text-ink-soft">{summary.dist[n - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {[['helpful', 'Most helpful'], ['recent', 'Newest'], ['high', 'Highest'], ['low', 'Lowest']].map(([v, l]) => <button type="button" key={v} onClick={() => { setSort(v); setPage(1); }} className={`chip ${sort === v ? 'chip-on' : ''}`}>{l}</button>)}
      </div>
      <div className="mt-3 divide-y divide-line">
        {data?.items?.map((r) => (
          <article key={r._id} className="py-4">
            <div className="flex items-center gap-2"><RatingChip value={r.rating} small /><p className="font-semibold">{r.title || 'Review'}</p></div>
            <p className="mt-1.5 text-[15px] text-ink-2">{r.comment}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
              <span className="font-semibold text-ink-2">{r.name}</span>
              {r.verified && <span className="inline-flex items-center gap-1 text-leaf"><CheckCircle2 className="size-3.5" />Verified buyer</span>}
              <span>{formatDate(r.createdAt)}</span>
              <button type="button" disabled={liked[r._id]} onClick={async () => { setLiked({ ...liked, [r._id]: true }); await api(`/reviews/${r._id}/helpful`, { method: 'POST', body: {}, auth: false }).catch(() => {}); }} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-mist disabled:text-leaf">
                <ThumbsUp className="size-3.5" />Helpful ({r.helpful + (liked[r._id] ? 1 : 0)})
              </button>
            </div>
          </article>
        ))}
      </div>
      {data?.pages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-ghost btn-sm">Previous</button>
          <span className="text-ink-soft">Page {page} of {data.pages}</span>
          <button type="button" disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn btn-ghost btn-sm">Next</button>
        </div>
      )}
      {form && <ReviewForm breed={breed} onClose={() => setForm(false)} />}
    </section>
  );
}

export default function PuppyDetail() {
  const { slug } = useParams();
  const { data, isLoading, error } = usePet(slug);
  const { data: settings } = useSettings();
  const cart = useCart();
  const nav = useNavigate();
  const [pin, setPin] = useState(cart.pincode || '');
  const [more, setMore] = useState(false);

  const pet = data?.pet;
  useEffect(() => { if (pet) cart.addViewed(pet); }, [pet?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="wrap grid gap-6 py-6 lg:grid-cols-2"><div className="skeleton aspect-square" /><div className="space-y-3"><div className="skeleton h-10 w-3/4" /><div className="skeleton h-8 w-1/2" /><div className="skeleton h-48" /></div></div>;
  }
  if (error || !pet) {
    return (
      <div className="wrap py-20 text-center">
        <h1 className="text-3xl font-bold">This puppy has found a home</h1>
        <p className="mt-2 text-ink-soft">The listing is no longer available. There are plenty more puppies waiting.</p>
        <Link to="/shop" className="btn btn-dark mt-6">Shop puppies</Link>
      </div>
    );
  }

  const { breed, similar, reviews, offers = [], coupons = [] } = data;
  const available = pet.status === 'available';
  const inCart = cart.has(pet._id);
  const eta = deliveryInfo(cart.pincode, settings?.outstationDeliveryFee);
  const short = pet.breed.replace(' (Indian Pariah)', '');
  const addToCart = () => (inCart ? nav('/cart') : cart.add(pet));
  const buyNow = () => { if (!inCart) cart.add(pet, { silent: true }); nav('/checkout'); };

  const specs = [
    ['Breed', pet.breed], ['Gender', pet.gender === 'male' ? 'Male' : 'Female'], ['Age', `${ageLabel(pet.dob)} (born ${formatDate(pet.dob)})`],
    ['Colour', pet.color], ['Current weight', pet.weightKg ? `${pet.weightKg} kg` : '—'], ['Adult size', pet.size ? pet.size[0].toUpperCase() + pet.size.slice(1) : '—'],
    ['Adult weight', breed?.weightRange || '—'], ['Life span', breed?.lifeSpan || '—'], ['KCI registered', pet.kciRegistered ? 'Yes' : 'No'],
    ['Microchipped', pet.microchipped ? 'Yes' : 'No'], ['Father', pet.parents?.sire || '—'], ['Mother', pet.parents?.dam || '—'], ['Product code', pet.code],
  ];

  const highlights = [
    [Stethoscope, 'Vet-checked with health certificate', pet.vetChecked !== false],
    [Syringe, `Vaccinated: ${(pet.vaccinations || []).slice(0, 2).join(', ') || 'age-appropriate'}`, pet.vaccinated],
    [BadgeCheck, 'KCI registration papers included', pet.kciRegistered],
    [Cpu, 'Microchipped for identification', pet.microchipped],
    [ShieldCheck, `${pet.healthGuaranteeMonths || 12}-month health guarantee`, !pet.adoption],
  ].filter((h) => h[2]);

  return (
    <div className="wrap py-4 pb-20 lg:pb-4">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: pet.adoption ? 'Adopt' : 'Puppies', to: pet.adoption ? '/adopt' : '/shop' }, { label: short, to: `/shop?breed=${encodeURIComponent(pet.breed)}` }, { label: pet.name }]} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        <div className="self-start lg:sticky lg:top-36">
          <div className="rounded-2xl bg-white p-3"><Gallery pet={pet} /></div>
          <div className="mt-3 hidden gap-3 lg:grid lg:grid-cols-2">
            {available ? (
              <>
                <button type="button" onClick={addToCart} className="btn btn-primary h-14 rounded-xl text-base"><ShoppingCart className="size-5" />{inCart ? 'Go to cart' : 'Add to cart'}</button>
                <button type="button" onClick={buyNow} className="btn btn-dark h-14 rounded-xl text-base"><Zap className="size-5" />Buy now</button>
              </>
            ) : <p className="col-span-2 rounded-xl bg-white p-4 text-center font-semibold text-ink-soft">This puppy is sold out</p>}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 sm:p-6">
            <p className="text-sm font-semibold text-ink-soft">{short} puppy · Sold by PawNest</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-[32px]">{pet.name} – {short} puppy ({pet.gender === 'male' ? 'Male' : 'Female'}, {ageLabel(pet.dob)}, {pet.color})</h1>
            {reviews?.count > 0 && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><RatingChip value={pet.rating} />{reviews.count} ratings & reviews</a>
            )}
            <div className="mt-4">
              {discountPct(pet.price, pet.mrp) > 0 && <p className="text-sm font-bold text-leaf">Special price</p>}
              <Price price={pet.price} mrp={pet.mrp} size="lg" free={pet.adoption} />
              {!pet.adoption && <p className="mt-0.5 text-xs text-ink-soft">Inclusive of all taxes · No-cost EMI from {money(Math.ceil(pet.price / 6 / 100) * 100)}/month</p>}
            </div>

            {!pet.adoption && (offers.length > 0 || coupons.length > 0) && (
              <div className="mt-5">
                <h2 className="font-bold">Available offers</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {coupons.slice(0, 2).map((c) => <li key={c.code} className="flex gap-2"><Tag className="mt-0.5 size-4 shrink-0 text-leaf" /><span><span className="font-semibold">Coupon {c.code}:</span> {c.description}</span></li>)}
                  {(more ? offers : offers.slice(0, 2)).map((o) => <li key={o} className="flex gap-2"><Tag className="mt-0.5 size-4 shrink-0 text-leaf" /><span><span className="font-semibold">Bank offer:</span> {o}</span></li>)}
                </ul>
                {offers.length > 2 && <button type="button" onClick={() => setMore(!more)} className="mt-2 text-sm font-semibold text-[#3b5bdb]">{more ? 'View less' : `View ${offers.length - 2} more offers`}</button>}
              </div>
            )}

            <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-[120px_1fr]">
              <p className="text-sm font-semibold text-ink-soft">Delivery</p>
              <div>
                <form onSubmit={(e) => { e.preventDefault(); if (/^\d{6}$/.test(pin)) cart.setPincode(pin); }} className="flex max-w-xs items-center gap-2 border-b-2 border-ink pb-1">
                  <MapPin className="size-4 text-ink-soft" />
                  <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Enter delivery pincode" className="min-w-0 flex-1 bg-transparent py-1 font-semibold outline-none" aria-label="Delivery pincode" />
                  <button className="text-sm font-bold text-[#3b5bdb]">Check</button>
                </form>
                {eta ? (
                  <p className="mt-2 text-sm"><span className="font-semibold">Delivery by {eta.label}</span> <span className="text-ink-soft">|</span> {eta.fee ? <span>{money(eta.fee)}</span> : <span className="font-semibold text-leaf">FREE</span>}</p>
                ) : <p className="mt-2 text-sm text-ink-soft">Enter your pincode to see the delivery date</p>}
                <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                  <li className="flex gap-2"><Truck className="size-4 shrink-0" />Delivered in an AC car with a care person</li>
                  <li className="flex gap-2"><Banknote className="size-4 shrink-0" />Cash on delivery available</li>
                  <li className="flex gap-2"><RotateCcw className="size-4 shrink-0" />7-day health promise: full refund if the vet finds an illness</li>
                </ul>
              </div>
            </div>

            {highlights.length > 0 && (
              <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-[120px_1fr]">
                <p className="text-sm font-semibold text-ink-soft">Highlights</p>
                <ul className="space-y-1.5 text-sm">{highlights.map(([I, t]) => <li key={t} className="flex gap-2"><I className="mt-0.5 size-4 shrink-0 text-leaf" />{t}</li>)}</ul>
              </div>
            )}

            <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-[120px_1fr]">
              <p className="text-sm font-semibold text-ink-soft">Seller</p>
              <div className="text-sm">
                <p className="flex items-center gap-2 font-semibold text-[#3b5bdb]"><Store className="size-4" />PawNest Bengaluru <RatingChip value={4.7} small /></p>
                <p className="mt-1 text-ink-soft">Ethical, home-raised litters from breeders we visit in person.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="text-2xl font-bold">Product details</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{pet.description}</p>
            {pet.temperament?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{pet.temperament.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
            <h3 className="mt-6 text-lg font-bold">Specifications</h3>
            <dl className="mt-2 divide-y divide-line rounded-xl border border-line">
              {specs.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2.5 text-sm"><dt className="text-ink-soft">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
            {pet.included?.length > 0 && (
              <>
                <h3 className="mt-6 text-lg font-bold">In the box</h3>
                <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">{pet.included.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf" />{x}</li>)}</ul>
              </>
            )}
            {pet.parents?.sireImage && (
              <>
                <h3 className="mt-6 text-lg font-bold">Parents</h3>
                <div className="mt-2 grid max-w-md grid-cols-2 gap-3">
                  {[['Father', pet.parents.sire, pet.parents.sireImage], ['Mother', pet.parents.dam, pet.parents.damImage]].map(([r, n, img]) => (
                    <figure key={r}><Img src={img} alt={`${r}: ${n}`} width={400} className="aspect-[4/3] w-full rounded-xl object-cover" /><figcaption className="mt-1 text-sm"><span className="text-ink-soft">{r}:</span> <span className="font-semibold">{n}</span></figcaption></figure>
                  ))}
                </div>
              </>
            )}
          </section>

          <Reviews breed={pet.breed} summary={reviews} />
        </div>
      </div>

      {similar?.length > 0 && <div className="mt-4"><Rail title="Similar puppies" items={similar} /></div>}

      {available && (
        <div className="fixed inset-x-0 bottom-[57px] z-30 grid grid-cols-2 border-t border-line bg-white md:bottom-0 lg:hidden">
          <button type="button" onClick={addToCart} className="flex h-14 items-center justify-center gap-2 font-bold"><ShoppingCart className="size-5" />{inCart ? 'Go to cart' : 'Add to cart'}</button>
          <button type="button" onClick={buyNow} className="flex h-14 items-center justify-center gap-2 bg-yolk font-bold"><Zap className="size-5" />Buy now</button>
        </div>
      )}
    </div>
  );
}
