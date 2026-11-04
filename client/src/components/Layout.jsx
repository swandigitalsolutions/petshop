import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, User, Heart, Menu, X, ShoppingCart, MapPin, Home as HomeIcon, LayoutGrid, Percent, Truck, ShieldCheck, BadgeCheck, CreditCard, MessageCircle, Phone, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings, useBreeds } from '../lib/queries.js';
import { api, money } from '../lib/api.js';
import { Img } from './ui.jsx';

export const CATEGORIES = [
  ['/shop', 'All puppies'],
  ['/shop?deals=true&sort=discount', 'Deals'],
  ['/shop?sort=popular', 'Bestsellers'],
  ['/shop?sort=newest', 'New arrivals'],
  ['/shop?size=toy,small', 'Small dogs'],
  ['/shop?size=large,giant', 'Large dogs'],
  ['/shop?goodWith=kids', 'Family dogs'],
  ['/shop?goodWith=apartments', 'Apartment dogs'],
  ['/shop?minPrice=60000&sort=price-desc', 'Premium'],
  ['/adopt', 'Adopt'],
];

export function Logo({ light }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="PawNest home">
      <span className="grid size-9 place-items-center rounded-xl bg-yolk">
        <svg viewBox="0 0 64 64" className="size-5" aria-hidden><g fill="#172033"><ellipse cx="32" cy="40" rx="11" ry="9" /><circle cx="20" cy="28" r="5" /><circle cx="27" cy="20" r="5" /><circle cx="37" cy="20" r="5" /><circle cx="44" cy="28" r="5" /></g></svg>
      </span>
      <span className={`font-display text-[22px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-white'}`}>PawNest</span>
    </Link>
  );
}

function useDebounced(value, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function SearchBox({ onDone }) {
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const dq = useDebounced(q.trim());
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ['search', dq], queryFn: () => api(`/search?q=${encodeURIComponent(dq)}`, { auth: false }), enabled: dq.length >= 2, staleTime: 60_000 });
  const go = (to) => { nav(to); setQ(''); setFocus(false); onDone?.(); };
  const submit = (e) => { e.preventDefault(); if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`); };
  const open = focus && dq.length >= 2 && data;
  return (
    <form onSubmit={submit} className="relative flex w-full" role="search">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder="Search for Golden Retriever, Pug, Husky…"
        className="h-11 w-full rounded-l-xl border-0 bg-white px-4 text-[15px] text-ink outline-none placeholder:text-ink-soft/70 focus:ring-4 focus:ring-yolk/50"
        aria-label="Search puppies"
      />
      <button className="grid h-11 w-14 shrink-0 place-items-center rounded-r-xl bg-yolk text-ink hover:bg-yolk-deep" aria-label="Search"><Search className="size-5" /></button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white text-ink shadow-2xl">
          {!data.pets.length && !data.breeds.length && <p className="px-4 py-3 text-sm text-ink-soft">No puppies match "{dq}"</p>}
          {data.breeds.map((b) => (
            <button type="button" key={b._id} onMouseDown={() => go(`/shop?breed=${encodeURIComponent(b.name)}`)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-mist">
              <Search className="size-4 text-ink-soft" /><span><span className="font-semibold">{b.name}</span> <span className="text-sm text-ink-soft">puppies</span></span>
            </button>
          ))}
          {data.pets.map((p) => (
            <button type="button" key={p._id} onMouseDown={() => go(`/puppies/${p.slug}`)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-mist">
              <Img src={p.images?.[0]} width={96} className="size-10 rounded-lg object-cover" alt="" />
              <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{p.name}</span> <span className="text-sm text-ink-soft">{p.breed}</span></span>
              <span className="text-sm font-semibold">{p.adoption ? 'Free' : money(p.price)}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function PincodeChip() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState(cart.pincode || '');
  const save = (e) => { e.preventDefault(); if (/^\d{6}$/.test(pin)) { cart.setPincode(pin); setOpen(false); } };
  return (
    <div className="relative hidden lg:block">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-left text-white hover:bg-white/10">
        <MapPin className="size-5 text-yolk" />
        <span className="leading-tight"><span className="block text-[11px] text-white/70">Deliver to</span><span className="text-sm font-bold">{cart.pincode || 'Enter pincode'}</span></span>
      </button>
      {open && (
        <form onSubmit={save} className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl bg-white p-3 text-ink shadow-2xl">
          <label className="text-sm font-semibold" htmlFor="pin">Your delivery pincode</label>
          <div className="mt-2 flex gap-2">
            <input id="pin" autoFocus inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="input py-2" placeholder="560038" />
            <button className="btn btn-dark btn-sm">Apply</button>
          </div>
        </form>
      )}
    </div>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative hidden md:block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link to={user ? '/account' : '/login'} className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-white hover:bg-white/10">
        <User className="size-5" />
        <span className="leading-tight"><span className="block text-[11px] text-white/70">Hello, {user ? user.name.split(' ')[0] : 'sign in'}</span><span className="flex items-center text-sm font-bold">Account <ChevronDown className="size-3.5" /></span></span>
      </Link>
      {open && (
        <div className="absolute right-0 top-full z-50 w-56 pt-2">
          <div className="rounded-xl bg-white p-2 text-ink shadow-2xl">
            {!user && <Link to="/login" className="btn btn-primary btn-sm mb-2 w-full">Sign in</Link>}
            {[['/account', 'My profile'], ['/account/orders', 'My orders'], ['/account/wishlist', 'Wishlist']].map(([to, l]) => <Link key={to} to={user ? to : '/login'} className="block rounded-lg px-3 py-2 text-sm hover:bg-mist">{l}</Link>)}
            {user && <button type="button" onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-mist">Sign out</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user } = useAuth();
  const cart = useCart();
  const { data: s } = useSettings();
  const { data: breeds = [] } = useBreeds();
  const [drawer, setDrawer] = useState(false);
  const [mega, setMega] = useState(false);
  const loc = useLocation();
  useEffect(() => { setDrawer(false); setMega(false); }, [loc.pathname, loc.search]);
  const cur = loc.pathname + loc.search;

  return (
    <header className="sticky top-0 z-40">
      {s?.announcement && <div className="hidden bg-yolk px-4 py-1.5 text-center text-[13px] font-semibold text-ink sm:block">{s.announcement}</div>}
      <div className="bg-ink">
        <div className="wrap flex h-16 items-center gap-3 lg:gap-5">
          <button type="button" className="-ml-1 grid size-10 place-items-center rounded-xl text-white hover:bg-white/10 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu className="size-6" /></button>
          <Logo />
          <PincodeChip />
          <div className="hidden flex-1 md:flex"><SearchBox /></div>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <AccountMenu />
            <Link to={user ? '/account/wishlist' : '/login'} className="relative grid size-11 place-items-center rounded-xl text-white hover:bg-white/10" aria-label="Wishlist">
              <Heart className="size-6" />
              {user?.wishlist?.length > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">{user.wishlist.length}</span>}
            </Link>
            <Link to="/cart" className="relative flex h-11 items-center gap-2 rounded-xl px-2 text-white hover:bg-white/10" aria-label={`Cart, ${cart.count} items`}>
              <span className="relative">
                <ShoppingCart className="size-6" />
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-yolk text-[11px] font-bold text-ink">{cart.count}</span>
              </span>
              <span className="hidden text-sm font-bold sm:inline">Cart</span>
            </Link>
          </div>
        </div>
        <div className="wrap pb-3 md:hidden"><SearchBox /></div>
      </div>
      <nav className="border-b border-line bg-white" aria-label="Categories">
        <div className="wrap relative flex items-center gap-1">
          <div className="hidden lg:block" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <button type="button" className="flex items-center gap-1 py-2.5 pr-3 text-sm font-bold" aria-expanded={mega}><LayoutGrid className="size-4" />All breeds <ChevronDown className="size-4" /></button>
            {mega && (
              <div className="absolute left-4 right-4 top-full z-50 rounded-b-2xl border border-t-0 border-line bg-white p-4 shadow-2xl sm:left-6 sm:right-6 lg:left-8 lg:right-8">
                <div className="grid grid-cols-3 gap-1 xl:grid-cols-6">
                  {breeds.map((b) => (
                    <Link key={b._id} to={`/shop?breed=${encodeURIComponent(b.name)}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-mist">
                      <Img src={b.image} width={96} className="size-10 rounded-full object-cover" alt="" />
                      <span className="min-w-0"><span className="block truncate text-sm font-semibold">{b.name.replace(' (Indian Pariah)', '')}</span><span className="text-xs text-ink-soft">{b.count ? `${b.count} available` : 'Coming soon'}</span></span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            {CATEGORIES.map(([to, l]) => (
              <Link key={to} to={to} className={`shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold whitespace-nowrap ${cur === to ? 'text-ink underline decoration-yolk decoration-[3px] underline-offset-[10px]' : 'text-ink-2 hover:text-ink'} ${l === 'Deals' ? 'text-coral' : ''}`}>{l}</Link>
            ))}
          </div>
        </div>
      </nav>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade-in absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white">
            <div className="flex items-center justify-between bg-ink p-4">
              <span className="flex items-center gap-2 text-white"><User className="size-5" /><span className="font-semibold">{user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, sign in'}</span></span>
              <button type="button" className="grid size-10 place-items-center rounded-xl text-white" onClick={() => setDrawer(false)} aria-label="Close menu"><X className="size-6" /></button>
            </div>
            <p className="px-4 pb-1 pt-4 text-xs font-bold text-ink-soft">SHOP</p>
            {CATEGORIES.map(([to, l]) => <Link key={to} to={to} className="px-4 py-2.5 font-semibold hover:bg-mist">{l}</Link>)}
            <p className="px-4 pb-1 pt-4 text-xs font-bold text-ink-soft">BREEDS</p>
            {breeds.map((b) => <Link key={b._id} to={`/shop?breed=${encodeURIComponent(b.name)}`} className="px-4 py-2 hover:bg-mist">{b.name}</Link>)}
            <p className="px-4 pb-1 pt-4 text-xs font-bold text-ink-soft">HELP</p>
            {[['/account/orders', 'My orders'], ['/faq', 'FAQs'], ['/policies', 'Returns & health guarantee'], ['/contact', 'Contact us']].map(([to, l]) => <Link key={to} to={to} className="px-4 py-2.5 hover:bg-mist">{l}</Link>)}
            <div className="h-6" />
          </div>
        </div>
      )}
    </header>
  );
}

function BottomNav() {
  const cart = useCart();
  const { user } = useAuth();
  const cls = ({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-ink' : 'text-ink-soft'}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Quick links">
      <NavLink to="/" end className={cls}><HomeIcon className="size-5" />Home</NavLink>
      <NavLink to="/breeds" className={cls}><LayoutGrid className="size-5" />Breeds</NavLink>
      <NavLink to="/shop?deals=true&sort=discount" className={() => cls({ isActive: false })}><Percent className="size-5" />Deals</NavLink>
      <NavLink to={user ? '/account' : '/login'} className={cls}><User className="size-5" />Account</NavLink>
      <NavLink to="/cart" className={cls}>
        <span className="relative"><ShoppingCart className="size-5" />{cart.count > 0 && <span className="absolute -right-2.5 -top-1.5 grid size-4 place-items-center rounded-full bg-yolk text-[10px] font-bold text-ink">{cart.count}</span>}</span>Cart
      </NavLink>
    </nav>
  );
}

function Footer() {
  const { data: s } = useSettings();
  return (
    <footer className="mt-12 bg-ink text-white">
      <div className="border-b border-white/10">
        <div className="wrap grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {[[Truck, 'Free home delivery', 'Across Bengaluru, in an AC car'], [BadgeCheck, 'Vet-checked puppies', 'Health certificate with every puppy'], [ShieldCheck, '12-month health guarantee', 'Treatment covered or replacement'], [CreditCard, 'Secure payments', 'UPI, cards, net banking, COD & EMI']].map(([I, t, d]) => (
            <div key={t} className="flex items-start gap-3"><I className="mt-0.5 size-6 shrink-0 text-yolk" /><div><p className="font-semibold">{t}</p><p className="text-sm text-white/60">{d}</p></div></div>
          ))}
        </div>
      </div>
      <div className="wrap grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm text-white/60">Bengaluru's online puppy store. Healthy, vet-checked puppies from breeders we visit ourselves, delivered to your door.</p>
          {s?.contact?.phone && <a href={`tel:${s.contact.phone.replace(/\s/g, '')}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"><Phone className="size-4 text-yolk" />{s.contact.phone}</a>}
        </div>
        <div>
          <h4 className="font-bold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">{CATEGORIES.slice(0, 6).map(([to, l]) => <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>)}</ul>
        </div>
        <div>
          <h4 className="font-bold">Help</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {[['/account/orders', 'Track your order'], ['/policies', 'Returns & health guarantee'], ['/faq', 'FAQs'], ['/contact', 'Contact us'], ['/visit', 'Visit our store']].map(([to, l]) => <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-bold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {[['/about', 'About PawNest'], ['/stories', 'Customer stories'], ['/breeds', 'Breed guide'], ['/adopt', 'Adopt a rescue']].map(([to, l]) => <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>)}
          </ul>
          <p className="mt-4 text-sm text-white/60">{s?.contact?.address}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PawNest. Registered pet shop under the PCA (Pet Shop) Rules, 2018.</p>
          <div className="flex flex-wrap gap-2">{['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net banking', 'COD'].map((p) => <span key={p} className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">{p}</span>)}</div>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFab() {
  const { data: s } = useSettings();
  const n = s?.contact?.whatsapp?.replace(/\D/g, '');
  if (!n) return null;
  return (
    <a href={`https://wa.me/${n}?text=${encodeURIComponent('Hi PawNest! I have a question about a puppy.')}`} target="_blank" rel="noreferrer" className="fixed bottom-20 right-4 z-30 grid size-13 place-items-center rounded-full bg-leaf p-3 text-white shadow-xl transition hover:scale-105 md:bottom-5" aria-label="Chat with us on WhatsApp">
      <MessageCircle className="size-7" />
    </a>
  );
}

export default function Layout({ fallback = null }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-16 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-yolk focus:px-4 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="flex-1"><Suspense fallback={fallback}><Outlet /></Suspense></main>
      <Footer />
      <BottomNav />
      {pathname !== '/cart' && pathname !== '/checkout' && !pathname.startsWith('/puppies/') && <WhatsAppFab />}
    </div>
  );
}
