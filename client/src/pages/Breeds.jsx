import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useBreeds } from '../lib/queries.js';
import { Img, Crumbs, CardSkeleton } from '../components/ui.jsx';
import { money } from '../lib/api.js';

const FILTERS = [
  ['all', 'All breeds', () => true],
  ['apartment', 'Apartment-friendly', (b) => b.apartmentFriendly],
  ['kids', 'Great with kids', (b) => b.goodWith?.includes('kids')],
  ['first', 'For first-time owners', (b) => b.goodWith?.includes('first-time owners')],
  ['low-shed', 'Low shedding', (b) => b.shedding <= 2],
  ['active', 'For active families', (b) => b.energyLevel >= 5],
];

export default function Breeds() {
  const { data = [], isLoading } = useBreeds();
  const [f, setF] = useState('all');
  const test = FILTERS.find((x) => x[0] === f)[2];
  const list = data.filter(test);
  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Breed guide' }]} />
      <h1 className="text-4xl font-extrabold sm:text-5xl">Which breed fits your home?</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">Honest notes on size, energy, grooming and how each breed copes with Bengaluru weather. Not sure? Book a free breed consultation with our team.</p>
      <div className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map(([k, l]) => <button type="button" key={k} onClick={() => setF(k)} className={`chip shrink-0 ${f === k ? 'chip-on' : ''}`}>{l}</button>)}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <CardSkeleton count={6} /> : list.map((b) => (
          <Link key={b._id} to={`/breeds/${b.slug}`} className="group panel overflow-hidden">
            <div className="aspect-[16/11] overflow-hidden bg-mist">
              <Img src={b.image} alt={`${b.name} dog`} width={640} className="size-full object-cover group-hover:scale-[1.04]" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold">{b.name}</h2>
                {b.apartmentFriendly && <Building2 className="mt-1 size-5 shrink-0 text-leaf" aria-label="Apartment-friendly" />}
              </div>
              <p className="mt-2 line-clamp-2 text-ink-soft">{b.summary}</p>
              <p className="mt-4 text-sm font-semibold">
                {b.count > 0
                  ? `${b.count} ${b.count === 1 ? 'puppy' : 'puppies'} available${b.minPrice ? `, from ${money(b.minPrice)}` : ', free adoption'}`
                  : <span className="text-ink-soft">No puppies right now. Join the waitlist.</span>}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
