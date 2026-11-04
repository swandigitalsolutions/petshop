import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, MapPin, Clock, Check } from 'lucide-react';
import { useSettings, usePets } from '../lib/queries.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api, formatDate } from '../lib/api.js';
import { Field, Spinner, Crumbs } from '../components/ui.jsx';

const days = () => Array.from({ length: 10 }, (_, i) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + i);
  return d;
});

export default function Visit() {
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { data: pets } = usePets({ status: 'available', limit: 60, sort: 'newest' });
  const types = settings?.visitTypes || [];
  const dates = useMemo(days, []);

  const [type, setType] = useState(sp.get('type') || 'kennel_visit');
  const [pet, setPet] = useState(sp.get('pet') || '');
  const [date, setDate] = useState(dates[1].toISOString());
  const [slot, setSlot] = useState('');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', people: 2, notes: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  const { data: slots = [], isFetching } = useQuery({
    queryKey: ['slots', date],
    queryFn: () => api(`/visits/slots?date=${encodeURIComponent(date)}`, { auth: false }),
    staleTime: 30_000,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!slot) { setErr('Choose a time slot.'); return; }
    setBusy(true);
    setErr('');
    try {
      const b = await api('/visits', { method: 'POST', body: { type, pet: pet || undefined, date, slot, ...form } });
      qc.invalidateQueries({ queryKey: ['me', 'visits'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
      setDone(b);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  if (done) {
    const t = types.find((x) => x.key === done.type);
    return (
      <div className="wrap max-w-xl py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-leaf text-white"><Check className="size-8" /></span>
        <h1 className="mt-5 text-4xl font-extrabold">You're booked in</h1>
        <p className="mt-3 text-lg text-ink-2">{t?.name} on {formatDate(done.date, { weekday: 'long', day: 'numeric', month: 'long' })} at {done.slot}{done.petName ? ` to meet ${done.petName}` : ''}.</p>
        <p className="mt-2 text-ink-soft">We'll confirm on WhatsApp shortly. Booking reference {done.bookingNo}.</p>
        {done.type === 'kennel_visit' && <p className="mt-4 rounded-2xl bg-mist p-4 text-sm"><MapPin className="mr-1 inline size-4" />{settings?.contact?.address}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/puppies" className="btn btn-dark">Keep browsing</Link>
          
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Book a visit' }]} />
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} className="space-y-10">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Meet your puppy first</h1>
            <p className="mt-3 max-w-xl text-lg text-ink-soft">Visits and video calls are free. Bring the family, ask the vet questions, and take your time deciding.</p>
          </div>

          <fieldset>
            <legend className="mb-3 text-xl font-bold">How would you like to meet?</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {types.map((t) => (
                <button type="button" key={t.key} onClick={() => setType(t.key)} aria-pressed={type === t.key} className={`rounded-2xl border-2 p-4 text-left transition ${type === t.key ? 'border-ink bg-mist' : 'border-line hover:border-ink-soft'}`}>
                  <span className="block font-semibold">{t.name}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{t.description}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"><Clock className="size-3.5" />{t.duration}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {type !== 'home_visit' && (
            <Field label="Which puppy would you like to meet?" hint="Optional. You can meet several puppies on one visit.">
              <select className="input" value={pet} onChange={(e) => setPet(e.target.value)}>
                <option value="">I'd like to see a few puppies</option>
                {pets?.items?.map((p) => <option key={p._id} value={p._id}>{p.name}, {p.breed} ({p.gender === 'male' ? 'boy' : 'girl'})</option>)}
              </select>
            </Field>
          )}

          <fieldset>
            <legend className="mb-3 text-xl font-bold">Pick a day</legend>
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {dates.map((d) => {
                const iso = d.toISOString();
                const on = iso === date;
                return (
                  <button type="button" key={iso} onClick={() => { setDate(iso); setSlot(''); }} aria-pressed={on} className={`w-[72px] shrink-0 rounded-2xl border-2 py-3 text-center transition ${on ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink-soft'}`}>
                    <span className="block text-xs">{formatDate(d, { weekday: 'short' })}</span>
                    <span className="block font-display text-2xl font-bold">{d.getDate()}</span>
                    <span className="block text-xs">{formatDate(d, { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
            <p className="mb-3 mt-6 text-sm font-semibold">Time {isFetching && <Spinner className="ml-1 size-3" />}</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button type="button" key={s.slot} disabled={!s.available} onClick={() => setSlot(s.slot)} className={`chip ${slot === s.slot ? 'chip-on' : ''} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}>{s.slot}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-xl font-bold">Your details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Phone (WhatsApp)"><input required type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              {type === 'kennel_visit' && (
                <Field label="How many people are coming?"><input type="number" min={1} max={6} className="input" value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} /></Field>
              )}
              <div className="sm:col-span-2"><Field label="Anything you'd like to ask?"><textarea rows={3} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
            </div>
          </fieldset>

          {err && <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral">{err}</p>}
          <button className="btn btn-primary px-8 py-4 text-base" disabled={busy}>{busy ? <Spinner /> : <><CalendarCheck className="size-5" />Confirm booking</>}</button>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[24px] bg-sky p-6">
            <h2 className="text-2xl font-bold">Visiting the kennel</h2>
            <ul className="mt-4 space-y-3 text-ink-2">
              <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0" />{settings?.contact?.address}</li>
              <li className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0" />{settings?.contact?.hours}</li>
            </ul>
            {settings?.contact?.mapUrl && <a href={settings.contact.mapUrl} target="_blank" rel="noreferrer" className="link mt-4 inline-block text-sm">Get directions</a>}
          </div>
          <div className="panel p-6">
            <h3 className="text-lg font-bold">Before you come</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              <li>Please don't visit other kennels on the same day, to protect young puppies from infection.</li>
              <li>Children are welcome. We'll show them how to hold a puppy safely.</li>
              <li>Visits last about 45 minutes, and you can meet as many puppies as you like.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
