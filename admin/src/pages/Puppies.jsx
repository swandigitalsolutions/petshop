import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ExternalLink, Star, Pencil } from 'lucide-react';
import { api, qs, money, ageLabel, PET_STATUS, STORE_URL } from '../lib/api.js';
import { PageHead, Badge, Img, Pager, Tabs, Empty, useDebounced } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Puppies() {
  const [status, setStatus] = useState('');
  const [breed, setBreed] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const params = { status, breed, q: dq, page, limit: 20, sort: 'newest' };
  const { data, isLoading } = useQuery({ queryKey: ['admin-pets', params], queryFn: () => api(`/pets/admin/all${qs(params)}`), placeholderData: (p) => p });
  const { data: breeds = [] } = useQuery({ queryKey: ['admin-breeds'], queryFn: () => api('/admin/breeds') });

  const patch = async (pet, body, msg) => {
    try {
      await api(`/pets/${pet._id}`, { method: 'PUT', body });
      qc.invalidateQueries({ queryKey: ['admin-pets'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast(msg);
    } catch (e) { toast(e.message, { type: 'error' }); }
  };

  const c = data?.counts || {};
  const all = Object.values(c).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHead title="Puppies" sub="Everything listed on the store, including reserved and sold puppies." actions={<Link to="/puppies/new" className="btn btn-primary"><Plus className="size-4" />List a puppy</Link>} />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[['', 'All', all], ['available', 'Available', c.available || 0], ['reserved', 'Reserved', c.reserved || 0], ['sold', 'Sold', c.sold || 0], ['hidden', 'Hidden', c.hidden || 0]]} />
          <select className="input w-auto" value={breed} onChange={(e) => { setBreed(e.target.value); setPage(1); }} aria-label="Filter by breed">
            <option value="">All breeds</option>
            {breeds.map((b) => <option key={b._id}>{b.name}</option>)}
          </select>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Name, breed, colour or kennel ID" className="input pl-9" />
          </div>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {data?.items?.map((p) => (
            <li key={p._id}>
              <Link to={`/puppies/${p._id}`} className="flex items-center gap-3 p-4 active:bg-mist">
                <Img src={p.images?.[0]} width={120} className="size-14 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-semibold">{p.name}{p.featured && <Star className="size-3.5 fill-yolk-deep text-yolk-deep" />}</span>
                  <span className="block truncate text-xs text-ink-soft">{p.breed} · {p.gender === 'male' ? 'M' : 'F'} · {ageLabel(p.dob)}</span>
                  <span className="mt-1 block text-sm font-semibold tabular-nums">{p.adoption ? 'Free adoption' : money(p.price)}</span>
                </span>
                <Badge map={PET_STATUS} value={p.status} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-line bg-mist/60">
              <tr><th className="th">Puppy</th><th className="th">Breed</th><th className="th">Age</th><th className="th">Price</th><th className="th">Cost</th><th className="th">Status</th><th className="th">Featured</th><th className="th">Views</th><th className="th" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={9} className="td"><div className="skeleton h-10" /></td></tr>)}
              {data?.items?.map((p) => (
                <tr key={p._id} className="cursor-pointer hover:bg-mist/50" onClick={() => nav(`/puppies/${p._id}`)}>
                  <td className="td">
                    <span className="flex items-center gap-3">
                      <Img src={p.images?.[0]} width={100} className="size-12 rounded-xl object-cover" />
                      <span><span className="block font-semibold">{p.name}</span><span className="text-xs text-ink-soft">{p.code} · {p.gender === 'male' ? 'Male' : 'Female'}</span></span>
                    </span>
                  </td>
                  <td className="td">{p.breed}{p.adoption && <span className="badge ml-2 bg-leaf-soft text-leaf">Adoption</span>}</td>
                  <td className="td whitespace-nowrap">{ageLabel(p.dob)}</td>
                  <td className="td tabular-nums">{p.adoption ? 'Free' : money(p.price)}</td>
                  <td className="td tabular-nums text-ink-soft">{p.costPrice ? money(p.costPrice) : '—'}</td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={p.status}
                      onChange={(e) => patch(p, { status: e.target.value }, `${p.name} marked ${PET_STATUS[e.target.value][0].toLowerCase()}`)}
                      className={`rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-semibold ${PET_STATUS[p.status]?.[1]}`}
                      aria-label={`Status for ${p.name}`}
                    >
                      {Object.entries(PET_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => patch(p, { featured: !p.featured }, p.featured ? `${p.name} removed from homepage` : `${p.name} featured on homepage`)} aria-pressed={p.featured} aria-label="Toggle featured" className="rounded-lg p-1.5 hover:bg-mist">
                      <Star className={`size-4 ${p.featured ? 'fill-yolk-deep text-yolk-deep' : 'text-line'}`} />
                    </button>
                  </td>
                  <td className="td tabular-nums text-ink-soft">{p.views}</td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <span className="flex justify-end gap-1">
                      <a href={`${STORE_URL}/puppies/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs" aria-label="View on store"><ExternalLink className="size-4" /></a>
                      <Link to={`/puppies/${p._id}`} className="btn btn-ghost btn-xs" aria-label="Edit"><Pencil className="size-4" /></Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !data?.items?.length && <Empty title="No puppies here" text="Try another filter, or list a new puppy." action={<Link to="/puppies/new" className="btn btn-dark">List a puppy</Link>} />}
        </div>
        <Pager page={page} pages={data?.pages} onChange={setPage} />
      </div>
    </>
  );
}
