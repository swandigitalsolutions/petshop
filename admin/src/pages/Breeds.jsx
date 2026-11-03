import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageHead, Img, Drawer, Field, Spinner, Empty } from '../components/ui.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { name: '', image: '', summary: '', description: '', size: 'medium', origin: '', lifeSpan: '', weightRange: '', temperament: [], goodWith: [], energyLevel: 3, shedding: 3, grooming: 3, trainability: 3, apartmentFriendly: false, climateNote: '', featured: false, order: 0 };
const GOOD_WITH = ['kids', 'first-time owners', 'apartments', 'seniors', 'other dogs', 'cats', 'active families', 'experienced owners'];

function BreedForm({ breed, onClose }) {
  const [f, setF] = useState({ ...EMPTY, ...breed });
  const [temp, setTemp] = useState((breed?.temperament || []).join(', '));
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.name) { toast('Breed name is required', { type: 'error' }); return; }
    setBusy(true);
    const body = { ...f, temperament: temp.split(',').map((s) => s.trim()).filter(Boolean) };
    ['_id', 'slug', 'stock', 'createdAt', 'updatedAt', '__v'].forEach((k) => delete body[k]);
    try {
      await api(breed?._id ? `/admin/breeds/${breed._id}` : '/admin/breeds', { method: breed?._id ? 'PUT' : 'POST', body });
      qc.invalidateQueries({ queryKey: ['admin-breeds'] });
      toast(`${f.name} saved`);
      onClose();
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete the ${f.name} breed?`)) return;
    try {
      await api(`/admin/breeds/${breed._id}`, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['admin-breeds'] });
      toast('Breed deleted');
      onClose();
    } catch (e) { toast(e.message, { type: 'error' }); }
  };
  const Range = ({ k, label }) => <Field label={`${label}: ${f[k]}/5`}><input type="range" min="1" max="5" className="w-full accent-ink" value={f[k]} onChange={(e) => set(k, Number(e.target.value))} /></Field>;
  return (
    <Drawer
      title={breed?._id ? `Edit ${breed.name}` : 'Add a breed'}
      onClose={onClose}
      wide
      footer={<>{breed?._id && <button type="button" className="btn btn-danger mr-auto" onClick={remove}>Delete</button>}<button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button type="button" className="btn btn-dark" onClick={save} disabled={busy}>{busy ? <Spinner /> : 'Save breed'}</button></>}
    >
      <div className="space-y-4">
        <div><p className="label">Photo</p><ImageUploader max={1} value={f.image ? [f.image] : []} onChange={(v) => set('image', v[0] || '')} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Breed name"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Adult size"><select className="input" value={f.size} onChange={(e) => set('size', e.target.value)}>{['toy', 'small', 'medium', 'large', 'giant'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Origin"><input className="input" value={f.origin} onChange={(e) => set('origin', e.target.value)} /></Field>
          <Field label="Life span"><input className="input" value={f.lifeSpan} onChange={(e) => set('lifeSpan', e.target.value)} placeholder="10–12 years" /></Field>
          <Field label="Adult weight"><input className="input" value={f.weightRange} onChange={(e) => set('weightRange', e.target.value)} placeholder="25–34 kg" /></Field>
          <Field label="Sort order"><input type="number" className="input" value={f.order} onChange={(e) => set('order', Number(e.target.value))} /></Field>
        </div>
        <Field label="One-line summary"><input className="input" value={f.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
        <Field label="Full description"><textarea rows={4} className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Temperament" hint="Comma separated"><input className="input" value={temp} onChange={(e) => setTemp(e.target.value)} /></Field>
        <div>
          <p className="label">Good with</p>
          <div className="flex flex-wrap gap-2">{GOOD_WITH.map((g) => { const on = f.goodWith.includes(g); return <button type="button" key={g} onClick={() => set('goodWith', on ? f.goodWith.filter((x) => x !== g) : [...f.goodWith, g])} className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-ink bg-ink text-white' : 'border-line'}`}>{g}</button>; })}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Range k="energyLevel" label="Energy" /><Range k="shedding" label="Shedding" /><Range k="grooming" label="Grooming" /><Range k="trainability" label="Ease of training" />
        </div>
        <Field label="Climate note" hint="e.g. Needs AC in Indian summers"><input className="input" value={f.climateNote} onChange={(e) => set('climateNote', e.target.value)} /></Field>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-ink" checked={f.apartmentFriendly} onChange={(e) => set('apartmentFriendly', e.target.checked)} />Apartment-friendly</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-ink" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} />Featured</label>
        </div>
      </div>
    </Drawer>
  );
}

export default function Breeds() {
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-breeds'], queryFn: () => api('/admin/breeds') });
  const [edit, setEdit] = useState(null);
  return (
    <>
      <PageHead title="Breeds" sub="Breed guide content and filters on the store." actions={<button type="button" onClick={() => setEdit({})} className="btn btn-primary"><Plus className="size-4" />Add breed</button>} />
      {isLoading ? <div className="skeleton h-64" /> : !data.length ? <div className="card"><Empty title="No breeds yet" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((b) => (
            <button type="button" key={b._id} onClick={() => setEdit(b)} className="card flex gap-4 p-4 text-left hover:border-ink">
              <Img src={b.image} width={160} className="size-20 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-display text-lg font-bold">{b.name}{b.apartmentFriendly && <Building2 className="size-4 text-leaf" aria-label="Apartment-friendly" />}</span>
                <span className="mt-0.5 block text-sm capitalize text-ink-soft">{b.size} · {b.lifeSpan}</span>
                <span className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="badge bg-leaf-soft text-leaf">{b.stock?.available || 0} available</span>
                  <span className="badge bg-yolk-soft text-ink">{b.stock?.reserved || 0} reserved</span>
                  <span className="badge bg-mist text-ink-soft">{b.stock?.sold || 0} sold</span>
                </span>
              </span>
              <Pencil className="size-4 shrink-0 text-ink-soft" />
            </button>
          ))}
        </div>
      )}
      {edit && <BreedForm breed={edit._id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}
