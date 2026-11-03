import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PartyPopper } from 'lucide-react';
import { api, money, formatDate } from '../lib/api.js';
import { Img, Spinner } from '../components/ui.jsx';
import { Timeline } from './Account.jsx';

export default function ReservationDone() {
  const { id } = useParams();
  const { data: o, isLoading } = useQuery({ queryKey: ['me', 'order', id], queryFn: () => api(`/orders/mine/${id}`) });
  if (isLoading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-8" /></div>;
  if (!o) return null;
  const adoption = o.petPrice === 0;
  return (
    <div className="wrap max-w-3xl py-12">
      <div className="rounded-[32px] bg-yolk p-8 text-center sm:p-12">
        <PartyPopper className="mx-auto size-12" />
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{adoption ? 'Adoption request received' : `${o.petSnapshot.name} is reserved for you`}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-2">
          {adoption
            ? "Our rescue team will call you within 24 hours to arrange a friendly home check."
            : `Our care team will call you on ${o.customer.phone} within the next hour to plan ${o.petSnapshot.gender === 'male' ? 'his' : 'her'} homecoming.`}
        </p>
        <p className="mt-4 font-semibold">Reservation {o.orderNo}</p>
      </div>

      <div className="panel mt-8 flex flex-col gap-5 p-6 sm:flex-row">
        <Img src={o.petSnapshot.image} alt={o.petSnapshot.name} width={300} className="size-32 shrink-0 rounded-2xl object-cover" />
        <dl className="grid flex-1 grid-cols-2 gap-3 text-[15px]">
          <div><dt className="text-sm text-ink-soft">Puppy</dt><dd className="font-semibold">{o.petSnapshot.name}, {o.petSnapshot.breed}</dd></div>
          <div><dt className="text-sm text-ink-soft">Handover</dt><dd className="font-semibold">{o.handover === 'home_delivery' ? 'Home delivery' : 'Kennel pickup'}{o.handoverDate ? `, ${formatDate(o.handoverDate)}` : ''}</dd></div>
          <div><dt className="text-sm text-ink-soft">Paid</dt><dd className="font-semibold">{money(o.amountPaid)}</dd></div>
          <div><dt className="text-sm text-ink-soft">Balance at handover</dt><dd className="font-semibold">{money(o.balanceDue)}</dd></div>
        </dl>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="text-2xl font-bold">What happens next</h2>
        <Timeline order={o} />
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/account/reservations" className="btn btn-dark">Track my reservation</Link>
        <Link to="/faq" className="btn btn-outline">Prepare for your puppy</Link>
      </div>
    </div>
  );
}
