import { useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, CalendarCheck, PawPrint, User as UserIcon, LogOut, Check, Circle, MessageSquareHeart, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useMyOrders, useMyVisits, useWishlist, useBreeds, usePets } from '../lib/queries.js';
import { api, money, formatDate } from '../lib/api.js';
import { Img, Empty, Field, Spinner } from '../components/ui.jsx';
import { PetCard } from '../components/Cards.jsx';

export const STEPS = [
  ['placed', 'Reservation placed', 'Your puppy is held for you.'],
  ['confirmed', 'Confirmed', 'Payment received and paperwork started.'],
  ['vet_check', 'Final vet check', 'Health check, vaccination update and certificate.'],
  ['ready', 'Ready to go home', "We'll call to fix the handover time."],
  ['completed', 'Home with you', 'Welcome to the PawNest family.'],
];
const LABEL = Object.fromEntries(STEPS.map(([k, l]) => [k, l]));
LABEL.cancelled = 'Cancelled';

export function Timeline({ order }) {
  if (order.status === 'cancelled') {
    return <p className="mt-4 rounded-2xl bg-coral-soft px-4 py-3 text-sm text-coral">This reservation was cancelled. {order.amountPaid > 0 ? 'Your payment has been refunded.' : ''}</p>;
  }
  const idx = STEPS.findIndex(([k]) => k === order.status);
  const at = (k) => order.timeline?.find((t) => t.status === k);
  return (
    <ol className="mt-5 space-y-0">
      {STEPS.map(([k, l, d], i) => {
        const done = i <= idx;
        const ev = at(k);
        return (
          <li key={k} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STEPS.length - 1 && <span className={`absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${i < idx ? 'bg-leaf' : 'bg-line'}`} aria-hidden />}
            <span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ${done ? 'bg-leaf text-white' : 'border-2 border-line bg-white text-line'}`}>
              {done ? <Check className="size-3.5" /> : <Circle className="size-2 fill-current" />}
            </span>
            <div className="-mt-0.5">
              <p className={`font-semibold ${done ? '' : 'text-ink-soft'}`}>{l}</p>
              <p className="text-sm text-ink-soft">{ev?.note || d}</p>
              {ev && <p className="text-xs text-ink-soft">{formatDate(ev.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Reservations() {
  const { data = [], isLoading } = useMyOrders();
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const cancel = async (o) => {
    if (!window.confirm(`Cancel the reservation for ${o.petSnapshot.name}? ${o.amountPaid ? 'Your deposit will be refunded.' : ''}`)) return;
    setBusy(o._id);
    try {
      await api(`/orders/mine/${o._id}/cancel`, { method: 'POST', body: {} });
      qc.invalidateQueries({ queryKey: ['me', 'orders'] });
      qc.invalidateQueries({ queryKey: ['pets'] });
      toast('Reservation cancelled. Your refund is on its way.');
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(''); }
  };
  if (isLoading) return <div className="skeleton h-64" />;
  if (!data.length) return <Empty icon={PawPrint} title="No reservations yet" text="When you reserve a puppy, you'll be able to follow every step until they come home." action={<Link to="/puppies" className="btn btn-dark">Find a puppy</Link>} />;
  return (
    <div className="space-y-6">
      {data.map((o) => (
        <article key={o._id} className="panel p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            <Link to={`/puppies/${o.petSnapshot.slug}`} className="shrink-0"><Img src={o.petSnapshot.image} alt={o.petSnapshot.name} width={240} className="size-28 rounded-2xl object-cover" /></Link>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold">{o.petSnapshot.name}</h3>
                  <p className="text-sm text-ink-soft">{o.petSnapshot.breed}. Reservation {o.orderNo}, {formatDate(o.createdAt)}</p>
                </div>
                <span className={`badge ${o.status === 'cancelled' ? 'bg-coral-soft text-coral' : o.status === 'completed' ? 'bg-leaf text-white' : 'bg-yolk text-ink'}`}>{LABEL[o.status]}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-ink-soft">Total</dt><dd className="font-semibold">{o.petPrice === 0 ? 'Free adoption' : money(o.total)}</dd></div>
                <div><dt className="text-ink-soft">Paid</dt><dd className="font-semibold">{money(o.amountPaid)}</dd></div>
                <div><dt className="text-ink-soft">Balance</dt><dd className="font-semibold">{money(o.balanceDue)}</dd></div>
                <div><dt className="text-ink-soft">Handover</dt><dd className="font-semibold">{o.handover === 'home_delivery' ? 'Home delivery' : 'Kennel pickup'}</dd></div>
              </dl>
            </div>
          </div>
          <div className="mt-2 border-t border-line pt-2">
            <Timeline order={o} />
          </div>
          {['placed', 'confirmed'].includes(o.status) && (
            <button type="button" onClick={() => cancel(o)} disabled={busy === o._id} className="mt-4 text-sm font-semibold text-coral underline">{busy === o._id ? 'Cancelling…' : 'Cancel reservation'}</button>
          )}
        </article>
      ))}
    </div>
  );
}

function Visits() {
  const { data = [], isLoading } = useMyVisits();
  const qc = useQueryClient();
  const toast = useToast();
  const NAMES = { kennel_visit: 'Kennel visit', video_call: 'Video call', home_visit: 'Breed consultation' };
  const cancel = async (b) => {
    try {
      await api(`/visits/mine/${b._id}/cancel`, { method: 'POST', body: {} });
      qc.invalidateQueries({ queryKey: ['me', 'visits'] });
      toast('Visit cancelled');
    } catch (e) { toast(e.message, { type: 'error' }); }
  };
  if (isLoading) return <div className="skeleton h-48" />;
  if (!data.length) return <Empty icon={CalendarCheck} title="No visits booked" text="Meet puppies at the kennel or on a video call before you decide." action={<Link to="/visit" className="btn btn-dark">Book a visit</Link>} />;
  return (
    <div className="panel divide-y divide-line">
      {data.map((b) => {
        const upcoming = new Date(b.date) >= new Date(new Date().toDateString()) && ['pending', 'confirmed'].includes(b.status);
        return (
          <div key={b._id} className="flex flex-wrap items-center gap-4 p-5">
            <div className="grid w-16 shrink-0 place-items-center rounded-2xl bg-mist py-2 text-center">
              <span className="text-xs">{formatDate(b.date, { month: 'short' })}</span>
              <span className="font-display text-2xl font-bold">{new Date(b.date).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{NAMES[b.type]} at {b.slot}</p>
              <p className="text-sm text-ink-soft">{b.petName ? `To meet ${b.petName}` : 'Meeting a few puppies'}. Ref {b.bookingNo}</p>
            </div>
            <span className="badge bg-mist capitalize text-ink">{b.status.replace('_', ' ')}</span>
            {upcoming && <button type="button" onClick={() => cancel(b)} className="text-sm font-semibold text-coral underline">Cancel</button>}
          </div>
        );
      })}
    </div>
  );
}

function Favourites() {
  const { user } = useAuth();
  const { data = [], isLoading } = useWishlist(Boolean(user));
  if (isLoading) return <div className="skeleton h-48" />;
  if (!data.length) return <Empty icon={Heart} title="No favourites yet" text="Tap the heart on any puppy to save them here." action={<Link to="/puppies" className="btn btn-dark">Browse puppies</Link>} />;
  return <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{data.map((p) => <PetCard key={p._id} pet={p} />)}</div>;
}

function Overview() {
  const { user } = useAuth();
  const { data: orders = [] } = useMyOrders();
  const { data: visits = [] } = useMyVisits();
  const prefs = user.preferences?.breeds || [];
  const { data: forYou } = usePets({ breed: prefs.join(','), status: 'available', limit: 3 }, { enabled: prefs.length > 0 });
  const active = orders.find((o) => !['completed', 'cancelled'].includes(o.status));
  const nextVisit = visits.filter((b) => new Date(b.date) >= new Date(new Date().toDateString()) && ['pending', 'confirmed'].includes(b.status)).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  return (
    <div className="space-y-8">
      {active ? (
        <section className="rounded-[24px] bg-yolk-soft p-6">
          <div className="flex items-center gap-4">
            <Img src={active.petSnapshot.image} alt="" width={160} className="size-16 rounded-2xl object-cover" />
            <div>
              <p className="text-sm text-ink-soft">Your reservation</p>
              <h2 className="text-2xl font-bold">{active.petSnapshot.name} is at "{LABEL[active.status]}"</h2>
            </div>
          </div>
          <Timeline order={active} />
        </section>
      ) : (
        <section className="rounded-[24px] bg-sky p-6">
          <h2 className="text-2xl font-bold">Ready to find your puppy?</h2>
          <p className="mt-1 text-ink-soft">Save favourites, compare them, then book a visit to meet them.</p>
          <Link to="/puppies" className="btn btn-dark mt-4">Browse puppies</Link>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/account/reservations" className="panel p-5 hover:border-ink"><PawPrint className="size-6" /><p className="mt-3 font-display text-3xl font-bold">{orders.length}</p><p className="text-sm text-ink-soft">Reservations</p></Link>
        <Link to="/account/visits" className="panel p-5 hover:border-ink"><CalendarCheck className="size-6" /><p className="mt-3 font-display text-xl font-bold">{nextVisit ? `${formatDate(nextVisit.date, { day: 'numeric', month: 'short' })}, ${nextVisit.slot}` : 'None booked'}</p><p className="text-sm text-ink-soft">Next visit</p></Link>
        <Link to="/account/favourites" className="panel p-5 hover:border-ink"><Heart className="size-6" /><p className="mt-3 font-display text-3xl font-bold">{user.wishlist?.length || 0}</p><p className="text-sm text-ink-soft">Favourite puppies</p></Link>
      </div>
      {forYou?.items?.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Puppies from breeds you like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{forYou.items.map((p) => <PetCard key={p._id} pet={p} />)}</div>
        </section>
      )}
    </div>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data: breeds = [] } = useBreeds();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [prefs, setPrefs] = useState({ breeds: user.preferences?.breeds || [], homeType: user.preferences?.homeType || '', hasKids: Boolean(user.preferences?.hasKids), firstDog: Boolean(user.preferences?.firstDog) });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');
  const save = async (what, body, path = '/auth/me') => {
    setBusy(what);
    try {
      const u = await api(path, { method: 'PUT', body });
      setUser((prev) => ({ ...prev, ...u }));
      toast('Saved');
      if (what === 'pw') setPw({ currentPassword: '', newPassword: '' });
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(''); }
  };
  const toggleBreed = (n) => setPrefs((p) => ({ ...p, breeds: p.breeds.includes(n) ? p.breeds.filter((x) => x !== n) : [...p.breeds, n] }));
  return (
    <div className="space-y-8">
      <form onSubmit={(e) => { e.preventDefault(); save('profile', form); }} className="panel p-6">
        <h2 className="text-2xl font-bold">Your details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email" hint="Contact us to change your email"><input disabled className="input bg-mist" value={user.email} /></Field>
        </div>
        <button className="btn btn-dark mt-5" disabled={busy === 'profile'}>{busy === 'profile' ? <Spinner /> : 'Save details'}</button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); save('prefs', prefs, '/auth/me/preferences'); }} className="panel p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold"><HomeIcon className="size-6" />About your home</h2>
        <p className="mt-1 text-ink-soft">Helps us suggest puppies that suit you.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Home type">
            <select className="input" value={prefs.homeType} onChange={(e) => setPrefs({ ...prefs, homeType: e.target.value })}>
              <option value="">Choose</option><option value="apartment">Apartment</option><option value="house">Independent house</option><option value="farm">Farmhouse / large garden</option>
            </select>
          </Field>
          <label className="mt-7 flex items-center gap-3"><input type="checkbox" className="size-4 accent-ink" checked={prefs.hasKids} onChange={(e) => setPrefs({ ...prefs, hasKids: e.target.checked })} />Children at home</label>
          <label className="mt-7 flex items-center gap-3"><input type="checkbox" className="size-4 accent-ink" checked={prefs.firstDog} onChange={(e) => setPrefs({ ...prefs, firstDog: e.target.checked })} />This is our first dog</label>
        </div>
        <p className="label mt-5">Breeds you're interested in</p>
        <div className="flex flex-wrap gap-2">{breeds.map((b) => <button type="button" key={b._id} onClick={() => toggleBreed(b.name)} className={`chip ${prefs.breeds.includes(b.name) ? 'chip-on' : ''}`}>{b.name}</button>)}</div>
        <button className="btn btn-dark mt-5" disabled={busy === 'prefs'}>{busy === 'prefs' ? <Spinner /> : 'Save preferences'}</button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); save('pw', pw); }} className="panel p-6">
        <h2 className="text-2xl font-bold">Change password</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Current password"><input required type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input required type="password" minLength={6} autoComplete="new-password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        </div>
        <button className="btn btn-dark mt-5" disabled={busy === 'pw'}>{busy === 'pw' ? <Spinner /> : 'Update password'}</button>
      </form>
    </div>
  );
}

function ShareStory() {
  const { data: orders = [] } = useMyOrders();
  const toast = useToast();
  const eligible = orders.filter((o) => o.status !== 'cancelled');
  const [form, setForm] = useState({ order: '', rating: 5, quote: '', city: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (!eligible.length) return <Empty icon={MessageSquareHeart} title="Share your story after you reserve" text="Once you've reserved a puppy with us, you can tell other families about your experience." />;
  if (sent) return <Empty icon={MessageSquareHeart} title="Thank you for sharing" text="Our team will review your story and publish it on the Happy families page." />;
  const submit = async (e) => {
    e.preventDefault();
    const o = eligible.find((x) => x._id === form.order) || eligible[0];
    setBusy(true);
    try {
      await api('/testimonials', { method: 'POST', body: { quote: form.quote, rating: form.rating, city: form.city, petName: o.petSnapshot.name, breed: o.petSnapshot.breed } });
      setSent(true);
    } catch (ex) { toast(ex.message, { type: 'error' }); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="panel space-y-4 p-6">
      <h2 className="text-2xl font-bold">Tell other families about your puppy</h2>
      <Field label="Which puppy?">
        <select className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}>
          {eligible.map((o) => <option key={o._id} value={o._id}>{o.petSnapshot.name}, {o.petSnapshot.breed}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rating">
          <select className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
        </Field>
        <Field label="Your area"><input className="input" placeholder="e.g. Koramangala" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
      </div>
      <Field label="Your story"><textarea required minLength={20} rows={5} className="input" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></Field>
      <button className="btn btn-dark" disabled={busy}>{busy ? <Spinner /> : 'Submit story'}</button>
    </form>
  );
}

const TABS = [
  ['', 'Overview', PawPrint],
  ['reservations', 'Reservations', PawPrint],
  ['visits', 'Visits', CalendarCheck],
  ['favourites', 'Favourites', Heart],
  ['story', 'Share your story', MessageSquareHeart],
  ['profile', 'Profile', UserIcon],
];

export default function Account() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="wrap py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">Hi, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-ink-soft">Member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</p>
        </div>
        <button type="button" onClick={() => { logout(); nav('/'); }} className="btn btn-ghost btn-sm"><LogOut className="size-4" /> Sign out</button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Account">
          {TABS.map(([to, l, I]) => (
            <NavLink key={l} end to={`/account${to ? `/${to}` : ''}`} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-[15px] font-semibold ${isActive ? 'bg-ink text-white' : 'hover:bg-mist'}`}>
              <I className="size-4" />{l}
            </NavLink>
          ))}
        </nav>
        <div>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="visits" element={<Visits />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="story" element={<ShareStory />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

