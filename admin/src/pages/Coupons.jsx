import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api, money, formatDate } from '../lib/api.js';
import { PageHead, Drawer, Field, Spinner, Empty } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { code: '', description: '', type: 'flat', value: '', minOrder: 0, maxDiscount: '', expiresAt: '', usageLimit: '', active: true };

function CouponForm({ coupon, onClose }) {
  const [f, setF] = useState({ ...EMPTY, ...coupon, expiresAt: coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '' });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true);
    const body = { ...f, value: Number(f.value), minOrder: Number(f.minOrder) || 0, maxDiscount: f.maxDiscount ? Number(f.maxDiscount) : undefined, usageLimit: f.usageLimit ? Number(f.usageLimit) : undefined, expiresAt: f.expiresAt || undefined };
    ['_id', 'createdAt', 'updatedAt', '__v', 'used'].forEach((k) => delete body[k]);
    try {
      await api(coupon?._id ? `/admin/coupons/${coupon._id}` : '/admin/coupons', { method: coupon?._id ? 'PUT' : 'POST', body });
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast(`${body.code.toUpperCase()} saved`);
      onClose();
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete coupon ${f.code}?`)) return;
    await api(`/admin/coupons/${coupon._id}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    toast('Coupon deleted');
    onClose();
  };
  return (
    <Drawer title={coupon?._id ? `Edit ${coupon.code}` : 'New coupon'} onClose={onClose}
      footer={<>{coupon?._id && <button type="button" className="btn btn-danger mr-auto" onClick={remove}>Delete</button>}<button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button type="button" className="btn btn-dark" onClick={save} disabled={busy || !f.code || !f.value}>{busy ? <Spinner /> : 'Save coupon'}</button></>}>
      <div className="space-y-4">
        <Field label="Code"><input className="input uppercase" value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="FIRSTPUP" /></Field>
        <Field label="Description shown to customers"><input className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type"><select className="input" value={f.type} onChange={(e) => set('type', e.target.value)}><option value="flat">Flat ₹ off</option><option value="percent">% off</option></select></Field>
          <Field label={f.type === 'flat' ? 'Amount (₹)' : 'Percent'}><input type="number" min="1" className="input" value={f.value} onChange={(e) => set('value', e.target.value)} /></Field>
          <Field label="Minimum puppy price (₹)"><input type="number" min="0" className="input" value={f.minOrder} onChange={(e) => set('minOrder', e.target.value)} /></Field>
          {f.type === 'percent' && <Field label="Max discount (₹)"><input type="number" min="0" className="input" value={f.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} /></Field>}
          <Field label="Expires on"><input type="date" className="input" value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} /></Field>
          <Field label="Usage limit"><input type="number" min="1" className="input" value={f.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="Unlimited" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-ink" checked={f.active} onChange={(e) => set('active', e.target.checked)} />Active</label>
      </div>
    </Drawer>
  );
}

export default function Coupons() {
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api('/admin/coupons') });
  const [edit, setEdit] = useState(null);
  const expired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();
  return (
    <>
      <PageHead title="Coupons" sub="Discount codes customers can use when reserving a puppy." actions={<button type="button" onClick={() => setEdit({})} className="btn btn-primary"><Plus className="size-4" />New coupon</button>} />
      <div className="card overflow-hidden">
        {isLoading ? <div className="skeleton m-4 h-40" /> : !data.length ? <Empty title="No coupons yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-mist/60"><tr><th className="th">Code</th><th className="th">Discount</th><th className="th">Minimum</th><th className="th">Used</th><th className="th">Expires</th><th className="th">Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.map((c) => (
                  <tr key={c._id} onClick={() => setEdit(c)} className="cursor-pointer hover:bg-mist/50">
                    <td className="td"><span className="rounded-lg bg-mist px-2 py-1 font-mono font-semibold">{c.code}</span><span className="mt-1 block text-xs text-ink-soft">{c.description}</span></td>
                    <td className="td">{c.type === 'flat' ? money(c.value) : `${c.value}%${c.maxDiscount ? ` up to ${money(c.maxDiscount)}` : ''}`}</td>
                    <td className="td">{c.minOrder ? money(c.minOrder) : '—'}</td>
                    <td className="td tabular-nums">{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td className="td">{c.expiresAt ? formatDate(c.expiresAt) : 'Never'}</td>
                    <td className="td">{!c.active ? <span className="badge bg-mist text-ink-soft">Paused</span> : expired(c) ? <span className="badge bg-coral-soft text-coral">Expired</span> : <span className="badge bg-leaf-soft text-leaf">Active</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {edit && <CouponForm coupon={edit._id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}
