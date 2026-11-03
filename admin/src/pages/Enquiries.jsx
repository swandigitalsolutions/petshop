import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import { api, qs, formatDate } from '../lib/api.js';
import { PageHead, Tabs, Empty } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

const TYPES = { pet: 'Puppy enquiry', breed_waitlist: 'Breed waitlist', adoption: 'Adoption', general: 'General' };
const ST = { new: 'bg-coral-soft text-coral', contacted: 'bg-yolk-soft text-ink', closed: 'bg-mist text-ink-soft' };

export default function Enquiries() {
  const [status, setStatus] = useState('new');
  const [type, setType] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-enq', status, type], queryFn: () => api(`/admin/enquiries${qs({ status, type })}`) });
  const mark = async (e, s) => {
    try {
      await api(`/admin/enquiries/${e._id}`, { method: 'PATCH', body: { status: s } });
      qc.invalidateQueries({ queryKey: ['admin-enq'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast(`Marked ${s}`);
    } catch (ex) { toast(ex.message, { type: 'error' }); }
  };
  return (
    <>
      <PageHead title="Enquiries" sub="Questions about puppies, breed waitlists and adoption requests." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Tabs value={status} onChange={setStatus} items={[['new', 'New'], ['contacted', 'Contacted'], ['closed', 'Closed'], ['', 'All']]} />
        <Tabs value={type} onChange={setType} items={[['', 'All types'], ...Object.entries(TYPES)]} />
      </div>
      {isLoading ? <div className="skeleton h-64" /> : !data.length ? <div className="card"><Empty title="Inbox zero" text="No enquiries match this filter." /></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((e) => {
            const wa = e.phone?.replace(/\D/g, '');
            return (
              <article key={e._id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-ink-soft">{TYPES[e.type]}{e.petName ? ` · ${e.petName}` : ''}{e.breed && !e.petName ? ` · ${e.breed}` : ''} · {formatDate(e.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  <span className={`badge capitalize ${ST[e.status]}`}>{e.status}</span>
                </div>
                {e.message && <p className="mt-3 flex-1 text-[15px] text-ink-2">{e.message}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a href={`tel:${e.phone}`} className="btn btn-outline btn-xs"><Phone className="size-3.5" />{e.phone}</a>
                  {wa && <a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noreferrer" className="btn btn-xs bg-leaf text-white"><MessageCircle className="size-3.5" />WhatsApp</a>}
                  {e.email && <a href={`mailto:${e.email}`} className="btn btn-outline btn-xs"><Mail className="size-3.5" />Email</a>}
                  <span className="ml-auto flex gap-1">
                    {e.status !== 'contacted' && <button type="button" onClick={() => mark(e, 'contacted')} className="btn btn-ghost btn-xs">Mark contacted</button>}
                    {e.status !== 'closed' && <button type="button" onClick={() => mark(e, 'closed')} className="btn btn-ghost btn-xs">Close</button>}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
