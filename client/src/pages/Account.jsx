import { useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Package, Heart, User as UserIcon, LogOut, Check, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useMyOrders, useWishlist } from '../lib/queries.js';
import { api, money, formatDate, ORDER_STEPS, STATUS_LABEL } from '../lib/api.js';
import { Img, Empty, Field, Spinner } from '../components/ui.jsx';
import { ProductCard } from '../components/Cards.jsx';

export function Tracker({ order }) {
  if (order.status === 'cancelled') return <p className="rounded-xl bg-coral-soft px-3 py-2 text-sm font-semibold text-coral">Cancelled{order.amountPaid > 0 ? ' · Refund initiated to your original payment method' : ''}</p>;
  const idx = ORDER_STEPS.findIndex(([k]) => k === order.status);
  const at = (k) => order.timeline?.find((t) => t.status === k)?.at;
  return (
    <ol className="grid grid-cols-5 gap-1">
      {ORDER_STEPS.map(([k, l], i) => (
        <li key={k} className="text-center">
          <div className="flex items-center">
            <span className={`h-1 flex-1 ${i === 0 ? 'invisible' : i <= idx ? 'bg-leaf' : 'bg-line'}`} />
            <span className={`grid size-6 shrink-0 place-items-center rounded-full ${i <= idx ? 'bg-leaf text-white' : 'border-2 border-line bg-white'}`}>{i <= idx && <Check className="size-3.5" />}</span>
            <span className={`h-1 flex-1 ${i === ORDER_STEPS.length - 1 ? 'invisible' : i < idx ? 'bg-leaf' : 'bg-line'}`} />
          </div>
          <p className={`mt-1 text-[11px] leading-tight sm:text-xs ${i <= idx ? 'font-semibold' : 'text-ink-soft'}`}>{l}</p>
          {at(k) && <p className="text-[10px] text-ink-soft">{formatDate(at(k), { day: 'numeric', month: 'short' })}</p>}
        </li>
      ))}
    </ol>
  );
}

function Orders() {
  const { data = [], isLoading } = useMyOrders();
  const [q, setQ] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const cancel = async (o) => {
    if (!window.confirm(`Cancel the order for ${o.petSnapshot.name}?`)) return;
    setBusy(o._id);
    try {
      await api(`/orders/mine/${o._id}/cancel`, { method: 'POST', body: {} });
      qc.invalidateQueries({ queryKey: ['me', 'orders'] });
      qc.invalidateQueries({ queryKey: ['pets'] });
      toast('Order cancelled');
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(''); }
  };
  if (isLoading) return <div className="skeleton h-64" />;
  if (!data.length) return <Empty icon={Package} title="No orders yet" text="When you buy a puppy, you can track the delivery here." action={<Link to="/shop" className="btn btn-primary">Shop puppies</Link>} />;
  const filtered = data.filter((o) => !q || `${o.petSnapshot?.name} ${o.petSnapshot?.breed} ${o.orderNo} ${o.groupNo}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [];
  filtered.forEach((o) => { const g = groups.find((x) => x.id === (o.groupNo || o.orderNo)); if (g) g.items.push(o); else groups.push({ id: o.groupNo || o.orderNo, items: [o] }); });
  return (
    <div className="space-y-4">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your orders" className="input bg-white pl-9" /></div>
      {groups.map((g) => (
        <article key={g.id} className="overflow-hidden rounded-2xl bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-mist/60 px-4 py-2.5 text-sm">
            <span><span className="text-ink-soft">Order</span> <span className="font-bold">{g.id}</span> · {formatDate(g.items[0].createdAt)}</span>
            <span className="font-semibold">{money(g.items.reduce((x, o) => x + o.total, 0))} · {g.items[0].paymentMethod === 'cash' ? 'Cash on delivery' : 'Paid online'}</span>
          </div>
          {g.items.map((o) => (
            <div key={o._id} className="border-b border-line p-4 last:border-0">
              <div className="flex gap-4">
                <Link to={`/puppies/${o.petSnapshot?.slug}`} className="shrink-0"><Img src={o.petSnapshot?.image} alt="" width={160} className="size-20 rounded-xl object-cover" /></Link>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.petSnapshot?.name} – {o.petSnapshot?.breed}</p>
                  <p className="text-sm text-ink-soft">{o.orderNo} · {money(o.total)}</p>
                  <p className={`mt-1 text-sm font-semibold ${o.status === 'completed' ? 'text-leaf' : o.status === 'cancelled' ? 'text-coral' : ''}`}>
                    {o.status === 'completed' ? `Delivered on ${formatDate(o.timeline?.find((t) => t.status === 'completed')?.at || o.handoverDate)}` : o.status === 'cancelled' ? 'Cancelled' : `${STATUS_LABEL[o.status]} · Delivery by ${formatDate(o.handoverDate, { weekday: 'short', day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
              </div>
              <div className="mt-4"><Tracker order={o} /></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['placed', 'confirmed'].includes(o.status) && <button type="button" disabled={busy === o._id} onClick={() => cancel(o)} className="btn btn-outline btn-sm">{busy === o._id ? 'Cancelling…' : 'Cancel order'}</button>}
                {o.status === 'completed' && <Link to={`/puppies/${o.petSnapshot?.slug}#reviews`} className="btn btn-outline btn-sm">Rate & review</Link>}
                <button type="button" onClick={() => window.print()} className="btn btn-ghost btn-sm">Download invoice</button>
              </div>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

function Wishlist() {
  const { user } = useAuth();
  const { data = [], isLoading } = useWishlist(Boolean(user));
  if (isLoading) return <div className="skeleton h-48" />;
  if (!data.length) return <Empty icon={Heart} title="Your wishlist is empty" text="Tap the heart on any puppy to save it here." action={<Link to="/shop" className="btn btn-primary">Shop puppies</Link>} />;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{data.map((p) => <ProductCard key={p._id} pet={p} />)}</div>;
}

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');
  const save = async (what, body) => {
    setBusy(what);
    try {
      const u = await api('/auth/me', { method: 'PUT', body });
      setUser((prev) => ({ ...prev, ...u }));
      toast('Saved');
      if (what === 'pw') setPw({ currentPassword: '', newPassword: '' });
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(''); }
  };
  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); save('p', form); }} className="rounded-2xl bg-white p-5">
        <h2 className="text-lg font-bold">Personal information</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Mobile number"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input disabled className="input bg-mist" value={user.email} /></Field>
        </div>
        <button className="btn btn-dark mt-4" disabled={busy === 'p'}>{busy === 'p' ? <Spinner /> : 'Save'}</button>
      </form>
      {user.addresses?.length > 0 && (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-lg font-bold">Saved addresses</h2>
          <ul className="mt-3 space-y-2">{user.addresses.map((a) => <li key={a._id} className="rounded-xl border border-line p-3 text-sm"><span className="font-semibold">{a.name}</span> · {a.phone}<br />{[a.line1, a.line2, a.city, a.state].filter(Boolean).join(', ')} - {a.pincode}</li>)}</ul>
        </section>
      )}
      <form onSubmit={(e) => { e.preventDefault(); save('pw', pw); }} className="rounded-2xl bg-white p-5">
        <h2 className="text-lg font-bold">Change password</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Current password"><input required type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input required minLength={6} type="password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        </div>
        <button className="btn btn-dark mt-4" disabled={busy === 'pw'}>{busy === 'pw' ? <Spinner /> : 'Update password'}</button>
      </form>
    </div>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const tabs = [['orders', 'My orders', Package], ['wishlist', 'Wishlist', Heart], ['', 'Profile', UserIcon]];
  return (
    <div className="wrap py-4">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3 self-start">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
            <span className="grid size-12 place-items-center rounded-full bg-yolk font-display text-xl font-bold">{user.name[0]}</span>
            <div className="min-w-0"><p className="text-xs text-ink-soft">Hello,</p><p className="truncate font-bold">{user.name}</p></div>
          </div>
          <nav className="scrollbar-none flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 lg:flex-col" aria-label="Account">
            {tabs.map(([to, l, I]) => (
              <NavLink key={l} end to={`/account${to ? `/${to}` : ''}`} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-ink text-white' : 'hover:bg-mist'}`}><I className="size-4" />{l}</NavLink>
            ))}
            <button type="button" onClick={() => { logout(); nav('/'); }} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-mist"><LogOut className="size-4" />Sign out</button>
          </nav>
        </aside>
        <div className="min-w-0">
          <Routes>
            <Route index element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="*" element={<Orders />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
