import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { api, money, STORE_URL } from '../lib/api.js';
import { Field, Spinner } from '../components/ui.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { useToast } from '../components/Toast.jsx';

const GOOD_WITH = ['kids', 'first-time owners', 'apartments', 'seniors', 'other dogs', 'cats', 'active families', 'experienced owners'];
const DEFAULT_INCLUDED = ['Vet health certificate', 'Vaccination & deworming card', '7-day food pack', "Blanket with mother's scent", 'Free first vet check-up', 'Lifetime care helpline'];
const EMPTY = {
  name: '', code: '', breed: '', gender: 'male', dob: '', color: '', size: '', weightKg: '', price: '', mrp: '', costPrice: '', breeder: '',
  images: [], videoUrl: '', description: '', temperament: [], goodWith: [], energyLevel: 3, vaccinated: true, vaccinations: ['DHPPi — 1st dose', 'Deworming ×3'],
  dewormed: true, microchipped: false, kciRegistered: false, vetChecked: true, healthGuaranteeMonths: 12, parents: { sire: '', dam: '', sireImage: '', damImage: '' },
  included: DEFAULT_INCLUDED, readyToGoHome: '', adoption: false, homeDelivery: true, status: 'available', featured: false, tags: [],
};

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const lines = (v) => (Array.isArray(v) ? v.join('\n') : v);
const fromLines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const fromCsv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

function Section({ title, sub, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {sub && <p className="text-sm text-ink-soft">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
    <span className="text-sm font-medium">{label}</span>
    <input type="checkbox" className="size-4 accent-ink" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

export default function PuppyForm() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: breeds = [] } = useQuery({ queryKey: ['admin-breeds'], queryFn: () => api('/admin/breeds') });
  const { data: pet, isLoading } = useQuery({ queryKey: ['admin-pet', id], queryFn: () => api(`/pets/admin/${id}`), enabled: !isNew });
  const [f, setF] = useState(EMPTY);
  const [text, setText] = useState({ temperament: '', vaccinations: '', included: '', tags: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pet) return;
    const merged = { ...EMPTY, ...pet, parents: { ...EMPTY.parents, ...(pet.parents || {}) } };
    setF(merged);
    setText({ temperament: (pet.temperament || []).join(', '), vaccinations: lines(pet.vaccinations || []), included: lines(pet.included || []), tags: (pet.tags || []).join(', ') });
  }, [pet]);
  useEffect(() => {
    if (isNew) setText({ temperament: '', vaccinations: lines(EMPTY.vaccinations), included: lines(EMPTY.included), tags: '' });
  }, [isNew]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setParent = (k, v) => setF((p) => ({ ...p, parents: { ...p.parents, [k]: v } }));
  const onBreed = (name) => {
    const b = breeds.find((x) => x.name === name);
    setF((p) => ({ ...p, breed: name, size: p.size || b?.size || '', goodWith: p.goodWith.length ? p.goodWith : b?.goodWith || [], energyLevel: b?.energyLevel || p.energyLevel }));
    if (b && !text.temperament) setText((t) => ({ ...t, temperament: (b.temperament || []).join(', ') }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!f.images.length) { toast('Add at least one photo of the puppy', { type: 'error' }); return; }
    setBusy(true);
    const body = {
      ...f,
      price: f.adoption ? 0 : Number(f.price) || 0,
      mrp: f.mrp ? Number(f.mrp) : undefined,
      costPrice: f.costPrice ? Number(f.costPrice) : 0,
      weightKg: f.weightKg ? Number(f.weightKg) : undefined,
      energyLevel: Number(f.energyLevel),
      healthGuaranteeMonths: f.adoption ? 0 : Number(f.healthGuaranteeMonths),
      temperament: fromCsv(text.temperament),
      vaccinations: fromLines(text.vaccinations),
      included: fromLines(text.included),
      tags: fromCsv(text.tags),
      dob: f.dob || undefined,
      readyToGoHome: f.readyToGoHome || undefined,
    };
    ['_id', 'slug', 'views', 'createdAt', 'updatedAt', '__v'].forEach((k) => delete body[k]);
    try {
      const saved = await api(isNew ? '/pets' : `/pets/${id}`, { method: isNew ? 'POST' : 'PUT', body });
      qc.invalidateQueries({ queryKey: ['admin-pets'] });
      qc.invalidateQueries({ queryKey: ['admin-pet', saved._id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast(isNew ? `${saved.name} is now live on the store` : `${saved.name} saved`);
      if (isNew) nav(`/puppies/${saved._id}`, { replace: true });
    } catch (ex) { toast(ex.message, { type: 'error' }); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${f.name}'s listing permanently? This can't be undone. To just hide it from the store, set the status to Hidden instead.`)) return;
    try {
      await api(`/pets/${id}`, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['admin-pets'] });
      toast(`${f.name} deleted`);
      nav('/puppies');
    } catch (ex) { toast(ex.message, { type: 'error' }); }
  };

  if (!isNew && isLoading) return <div className="skeleton h-96" />;
  const margin = (Number(f.price) || 0) - (Number(f.costPrice) || 0);

  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/puppies" className="btn btn-outline size-10 p-0" aria-label="Back to puppies"><ArrowLeft className="size-4" /></Link>
          <div>
            <h1 className="text-3xl font-bold">{isNew ? 'List a new puppy' : f.name}</h1>
            {!isNew && <p className="text-sm text-ink-soft">{f.code} · {f.breed}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && <a href={`${STORE_URL}/puppies/${pet?.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline"><ExternalLink className="size-4" />View on store</a>}
          {!isNew && <button type="button" onClick={remove} className="btn btn-danger"><Trash2 className="size-4" />Delete</button>}
          <button className="btn btn-dark" disabled={busy}>{busy ? <Spinner /> : isNew ? 'Publish puppy' : 'Save changes'}</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Section title="Photos" sub="Clear, well-lit photos sell puppies. Add 3–6 from different angles.">
            <ImageUploader value={f.images} onChange={(v) => set('images', v)} />
            <Field label="Video link (YouTube or Instagram, optional)" className="mt-4"><input className="input" value={f.videoUrl || ''} onChange={(e) => set('videoUrl', e.target.value)} /></Field>
          </Section>

          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input required className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Breed">
                <select required className="input" value={f.breed} onChange={(e) => onBreed(e.target.value)}>
                  <option value="">Choose a breed</option>
                  {breeds.map((b) => <option key={b._id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Gender">
                <select className="input" value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option></select>
              </Field>
              <Field label="Date of birth"><input type="date" required className="input" value={toDateInput(f.dob)} onChange={(e) => set('dob', e.target.value)} /></Field>
              <Field label="Colour / markings"><input className="input" value={f.color || ''} onChange={(e) => set('color', e.target.value)} /></Field>
              <Field label="Current weight (kg)"><input type="number" step="0.1" min="0" className="input" value={f.weightKg ?? ''} onChange={(e) => set('weightKg', e.target.value)} /></Field>
              <Field label="Adult size">
                <select className="input" value={f.size || ''} onChange={(e) => set('size', e.target.value)}>
                  <option value="">From breed</option>{['toy', 'small', 'medium', 'large', 'giant'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Kennel ID" hint="Leave blank to generate one"><input className="input" value={f.code || ''} onChange={(e) => set('code', e.target.value)} /></Field>
              <Field label="Ready to go home on" hint="For puppies under 8 weeks. Shows as Pre-book.">
                <input type="date" className="input" value={toDateInput(f.readyToGoHome)} onChange={(e) => set('readyToGoHome', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Story and personality">
            <Field label="Description shown on the store"><textarea rows={5} className="input" value={f.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="How was the puppy raised? What's their personality like?" /></Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Temperament" hint="Comma separated, e.g. Playful, Gentle"><input className="input" value={text.temperament} onChange={(e) => setText({ ...text, temperament: e.target.value })} /></Field>
              <Field label={`Energy level: ${f.energyLevel}/5`}><input type="range" min="1" max="5" className="w-full accent-ink" value={f.energyLevel} onChange={(e) => set('energyLevel', e.target.value)} /></Field>
            </div>
            <p className="label mt-4">Good with</p>
            <div className="flex flex-wrap gap-2">
              {GOOD_WITH.map((g) => {
                const on = f.goodWith.includes(g);
                return <button type="button" key={g} onClick={() => set('goodWith', on ? f.goodWith.filter((x) => x !== g) : [...f.goodWith, g])} className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}>{g}</button>;
              })}
            </div>
            <Field label="Tags" hint="Comma separated, e.g. blue eyes, show line" className="mt-4"><input className="input" value={text.tags} onChange={(e) => setText({ ...text, tags: e.target.value })} /></Field>
          </Section>

          <Section title="Parents" sub="Shown on the puppy page. Leave blank for rescues.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Father (sire)"><input className="input" value={f.parents.sire || ''} onChange={(e) => setParent('sire', e.target.value)} /></Field>
              <Field label="Mother (dam)"><input className="input" value={f.parents.dam || ''} onChange={(e) => setParent('dam', e.target.value)} /></Field>
              <div><p className="label">Father photo</p><ImageUploader max={1} value={f.parents.sireImage ? [f.parents.sireImage] : []} onChange={(v) => setParent('sireImage', v[0] || '')} /></div>
              <div><p className="label">Mother photo</p><ImageUploader max={1} value={f.parents.damImage ? [f.parents.damImage] : []} onChange={(v) => setParent('damImage', v[0] || '')} /></div>
            </div>
          </Section>

          <Section title="Health">
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle label="Vet-checked" checked={f.vetChecked} onChange={(v) => set('vetChecked', v)} />
              <Toggle label="Vaccinated for age" checked={f.vaccinated} onChange={(v) => set('vaccinated', v)} />
              <Toggle label="Dewormed" checked={f.dewormed} onChange={(v) => set('dewormed', v)} />
              <Toggle label="Microchipped" checked={f.microchipped} onChange={(v) => set('microchipped', v)} />
              <Toggle label="KCI registered" checked={f.kciRegistered} onChange={(v) => set('kciRegistered', v)} />
              <Field label="Health guarantee (months)"><input type="number" min="0" className="input" value={f.healthGuaranteeMonths} onChange={(e) => set('healthGuaranteeMonths', e.target.value)} /></Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Vaccinations done" hint="One per line"><textarea rows={4} className="input" value={text.vaccinations} onChange={(e) => setText({ ...text, vaccinations: e.target.value })} /></Field>
              <Field label="Goes home with" hint="One per line"><textarea rows={4} className="input" value={text.included} onChange={(e) => setText({ ...text, included: e.target.value })} /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Section title="Status">
            <div className="space-y-3">
              <Field label="Visibility">
                <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="available">Available on store</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="hidden">Hidden from store</option>
                </select>
              </Field>
              <Toggle label="Feature on homepage" checked={f.featured} onChange={(v) => set('featured', v)} />
              <Toggle label="Home delivery available" checked={f.homeDelivery} onChange={(v) => set('homeDelivery', v)} />
              <Toggle label="Rescue / free adoption" checked={f.adoption} onChange={(v) => set('adoption', v)} />
            </div>
          </Section>
          {!f.adoption && (
            <Section title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Field label="Selling price (₹)"><input required type="number" min="0" className="input" value={f.price} onChange={(e) => set('price', e.target.value)} /></Field>
                <Field label="Compare-at price (₹)" hint="Shown struck through"><input type="number" min="0" className="input" value={f.mrp ?? ''} onChange={(e) => set('mrp', e.target.value)} /></Field>
                <Field label="Breeder payout (₹)" hint="Private, never shown on the store"><input type="number" min="0" className="input" value={f.costPrice ?? ''} onChange={(e) => set('costPrice', e.target.value)} /></Field>
                <Field label="Breeder / source" hint="Private"><input className="input" value={f.breeder || ''} onChange={(e) => set('breeder', e.target.value)} /></Field>
              </div>
              {Number(f.price) > 0 && <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-sm">Margin: <span className={`font-semibold ${margin < 0 ? 'text-coral' : 'text-leaf'}`}>{money(margin)}</span>{Number(f.price) ? ` (${Math.round((margin / Number(f.price)) * 100)}%)` : ''}</p>}
            </Section>
          )}
          <button className="btn btn-dark w-full py-3" disabled={busy}>{busy ? <Spinner /> : isNew ? 'Publish puppy' : 'Save changes'}</button>
        </div>
      </div>
    </form>
  );
}
