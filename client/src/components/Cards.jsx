import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import { Img, Price, Rating } from './ui.jsx';
import WishButton from './WishButton.jsx';
import { ageLabel, discountPct, deliveryInfo } from '../lib/api.js';
import { usePrefetch } from '../lib/queries.js';
import { useCart } from '../context/CartContext.jsx';

export function ProductCard({ pet, eager, compact }) {
  const prefetch = usePrefetch();
  const cart = useCart();
  const nav = useNavigate();
  const soldOut = pet.status !== 'available';
  const off = discountPct(pet.price, pet.mrp);
  const inCart = cart.has(pet._id);
  const eta = deliveryInfo(cart.pincode || '560001');
  const to = `/puppies/${pet.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(23,32,51,0.10)]">
      <Link to={to} onMouseEnter={() => prefetch(pet.slug)} onFocus={() => prefetch(pet.slug)} className="block" aria-label={`${pet.name}, ${pet.breed}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-mist">
          <Img src={pet.images?.[0] || pet.image} alt={`${pet.name}, ${pet.breed} puppy`} width={440} eager={eager} sizes="(min-width: 1024px) 22vw, 48vw" className={`size-full object-cover group-hover:scale-[1.04] ${soldOut ? 'opacity-60 grayscale-[40%]' : ''}`} />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {off > 0 && !soldOut && <span className="badge bg-coral text-white">{off}% OFF</span>}
            {pet.adoption && <span className="badge bg-leaf text-white">Free adoption</span>}
            {pet.kciRegistered && !compact && <span className="badge bg-white/95 text-ink">KCI</span>}
          </div>
          {soldOut && <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-xs font-bold tracking-wide text-white">SOLD OUT</span>}
        </div>
      </Link>
      <WishButton id={pet._id} name={pet.name} className="absolute right-2 top-2 size-9" />
      <div className="flex flex-1 flex-col p-3">
        <Link to={to} className="block">
          <p className="truncate text-xs font-medium text-ink-soft">{pet.breed.replace(' (Indian Pariah)', '')}</p>
          <h3 className="mt-0.5 truncate text-[15px] font-semibold leading-snug text-ink group-hover:text-ink-2">
            {pet.name} <span className="font-normal text-ink-soft">· {pet.gender === 'male' ? 'Male' : 'Female'}, {ageLabel(pet.dob)}</span>
          </h3>
          <div className="mt-1.5"><Rating rating={pet.rating} count={pet.numReviews} /></div>
          <div className="mt-1.5"><Price price={pet.price} mrp={pet.mrp} free={pet.adoption} /></div>
          {!soldOut && eta && !compact && (
            <p className="mt-1 text-xs text-ink-soft">
              <span className="font-semibold text-leaf">{eta.local ? 'Free delivery' : 'Delivery'}</span> by {eta.label.split(',')[0]}
            </p>
          )}
        </Link>
        <div className="mt-auto pt-3">
          {soldOut ? (
            <button type="button" disabled className="btn btn-sm w-full rounded-xl border border-line text-ink-soft">Sold out</button>
          ) : inCart ? (
            <button type="button" onClick={() => nav('/cart')} className="btn btn-sm btn-outline w-full rounded-xl"><Check className="size-4" />Go to cart</button>
          ) : (
            <button type="button" onClick={() => cart.add(pet)} className="btn btn-sm btn-primary w-full rounded-xl"><ShoppingCart className="size-4" />{pet.adoption ? 'Add to adopt' : 'Add to cart'}</button>
          )}
        </div>
      </div>
    </article>
  );
}

export { ProductCard as PetCard };

export function CardSkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="skeleton aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-9 w-full" />
      </div>
    </div>
  ));
}
