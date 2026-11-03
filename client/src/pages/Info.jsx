import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { useSettings, useBreeds } from '../lib/queries.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Crumbs, Field, Spinner } from '../components/ui.jsx';

const FAQ = [
  ['How do I know a puppy is healthy?', 'Our vet examines every puppy before it is listed and again before it goes home. You get a health certificate, the vaccination and deworming card, and a free first check-up with our partner vet. If a genetic or congenital illness appears within 12 months, we cover treatment or offer a replacement puppy.'],
  ['Can I meet the puppy before paying?', 'Yes, and we encourage it. Book a free kennel visit or a live video call from any puppy page. Where possible you can meet the mother too.'],
  ['How does the reservation deposit work?', 'A deposit (usually 10% of the price, minimum ₹5,000) holds the puppy only for you. It is fully refundable until the final vet check. You pay the balance at handover by UPI, card or bank transfer.'],
  ['At what age can a puppy come home?', 'Not before 8 weeks. Younger puppies are listed as "Pre-book" with a ready-to-go-home date. You can reserve them now and we keep them with their mother until they are ready.'],
  ['Do you deliver outside Bengaluru?', 'Yes. Home delivery is free within Bengaluru. For other cities in South India we use a pet-safe AC car with a care person, and the fee is shown at checkout.'],
  ['Where do your puppies come from?', 'Only from home breeders we have visited in person, who raise litters indoors, retire mothers responsibly, and register with the Kennel Club of India where applicable. We never source from puppy mills or pet markets.'],
  ['What comes home with my puppy?', 'A health certificate, vaccination card, KCI papers where applicable, a 7-day food pack, a blanket with the mother\'s scent, and access to our care helpline for life.'],
  ['How does adoption work?', 'Rescued Indie puppies are free to adopt. We do a short, friendly home check, ask you to sign our adoption pledge, and cover the spay or neuter surgery.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Questions families ask us</h1>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {FAQ.map(([q, a], i) => (
          <div key={q}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-5 text-left">
              <span className="font-display text-xl font-bold">{q}</span>
              <ChevronDown className={`size-5 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="fade-in max-w-[68ch] pb-5 text-[17px] leading-relaxed text-ink-2">{a}</p>}
          </div>
        ))}
      </div>
      <p className="mt-8 text-ink-soft">Still wondering about something? <Link to="/contact" className="link">Ask us directly</Link>.</p>
    </div>
  );
}

function About() {
  const items = [
    ['We visit every breeder', 'Before a single puppy is listed, our team visits the breeder\'s home, meets the parents and checks living conditions. If we wouldn\'t take a puppy home ourselves, we don\'t list it.'],
    ['Mothers are cared for', 'Our breeders allow no more than one litter a year per mother and retire them by age six into loving homes.'],
    ['Puppies grow up in homes', 'Litters are raised indoors with people, children and everyday sounds, so they settle easily with you.'],
    ['Honest about every breed', 'We\'ll tell you if a Husky won\'t suit a non-AC flat, or if a Beagle will be too loud for your building. The right match matters more than a sale.'],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Why families choose PawNest</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-2">PawNest started in 2019 when our founder, a Bengaluru vet nurse, kept seeing sick puppies bought from pet markets. We set out to build a puppy store that families could trust completely, with every breeder known by name and every puppy guaranteed.</p>
      <div className="mt-10 space-y-8">
        {items.map(([t, d]) => (
          <section key={t} className="border-l-4 border-yolk pl-5">
            <h2 className="text-2xl font-bold">{t}</h2>
            <p className="mt-2 text-ink-2">{d}</p>
          </section>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/puppies" className="btn btn-dark">Meet the puppies</Link>
        <Link to="/visit" className="btn btn-outline">Visit the kennel</Link>
      </div>
    </div>
  );
}

function Policies() {
  const sections = [
    ['Reservation and deposit', 'Your deposit holds the puppy exclusively for you. It is fully refundable if you cancel before the final vet check. After the vet check, the deposit is refundable only if the puppy fails a health check.'],
    ['12-month health guarantee', 'If your puppy is diagnosed with a genetic or congenital condition within 12 months, we will cover treatment at our partner vet up to the price of the puppy, or offer a replacement puppy of the same breed. Illnesses caused by missed vaccinations or accidents are not covered.'],
    ['7-day settling-in promise', 'If your puppy falls ill with an infectious disease within 7 days of handover, we cover the vet costs in full.'],
    ['Handover', 'Puppies go home only after 8 weeks of age with a health certificate and vaccination card. Home delivery within Bengaluru is free.'],
    ['Adoption', 'Rescue adoptions are free and subject to a home check. If an adoption doesn\'t work out, we will always take the dog back.'],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Health guarantee and refunds</h1>
      <div className="mt-8 space-y-8">
        {sections.map(([t, d]) => <section key={t}><h2 className="text-2xl font-bold">{t}</h2><p className="mt-2 text-[17px] leading-relaxed text-ink-2">{d}</p></section>)}
      </div>
    </div>
  );
}

function Contact() {
  const { data: s } = useSettings();
  const { data: breeds = [] } = useBreeds();
  const { user } = useAuth();
  const waitlist = new URLSearchParams(window.location.search).get('waitlist');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', breed: '', message: '' });
  const [state, setState] = useState('idle');
  const submit = async (e) => {
    e.preventDefault();
    setState('busy');
    try {
      await api('/enquiries', { method: 'POST', body: { ...form, type: form.breed ? 'breed_waitlist' : 'general' } });
      setState('done');
    } catch { setState('error'); }
  };
  const wa = s?.contact?.whatsapp?.replace(/\D/g, '');
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div>
        <h1 className="text-4xl font-extrabold sm:text-5xl">{waitlist ? 'Join the waitlist' : 'Talk to us'}</h1>
        <p className="mt-3 text-lg text-ink-soft">{waitlist ? "Tell us the breed you're waiting for. We'll call you when a litter is ready." : 'Questions about a puppy, a breed or caring for your dog? We reply within an hour, 10 AM to 8 PM.'}</p>
        <ul className="mt-8 space-y-4 text-[17px]">
          <li className="flex gap-3"><MapPin className="mt-1 size-5 shrink-0" />{s?.contact?.address}</li>
          <li className="flex gap-3"><Clock className="mt-1 size-5 shrink-0" />{s?.contact?.hours}</li>
          <li className="flex gap-3"><Phone className="mt-1 size-5 shrink-0" /><a href={`tel:${s?.contact?.phone?.replace(/\s/g, '')}`} className="hover:underline">{s?.contact?.phone}</a></li>
          <li className="flex gap-3"><Mail className="mt-1 size-5 shrink-0" /><a href={`mailto:${s?.contact?.email}`} className="hover:underline">{s?.contact?.email}</a></li>
        </ul>
        {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn mt-8 bg-leaf text-white hover:bg-leaf/90"><MessageCircle className="size-5" /> Chat on WhatsApp</a>}
      </div>
      {state === 'done' ? (
        <div className="rounded-[24px] bg-leaf-soft p-8"><h2 className="text-2xl font-bold text-leaf">Thanks, we've got your message</h2><p className="mt-2">Someone from our team will call you soon.</p></div>
      ) : (
        <form onSubmit={submit} className="panel space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><input required type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Breed you're interested in">
            <select className="input" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>
              <option value="">Not sure yet</option>
              {breeds.map((b) => <option key={b._id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Message"><textarea rows={4} className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          {state === 'error' && <p className="text-sm text-coral">Add your name and a valid phone number, then send again.</p>}
          <button className="btn btn-dark" disabled={state === 'busy'}>{state === 'busy' ? <Spinner /> : waitlist ? 'Join the waitlist' : 'Send message'}</button>
        </form>
      )}
    </div>
  );
}

export default function Info({ page }) {
  const label = { about: 'Why PawNest', faq: 'Questions', policies: 'Health guarantee', contact: 'Contact' }[page];
  if (page === '404') {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="text-5xl font-extrabold">This page has wandered off</h1>
        <p className="mt-3 text-ink-soft">The link may be old, or the puppy may already be home with a family.</p>
        <Link to="/puppies" className="btn btn-dark mt-6">See available puppies</Link>
      </div>
    );
  }
  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label }]} />
      {page === 'faq' && <Faq />}
      {page === 'about' && <About />}
      {page === 'policies' && <Policies />}
      {page === 'contact' && <Contact />}
    </div>
  );
}
