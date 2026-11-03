import { Link } from 'react-router-dom';
import { X, Scale, Check, Minus } from 'lucide-react';
import { useCompare } from '../context/CompareContext.jsx';
import { usePets } from '../lib/queries.js';
import { Img, Empty, Crumbs, Price } from '../components/ui.jsx';
import { ageLabel } from '../lib/api.js';

const yes = (v) => (v ? <Check className="mx-auto size-5 text-leaf" aria-label="Yes" /> : <Minus className="mx-auto size-5 text-ink-soft" aria-label="No" />);

export default function Compare() {
  const compare = useCompare();
  const ids = compare.items.map((p) => p._id).join(',');
  const { data, isLoading } = usePets({ ids, status: 'available,reserved,sold', limit: 3 }, { enabled: Boolean(ids) });
  const pets = compare.items.map((c) => data?.items?.find((p) => p._id === c._id)).filter(Boolean);

  if (!compare.items.length) {
    return (
      <div className="wrap py-16">
        <Empty icon={Scale} title="Pick puppies to compare" text="Tap Compare on up to three puppies to see them side by side." action={<Link to="/puppies" className="btn btn-dark">Browse puppies</Link>} />
      </div>
    );
  }

  const rows = [
    ['Price', (p) => <Price price={p.price} mrp={p.mrp} free={p.adoption} />],
    ['Breed', (p) => p.breed],
    ['Gender', (p) => (p.gender === 'male' ? 'Boy' : 'Girl')],
    ['Age', (p) => ageLabel(p.dob)],
    ['Colour', (p) => p.color],
    ['Adult size', (p) => p.size],
    ['Vaccinated', (p) => yes(p.vaccinated)],
    ['KCI registered', (p) => yes(p.kciRegistered)],
    ['Microchipped', (p) => yes(p.microchipped)],
    ['Status', (p) => (p.status === 'available' ? 'Available' : 'Reserved')],
  ];

  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Puppies', to: '/puppies' }, { label: 'Compare' }]} />
      <h1 className="text-4xl font-extrabold">Compare puppies</h1>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-x-3">
          <thead>
            <tr>
              <th className="w-36" />
              {(isLoading ? compare.items : pets).map((p) => (
                <th key={p._id} className="text-left align-top font-normal">
                  <div className="relative">
                    <div className="aspect-[4/5] overflow-hidden rounded-[20px] bg-mist"><Img src={p.images?.[0] || p.image} alt={p.name} width={420} className="size-full object-cover" /></div>
                    <button type="button" onClick={() => compare.remove(p._id)} className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white shadow" aria-label={`Remove ${p.name}`}><X className="size-4" /></button>
                  </div>
                  <Link to={`/puppies/${p.slug}`} className="mt-3 block font-display text-2xl font-bold hover:underline">{p.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label}>
                <th scope="row" className="border-b border-line py-3.5 text-left text-sm font-semibold text-ink-soft">{label}</th>
                {pets.map((p) => <td key={p._id} className="border-b border-line py-3.5 text-[15px] capitalize">{fn(p)}</td>)}
              </tr>
            ))}
            <tr>
              <td />
              {pets.map((p) => (
                <td key={p._id} className="pt-5">
                  {p.status === 'available' ? <Link to={`/reserve/${p.slug}`} className="btn btn-primary w-full">{p.adoption ? 'Apply to adopt' : `Reserve ${p.name}`}</Link> : <Link to={`/puppies/${p.slug}`} className="btn btn-outline w-full">View details</Link>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
