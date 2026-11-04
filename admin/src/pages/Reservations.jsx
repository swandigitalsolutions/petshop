import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Phone, MessageCircle, Truck, Store } from 'lucide-react';
import { api, qs, money, formatDate, STATUS, PAY_STATUS } from '../lib/api.js';
import { PageHead, Badge, Img, Pager, Tabs, Empty, Drawer, Field, Spinner, useDebounced } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

const FLOW = ['placed', 'confirmed', 'vet_check', 'ready', 'completed'];
const NEXT_LABEL = { placed: 'Confirm order', confirmed: 'Mark health check done', vet_check: 'Send out for delivery', ready: 'Mark delivered' };

function Detail({ id, onClose }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: o, isLoading } = useQuery({ queryKey: ['admin-order', id], queryFn: () => api(`/orders/${id}`) });
  const [note, setNote] = useState('');
  const [pay, setPay] = useState('');
  const [busy, setBusy] = useState('');

  const update = async (body, msg, key) => {
    setBusy(key);
    try {
      await api(`/orders/${id}`, { method: 'PATCH', body });
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['admin-pets'] });
      toast(msg);
      setNote('');
      setPay('');
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(''); }
  };

  if (isLoading || !o) return <Drawer title="Order" onClose={onClose} wide><div className="skeleton h-64" /></Drawer>;
  const idx = FLOW.indexOf(o.status);
  const next = FLOW[idx + 1];
  const wa = o.customer?.phone?.replace(/\D/g, '');

  return (
    <Drawer
      title={`Order ${o.orderNo}`}
      onClose={onClose}
      wide
      footer={
        <>
          {!['completed', 'cancelled'].includes(o.status) && (
            <button type="button" className="btn btn-danger mr-auto" disabled={!!busy} onClick={() => window.confirm('Cancel this order? The puppy goes back on sale and any payment is marked refunded.') && update({ status: 'cancelled', note: note || 'Cancelled by store' }, 'Order cancelled', 'cancel')}>
              Cancel order
            </button>
          )}
          {next && <button type="button" className="btn btn-dark" disabled={!!busy} onClick={() => update({ status: next, note: note || undefined }, `Moved to ${STATUS[next][0]}`, 'next')}>{busy === 'next' ? <Spinner /> : NEXT_LABEL[o.status]}</button>}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="flex gap-4">
            <Img src={o.petSnapshot?.image} width={200} className="size-24 rounded-2xl object-cover" />
            <div>
              <p className="font-display text-2xl font-bold">{o.petSnapshot?.name}</p>
              <p className="text-sm text-ink-soft">{o.petSnapshot?.breed} · {o.pet?.code}</p>
              <div className="mt-2 flex gap-2"><Badge map={STATUS} value={o.status} /><Badge map={PAY_STATUS} value={o.paymentStatus} /></div>
            </div>
          </div>

          <div className="rounded-2xl bg-mist p-4">
            <p className="font-semibold">{o.customer?.name}</p>
            <p className="text-sm text-ink-soft">{o.customer?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${o.customer?.phone}`} className="btn btn-outline btn-xs"><Phone className="size-3.5" />{o.customer?.phone}</a>
              {wa && <a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noreferrer" className="btn btn-xs bg-leaf text-white"><MessageCircle className="size-3.5" />WhatsApp</a>}
              {o.user?._id && <Link to={`/customers?open=${o.user._id}`} className="btn btn-ghost btn-xs">Customer profile</Link>}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 font-semibold">{o.handover === 'home_delivery' ? <><Truck className="size-4" />Home delivery</> : <><Store className="size-4" />Pickup from kennel</>}</p>
            {o.address?.line1 && <p className="mt-1 text-sm text-ink-soft">{[o.address.line1, o.address.line2, o.address.city, o.address.pincode].filter(Boolean).join(', ')}</p>}
            <div className="mt-3 flex items-end gap-2">
              <Field label="Handover date" className="flex-1"><input type="date" className="input" defaultValue={o.handoverDate ? new Date(o.handoverDate).toISOString().slice(0, 10) : ''} onChange={(e) => e.target.value && update({ handoverDate: e.target.value }, 'Handover date saved', 'date')} /></Field>
            </div>
          </div>
          {o.notes && <div className="rounded-2xl border border-line p-3 text-sm"><p className="label">Customer note</p>{o.notes}</div>}
        </div>

        <div className="space-y-5">
          <dl className="card divide-y divide-line text-sm">
            {[['Puppy price', money(o.petPrice)], ['Discount', o.discount ? `−${money(o.discount)}${o.coupon ? ` (${o.coupon})` : ''}` : '—'], ['Delivery', o.deliveryFee ? money(o.deliveryFee) : 'Free'], ['Total', money(o.total)], ['Paid', money(o.amountPaid)], ['Balance due', money(o.balanceDue)], ['Plan', o.paymentPlan === 'full' ? 'Paid in full' : 'Deposit'], ['Method', o.paymentMethod?.toUpperCase()]].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2.5"><dt className="text-ink-soft">{k}</dt><dd className={`font-semibold tabular-nums ${k === 'Balance due' && o.balanceDue > 0 ? 'text-coral' : ''}`}>{v}</dd></div>
            ))}
          </dl>
          {o.balanceDue > 0 && o.status !== 'cancelled' && (
            <div className="flex items-end gap-2">
              <Field label="Record a payment (₹)" className="flex-1"><input type="number" min="1" max={o.balanceDue} className="input" value={pay} onChange={(e) => setPay(e.target.value)} placeholder={String(o.balanceDue)} /></Field>
              <button type="button" className="btn btn-outline" disabled={!pay || !!busy} onClick={() => update({ recordPayment: Number(pay) }, 'Payment recorded', 'pay')}>Record</button>
            </div>
          )}
          <div>
            <p className="label">Timeline</p>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {[...(o.timeline || [])].reverse().map((t) => (
                <li key={t._id || t.at} className="relative">
                  <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-white bg-ink" />
                  <p className="text-sm font-semibold">{STATUS[t.status]?.[0] || t.status}</p>
                  {t.note && <p className="text-sm text-ink-2">{t.note}</p>}
                  <p className="text-xs text-ink-soft">{formatDate(t.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-end gap-2">
            <Field label="Add a note (visible to the customer)" className="flex-1"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Second vaccination done today" /></Field>
            <button type="button" className="btn btn-outline" disabled={!note || !!busy} onClick={() => update({ note }, 'Note added', 'note')}>Add</button>
          </div>
          <Field label="Private admin notes"><textarea rows={3} className="input" defaultValue={o.adminNotes || ''} onBlur={(e) => e.target.value !== (o.adminNotes || '') && update({ adminNotes: e.target.value }, 'Notes saved', 'admin')} /></Field>
        </div>
      </div>
    </Drawer>
  );
}

export default function Reservations() {
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const open = sp.get('open');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const params = { status, q: dq, page, limit: 20 };
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders', params], queryFn: () => api(`/orders${qs(params)}`), placeholderData: (p) => p });
  const setParam = (k, v) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const c = data?.counts || {};

  return (
    <>
      <PageHead title="Orders" sub="Every puppy order, from payment to delivery." />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Tabs value={status} onChange={(v) => { setParam('status', v); setPage(1); }} items={[['', 'All'], ...Object.entries(STATUS).map(([k, [l]]) => [k, l, c[k] || 0])]} />
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Order no., customer, phone, puppy" className="input pl-9" />
          </div>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {data?.items?.map((o) => (
            <li key={o._id}>
              <button type="button" onClick={() => setParam('open', o._id)} className="flex w-full items-center gap-3 p-4 text-left active:bg-mist">
                <Img src={o.petSnapshot?.image} width={120} className="size-14 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{o.petSnapshot?.name} <span className="font-normal text-ink-soft">to {o.customer?.name}</span></span>
                  <span className="block text-xs text-ink-soft">{o.orderNo} · {formatDate(o.createdAt, { day: 'numeric', month: 'short' })}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5"><Badge map={STATUS} value={o.status} />{o.balanceDue > 0 && o.status !== 'cancelled' && <span className="text-xs font-semibold text-coral">{money(o.balanceDue)} due</span>}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{money(o.total)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-line bg-mist/60"><tr><th className="th">Order</th><th className="th">Puppy</th><th className="th">Customer</th><th className="th">Delivery</th><th className="th">Total</th><th className="th">Balance</th><th className="th">Payment</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {isLoading && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={8} className="td"><div className="skeleton h-10" /></td></tr>)}
              {data?.items?.map((o) => (
                <tr key={o._id} onClick={() => setParam('open', o._id)} className="cursor-pointer hover:bg-mist/50">
                  <td className="td"><span className="font-semibold">{o.orderNo}</span><span className="block text-xs text-ink-soft">{formatDate(o.createdAt)}</span></td>
                  <td className="td"><span className="flex items-center gap-2"><Img src={o.petSnapshot?.image} width={64} className="size-9 rounded-lg object-cover" /><span><span className="block font-medium">{o.petSnapshot?.name}</span><span className="text-xs text-ink-soft">{o.petSnapshot?.breed}</span></span></span></td>
                  <td className="td"><span className="block">{o.customer?.name}</span><span className="text-xs text-ink-soft">{o.customer?.phone}</span></td>
                  <td className="td whitespace-nowrap">{o.handover === 'home_delivery' ? 'Delivery' : 'Pickup'}<span className="block text-xs text-ink-soft">{o.handoverDate ? formatDate(o.handoverDate, { day: 'numeric', month: 'short' }) : 'Date TBC'}</span></td>
                  <td className="td tabular-nums">{money(o.total)}</td>
                  <td className={`td tabular-nums ${o.balanceDue > 0 && o.status !== 'cancelled' ? 'font-semibold text-coral' : 'text-ink-soft'}`}>{money(o.balanceDue)}</td>
                  <td className="td"><Badge map={PAY_STATUS} value={o.paymentStatus} /></td>
                  <td className="td"><Badge map={STATUS} value={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !data?.items?.length && <Empty title="No orders here" text="New orders from the store appear here instantly." />}
        </div>
        <Pager page={page} pages={data?.pages} onChange={setPage} />
      </div>
      {open && <Detail id={open} onClose={() => setParam('open', '')} />}
    </>
  );
}
