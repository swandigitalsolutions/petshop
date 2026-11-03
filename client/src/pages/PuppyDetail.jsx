import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Syringe, BadgeCheck, Cpu, Stethoscope, CalendarCheck, Video, MessageCircle, Check, Gift, Truck, PawPrint, X, Scale,
} from 'lucide-react';
import { usePet, useSettings } from '../lib/queries.js';
import { Img, Price, Crumbs, Spinner, Field } from '../components/ui.jsx';
import { PetCard } from '../components/Cards.jsx';
import WishButton from '../components/WishButton.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ageLabel, formatDate, money } from '../lib/api.js';

function Meter({ label, value = 0 }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-ink-soft">{label}</span><span className="font-semibold">{['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'][value]}</span></div>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 flex-1 rounded-full ${i <= value ? 'bg-ink' : 'bg-line'}`} />)}
      </div>
    </div>
  );
}

function Gallery({ pet }) {
  const [i, setI] = useState(0);
  const imgs = pet.images?.length ? pet.images : [null];
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-mist sm:aspect-square">
        <Img key={imgs[i]} src={imgs[i]} alt={`${pet.name}, ${pet.breed} puppy, photo ${i + 1}`} width={1100} eager sizes="(min-width: 1024px) 55vw, 100vw" className="size-full object-cover" />
        {pet.status === 'reserved' && <span className="badge absolute left-4 top-4 bg-ink px-3 py-1.5 text-sm text-white">Reserved by another family</span>}
      </div>
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-3">
          {imgs.map((src, n) => (
            <button type="button" key={src} onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`} aria-current={i === n} className={`size-20 overflow-hidden rounded-2xl border-2 transition sm:size-24 ${i === n ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <Img src={src} alt="" width={200} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EnquiryModal({ pet, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', message: `Hi, I'm interested in ${pet.name} (${pet.breed}). ` });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/enquiries', { method: 'POST', body: { ...form, pet: pet._id, type: pet.adoption ? 'adoption' : 'pet' } });
      toast('Question sent. We usually reply within an hour.');
      onClose();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="enq-title">
      <div className="fade-in absolute inset-0 bg-ink/50" onClick={onClose} />
      <form onSubmit={submit} className="toast-in relative w-full max-w-md rounded-[28px] bg-white p-6">
        <button type="button" onClick={onClose} className="btn btn-ghost absolute right-3 top-3 size-10 p-0" aria-label="Close"><X className="size-5" /></button>
        <h2 id="enq-title" className="text-2xl font-bold">Ask about {pet.name}</h2>
        <p className="mt-1 text-sm text-ink-soft">Our care team will call or WhatsApp you back.</p>
        <div className="mt-5 space-y-3">
          <Field label="Your name"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone (WhatsApp preferred)"><input required type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Your question"><textarea rows={3} className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
        </div>
        {err && <p className="mt-3 text-sm text-coral">{err}</p>}
        <button className="btn btn-dark mt-5 w-full" disabled={busy}>{busy ? <Spinner /> : 'Send question'}</button>
      </form>
    </div>
  );
}

export default function PuppyDetail() {
  const { slug } = useParams();
  const { data, isLoading, error } = usePet(slug);
  const { data: settings } = useSettings();
  const compare = useCompare();
  const nav = useNavigate();
  const [ask, setAsk] = useState(false);

  if (isLoading) {
    return (
      <div className="wrap grid gap-10 py-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="skeleton aspect-square rounded-[28px]" />
        <div className="space-y-4"><div className="skeleton h-12 w-2/3" /><div className="skeleton h-6 w-1/2" /><div className="skeleton h-40" /></div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="text-4xl font-bold">This puppy has found a home</h1>
        <p className="mt-3 text-ink-soft">The listing is no longer available. There are plenty more puppies waiting to meet you.</p>
        <Link to="/puppies" className="btn btn-dark mt-6">See available puppies</Link>
      </div>
    );
  }

  const { pet, breed, similar } = data;
  const he = pet.gender === 'male' ? 'He' : 'She';
  const available = pet.status === 'available';
  const preBook = pet.readyToGoHome && new Date(pet.readyToGoHome) > new Date();
  const pct = settings?.depositPercent ?? 10;
  const deposit = pet.adoption ? 0 : Math.max(settings?.minDeposit ?? 5000, Math.round((pet.price * pct) / 100 / 500) * 500);
  const wa = settings?.contact?.whatsapp?.replace(/\D/g, '');

  const facts = [
    ['Breed', pet.breed], ['Gender', pet.gender === 'male' ? 'Male' : 'Female'], ['Age', `${ageLabel(pet.dob)} (born ${formatDate(pet.dob)})`],
    ['Colour', pet.color], ['Current weight', pet.weightKg ? `${pet.weightKg} kg` : '—'], ['Adult size', pet.size?.[0].toUpperCase() + pet.size?.slice(1)],
    ['Kennel ID', pet.code], ['Location', `${pet.location} kennel`],
  ];

  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: pet.adoption ? 'Adopt' : 'Puppies', to: pet.adoption ? '/adopt' : '/puppies' }, { label: pet.breed, to: `/puppies?breed=${encodeURIComponent(pet.breed)}` }, { label: pet.name }]} />

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Gallery pet={pet} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap gap-2">
            {pet.adoption && <span className="badge bg-leaf text-white">PawNest Rescue</span>}
            {pet.kciRegistered && <span className="badge bg-leaf-soft text-leaf"><BadgeCheck className="size-3.5" />KCI registered</span>}
            {preBook && <span className="badge bg-yolk-soft text-ink">Ready to go home {formatDate(pet.readyToGoHome, { day: 'numeric', month: 'long' })}</span>}
          </div>
          <h1 className="mt-3 text-5xl font-extrabold sm:text-6xl">{pet.name}</h1>
          <p className="mt-2 text-lg text-ink-2">{pet.breed}, {pet.gender === 'male' ? 'boy' : 'girl'}, {ageLabel(pet.dob)} old</p>

          <div className="mt-6"><Price price={pet.price} mrp={pet.mrp} size="lg" free={pet.adoption} /></div>
          {!pet.adoption && available && <p className="mt-1 text-sm text-ink-soft">Reserve today with a refundable {money(deposit)} deposit. Pay the balance when you take {pet.gender === 'male' ? 'him' : 'her'} home.</p>}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {available ? (
              <button type="button" onClick={() => nav(`/reserve/${pet.slug}`)} className="btn btn-primary py-4 text-base sm:col-span-2">
                {pet.adoption ? `Apply to adopt ${pet.name}` : `Reserve ${pet.name}`}
              </button>
            ) : (
              <div className="rounded-2xl bg-mist p-4 text-sm sm:col-span-2">
                <p className="font-semibold">{pet.name} is reserved by another family.</p>
                <p className="text-ink-soft">If their reservation falls through, we'll contact the waitlist first.</p>
                <button type="button" onClick={() => setAsk(true)} className="link mt-2 text-sm">Join the waitlist for {pet.name}</button>
              </div>
            )}
            <Link to={`/visit?pet=${pet._id}`} className="btn btn-outline"><CalendarCheck className="size-5" /> Book a visit</Link>
            <Link to={`/visit?pet=${pet._id}&type=video_call`} className="btn btn-outline"><Video className="size-5" /> Video call</Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <WishButton id={pet._id} name={pet.name} withLabel className="btn-sm" />
            <button type="button" onClick={() => compare.toggle(pet)} className={`btn btn-sm ${compare.has(pet._id) ? 'btn-dark' : 'btn-outline'}`}><Scale className="size-4" /> {compare.has(pet._id) ? 'Comparing' : 'Compare'}</button>
            <button type="button" onClick={() => setAsk(true)} className="btn btn-ghost btn-sm">Ask a question</button>
            {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi PawNest, I'd like to know more about ${pet.name} (${pet.breed}, ${pet.code}).`)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm text-leaf"><MessageCircle className="size-4" /> WhatsApp</a>}
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {[
              [Stethoscope, 'Vet-checked', pet.vetChecked],
              [Syringe, 'Vaccinated for age', pet.vaccinated],
              [Check, 'Dewormed', pet.dewormed],
              [Cpu, 'Microchipped', pet.microchipped],
              [ShieldCheck, `${pet.healthGuaranteeMonths}-month health guarantee`, pet.healthGuaranteeMonths > 0],
              [Truck, 'Free delivery in Bengaluru', pet.homeDelivery !== false],
            ].filter(([, , on]) => on).map(([I, l]) => (
              <li key={l} className="flex items-center gap-2.5 rounded-2xl bg-leaf-soft px-3 py-2.5 text-sm font-medium text-leaf"><I className="size-4 shrink-0" />{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold">About {pet.name}</h2>
            <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink-2">{pet.description}</p>
            {pet.temperament?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">{pet.temperament.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            )}
            {pet.goodWith?.length > 0 && <p className="mt-4 text-ink-2"><span className="font-semibold text-ink">{he}'s a good match for</span> {pet.goodWith.join(', ')}.</p>}
          </section>

          {pet.parents?.sire && pet.parents.sire !== 'Unknown' && (
            <section>
              <h2 className="text-3xl font-bold">Meet the parents</h2>
              <p className="mt-2 text-ink-soft">Both parents are health-screened by the breeder. You can meet the mother on a kennel visit by appointment.</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {[['Father', pet.parents.sire, pet.parents.sireImage], ['Mother', pet.parents.dam, pet.parents.damImage]].map(([r, n, img]) => (
                  <figure key={r}>
                    <div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-mist">{img && <Img src={img} alt={`${pet.name}'s ${r.toLowerCase()}, ${n}`} width={520} className="size-full object-cover" />}</div>
                    <figcaption className="mt-2"><span className="block text-sm text-ink-soft">{r}</span><span className="font-semibold">{n}</span></figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-3xl font-bold">Health record</h2>
            <div className="panel mt-5 divide-y divide-line">
              {(pet.vaccinations || []).map((v) => (
                <div key={v} className="flex items-center justify-between px-5 py-3.5"><span>{v}</span><span className="badge bg-leaf-soft text-leaf"><Check className="size-3.5" />Done</span></div>
              ))}
              <div className="flex items-center justify-between px-5 py-3.5"><span>Vet health certificate</span><span className="badge bg-leaf-soft text-leaf"><Check className="size-3.5" />Issued</span></div>
              <div className="px-5 py-3.5 text-sm text-ink-soft">We'll share the remaining vaccination schedule with you at handover, and your first vet check-up after bringing {pet.gender === 'male' ? 'him' : 'her'} home is free.</div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="panel p-6">
            <h2 className="text-2xl font-bold">Details</h2>
            <dl className="mt-4 divide-y divide-line">
              {facts.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5 text-[15px]"><dt className="text-ink-soft">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
            </dl>
          </section>

          {pet.included?.length > 0 && (
            <section className="rounded-[24px] bg-yolk-soft p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold"><Gift className="size-6" /> Goes home with</h2>
              <ul className="mt-4 space-y-2">
                {pet.included.map((i) => <li key={i} className="flex gap-2.5"><Check className="mt-1 size-4 shrink-0 text-leaf" />{i}</li>)}
              </ul>
            </section>
          )}

          {breed && (
            <section className="panel p-6">
              <h2 className="text-2xl font-bold">Living with a {breed.name.replace(' (Indian Pariah)', '')}</h2>
              <p className="mt-2 text-ink-soft">{breed.summary}</p>
              <div className="mt-5 space-y-4">
                <Meter label="Energy" value={breed.energyLevel} />
                <Meter label="Shedding" value={breed.shedding} />
                <Meter label="Grooming needs" value={breed.grooming} />
                <Meter label="Ease of training" value={breed.trainability} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-ink-soft">Adult weight</dt><dd className="font-semibold">{breed.weightRange}</dd></div>
                <div><dt className="text-ink-soft">Life span</dt><dd className="font-semibold">{breed.lifeSpan}</dd></div>
              </dl>
              {breed.climateNote && <p className="mt-4 rounded-2xl bg-sky p-3 text-sm">{breed.climateNote}</p>}
              <Link to={`/breeds/${breed.slug}`} className="link mt-5 inline-block text-sm">Read the full {breed.name.replace(' (Indian Pariah)', '')} guide</Link>
            </section>
          )}
        </aside>
      </div>

      {similar?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold"><PawPrint className="size-7" /> You might also love</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{similar.map((p) => <PetCard key={p._id} pet={p} />)}</div>
        </section>
      )}

      {ask && <EnquiryModal pet={pet} onClose={() => setAsk(false)} />}
    </div>
  );
}
