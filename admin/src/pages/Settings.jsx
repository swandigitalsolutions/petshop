import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, DEMO } from '../lib/api.js';
import { PageHead, Field, Spinner } from '../components/ui.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { useToast } from '../components/Toast.jsx';

function Section({ title, sub, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {sub && <p className="text-sm text-ink-soft">{sub}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: () => api('/admin/settings') });
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  useEffect(() => { if (data) setF({ ...data, contact: data.contact || {}, social: data.social || {} }); }, [data]);
  if (isLoading || !f) return <div className="skeleton h-96" />;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setIn = (o, k, v) => setF((p) => ({ ...p, [o]: { ...p[o], [k]: v } }));
  const resetDemo = async () => {
    if (!window.confirm('Reset all demo data (puppies, reservations, visits, customers) back to the original demo?')) return;
    await api('/admin/demo-reset', { method: 'POST', body: {} });
    window.location.reload();
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...f,
        depositPercent: Number(f.depositPercent), minDeposit: Number(f.minDeposit), outstationDeliveryFee: Number(f.outstationDeliveryFee),
        healthGuaranteeMonths: Number(f.healthGuaranteeMonths),
        freeDeliveryCities: String(f.freeDeliveryCities).split(',').map((s) => s.trim()).filter(Boolean),
        visitSlots: String(f.visitSlots).split(',').map((s) => s.trim()).filter(Boolean),
      };
      const saved = await api('/admin/settings', { method: 'PUT', body });
      qc.setQueryData(['admin-settings'], saved);
      toast('Settings saved. The store updates within a minute.');
    } catch (ex) { toast(ex.message, { type: 'error' }); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save}>
      <PageHead title="Store settings" sub="Homepage text, reservation rules and contact details." actions={<>{DEMO && <button type="button" onClick={resetDemo} className="btn btn-outline">Reset demo data</button>}<button className="btn btn-dark" disabled={busy}>{busy ? <Spinner /> : 'Save settings'}</button></>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Homepage">
          <Field label="Announcement bar"><input className="input" value={f.announcement || ''} onChange={(e) => set('announcement', e.target.value)} /></Field>
          <Field label="Hero headline"><input className="input" value={f.heroTitle || ''} onChange={(e) => set('heroTitle', e.target.value)} /></Field>
          <Field label="Hero text"><textarea rows={3} className="input" value={f.heroSubtitle || ''} onChange={(e) => set('heroSubtitle', e.target.value)} /></Field>
          <div><p className="label">Fallback hero photo (shown when no puppy is featured)</p><ImageUploader max={1} value={f.heroImage ? [f.heroImage] : []} onChange={(v) => set('heroImage', v[0] || '')} /></div>
        </Section>
        <div className="space-y-6">
          <Section title="Reservations & delivery">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deposit (% of price)"><input type="number" min="0" max="100" className="input" value={f.depositPercent} onChange={(e) => set('depositPercent', e.target.value)} /></Field>
              <Field label="Minimum deposit (₹)"><input type="number" min="0" className="input" value={f.minDeposit} onChange={(e) => set('minDeposit', e.target.value)} /></Field>
              <Field label="Free delivery cities" hint="Comma separated"><input className="input" value={Array.isArray(f.freeDeliveryCities) ? f.freeDeliveryCities.join(', ') : f.freeDeliveryCities} onChange={(e) => set('freeDeliveryCities', e.target.value)} /></Field>
              <Field label="Outstation delivery fee (₹)"><input type="number" min="0" className="input" value={f.outstationDeliveryFee} onChange={(e) => set('outstationDeliveryFee', e.target.value)} /></Field>
              <Field label="Health guarantee (months)"><input type="number" min="0" className="input" value={f.healthGuaranteeMonths} onChange={(e) => set('healthGuaranteeMonths', e.target.value)} /></Field>
            </div>
            <Field label="Visit time slots" hint="Comma separated, e.g. 10:00 AM, 11:30 AM"><input className="input" value={Array.isArray(f.visitSlots) ? f.visitSlots.join(', ') : f.visitSlots} onChange={(e) => set('visitSlots', e.target.value)} /></Field>
          </Section>
          <Section title="Contact & social">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><input className="input" value={f.contact.phone || ''} onChange={(e) => setIn('contact', 'phone', e.target.value)} /></Field>
              <Field label="WhatsApp"><input className="input" value={f.contact.whatsapp || ''} onChange={(e) => setIn('contact', 'whatsapp', e.target.value)} /></Field>
              <Field label="Email"><input className="input" value={f.contact.email || ''} onChange={(e) => setIn('contact', 'email', e.target.value)} /></Field>
              <Field label="Opening hours"><input className="input" value={f.contact.hours || ''} onChange={(e) => setIn('contact', 'hours', e.target.value)} /></Field>
            </div>
            <Field label="Kennel address"><input className="input" value={f.contact.address || ''} onChange={(e) => setIn('contact', 'address', e.target.value)} /></Field>
            <Field label="Google Maps link"><input className="input" value={f.contact.mapUrl || ''} onChange={(e) => setIn('contact', 'mapUrl', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              {['instagram', 'facebook', 'youtube'].map((k) => <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><input className="input" value={f.social[k] || ''} onChange={(e) => setIn('social', k, e.target.value)} /></Field>)}
            </div>
          </Section>
        </div>
      </div>
    </form>
  );
}
