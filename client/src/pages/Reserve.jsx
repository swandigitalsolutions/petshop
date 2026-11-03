import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, Truck, Lock, ShieldCheck, Smartphone, CreditCard, Landmark } from 'lucide-react';
import { usePet } from '../lib/queries.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api, money, ageLabel } from '../lib/api.js';
import { Img, Field, Spinner, Crumbs } from '../components/ui.jsx';

const Choice = ({ on, onClick, icon: I, title, text, aside }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${on ? 'border-ink bg-mist' : 'border-line hover:border-ink-soft'}`}>
    {I && <I className="mt-0.5 size-5 shrink-0" />}
    <span className="flex-1"><span className="block font-semibold">{title}</span>{text && <span className="text-sm text-ink-soft">{text}</span>}</span>
    {aside && <span className="font-semibold">{aside}</span>}
  </button>
);

const minDate = () => {
  const d = new Date(Date.now() + 2 * 864e5);
  return d.toISOString().slice(0, 10);
};

export default function Reserve() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = usePet(slug);
  const pet = data?.pet;
  const def = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  const [customer, setCustomer] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const [handover, setHandover] = useState('home_delivery');
  const [handoverDate, setHandoverDate] = useState('');
  const [address, setAddress] = useState({ line1: def?.line1 || '', line2: def?.line2 || '', city: def?.city || 'Bengaluru', state: def?.state || 'Karnataka', pincode: def?.pincode || '' });
  const [plan, setPlan] = useState('deposit');
  const [method, setMethod] = useState('upi');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const quoteBody = useMemo(() => ({ petId: pet?._id, paymentPlan: plan, handover, city: address.city, coupon }), [pet?._id, plan, handover, address.city, coupon]);
  const { data: quote, isFetching: quoting, error: quoteErr } = useQuery({
    queryKey: ['quote', quoteBody],
    queryFn: () => api('/orders/quote', { method: 'POST', body: quoteBody }),
    enabled: Boolean(pet?._id),
    placeholderData: (p) => p,
    staleTime: 0,
  });
  useEffect(() => { if (pet?.adoption) setPlan('full'); }, [pet?.adoption]);

  if (isLoading) return <div className="wrap py-16"><div className="skeleton h-96" /></div>;
  if (!pet) return <div className="wrap py-24 text-center"><h1 className="text-3xl font-bold">Puppy not found</h1><Link to="/puppies" className="btn btn-dark mt-6">See puppies</Link></div>;
  if (pet.status !== 'available') {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="text-3xl font-bold">{pet.name} has just been reserved</h1>
        <p className="mt-2 text-ink-soft">Another family reserved {pet.name} a moment ago. Here are puppies like {pet.gender === 'male' ? 'him' : 'her'}.</p>
        <Link to={`/puppies?breed=${encodeURIComponent(pet.breed)}`} className="btn btn-dark mt-6">See more {pet.breed} puppies</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!agree) { setErr('Please accept the reservation terms to continue.'); return; }
    setBusy(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: { petId: pet._id, paymentPlan: plan, handover, handoverDate: handoverDate || undefined, address: handover === 'home_delivery' ? address : undefined, customer, paymentMethod: method, coupon: coupon || undefined, notes },
      });
      qc.invalidateQueries({ queryKey: ['pets'] });
      qc.invalidateQueries({ queryKey: ['pet', slug] });
      qc.invalidateQueries({ queryKey: ['home'] });
      qc.invalidateQueries({ queryKey: ['me', 'orders'] });
      nav(`/reservation/${order._id}`, { replace: true });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const payNow = quote?.payNow ?? 0;

  return (
    <div className="wrap py-8">
      <Crumbs items={[{ label: 'Puppies', to: '/puppies' }, { label: pet.name, to: `/puppies/${pet.slug}` }, { label: pet.adoption ? 'Adoption request' : 'Reserve' }]} />
      <h1 className="text-4xl font-extrabold">{pet.adoption ? `Apply to adopt ${pet.name}` : `Reserve ${pet.name}`}</h1>

      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input required className="input" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></Field>
              <Field label="Phone" hint="We'll WhatsApp you puppy updates"><input required type="tel" className="input" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></Field>
              <Field label="Email"><input type="email" className="input" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></Field>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold">How {pet.name} comes home</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Choice on={handover === 'home_delivery'} onClick={() => setHandover('home_delivery')} icon={Truck} title="Home delivery" text="In an AC car with a care person who helps settle your puppy in" />
              <Choice on={handover === 'pickup'} onClick={() => setHandover('pickup')} icon={Store} title="Pick up from kennel" text="Indiranagar, Bengaluru. Includes a 30-minute care session" aside="Free" />
            </div>
            {handover === 'home_delivery' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="House / flat, street"><input required className="input" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} /></Field>
                <Field label="Area / landmark"><input className="input" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} /></Field>
                <Field label="City" hint="Free within Bengaluru"><input required className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></Field>
                <Field label="Pincode"><input required inputMode="numeric" pattern="[0-9]{6}" className="input" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} /></Field>
              </div>
            )}
            <div className="mt-4 max-w-xs">
              <Field label="Preferred date" hint="We'll confirm the exact time on call"><input type="date" min={minDate()} className="input" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)} /></Field>
            </div>
          </section>

          {!pet.adoption && (
            <section>
              <h2 className="text-2xl font-bold">Payment</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Choice on={plan === 'deposit'} onClick={() => setPlan('deposit')} title="Pay a deposit now" text="Fully refundable until the vet check. Pay the balance at handover." aside={quote ? money(quote.deposit) : ''} />
                <Choice on={plan === 'full'} onClick={() => setPlan('full')} title="Pay in full" text="Nothing to pay on the day you bring your puppy home" aside={quote ? money(quote.total) : ''} />
              </div>
              <p className="mb-2 mt-6 text-sm font-semibold">Pay with</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Choice on={method === 'upi'} onClick={() => setMethod('upi')} icon={Smartphone} title="UPI" />
                <Choice on={method === 'card'} onClick={() => setMethod('card')} icon={CreditCard} title="Card" />
                <Choice on={method === 'netbanking'} onClick={() => setMethod('netbanking')} icon={Landmark} title="Net banking" />
              </div>
              <p className="mt-2 text-xs text-ink-soft">Demo store: payment is simulated and no money is charged.</p>
            </section>
          )}

          <section>
            <Field label="Anything we should know?" hint="Other pets at home, your work hours, questions for the vet"><textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="panel p-5">
            <div className="flex gap-4">
              <Img src={pet.images?.[0]} alt="" width={200} className="size-24 rounded-2xl object-cover" />
              <div>
                <p className="font-display text-2xl font-bold">{pet.name}</p>
                <p className="text-sm text-ink-soft">{pet.breed}, {pet.gender === 'male' ? 'boy' : 'girl'}, {ageLabel(pet.dob)}</p>
                <p className="mt-1 text-sm text-ink-soft">Kennel ID {pet.code}</p>
              </div>
            </div>

            {!pet.adoption && (
              <div className="mt-5">
                {coupon ? (
                  <div className="flex items-center justify-between rounded-2xl bg-leaf-soft px-4 py-3 text-sm">
                    <span className="font-semibold text-leaf">{coupon} applied</span>
                    <button type="button" onClick={() => { setCoupon(''); setCouponInput(''); }} className="font-semibold underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code" className="input py-2.5" aria-label="Coupon code" />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim()}>Apply</button>
                  </div>
                )}
                {quote?.couponError && <p className="mt-2 text-sm text-coral">{quote.couponError}</p>}
              </div>
            )}

            <dl className={`mt-5 space-y-2.5 text-[15px] ${quoting ? 'opacity-60' : ''}`}>
              <div className="flex justify-between"><dt>Puppy price</dt><dd>{pet.adoption ? 'Free' : money(quote?.petPrice ?? pet.price)}</dd></div>
              {quote?.discount > 0 && <div className="flex justify-between text-leaf"><dt>Coupon discount</dt><dd>−{money(quote.discount)}</dd></div>}
              <div className="flex justify-between"><dt>{handover === 'home_delivery' ? 'Home delivery' : 'Kennel pickup'}</dt><dd>{quote?.deliveryFee ? money(quote.deliveryFee) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>Total</dt><dd>{money(quote?.total ?? pet.price)}</dd></div>
              {!pet.adoption && (
                <>
                  <div className="flex justify-between rounded-2xl bg-yolk-soft px-3 py-3 text-lg font-bold"><dt>Pay now</dt><dd>{money(payNow)}</dd></div>
                  {quote?.balance > 0 && <div className="flex justify-between text-sm text-ink-soft"><dt>Balance at handover</dt><dd>{money(quote.balance)}</dd></div>}
                </>
              )}
            </dl>
            {quoteErr && <p className="mt-3 text-sm text-coral">{quoteErr.message}</p>}

            <label className="mt-5 flex cursor-pointer gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-ink" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I agree to the <Link to="/policies" target="_blank" className="underline">reservation, refund and health guarantee terms</Link>{pet.adoption ? ' and the PawNest adoption pledge' : ''}.</span>
            </label>
            {err && <p className="mt-3 rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral">{err}</p>}
            <button className="btn btn-primary mt-5 w-full py-4 text-base" disabled={busy}>
              {busy ? <Spinner /> : <><Lock className="size-4" />{pet.adoption ? 'Send adoption request' : `Pay ${money(payNow)} and reserve`}</>}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft"><ShieldCheck className="size-4 text-leaf" />{pet.name} is held for you the moment you confirm</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
