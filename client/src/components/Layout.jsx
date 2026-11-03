import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Heart, Menu, X, Phone, ShieldCheck, Instagram, Facebook, Youtube, MessageCircle, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { useSettings } from '../lib/queries.js';
import { api, money } from '../lib/api.js';
import { Img } from './ui.jsx';

export function Logo({ light }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="PawNest home">
      <span className="grid size-10 place-items-center rounded-[14px] bg-ink">
        <svg viewBox="0 0 64 64" className="size-6" aria-hidden><g fill="#FFC93C"><ellipse cx="32" cy="40" rx="11" ry="9" /><circle cx="20" cy="28" r="5" /><circle cx="27" cy="20" r="5" /><circle cx="37" cy="20" r="5" /><circle cx="44" cy="28" r="5" /></g></svg>
      </span>
      <span className={`font-display text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>PawNest</span>
    </Link>
  );
}

function useDebounced(value, ms = 220) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SearchBox({ onDone, autoFocus }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const nav = useNavigate();
  const { data, isFetching } = useQuery({
    queryKey: ['search', dq],
    queryFn: () => api(`/search?q=${encodeURIComponent(dq)}`, { auth: false }),
    enabled: dq.length >= 2,
    staleTime: 60_000,
  });
  const go = (to) => { nav(to); setQ(''); onDone?.(); };
  const submit = (e) => { e.preventDefault(); if (q.trim()) go(`/puppies?q=${encodeURIComponent(q.trim())}`); };
  const has = data && (data.pets.length || data.breeds.length);
  return (
    <form onSubmit={submit} className="relative w-full" role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by breed, name or colour"
        className="input rounded-full border-transparent bg-mist pl-11"
        aria-label="Search puppies"
      />
      {dq.length >= 2 && (
        <div className="fade-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-line bg-white shadow-2xl">
          {!has && <p className="px-5 py-4 text-sm text-ink-soft">{isFetching ? 'Searching…' : `No puppies match "${dq}". Try a breed such as Beagle or Shih Tzu.`}</p>}
          {data?.breeds?.length > 0 && (
            <div className="p-2">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-soft">Breeds</p>
              {data.breeds.map((b) => (
                <button type="button" key={b._id} onClick={() => go(`/breeds/${b.slug}`)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-mist">
                  <Img src={b.image} width={96} className="size-11 rounded-full object-cover" alt="" />
                  <span className="font-semibold">{b.name}</span>
                </button>
              ))}
            </div>
          )}
          {data?.pets?.length > 0 && (
            <div className="border-t border-line p-2">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-soft">Puppies</p>
              {data.pets.map((p) => (
                <button type="button" key={p._id} onClick={() => go(`/puppies/${p.slug}`)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-mist">
                  <Img src={p.images?.[0]} width={96} className="size-11 rounded-xl object-cover" alt="" />
                  <span className="flex-1"><span className="block font-semibold">{p.name}</span><span className="text-sm text-ink-soft">{p.breed}{p.status === 'reserved' ? ', reserved' : ''}</span></span>
                  <span className="text-sm font-semibold">{p.adoption ? 'Adopt' : money(p.price)}</span>
                </button>
              ))}
            </div>
          )}
          {has ? <button type="submit" className="w-full border-t border-line px-5 py-3 text-left text-sm font-semibold hover:bg-mist">See every puppy matching "{dq}"</button> : null}
        </div>
      )}
    </form>
  );
}

const NAV = [
  ['/puppies', 'Puppies'],
  ['/breeds', 'Breed guide'],
  ['/adopt', 'Adopt'],
  ['/visit', 'Book a visit'],
  ['/about', 'Why PawNest'],
];

function Header() {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const [mobile, setMobile] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMobile(false); setMobileSearch(false); }, [loc.pathname, loc.search]);
  const navCls = ({ isActive }) => `rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors ${isActive ? 'bg-mist text-ink' : 'text-ink-2 hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      {settings?.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-[13px] font-medium text-white">
          <ShieldCheck className="mr-2 inline size-4 text-yolk" />{settings.announcement}
        </div>
      )}
      <div className="wrap flex h-[72px] items-center gap-3">
        <button type="button" className="btn btn-ghost -ml-2 size-11 p-0 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="size-6" /></button>
        <Logo />
        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.map(([to, l]) => <NavLink key={to} to={to} className={navCls}>{l}</NavLink>)}
        </nav>
        <div className="ml-auto hidden w-full max-w-xs xl:block"><SearchBox /></div>
        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          <button type="button" className="btn btn-ghost size-11 p-0 xl:hidden" onClick={() => setMobileSearch((v) => !v)} aria-label="Search"><Search className="size-5" /></button>
          <Link to={user ? '/account/favourites' : '/login'} className="btn btn-ghost relative size-11 p-0" aria-label="Favourite puppies">
            <Heart className="size-5" />
            {user?.wishlist?.length > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-coral text-[10px] font-bold text-white">{user.wishlist.length}</span>}
          </Link>
          <Link to={user ? '/account' : '/login'} className="btn btn-ghost h-11 gap-2 px-3" aria-label={user ? 'My account' : 'Sign in'}>
            <User className="size-5" />
            <span className="hidden text-sm sm:inline">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
          </Link>
          <Link to="/visit" className="btn btn-primary hidden h-11 sm:inline-flex">Book a visit</Link>
        </div>
      </div>
      {mobileSearch && <div className="wrap pb-3 xl:hidden"><SearchBox autoFocus onDone={() => setMobileSearch(false)} /></div>}
      <div className="h-px bg-line" />

      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade-in absolute inset-0 bg-ink/50" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white p-5">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" className="btn btn-ghost size-11 p-0" onClick={() => setMobile(false)} aria-label="Close menu"><X className="size-6" /></button>
            </div>
            <nav className="mt-6 flex flex-col gap-1 text-lg font-semibold">
              {[...NAV, ['/stories', 'Happy families'], ['/faq', 'Questions'], ['/contact', 'Visit the kennel']].map(([to, l]) => (
                <Link key={to} to={to} className="rounded-2xl px-3 py-3 hover:bg-mist">{l}</Link>
              ))}
            </nav>
            {settings?.contact?.phone && (
              <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} className="btn btn-outline mt-8"><Phone className="size-4" /> Call {settings.contact.phone}</a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function CompareBar() {
  const compare = useCompare();
  const nav = useNavigate();
  const { pathname } = useLocation();
  if (!compare.items.length || pathname === '/compare') return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="toast-in flex w-full max-w-xl items-center gap-3 rounded-full bg-ink p-2 pl-3 text-white shadow-2xl">
        <Scale className="size-5 shrink-0 text-yolk" />
        <div className="flex -space-x-2">
          {compare.items.map((p) => <Img key={p._id} src={p.image} width={80} alt={p.name} className="size-9 rounded-full border-2 border-ink object-cover" />)}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm">{compare.items.length === 1 ? 'Add one more puppy to compare' : `${compare.items.length} puppies selected`}</p>
        <button type="button" onClick={compare.clear} className="px-2 text-sm text-white/70 hover:text-white">Clear</button>
        <button type="button" disabled={compare.items.length < 2} onClick={() => nav('/compare')} className="btn btn-primary btn-sm">Compare</button>
      </div>
    </div>
  );
}

function Footer() {
  const { data: s } = useSettings();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const subscribe = async (e) => {
    e.preventDefault();
    setState('loading');
    try {
      await api('/newsletter', { method: 'POST', body: { email }, auth: false });
      setState('done');
      setEmail('');
    } catch { setState('error'); }
  };
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="wrap grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-white/70">A Bengaluru puppy store that works only with home breeders we have visited ourselves. Every puppy is vet-checked, vaccinated and guaranteed.</p>
          <form onSubmit={subscribe} className="mt-6 max-w-sm">
            <label htmlFor="nl" className="text-sm font-semibold">Hear about new litters before they're listed</label>
            <div className="mt-2 flex gap-2">
              <input id="nl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="input rounded-full border-white/15 bg-white/10 text-white placeholder:text-white/50" />
              <button className="btn btn-primary shrink-0" disabled={state === 'loading'}>Notify me</button>
            </div>
            {state === 'done' && <p className="mt-2 text-sm text-yolk">You're on the list. We'll email you when a new litter arrives.</p>}
            {state === 'error' && <p className="mt-2 text-sm text-coral">Enter a valid email address.</p>}
          </form>
        </div>
        <div>
          <h4 className="font-display text-lg font-bold">Find a puppy</h4>
          <ul className="mt-4 space-y-2.5 text-white/70">
            <li><Link to="/puppies" className="hover:text-white">All puppies</Link></li>
            <li><Link to="/puppies?goodWith=apartments" className="hover:text-white">Apartment-friendly</Link></li>
            <li><Link to="/puppies?goodWith=first-time%20owners" className="hover:text-white">Great for first-time owners</Link></li>
            <li><Link to="/breeds" className="hover:text-white">Breed guide</Link></li>
            <li><Link to="/adopt" className="hover:text-white">Adopt a rescued Indie</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg font-bold">Buying with us</h4>
          <ul className="mt-4 space-y-2.5 text-white/70">
            <li><Link to="/about" className="hover:text-white">Our breeder standards</Link></li>
            <li><Link to="/policies" className="hover:text-white">Health guarantee & refunds</Link></li>
            <li><Link to="/account/reservations" className="hover:text-white">Track your reservation</Link></li>
            <li><Link to="/stories" className="hover:text-white">Happy families</Link></li>
            <li><Link to="/faq" className="hover:text-white">Questions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg font-bold">Visit the kennel</h4>
          <address className="mt-4 space-y-2.5 not-italic text-white/70">
            <p>{s?.contact?.address}</p>
            <p>{s?.contact?.hours}</p>
            <p><a className="hover:text-white" href={`tel:${s?.contact?.phone?.replace(/\s/g, '')}`}>{s?.contact?.phone}</a></p>
            <p><a className="hover:text-white" href={`mailto:${s?.contact?.email}`}>{s?.contact?.email}</a></p>
          </address>
          <div className="mt-5 flex gap-2">
            {[[Instagram, s?.social?.instagram, 'Instagram'], [Facebook, s?.social?.facebook, 'Facebook'], [Youtube, s?.social?.youtube, 'YouTube']].map(([I, href, l]) => href && (
              <a key={l} href={href} target="_blank" rel="noreferrer" aria-label={l} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"><I className="size-5" /></a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-2 py-6 text-sm text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} PawNest. Registered pet shop under the Prevention of Cruelty to Animals (Pet Shop) Rules, 2018.</p>
          <p>Pay by UPI, card or net banking</p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFab() {
  const { data: s } = useSettings();
  const compare = useCompare();
  const n = s?.contact?.whatsapp?.replace(/\D/g, '');
  if (!n) return null;
  return (
    <a
      href={`https://wa.me/${n}?text=${encodeURIComponent('Hi PawNest! I would like to know more about your puppies.')}`}
      target="_blank"
      rel="noreferrer"
      className={`fixed right-5 z-30 grid size-14 place-items-center rounded-full bg-leaf text-white shadow-xl transition hover:scale-105 ${compare.items.length ? 'bottom-24' : 'bottom-5'}`}
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-yolk focus:px-4 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <CompareBar />
      <WhatsAppFab />
    </div>
  );
}
