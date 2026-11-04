import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, CalendarDays, Truck } from 'lucide-react';
import { api, money, formatDate, STATUS, VISIT_NAMES } from '../lib/api.js';
import { PageHead, Stat, Badge, Img, Empty } from '../components/ui.jsx';

function RevenueChart({ series = [] }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = 220;
  const pad = { l: 8, r: 8, t: 16, b: 26 };
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const bw = (W - pad.l - pad.r) / Math.max(1, series.length);
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const total = series.reduce((s, d) => s + d.revenue, 0);
  const h = hover !== null ? series[hover] : null;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Sales, last 30 days</h2>
          <p className="text-sm text-ink-soft">{money(total)} across {series.reduce((s, d) => s + d.orders, 0)}  orders</p>
        </div>
        <p className="text-sm tabular-nums text-ink-soft">{h ? <><span className="font-semibold text-ink">{money(h.revenue)}</span> on {formatDate(h.date, { day: 'numeric', month: 'short' })} ({h.orders})</> : 'Tap a bar for details'}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Daily sales for the last 30 days" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--color-line)" strokeDasharray="3 4" />)}
        {series.map((d, i) => {
          const x = pad.l + i * bw;
          const top = y(d.revenue);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <rect x={x} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              <rect x={x + bw * 0.18} y={top} width={bw * 0.64} height={Math.max(0, H - pad.b - top)} rx={3} fill={hover === i ? 'var(--color-yolk-deep)' : d.revenue ? 'var(--color-ink)' : 'var(--color-line)'} />
              {i % 5 === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-ink-soft)">{formatDate(d.date, { day: 'numeric', month: 'short' })}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { data: s, isLoading } = useQuery({ queryKey: ['stats'], queryFn: () => api('/admin/stats') });
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-28" />)}</div>;
  const av = s.pets?.available || { count: 0, value: 0 };
  const flow = ['placed', 'confirmed', 'vet_check', 'ready'];
  const breedMax = Math.max(1, ...(s.breedSales || []).map((b) => b.revenue));

  return (
    <>
      <PageHead
        title="Good day"
        sub={formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={<Link to="/puppies/new" className="btn btn-primary"><Plus className="size-4" />List a puppy</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Money collected" value={money(s.collected)} sub={`${money(s.balanceDue)} balance due at handover`} />
        <Stat label="Open orders" value={s.activeReservations} sub={`${s.completed} puppies delivered so far`} />
        <Stat label="Puppies available" value={av.count} sub={`${money(av.value)} listed value, ${s.pets?.reserved?.count || 0} reserved`} />
        <Stat label="Margin on completed sales" value={money(s.margin)} sub={`Average puppy price ${money(s.avgPrice)}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <RevenueChart series={s.series} />
        <div className="card p-5">
          <h2 className="text-lg font-bold">Order pipeline</h2>
          <div className="mt-4 space-y-3">
            {flow.map((k) => (
              <Link key={k} to={`/reservations?status=${k}`} className="flex items-center justify-between rounded-xl bg-mist px-4 py-3 hover:bg-line/60">
                <Badge map={STATUS} value={k} />
                <span className="font-display text-2xl font-bold tabular-nums">{s.statusCounts?.[k] || 0}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Link to="/enquiries" className="rounded-xl border border-line p-3 hover:border-ink"><span className="font-display text-xl font-bold">{s.newEnquiries}</span><span className="block text-ink-soft">new enquiries</span></Link>
            <Link to="/stories" className="rounded-xl border border-line p-3 hover:border-ink"><span className="font-display text-xl font-bold">{s.pendingStories}</span><span className="block text-ink-soft">stories to review</span></Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-lg font-bold">Top breeds by value</h2>
          <div className="mt-4 space-y-3">
            {(s.breedSales || []).map((b) => (
              <div key={b._id}>
                <div className="flex justify-between text-sm"><span className="font-medium">{b._id}</span><span className="tabular-nums text-ink-soft">{b.sold} · {money(b.revenue)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-mist"><div className="h-full rounded-full bg-ink" style={{ width: `${(b.revenue / breedMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Upcoming visits</h2><Link to="/visits" className="text-sm font-semibold underline">All visits</Link></div>
          {s.upcomingVisits?.length ? (
            <ul className="mt-3 divide-y divide-line">
              {s.upcomingVisits.map((v) => (
                <li key={v._id} className="flex items-center gap-3 py-2.5">
                  <CalendarDays className="size-4 shrink-0 text-ink-soft" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{v.name}</span><span className="block truncate text-xs text-ink-soft">{VISIT_NAMES[v.type]}{v.petName ? `, ${v.petName}` : ''}</span></span>
                  <span className="text-right text-xs"><span className="block font-semibold">{formatDate(v.date, { day: 'numeric', month: 'short' })}</span>{v.slot}</span>
                </li>
              ))}
            </ul>
          ) : <Empty title="No visits booked" />}
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-bold">Going home soon</h2>
          {s.readySoon?.length ? (
            <ul className="mt-3 divide-y divide-line">
              {s.readySoon.map((o) => (
                <li key={o._id} className="flex items-center gap-3 py-2.5">
                  <Img src={o.petSnapshot?.image} width={80} className="size-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{o.petSnapshot?.name} to {o.customer?.name}</span><span className="flex items-center gap-1 text-xs text-ink-soft"><Truck className="size-3" />{o.handover === 'home_delivery' ? 'Home delivery' : 'Pickup'}{o.handoverDate ? `, ${formatDate(o.handoverDate, { day: 'numeric', month: 'short' })}` : ''}</span></span>
                  <Badge map={STATUS} value={o.status} />
                </li>
              ))}
            </ul>
          ) : <Empty title="No handovers scheduled" />}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4"><h2 className="text-lg font-bold">Latest orders</h2><Link to="/reservations" className="text-sm font-semibold underline">View all</Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-y border-line bg-mist/60"><tr><th className="th">Order</th><th className="th">Puppy</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Paid</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {s.recent.map((o) => (
                <tr key={o._id} className="hover:bg-mist/50">
                  <td className="td"><Link to={`/reservations?open=${o._id}`} className="font-semibold hover:underline">{o.orderNo}</Link><span className="block text-xs text-ink-soft">{formatDate(o.createdAt)}</span></td>
                  <td className="td"><span className="flex items-center gap-2"><Img src={o.petSnapshot?.image} width={64} className="size-8 rounded-lg object-cover" />{o.petSnapshot?.name}<span className="text-ink-soft">{o.petSnapshot?.breed}</span></span></td>
                  <td className="td">{o.customer?.name}</td>
                  <td className="td tabular-nums">{money(o.total)}</td>
                  <td className="td tabular-nums">{money(o.amountPaid)}</td>
                  <td className="td"><Badge map={STATUS} value={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
