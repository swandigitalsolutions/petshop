import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useBreed } from '../lib/queries.js';
import { Img, Crumbs, Empty, Field, Spinner } from '../components/ui.jsx';
import { PetCard } from '../components/Cards.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Dog } from 'lucide-react';

function Bar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-ink-soft">{label}</span><span className="font-semibold">{value}/5</span></div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${value * 20}%` }} /></div>
    </div>
  );
}

function Waitlist({ breed }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', message: '' });
  const [state, setState] = useState('idle');
  const submit = async (e) => {
    e.preventDefault();
    setState('busy');
    try {
      await api('/enquiries', { method: 'POST', body: { ...form, breed, type: 'breed_waitlist', message: form.message || `Please add me to the ${breed} waitlist.` } });
      setState('done');
    } catch { setState('error'); }
  };
  if (state === 'done') return <p className="rounded-2xl bg-leaf-soft p-4 font-medium text-leaf">You're on the {breed} waitlist. We'll call you as soon as a litter is ready.</p>;
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Name"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Phone"><input required type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <button className="btn btn-dark" disabled={state === 'busy'}>{state === 'busy' ? <Spinner /> : 'Join the waitlist'}</button>
      {state === 'error' && <p className="text-sm text-coral sm:col-span-3">Check your name and phone number, then try again.</p>}
    </form>
  );
}

export default function BreedDetail() {
  const { slug } = useParams();
  const { data, isLoading, error } = useBreed(slug);
  if (isLoading) return <div className="wrap py-10"><div className="skeleton h-[420px]" /></div>;
  if (error) return <div className="wrap py-24 text-center"><h1 className="text-4xl font-bold">Breed not found</h1><Link to="/breeds" className="btn btn-dark mt-6">Back to the breed guide</Link></div>;
  const { breed: b, puppies } = data;
  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Breed guide', to: '/breeds' }, { label: b.name }]} />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="aspect-[4/3] overflow-hidden rounded-[28px] bg-mist"><Img src={b.image} alt={`${b.name} dog`} width={1000} eager className="size-full object-cover" /></div>
        <div>
          <h1 className="text-5xl font-extrabold">{b.name}</h1>
          <p className="mt-4 text-lg text-ink-2">{b.description}</p>
          <dl className="mt-6 grid grid-cols-3 gap-4">
            {[['Origin', b.origin], ['Adult weight', b.weightRange], ['Life span', b.lifeSpan]].map(([k, v]) => (
              <div key={k}><dt className="text-sm text-ink-soft">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">{b.temperament?.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <section className="panel p-6 lg:col-span-1">
          <h2 className="text-2xl font-bold">At a glance</h2>
          <div className="mt-5 space-y-4">
            <Bar label="Energy" value={b.energyLevel} />
            <Bar label="Shedding" value={b.shedding} />
            <Bar label="Grooming needs" value={b.grooming} />
            <Bar label="Ease of training" value={b.trainability} />
          </div>
          <p className="mt-5 text-sm"><span className="font-semibold">Good with:</span> {b.goodWith?.join(', ')}</p>
          <p className="mt-2 text-sm"><span className="font-semibold">Apartment-friendly:</span> {b.apartmentFriendly ? 'Yes' : 'Better with a house and garden'}</p>
          {b.climateNote && <p className="mt-4 rounded-2xl bg-sky p-3 text-sm">{b.climateNote}</p>}
        </section>
        <section className="lg:col-span-2">
          <h2 className="text-3xl font-bold">{puppies.length ? `${b.name} puppies available now` : `No ${b.name} puppies right now`}</h2>
          {puppies.length ? (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{puppies.map((p) => <PetCard key={p._id} pet={p} />)}</div>
          ) : (
            <div className="mt-6"><Empty icon={Dog} title="Be first for the next litter" text={`Leave your number and we'll call you when ${b.name} puppies arrive.`} /></div>
          )}
          <div className="panel mt-8 p-6">
            <h3 className="text-xl font-bold">Waiting for a {b.name}?</h3>
            <p className="mb-4 mt-1 text-ink-soft">Our breeders have litters every few months. Join the waitlist and we'll give you first pick.</p>
            <Waitlist breed={b.name} />
          </div>
        </section>
      </div>
    </div>
  );
}
