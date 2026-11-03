import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, Dog } from 'lucide-react';
import { usePets } from '../lib/queries.js';
import { PetCard } from '../components/Cards.jsx';
import { CardSkeleton, Empty, Pagination, Crumbs } from '../components/ui.jsx';
import { money } from '../lib/api.js';

const SIZES = [['toy', 'Toy'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['giant', 'Giant']];
const GOOD_WITH = [['apartments', 'Apartments'], ['kids', 'Kids'], ['first-time owners', 'First-time owners'], ['seniors', 'Seniors'], ['other dogs', 'Other dogs'], ['cats', 'Cats']];
const AGES = [['', 'Any age'], ['10', 'Up to 10 weeks'], ['13', 'Up to 3 months'], ['20', 'Up to 5 months']];
const PRICES = [['', '', 'Any price'], ['', '25000', 'Under ₹25,000'], ['25000', '40000', '₹25,000 – ₹40,000'], ['40000', '60000', '₹40,000 – ₹60,000'], ['60000', '', 'Above ₹60,000']];
const SORTS = [['newest', 'Newest first'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['youngest', 'Youngest first'], ['popular', 'Most viewed']];

export default function Puppies({ adopt = false }) {
  const [sp, setSp] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const get = (k) => sp.get(k) || '';
  const list = (k) => (get(k) ? get(k).split(',') : []);

  const params = useMemo(() => ({
    breed: get('breed'), gender: get('gender'), size: get('size'), goodWith: get('goodWith'), ageMax: get('ageMax'),
    minPrice: get('minPrice'), maxPrice: get('maxPrice'), kci: get('kci'), q: get('q'), sort: get('sort') || 'newest',
    page: get('page') || 1, limit: 12, adoption: adopt ? 'true' : get('adoption'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sp, adopt]);
  const { data, isLoading, isFetching } = usePets(params);

  const set = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setSp(next, { replace: true });
  };
  const toggleIn = (k, v) => {
    const cur = list(k);
    set({ [k]: (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(',') });
  };
  const activeCount = ['breed', 'gender', 'size', 'goodWith', 'ageMax', 'minPrice', 'maxPrice', 'kci', 'q'].filter((k) => get(k)).length;
  const clearAll = () => setSp(get('sort') ? { sort: get('sort') } : {}, { replace: true });

  const breeds = data?.facets?.breeds || [];

  const filters = (
    <div className="space-y-8">
      {!adopt && (
        <fieldset>
          <legend className="mb-3 font-display text-lg font-bold">Breed</legend>
          <div className="space-y-1">
            {breeds.filter((b) => !b._id.startsWith('Indie')).map((b) => (
              <label key={b._id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-mist">
                <input type="checkbox" className="size-4 accent-ink" checked={list('breed').includes(b._id)} onChange={() => toggleIn('breed', b._id)} />
                <span className="flex-1 text-[15px]">{b._id}</span>
                <span className="text-xs text-ink-soft">{b.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">Boy or girl</legend>
        <div className="flex gap-2">
          {[['', 'Either'], ['male', 'Boy'], ['female', 'Girl']].map(([v, l]) => (
            <button type="button" key={l} onClick={() => set({ gender: v })} className={`chip ${get('gender') === v ? 'chip-on' : ''}`}>{l}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">Good with</legend>
        <div className="flex flex-wrap gap-2">
          {GOOD_WITH.map(([v, l]) => (
            <button type="button" key={v} onClick={() => toggleIn('goodWith', v)} className={`chip ${list('goodWith').includes(v) ? 'chip-on' : ''}`}>{l}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">Adult size</legend>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(([v, l]) => (
            <button type="button" key={v} onClick={() => toggleIn('size', v)} className={`chip ${list('size').includes(v) ? 'chip-on' : ''}`}>{l}</button>
          ))}
        </div>
      </fieldset>
      {!adopt && (
        <fieldset>
          <legend className="mb-3 font-display text-lg font-bold">Price</legend>
          <div className="space-y-1">
            {PRICES.map(([min, max, l]) => (
              <label key={l} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-mist">
                <input type="radio" name="price" className="size-4 accent-ink" checked={get('minPrice') === min && get('maxPrice') === max} onChange={() => set({ minPrice: min, maxPrice: max })} />
                <span className="text-[15px]">{l}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">Age</legend>
        <select className="input" value={get('ageMax')} onChange={(e) => set({ ageMax: e.target.value })} aria-label="Age">
          {AGES.map(([v, l]) => <option key={l} value={v}>{l}</option>)}
        </select>
      </fieldset>
      {!adopt && (
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-4 accent-ink" checked={get('kci') === 'true'} onChange={(e) => set({ kci: e.target.checked ? 'true' : '' })} />
          <span className="text-[15px] font-semibold">KCI registered only</span>
        </label>
      )}
    </div>
  );

  const title = adopt ? 'Adopt a rescued Indie' : get('breed') && !get('breed').includes(',') ? `${get('breed')} puppies` : 'Puppies for sale';

  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: adopt ? 'Adopt' : 'Puppies' }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-2 text-ink-soft">
            {adopt
              ? 'Free adoption with a home check. Every rescue is vaccinated, dewormed and vet-checked.'
              : data ? `${data.total} ${data.total === 1 ? 'puppy' : 'puppies'}${data.facets?.priceRange?.min ? `, from ${money(data.facets.priceRange.min)}` : ''}` : 'Loading puppies…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm lg:hidden" onClick={() => setDrawer(true)}>
            <SlidersHorizontal className="size-4" /> Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" className="input w-auto rounded-full py-2 text-sm" value={get('sort') || 'newest'} onChange={(e) => set({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {get('q') && <button type="button" onClick={() => set({ q: '' })} className="chip chip-on">"{get('q')}" <X className="size-3.5" /></button>}
          {list('breed').map((b) => <button type="button" key={b} onClick={() => toggleIn('breed', b)} className="chip chip-on">{b} <X className="size-3.5" /></button>)}
          {list('goodWith').map((b) => <button type="button" key={b} onClick={() => toggleIn('goodWith', b)} className="chip chip-on">Good with {b} <X className="size-3.5" /></button>)}
          {list('size').map((b) => <button type="button" key={b} onClick={() => toggleIn('size', b)} className="chip chip-on">{b} <X className="size-3.5" /></button>)}
          {get('gender') && <button type="button" onClick={() => set({ gender: '' })} className="chip chip-on">{get('gender') === 'male' ? 'Boys' : 'Girls'} <X className="size-3.5" /></button>}
          <button type="button" onClick={clearAll} className="px-2 text-sm font-semibold underline">Clear all</button>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''}>
          {!isLoading && data?.items?.length === 0 ? (
            <Empty
              icon={Dog}
              title="No puppies match these filters"
              text="Try removing a filter, or join the waitlist and we'll tell you when a matching litter arrives."
              action={<div className="flex flex-wrap justify-center gap-2"><button type="button" className="btn btn-dark" onClick={clearAll}>Clear filters</button><Link to="/contact?waitlist=1" className="btn btn-outline">Join the waitlist</Link></div>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {isLoading ? <CardSkeleton count={9} /> : data.items.map((p, i) => <PetCard key={p._id} pet={p} eager={i < 3} />)}
            </div>
          )}
          <Pagination page={Number(get('page') || 1)} pages={data?.pages} onChange={(n) => { set({ page: String(n) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="fade-in absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="drawer-in absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line p-4">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button type="button" className="btn btn-ghost size-11 p-0" onClick={() => setDrawer(false)} aria-label="Close filters"><X className="size-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filters}</div>
            <div className="flex gap-2 border-t border-line p-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={clearAll}>Clear</button>
              <button type="button" className="btn btn-dark flex-1" onClick={() => setDrawer(false)}>Show {data?.total ?? ''} puppies</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
