import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, BadgeCheck, ShieldCheck, CreditCard, Clock, Star } from 'lucide-react';
import { useHome } from '../lib/queries.js';
import { Img, RatingChip } from '../components/ui.jsx';
import Rail from '../components/Rail.jsx';
import { money } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';

function Banners({ items = [] }) {
  const [i, setI] = useState(0);
  const n = items.length;
  useEffect(() => {
    if (n < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);
  if (!n) return <div className="skeleton h-[220px] rounded-3xl sm:h-[320px]" />;
  const b = items[i];
  return (
    <section className="relative overflow-hidden rounded-3xl" style={{ background: b.color }} aria-roledescription="carousel" aria-label="Offers">
      <Link to={b.link} className="grid min-h-[220px] grid-cols-[1.2fr_1fr] items-center sm:min-h-[320px]">
        <div className="px-5 py-6 sm:px-10">
          <p className="text-xs font-bold text-ink/70 sm:text-sm">{i === 2 ? 'LIMITED TIME DEAL' : 'PAWNEST SPECIAL'}</p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-ink sm:text-5xl">{b.title}</h2>
          <p className="mt-2 text-sm text-ink-2 sm:text-lg">{b.subtitle}</p>
          <span className="btn btn-dark btn-sm mt-4 rounded-xl sm:mt-6 sm:px-6 sm:py-3 sm:text-base">{b.cta}</span>
        </div>
        <div className="relative h-full min-h-[220px] sm:min-h-[320px]">
          <Img key={b.image} src={b.image} alt="" width={900} eager sizes="(min-width: 1024px) 45vw, 45vw" className="absolute inset-0 size-full object-cover [mask-image:linear-gradient(to_right,transparent,black_30%)]" />
        </div>
      </Link>
      {n > 1 && (
        <>
          <button type="button" onClick={() => setI((i - 1 + n) % n)} className="absolute left-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow sm:grid" aria-label="Previous offer"><ChevronLeft className="size-5" /></button>
          <button type="button" onClick={() => setI((i + 1) % n)} className="absolute right-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow sm:grid" aria-label="Next offer"><ChevronRight className="size-5" /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((x, n2) => <button type="button" key={x.title} onClick={() => setI(n2)} aria-label={`Show offer ${n2 + 1}`} className={`h-1.5 rounded-full transition-all ${n2 === i ? 'w-6 bg-ink' : 'w-1.5 bg-ink/30'}`} />)}
          </div>
        </>
      )}
    </section>
  );
}

function Countdown() {
  const end = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };
  const [left, setLeft] = useState(() => end() - Date.now());
  useEffect(() => { const t = setInterval(() => setLeft(end() - Date.now()), 1000); return () => clearInterval(t); }, []);
  const h = Math.floor(left / 36e5); const m = Math.floor((left % 36e5) / 6e4); const s = Math.floor((left % 6e4) / 1000);
  const pad = (x) => String(Math.max(0, x)).padStart(2, '0');
  return <span className="inline-flex items-center gap-1.5 rounded-lg bg-coral-soft px-2.5 py-1 text-sm font-bold text-coral tabular-nums"><Clock className="size-4" />{pad(h)}:{pad(m)}:{pad(s)} left</span>;
}

export default function Home() {
  const { data, isLoading } = useHome();
  const cart = useCart();
  const breeds = (data?.breeds || []).filter((b) => b.count > 0);
  return (
    <div className="wrap space-y-4 py-4 sm:space-y-6 sm:py-6">
      <Banners items={data?.banners} />

      <section className="grid grid-cols-2 gap-2 rounded-3xl bg-white p-3 sm:p-4 lg:grid-cols-4">
        {[[Truck, 'Free home delivery', 'Across Bengaluru'], [BadgeCheck, 'Vet-checked', 'Health certificate included'], [ShieldCheck, '12-month guarantee', 'On every puppy'], [CreditCard, 'Pay your way', 'UPI, cards, COD, EMI']].map(([I, t, d]) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl p-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-yolk-soft"><I className="size-5" /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-bold">{t}</span><span className="block truncate text-xs text-ink-soft">{d}</span></span>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-[28px]">Shop by breed</h2>
          <Link to="/breeds" className="btn btn-sm btn-dark rounded-xl">All breeds</Link>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {(isLoading ? Array.from({ length: 8 }, (_, k) => ({ _id: k })) : breeds).map((b) => (
            <Link key={b._id} to={b.name ? `/shop?breed=${encodeURIComponent(b.name)}` : '#'} className="group w-[84px] shrink-0 text-center sm:w-28">
              <div className="mx-auto size-[84px] overflow-hidden rounded-full bg-mist ring-2 ring-transparent transition group-hover:ring-yolk sm:size-28">
                {b.image && <Img src={b.image} alt="" width={240} className="size-full object-cover" />}
              </div>
              <p className="mt-2 text-[13px] font-semibold leading-tight">{b.name?.replace(' (Indian Pariah)', '')}</p>
              {b.minPrice !== undefined && <p className="text-xs text-ink-soft">{b.minPrice ? `From ${money(b.minPrice)}` : 'Free'}</p>}
            </Link>
          ))}
        </div>
      </section>

      <Rail title="Deals of the day" sub="Biggest discounts on vet-checked puppies" link="/shop?deals=true&sort=discount" items={data?.deals} loading={isLoading} aside={<span className="hidden sm:inline"><Countdown /></span>} />

      <section className="grid gap-3 sm:grid-cols-3">
        {[['Under ₹30,000', '/shop?maxPrice=30000&sort=price-asc', '#E3F3EB', 'Pugs, Lhasa Apsos, Pomeranians & more'], ['₹30,000 – ₹50,000', '/shop?minPrice=30000&maxPrice=50000', '#FFF4D1', 'Labradors, Goldens, Beagles, GSDs'], ['Premium ₹50,000+', '/shop?minPrice=50000&sort=price-desc', '#EAF2FB', 'Huskies, French Bulldogs, Great Danes']].map(([t, to, bg, d]) => (
          <Link key={t} to={to} className="rounded-3xl p-5 transition hover:shadow-md" style={{ background: bg }}>
            <p className="text-xs font-bold text-ink-soft">SHOP BY BUDGET</p>
            <p className="mt-1 font-display text-2xl font-bold">{t}</p>
            <p className="mt-1 text-sm text-ink-2">{d}</p>
          </Link>
        ))}
      </section>

      <Rail title="Bestsellers" sub="Most viewed puppies this week" link="/shop?sort=popular" items={data?.bestsellers} loading={isLoading} />
      <Rail title="New arrivals" sub="Just listed from our partner breeders" link="/shop?sort=newest" items={data?.newArrivals} loading={isLoading} />

      {data?.adoption?.length > 0 && (
        <section className="grid items-center gap-5 overflow-hidden rounded-3xl bg-leaf p-5 text-white sm:grid-cols-[1fr_1.3fr] sm:p-8">
          <div>
            <h2 className="text-3xl font-bold">Adopt, don't shop</h2>
            <p className="mt-2 text-white/80">Rescued Indie puppies, vaccinated and microchipped. Adoption is free, with a short home check.</p>
            <Link to="/adopt" className="btn btn-primary mt-4 rounded-xl">Meet the rescues</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.adoption.slice(0, 3).map((p) => (
              <Link key={p._id} to={`/puppies/${p.slug}`} className="overflow-hidden rounded-2xl bg-white/10">
                <Img src={p.images?.[0]} alt={p.name} width={300} className="aspect-square w-full object-cover" />
                <p className="px-2 py-1.5 text-sm font-semibold">{p.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data?.reviews?.length > 0 && (
        <section className="rounded-3xl bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-[28px]">What customers say</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft"><RatingChip value={data.stats.rating} small /> from {data.stats.reviews} verified reviews · {data.stats.delivered.toLocaleString('en-IN')}+ puppies delivered</p>
            </div>
          </div>
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            {data.reviews.map((r) => (
              <figure key={r._id} className="w-[80%] shrink-0 rounded-2xl border border-line p-4 sm:w-[340px]">
                <div className="flex items-center gap-3">
                  <Img src={r.image} alt="" width={120} className="size-11 rounded-full object-cover" />
                  <div className="min-w-0"><p className="truncate font-semibold">{r.name}</p><p className="truncate text-xs text-ink-soft">Bought a {r.breed.replace(' (Indian Pariah)', '')}</p></div>
                  <span className="ml-auto flex">{Array.from({ length: r.rating }, (_, k) => <Star key={k} className="size-3.5 fill-yolk-deep text-yolk-deep" />)}</span>
                </div>
                <p className="mt-3 font-semibold">{r.title}</p>
                <blockquote className="mt-1 line-clamp-4 text-sm text-ink-2">{r.comment}</blockquote>
              </figure>
            ))}
          </div>
        </section>
      )}

      {cart.viewed.length > 1 && <Rail title="Recently viewed" items={cart.viewed.map((v) => ({ ...v, images: [v.image], status: 'available' }))} />}
    </div>
  );
}
