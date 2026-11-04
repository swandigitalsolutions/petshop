import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api, qs, money, formatDate, STATUS, VISIT_NAMES } from '../lib/api.js';
import { PageHead, Pager, Tabs, Drawer, Badge, Img, Empty, useDebounced } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../components/Toast.jsx';

function CustomerDrawer({ id, onClose }) {
  const { data, isLoading } = useQuery({ queryKey: ['admin-user', id], queryFn: () => api(`/admin/users/${id}`) });
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const patch = async (body, msg) => {
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body });
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast(msg);
    } catch (e) { toast(e.message, { type: 'error' }); }
  };
  if (isLoading || !data) return <Drawer title="Customer" onClose={onClose}><div className="skeleton h-64" /></Drawer>;
  const { user: u, orders, visits } = data;
  return (
    <Drawer title={u.name} onClose={onClose} wide>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs text-ink-soft">Email</p><p className="truncate font-semibold">{u.email}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-soft">Phone</p><p className="font-semibold">{u.phone || '—'}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-soft">Joined</p><p className="font-semibold">{formatDate(u.createdAt)}</p></div>
      </div>
      {u.preferences && (u.preferences.breeds?.length || u.preferences.homeType) && (
        <p className="mt-4 rounded-2xl bg-mist p-4 text-sm">
          <span className="font-semibold">Looking for:</span> {u.preferences.breeds?.join(', ') || 'any breed'}
          {u.preferences.homeType ? `. Lives in ${u.preferences.homeType === 'house' ? 'an independent house' : `a ${u.preferences.homeType}`}` : ''}
          {u.preferences.hasKids ? ', has children' : ''}{u.preferences.firstDog ? ', first dog' : ''}.
        </p>
      )}
      <h3 className="mt-6 font-display text-lg font-bold">Orders</h3>
      {orders.length ? (
        <div className="card mt-2 divide-y divide-line">
          {orders.map((o) => (
            <Link key={o._id} to={`/reservations?open=${o._id}`} className="flex items-center gap-3 p-3 hover:bg-mist/50">
              <Img src={o.petSnapshot?.image} width={64} className="size-10 rounded-lg object-cover" />
              <span className="flex-1"><span className="block font-semibold">{o.petSnapshot?.name} · {o.petSnapshot?.breed}</span><span className="text-xs text-ink-soft">{o.orderNo}, {formatDate(o.createdAt)}</span></span>
              <span className="tabular-nums">{money(o.total)}</span>
              <Badge map={STATUS} value={o.status} />
            </Link>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-soft">No orders yet.</p>}
      <h3 className="mt-6 font-display text-lg font-bold">Visits</h3>
      {visits.length ? (
        <ul className="mt-2 space-y-1 text-sm">{visits.map((v) => <li key={v._id}>{formatDate(v.date)} at {v.slot}, {VISIT_NAMES[v.type]}{v.petName ? ` (${v.petName})` : ''}, <span className="capitalize">{v.status.replace('_', ' ')}</span></li>)}</ul>
      ) : <p className="mt-2 text-sm text-ink-soft">No visits booked.</p>}
      {u.wishlist?.length > 0 && (
        <>
          <h3 className="mt-6 font-display text-lg font-bold">Saved puppies</h3>
          <div className="mt-2 flex flex-wrap gap-3">{u.wishlist.map((p) => <span key={p._id} className="flex items-center gap-2 rounded-xl border border-line p-1.5 pr-3 text-sm"><Img src={p.images?.[0]} width={64} className="size-8 rounded-lg object-cover" />{p.name}</span>)}</div>
        </>
      )}
      <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-5">
        <button type="button" onClick={() => patch({ blocked: !u.blocked }, u.blocked ? 'Account unblocked' : 'Account blocked')} className={`btn ${u.blocked ? 'btn-outline' : 'btn-danger'}`}>{u.blocked ? 'Unblock account' : 'Block account'}</button>
        {me.role === 'admin' && String(me._id) !== String(u._id) && (
          <select className="input w-auto" value={u.role} onChange={(e) => patch({ role: e.target.value }, 'Role updated')} aria-label="Role">
            <option value="customer">Customer</option><option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
        )}
      </div>
    </Drawer>
  );
}

export default function Customers() {
  const [sp, setSp] = useSearchParams();
  const [role, setRole] = useState('customer');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const params = { role, q: dq, page };
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', params], queryFn: () => api(`/admin/users${qs(params)}`), placeholderData: (p) => p });
  const open = sp.get('open');
  return (
    <>
      <PageHead title="Customers" sub="Families who have signed up on the store." />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Tabs value={role} onChange={(v) => { setRole(v); setPage(1); }} items={[['customer', 'Customers'], ['staff', 'Staff'], ['admin', 'Admins'], ['', 'Everyone']]} />
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Name, email or phone" className="input pl-9" />
          </div>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {data?.items?.map((u) => (
            <li key={u._id}>
              <button type="button" onClick={() => setSp({ open: u._id })} className="flex w-full items-center gap-3 p-4 text-left active:bg-mist">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mist font-bold">{u.name[0]}</span>
                <span className="min-w-0 flex-1"><span className="block font-semibold">{u.name}</span><span className="block truncate text-xs text-ink-soft">{u.phone || u.email}</span></span>
                <span className="text-right text-xs"><span className="block font-semibold">{u.orders} orders</span>{money(u.spent)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line bg-mist/60"><tr><th className="th">Name</th><th className="th">Contact</th><th className="th">Orders</th><th className="th">Total paid</th><th className="th">Last order</th><th className="th">Joined</th></tr></thead>
            <tbody className="divide-y divide-line">
              {isLoading && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={6} className="td"><div className="skeleton h-8" /></td></tr>)}
              {data?.items?.map((u) => (
                <tr key={u._id} onClick={() => setSp({ open: u._id })} className="cursor-pointer hover:bg-mist/50">
                  <td className="td"><span className="font-semibold">{u.name}</span>{u.blocked && <span className="badge ml-2 bg-coral-soft text-coral">Blocked</span>}</td>
                  <td className="td"><span className="block">{u.email}</span><span className="text-xs text-ink-soft">{u.phone}</span></td>
                  <td className="td tabular-nums">{u.orders}</td>
                  <td className="td tabular-nums">{money(u.spent)}</td>
                  <td className="td">{u.lastOrder ? formatDate(u.lastOrder) : '—'}</td>
                  <td className="td">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !data?.items?.length && <Empty title="No one found" />}
        </div>
        <Pager page={page} pages={data?.pages} onChange={setPage} />
      </div>
      {open && <CustomerDrawer id={open} onClose={() => setSp({})} />}
    </>
  );
}
