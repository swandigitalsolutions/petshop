import { Quote } from 'lucide-react';
import { useTestimonials } from '../lib/queries.js';
import { Img, Stars, Crumbs, CardSkeleton } from '../components/ui.jsx';

export default function Stories() {
  const { data = [], isLoading } = useTestimonials();
  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Happy families' }]} />
      <h1 className="text-4xl font-extrabold sm:text-5xl">Happy families</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-soft">Stories from families who brought their puppy home from PawNest. Bought a puppy from us? You can rate it from My orders.</p>
      <div className="mt-10 columns-1 gap-5 md:columns-2 lg:columns-3">
        {isLoading ? <CardSkeleton count={3} /> : data.map((t) => (
          <figure key={t._id} className="panel mb-5 break-inside-avoid overflow-hidden">
            {t.image && <Img src={t.image} alt={`${t.petName}, ${t.breed}`} width={640} className="aspect-[4/3] w-full object-cover" />}
            <div className="p-6">
              <Quote className="size-6 text-yolk-deep" />
              <blockquote className="mt-3 text-[17px] leading-relaxed">{t.quote}</blockquote>
              <figcaption className="mt-5 flex items-center justify-between">
                <span><span className="block font-semibold">{t.name}</span><span className="text-sm text-ink-soft">{t.petName} the {t.breed}, {t.city}</span></span>
                <Stars value={t.rating} />
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
