import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ArrowUpDown, Dog } from 'lucide-react';
import { usePets, useBreeds } from '../lib/queries.js';
import { ProductCard, CardSkeleton } from '../components/Cards.jsx';
import { Empty, Pagination, Crumbs, RatingChip } from '../components/ui.jsx';

const SORTS = [['popular', 'Popularity'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low'], ['newest', 'Newest first'], ['rating', 'Customer rating'], ['discount', 'Discount']];
const PRICES = [['', '25000', 'Under ₹25,000'], ['25000', '40000', '₹25,000 – ₹40,000'], ['40000', '60000', '₹40,000 – ₹60,000'], ['60000', '', 'Over ₹60,000']];
const SIZES = [['toy', 'Toy'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['giant', 'Giant']];
const GOOD = [['apartments', 'Apartments'], ['kids', 'Kids'], ['first-time owners', 'First-time owners'], ['seniors', 'Seniors'], ['other dogs', 'Other dogs']];

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-line px-4 py-4 last:border-0">
      <legend className="float-left mb-2 w-full text-xs font-bold tracking-wide text-ink-soft">{title}</legend>
      <div className="clear-both space-y-1.5">{children}</div>
    </fieldset>
  );
}
const Check = ({ checked, onChange, children }) => (
  <label className="flex cursor-pointer items-center gap-2.5 text-sm">
    <input type="checkbox" className="size-4 accent-ink" checked={checked} onChange={onChange} />
    <span className="flex-1">{children}</span>
  </label>
);

export default function Puppies({ adopt = false }) {
  const [sp, setSp] = useSearchParams();
  const [sheet, setSheet] = useState(null); // 'filter' | 'sort' on mobile
  const [breedQ, setBreedQ] = useState('');
  const get = (k) => sp.get(k) || '';
  const list = (k) => (get(k) ? get(k).split(',') : []);
  const { data: allBreeds = [] } = useBreeds();

  const params = useMemo(() => ({
    breed: get('breed'), gender: get('gender'), size: get('size'), goodWith: get('goodWith'), ageMax: get('ageMax'),
    minPrice: get('minPrice'), maxPrice: get('maxPrice'), kci: get('kci'), q: get('q'), deals: get('deals'), minRating: get('minRating'),
    sort: get('sort') || 'popular', page: get('page') || 1, limit: 16, adoption: adopt ? 'true' : 'false',
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sp, adopt]);
  const { data, isLoading, isFetching } = usePets(params);

  const set = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setSp(next, { replace: true });
  };
  const toggle = (k, v) => { const cur = list(k); set({ [k]: (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(',') }); };
  const FILTER_KEYS = ['breed', 'gender', 'size', 'goodWith', 'ageMax', 'minPrice', 'maxPrice', 'kci', 'q', 'deals', 'minRating'];
  const active = FILTER_KEYS.filter((k) => get(k)).length;
  const clearAll = () => setSp(get('sort') ? { sort: get('sort') } : {}, { replace: true });

  const breedCounts = Object.fromEntries((data?.facets?.breeds || []).map((b) => [b._id, b.count]));
  const breeds = allBreeds.filter((b) => !b.name.startsWith('Indie') && b.name.toLowerCase().includes(breedQ.toLowerCase()));
  const oneBreed = get('breed') && !get('breed').includes(',') ? allBreeds.find((b) => b.name === get('breed')) : null;
  const title = adopt ? 'Adopt a rescued Indie' : get('q') ? `Results for "${get('q')}"` : oneBreed ? `${oneBreed.name} puppies` : get('deals') ? 'Deals on puppies' : 'Puppies for sale';

  const filters = (
    <div>
      {!adopt && (
        <Group title="BREED">
          <input value={breedQ} onChange={(e) => setBreedQ(e.target.value)} placeholder="Search breed" className="input mb-2 py-2 text-sm" />
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {breeds.map((b) => <Check key={b._id} checked={list('breed').includes(b.name)} onChange={() => toggle('breed', b.name)}>{b.name} <span className="text-ink-soft">({breedCounts[b.name] ?? b.count ?? 0})</span></Check>)}
          </div>
        </Group>
      )}
      {!adopt && (
        <Group title="PRICE">
          {PRICES.map(([min, max, l]) => (
            <label key={l} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="price" className="size-4 accent-ink" checked={get('minPrice') === min && get('maxPrice') === max} onChange={() => set({ minPrice: min, maxPrice: max })} />{l}
            </label>
          ))}
          {(get('minPrice') || get('maxPrice')) && <button type="button" onClick={() => set({ minPrice: '', maxPrice: '' })} className="text-xs font-semibold text-ink-soft underline">Clear price</button>}
        </Group>
      )}
      <Group title="CUSTOMER RATINGS">
        {['4', '3'].map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="radio" name="rating" className="size-4 accent-ink" checked={get('minRating') === r} onChange={() => set({ minRating: r })} /><RatingChip value={Number(r)} small /> & above
          </label>
        ))}
      </Group>
      {!adopt && <Group title="OFFERS"><Check checked={get('deals') === 'true'} onChange={(e) => set({ deals: e.target.checked ? 'true' : '' })}>On discount</Check><Check checked={get('kci') === 'true'} onChange={(e) => set({ kci: e.target.checked ? 'true' : '' })}>KCI registered</Check></Group>}
      <Group title="GENDER">
        {[['male', 'Male'], ['female', 'Female']].map(([v, l]) => <Check key={v} checked={get('gender') === v} onChange={() => set({ gender: get('gender') === v ? '' : v })}>{l}</Check>)}
      </Group>
      <Group title="ADULT SIZE">{SIZES.map(([v, l]) => <Check key={v} checked={list('size').includes(v)} onChange={() => toggle('size', v)}>{l}</Check>)}</Group>
      <Group title="GOOD WITH">{GOOD.map(([v, l]) => <Check key={v} checked={list('goodWith').includes(v)} onChange={() => toggle('goodWith', v)}>{l}</Check>)}</Group>
      <Group title="AGE">
        {[['10', 'Up to 10 weeks'], ['13', 'Up to 3 months'], ['20', 'Up to 5 months']].map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="radio" name="age" className="size-4 accent-ink" checked={get('ageMax') === v} onChange={() => set({ ageMax: v })} />{l}</label>
        ))}
      </Group>
    </div>
  );

  const chips = [
    ...list('breed').map((b) => [b, () => toggle('breed', b)]),
    ...(get('q') ? [[`"${get('q')}"`, () => set({ q: '' })]] : []),
    ...(get('minPrice') || get('maxPrice') ? [[PRICES.find(([a, b]) => a === get('minPrice') && b === get('maxPrice'))?.[2] || 'Price', () => set({ minPrice: '', maxPrice: '' })]] : []),
    ...(get('minRating') ? [[`${get('minRating')}★ & above`, () => set({ minRating: '' })]] : []),
    ...(get('deals') ? [['On discount', () => set({ deals: '' })]] : []),
    ...(get('kci') ? [['KCI registered', () => set({ kci: '' })]] : []),
    ...(get('gender') ? [[get('gender') === 'male' ? 'Male' : 'Female', () => set({ gender: '' })]] : []),
    ...list('size').map((v) => [`${v} size`, () => toggle('size', v)]),
    ...list('goodWith').map((v) => [`Good with ${v}`, () => toggle('goodWith', v)]),
    ...(get('ageMax') ? [[`Up to ${get('ageMax')} weeks`, () => set({ ageMax: '' })]] : []),
  ];

  return (
    <div className="wrap py-4">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: adopt ? 'Adopt' : 'Puppies', to: oneBreed ? '/shop' : undefined }, ...(oneBreed ? [{ label: oneBreed.name }] : [])]} />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="hidden self-start rounded-2xl bg-white lg:sticky lg:top-36 lg:block lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="text-lg font-bold">Filters</h2>{active > 0 && <button type="button" onClick={clearAll} className="text-sm font-semibold text-coral">Clear all</button>}</div>
          {filters}
        </aside>

        <div className="min-w-0">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
                <p className="mt-0.5 text-sm text-ink-soft">{data ? `Showing ${data.items.length ? (data.page - 1) * params.limit + 1 : 0}–${(data.page - 1) * params.limit + data.items.length} of ${data.total} puppies` : 'Loading…'}</p>
              </div>
              <div className="hidden items-center gap-1 lg:flex">
                <span className="mr-1 text-sm font-semibold">Sort by</span>
                {SORTS.map(([v, l]) => <button type="button" key={v} onClick={() => set({ sort: v })} className={`rounded-lg px-2.5 py-1.5 text-sm ${(get('sort') || 'popular') === v ? 'bg-ink font-semibold text-white' : 'text-ink-2 hover:bg-mist'}`}>{l}</button>)}
              </div>
            </div>
            {oneBreed?.summary && <p className="mt-3 rounded-xl bg-yolk-soft px-3 py-2 text-sm">{oneBreed.summary} <Link to="/breeds" className="font-semibold underline">Breed guide</Link></p>}
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map(([l, fn]) => <button type="button" key={l} onClick={fn} className="chip capitalize">{l}<X className="size-3.5" /></button>)}
                <button type="button" onClick={clearAll} className="px-1 text-sm font-semibold text-coral">Clear all</button>
              </div>
            )}
          </div>

          <div className="sticky top-[118px] z-30 mt-3 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-white text-sm font-semibold sm:top-[132px] md:top-[108px] lg:hidden">
            <button type="button" onClick={() => setSheet('sort')} className="flex items-center justify-center gap-2 py-3"><ArrowUpDown className="size-4" />Sort</button>
            <button type="button" onClick={() => setSheet('filter')} className="flex items-center justify-center gap-2 border-l border-line py-3"><SlidersHorizontal className="size-4" />Filter{active ? ` (${active})` : ''}</button>
          </div>

          {!isLoading && data?.items?.length === 0 ? (
            <div className="mt-3"><Empty icon={Dog} title="No puppies match these filters" text="Try removing a filter or two." action={<button type="button" className="btn btn-dark" onClick={clearAll}>Clear filters</button>} /></div>
          ) : (
            <div className={`mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
              {isLoading ? <CardSkeleton count={8} /> : data.items.map((p, i) => <ProductCard key={p._id} pet={p} eager={i < 4} />)}
            </div>
          )}
          <Pagination page={Number(get('page') || 1)} pages={data?.pages} onChange={(n) => { set({ page: String(n) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={sheet === 'sort' ? 'Sort' : 'Filters'}>
          <div className="fade-in absolute inset-0 bg-ink/50" onClick={() => setSheet(null)} />
          <div className="toast-in absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-lg font-bold">{sheet === 'sort' ? 'Sort by' : 'Filters'}</h2>
              <button type="button" onClick={() => setSheet(null)} className="grid size-10 place-items-center" aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sheet === 'sort'
                ? SORTS.map(([v, l]) => (
                  <label key={v} className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[15px]">
                    {l}<input type="radio" name="msort" className="size-5 accent-ink" checked={(get('sort') || 'popular') === v} onChange={() => { set({ sort: v }); setSheet(null); }} />
                  </label>
                ))
                : filters}
            </div>
            {sheet === 'filter' && (
              <div className="flex gap-2 border-t border-line p-3">
                <button type="button" className="btn btn-outline flex-1" onClick={clearAll}>Clear all</button>
                <button type="button" className="btn btn-primary flex-1" onClick={() => setSheet(null)}>Show {data?.total ?? ''} puppies</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
