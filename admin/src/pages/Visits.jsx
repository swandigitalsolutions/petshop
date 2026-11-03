import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, MessageCircle, Users } from 'lucide-react';
import { api, qs, formatDate, VISIT_NAMES } from '../lib/api.js';
import { PageHead, Tabs, Empty, Pager } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

const VSTATUS = { pending: 'bg-yolk-soft text-ink', confirmed: 'bg-iris-soft text-iris', completed: 'bg-leaf-soft text-leaf', cancelled: 'bg-coral-soft text-coral', no_show: 'bg-mist text-ink-soft' };

export default function Visits() {
  const [when, setWhen] = useState('upcoming');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const toast = useToast();
  const params = { when, type, page };
  const { data, isLoading } = useQuery({ queryKey: ['admin-visits', params], queryFn: () => api(`/admin/visits${qs(params)}`), placeholderData: (p) => p });

  const setStatus = async (b, status) => {
    try {
      await api(`/admin/visits/${b._id}`, { method: 'PATCH', body: { status } });
      qc.invalidateQueries({ queryKey: ['admin-visits'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast(`Visit for ${b.name} marked ${status.replace('_', ' ')}`);
    } catch (e) { toast(e.message, { type: 'error' }); }
  };

  // group by day
  const groups = {};
  (data?.items || []).forEach((b) => { const k = new Date(b.date).toDateString(); (groups[k] ||= []).push(b); });

  return (
    <>
      <PageHead title="Visits & video calls" sub="Kennel visits, video calls and breed consultations booked from the store." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Tabs value={when} onChange={(v) => { setWhen(v); setPage(1); }} items={[['upcoming', 'Upcoming'], ['past', 'Past']]} />
        <Tabs value={type} onChange={(v) => { setType(v); setPage(1); }} items={[['', 'All types'], ...Object.entries(VISIT_NAMES)]} />
      </div>
      {isLoading ? <div className="skeleton h-64" /> : !data?.items?.length ? (
        <div className="card"><Empty title={when === 'upcoming' ? 'No upcoming visits' : 'No past visits'} text="Bookings from the store's Book a visit page appear here." /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-2 font-display text-lg font-bold">{formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <div className="card divide-y divide-line">
                {list.map((b) => {
                  const wa = b.phone?.replace(/\D/g, '');
                  return (
                    <div key={b._id} className="flex flex-wrap items-center gap-4 p-4">
                      <span className="w-20 shrink-0 font-display text-lg font-bold">{b.slot}</span>
                      <div className="min-w-[200px] flex-1">
                        <p className="font-semibold">{b.name} <span className="font-normal text-ink-soft">· {VISIT_NAMES[b.type]}</span></p>
                        <p className="text-sm text-ink-soft">{b.petName ? `To meet ${b.petName}` : 'Browsing several puppies'}{b.type === 'kennel_visit' ? <><Users className="mx-1 inline size-3.5" />{b.people}</> : ''}</p>
                        {b.notes && <p className="mt-1 text-sm italic text-ink-2">"{b.notes}"</p>}
                      </div>
                      <div className="flex gap-1">
                        <a href={`tel:${b.phone}`} className="btn btn-outline btn-xs" aria-label={`Call ${b.name}`}><Phone className="size-3.5" /></a>
                        {wa && <a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs text-leaf" aria-label="WhatsApp"><MessageCircle className="size-3.5" /></a>}
                      </div>
                      <select value={b.status} onChange={(e) => setStatus(b, e.target.value)} className={`rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-semibold capitalize ${VSTATUS[b.status]}`} aria-label="Visit status">
                        {Object.keys(VSTATUS).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <Pager page={page} pages={data?.pages} onChange={setPage} />
    </>
  );
}
