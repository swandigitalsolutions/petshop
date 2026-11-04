import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Truck, Package } from 'lucide-react';
import { useMyOrders } from '../lib/queries.js';
import { Img, Spinner } from '../components/ui.jsx';
import { money, formatDate } from '../lib/api.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const { state } = useLocation();
  const { data: mine, isLoading } = useMyOrders(!state);
  const orders = state?.orders || (mine || []).filter((o) => o.groupNo === id);
  if (!state && isLoading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-8" /></div>;
  if (!orders.length) return <div className="wrap py-20 text-center"><h1 className="text-2xl font-bold">Order not found</h1><Link to="/account/orders" className="btn btn-dark mt-4">My orders</Link></div>;
  const total = orders.reduce((x, o) => x + o.total, 0);
  const cod = orders[0].paymentMethod === 'cash';
  return (
    <div className="wrap max-w-3xl py-6">
      <section className="rounded-3xl bg-white p-6 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-16 text-leaf" />
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Order placed successfully</h1>
        <p className="mt-2 text-ink-soft">Order ID <span className="font-bold text-ink">{id}</span> · {cod ? `Pay ${money(total)} on delivery` : `${money(total)} paid`}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-leaf-soft px-4 py-2 font-semibold text-leaf"><Truck className="size-5" />Delivery by {formatDate(orders[0].handoverDate, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <p className="mt-3 text-sm text-ink-soft">Our care team will call {orders[0].customer?.phone} to confirm the delivery time.</p>
      </section>
      <section className="mt-4 rounded-2xl bg-white">
        <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 font-bold"><Package className="size-5" />{orders.length} {orders.length === 1 ? 'item' : 'items'}</h2>
        <ul className="divide-y divide-line">
          {orders.map((o) => (
            <li key={o._id} className="flex items-center gap-4 p-4">
              <Img src={o.petSnapshot?.image} alt="" width={160} className="size-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{o.petSnapshot?.name} – {o.petSnapshot?.breed}</p><p className="text-sm text-ink-soft">{o.orderNo}</p></div>
              <p className="font-bold">{money(o.total)}</p>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-5 py-3 text-sm text-ink-soft">Delivering to {orders[0].address?.name}, {orders[0].address?.line1}, {orders[0].address?.city} - {orders[0].address?.pincode}</p>
      </section>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link to="/account/orders" className="btn btn-dark rounded-xl">Track order</Link>
        <Link to="/shop" className="btn btn-outline rounded-xl">Continue shopping</Link>
      </div>
    </div>
  );
}
