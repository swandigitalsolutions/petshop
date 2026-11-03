import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useHome } from '../lib/queries.js';
import { Field, Spinner, Img } from '../components/ui.jsx';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { data } = useHome();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const to = loc.state?.from || '/account';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
      nav(to, { replace: true });
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const img = data?.featured?.[1]?.images?.[0] || data?.settings?.heroImage;

  return (
    <div className="wrap grid min-h-[70vh] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl font-extrabold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 text-ink-soft">{isLogin ? 'Sign in to reserve puppies, save favourites and track your reservation.' : 'It takes a minute, and you can save puppies and reserve online.'}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {!isLogin && <Field label="Full name"><input required autoComplete="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>}
          <Field label="Email"><input required type="email" autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {!isLogin && <Field label="Phone"><input required type="tel" autoComplete="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>}
          <Field label="Password" hint={!isLogin ? 'At least 6 characters' : undefined}><input required type="password" minLength={6} autoComplete={isLogin ? 'current-password' : 'new-password'} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          {err && <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral">{err}</p>}
          <button className="btn btn-dark w-full py-4" disabled={busy}>{busy ? <Spinner /> : isLogin ? 'Sign in' : 'Create account'}</button>
        </form>
        {isLogin && (
          <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm">
            Demo account: <button type="button" className="font-semibold underline" onClick={() => setForm({ ...form, email: 'demo@pawnest.in', password: 'Demo@123' })}>demo@pawnest.in / Demo@123</button>
          </p>
        )}
        <p className="mt-6 text-ink-soft">
          {isLogin ? 'New to PawNest? ' : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'} state={loc.state} className="link">{isLogin ? 'Create an account' : 'Sign in'}</Link>
        </p>
      </div>
      <div className="hidden lg:block">
        <div className="dogtag dogtag-hole mx-auto aspect-[5/6] max-w-md border-[10px] border-white bg-mist shadow-2xl">
          {img && <Img src={img} alt="" width={800} className="size-full object-cover" />}
        </div>
      </div>
    </div>
  );
}
