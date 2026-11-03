import { Link } from 'react-router-dom';
import { ShieldCheck, Stethoscope, Home as HomeIcon, Video, Truck, Quote, BadgeCheck } from 'lucide-react';
import { useHome } from '../lib/queries.js';
import { Img, SectionHead, CardSkeleton, Stars } from '../components/ui.jsx';
import { PetCard } from '../components/Cards.jsx';
import { money } from '../lib/api.js';

function Hero({ data }) {
  const s = data?.settings;
  const star = data?.featured?.[0];
  return (
    <section className="bg-sky">
      <div className="wrap grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <h1 className="max-w-[13ch] text-5xl font-extrabold sm:text-6xl lg:text-7xl">{s?.heroTitle || 'Bring home a puppy you can be sure of'}</h1>
          <p className="mt-6 max-w-lg text-lg text-ink-2">{s?.heroSubtitle || 'Vet-checked, vaccinated puppies from ethical, home-raised litters.'}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/puppies" className="btn btn-dark px-7 py-4 text-base">Meet the puppies</Link>
            <Link to="/visit" className="btn btn-outline px-7 py-4 text-base">Book a kennel visit</Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {[[data?.stats?.available ?? '—', 'puppies ready now'], [data?.stats?.breeds ?? '—', 'breeds available'], [`${s?.healthGuaranteeMonths || 12} mo`, 'health guarantee']].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-2xl font-bold sm:text-3xl">{n}</dd>
                <dd className="text-sm text-ink-soft">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[480px]">
          <div className="swing-in">
            <div className="mx-auto h-8 w-1 rounded-full bg-ink/25" aria-hidden />
            <div className="dogtag dogtag-hole aspect-[5/6] border-[10px] border-white bg-mist shadow-2xl">
              {(star?.images?.[0] || s?.heroImage) && (
                <Img src={star?.images?.[0] || s?.heroImage} alt={star ? `${star.name}, a ${star.breed} puppy` : 'A happy puppy'} width={900} eager sizes="(min-width: 1024px) 480px, 90vw" className="size-full object-cover" />
              )}
            </div>
          </div>
          {star && (
            <Link to={`/puppies/${star.slug}`} className="absolute -bottom-6 left-0 right-0 mx-auto flex w-[88%] items-center gap-3 rounded-[22px] bg-white p-3 shadow-xl sm:-left-8 sm:right-auto sm:w-auto sm:pr-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-yolk font-display text-lg font-bold">{star.name[0]}</span>
              <span>
                <span className="block font-display text-lg font-bold leading-tight">{star.name} is looking for a home</span>
                <span className="text-sm text-ink-soft">{star.breed}, {star.gender === 'male' ? 'boy' : 'girl'}. {money(star.price)}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Promise3() {
  const items = [
    [Stethoscope, 'Vet-checked before listing', 'Our vet examines every puppy, updates vaccinations and issues a health certificate.'],
    [HomeIcon, 'Home-raised by breeders we visit', 'No puppy mills. We visit every breeder and meet the parents ourselves.'],
    [ShieldCheck, '12-month health guarantee', 'If a genetic or congenital illness shows up within a year, we cover treatment or offer a replacement.'],
    [Video, 'Meet them before you decide', 'Visit our Indiranagar kennel or book a live video call with any puppy.'],
  ];
  return (
    <section className="wrap py-16">
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([I, t, d]) => (
          <div key={t}>
            <I className="size-8 text-leaf" strokeWidth={1.8} />
            <h3 className="mt-3 text-xl font-bold">{t}</h3>
            <p className="mt-1.5 text-ink-soft">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BreedStrip({ breeds = [] }) {
  const list = breeds.filter((b) => b.count > 0);
  return (
    <section className="wrap py-10">
      <SectionHead title="Find puppies by breed" link="/breeds" linkLabel="Open the breed guide" />
      <div className="scrollbar-none -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {list.map((b) => (
          <Link key={b._id} to={`/puppies?breed=${encodeURIComponent(b.name)}`} className="group w-28 shrink-0 text-center sm:w-32">
            <div className="mx-auto size-28 overflow-hidden rounded-full border-4 border-white bg-mist shadow-md ring-2 ring-transparent transition group-hover:ring-yolk sm:size-32">
              <Img src={b.image} alt="" width={260} className="size-full object-cover" />
            </div>
            <p className="mt-2 font-semibold leading-tight">{b.name.replace(' (Indian Pariah)', '')}</p>
            <p className="text-xs text-ink-soft">{b.count} {b.count === 1 ? 'puppy' : 'puppies'}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    ['Choose', 'Browse puppies, compare them side by side, and save your favourites.'],
    ['Meet', 'Visit the kennel or book a live video call. Bring the whole family.'],
    ['Reserve', 'Hold your puppy with a refundable deposit, or pay in full online.'],
    ['Bring home', 'Pick up from the kennel or get free home delivery anywhere in Bengaluru.'],
  ];
  return (
    <section className="bg-ink py-20 text-white">
      <div className="wrap">
        <h2 className="max-w-xl text-4xl font-bold sm:text-5xl">From first look to first night home</h2>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="relative border-t-2 border-white/15 pt-6">
              <span className="absolute -top-[13px] left-0 grid size-6 place-items-center rounded-full bg-yolk text-xs font-bold text-ink">{i + 1}</span>
              <h3 className="text-2xl font-bold">{t}</h3>
              <p className="mt-2 text-white/70">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/puppies" className="btn btn-primary">Start browsing</Link>
          <Link to="/faq" className="btn border-2 border-white/30 text-white hover:bg-white/10">Read common questions</Link>
        </div>
      </div>
    </section>
  );
}

function Adoption({ pets = [] }) {
  if (!pets.length) return null;
  return (
    <section className="wrap py-16">
      <div className="grid items-center gap-10 rounded-[32px] bg-leaf-soft p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 className="text-4xl font-bold">Adopt a rescued Indie, free</h2>
          <p className="mt-4 text-ink-2">PawNest Rescue rehomes Indian street puppies found across Bengaluru. They are vaccinated, dewormed and microchipped, and adoption costs nothing. We'll just do a friendly home check.</p>
          <Link to="/adopt" className="btn btn-dark mt-6">Meet the rescue puppies</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {pets.map((p) => (
            <Link key={p._id} to={`/puppies/${p.slug}`} className="group">
              <div className="aspect-[3/4] overflow-hidden rounded-[20px] bg-white">
                <Img src={p.images?.[0]} alt={`${p.name}, rescued Indie puppy`} width={360} className="size-full object-cover group-hover:scale-105" />
              </div>
              <p className="mt-2 font-display text-lg font-bold">{p.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stories({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="wrap py-16">
      <SectionHead title="Families who found their dog here" link="/stories" linkLabel="Read more stories" />
      <div className="grid gap-5 md:grid-cols-3">
        {items.slice(0, 3).map((t) => (
          <figure key={t._id} className="panel flex flex-col p-6">
            <Quote className="size-7 text-yolk-deep" />
            <blockquote className="mt-3 flex-1 text-[17px] leading-relaxed">{t.quote}</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Img src={t.image} alt="" width={120} className="size-12 rounded-full object-cover" />
              <span>
                <span className="block font-semibold">{t.name}</span>
                <span className="text-sm text-ink-soft">{t.petName}'s family, {t.city}</span>
              </span>
              <span className="ml-auto"><Stars value={t.rating} /></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function VisitBand({ settings }) {
  return (
    <section className="wrap">
      <div className="grid gap-8 overflow-hidden rounded-[32px] bg-yolk p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <h2 className="text-4xl font-bold">Come and meet them</h2>
          <p className="mt-3 max-w-lg text-ink-2">Our kennel in Indiranagar is open every day. Visits are free, and there's no pressure to decide on the day.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/visit" className="btn btn-dark">Book a visit</Link>
            <Link to="/visit?type=video_call" className="btn btn-outline">Book a video call</Link>
          </div>
        </div>
        <ul className="space-y-3 text-ink">
          <li className="flex gap-3"><HomeIcon className="mt-0.5 size-5 shrink-0" />{settings?.contact?.address}</li>
          <li className="flex gap-3"><BadgeCheck className="mt-0.5 size-5 shrink-0" />{settings?.contact?.hours}</li>
          <li className="flex gap-3"><Truck className="mt-0.5 size-5 shrink-0" />Free home delivery of your puppy within Bengaluru</li>
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  const { data, isLoading } = useHome();
  return (
    <>
      <Hero data={data} />
      <Promise3 />
      <section className="wrap py-10">
        <SectionHead title="Puppies looking for a home" sub="Handpicked from this month's litters. Reserved puppies stay listed so you can see what's popular." link="/puppies" linkLabel="See all puppies" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {isLoading ? <CardSkeleton count={8} /> : data?.featured?.map((p, i) => <PetCard key={p._id} pet={p} eager={i < 4} />)}
        </div>
      </section>
      <BreedStrip breeds={data?.breeds} />
      <Steps />
      <section className="wrap py-16">
        <SectionHead title="Just arrived" sub="The newest puppies at the kennel." link="/puppies?sort=newest" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {isLoading ? <CardSkeleton count={4} /> : data?.latest?.slice(0, 4).map((p) => <PetCard key={p._id} pet={p} />)}
        </div>
      </section>
      <Adoption pets={data?.adoption} />
      <Stories items={data?.testimonials} />
      <VisitBand settings={data?.settings} />
    </>
  );
}
