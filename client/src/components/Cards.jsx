import { Link } from 'react-router-dom';
import { ShieldCheck, Syringe, BadgeCheck, CalendarClock } from 'lucide-react';
import { Img, Price } from './ui.jsx';
import WishButton from './WishButton.jsx';
import { ageLabel, formatDate } from '../lib/api.js';
import { usePrefetch } from '../lib/queries.js';
import { useCompare } from '../context/CompareContext.jsx';

export function PetCard({ pet, eager }) {
  const prefetch = usePrefetch();
  const compare = useCompare();
  const inCompare = compare.has(pet._id);
  const preBook = pet.readyToGoHome && new Date(pet.readyToGoHome) > new Date();
  return (
    <article className="group relative">
      <Link to={`/puppies/${pet.slug}`} onMouseEnter={() => prefetch(pet.slug)} onFocus={() => prefetch(pet.slug)} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-mist">
          <Img
            src={pet.images?.[0]}
            alt={`${pet.name}, ${pet.breed} puppy`}
            width={560}
            eager={eager}
            className="size-full object-cover group-hover:scale-[1.04]"
          />
          {pet.status === 'reserved' && <div className="absolute inset-0 bg-ink/30" />}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {pet.status === 'reserved' && <span className="badge bg-ink text-white">Reserved</span>}
            {pet.adoption && <span className="badge bg-leaf text-white">Free adoption</span>}
            {preBook && <span className="badge bg-yolk text-ink">Pre-book</span>}
          </div>
        </div>
        <div className="mt-3 px-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xl font-bold">{pet.name}</h3>
            <span className="shrink-0 text-sm text-ink-soft">{pet.gender === 'male' ? 'Boy' : 'Girl'}, {ageLabel(pet.dob)}</span>
          </div>
          <p className="text-sm text-ink-soft">{pet.breed}{pet.color ? `, ${pet.color.toLowerCase()}` : ''}</p>
          <div className="mt-2"><Price price={pet.price} mrp={pet.mrp} free={pet.adoption} /></div>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
            {pet.vaccinated && <li className="inline-flex items-center gap-1"><Syringe className="size-3.5 text-leaf" />Vaccinated</li>}
            {pet.kciRegistered && <li className="inline-flex items-center gap-1"><BadgeCheck className="size-3.5 text-leaf" />KCI papers</li>}
            {!pet.adoption && <li className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5 text-leaf" />12-month guarantee</li>}
            {preBook && <li className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />Home from {formatDate(pet.readyToGoHome, { day: 'numeric', month: 'short' })}</li>}
          </ul>
        </div>
      </Link>
      <WishButton id={pet._id} name={pet.name} className="absolute right-3 top-3" />
      <button
        type="button"
        onClick={() => compare.toggle(pet)}
        aria-pressed={inCompare}
        className={`absolute right-3 top-[3.75rem] rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${inCompare ? 'bg-ink text-white' : 'bg-white/95 text-ink opacity-0 group-hover:opacity-100 focus:opacity-100 max-lg:opacity-100'}`}
      >
        {inCompare ? 'Comparing' : 'Compare'}
      </button>
    </article>
  );
}
