import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, CardSkeleton } from './Cards.jsx';

// Horizontal product carousel: swipe on phones, arrow buttons on desktop.
export default function Rail({ title, sub, link, linkLabel = 'View all', items, loading, aside, tone = 'white' }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  if (!loading && !items?.length) return null;
  return (
    <section className={`rounded-3xl ${tone === 'white' ? 'bg-white' : tone} p-4 sm:p-6`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold sm:text-[28px]">{title}</h2>
          {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {aside}
          {link && <Link to={link} className="btn btn-sm btn-dark rounded-xl">{linkLabel}</Link>}
          <button type="button" onClick={() => scroll(-1)} className="hidden size-9 place-items-center rounded-full border border-line bg-white hover:border-ink md:grid" aria-label="Scroll left"><ChevronLeft className="size-5" /></button>
          <button type="button" onClick={() => scroll(1)} className="hidden size-9 place-items-center rounded-full border border-line bg-white hover:border-ink md:grid" aria-label="Scroll right"><ChevronRight className="size-5" /></button>
        </div>
      </div>
      <div ref={ref} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {loading
          ? <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5"><CardSkeleton count={5} /></div>
          : items.map((p) => (
            <div key={p._id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]">
              <ProductCard pet={p} compact />
            </div>
          ))}
      </div>
    </section>
  );
}
