import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Field, Spinner } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try { await login(form.email, form.password); } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <span className="grid size-12 place-items-center rounded-2xl bg-yolk"><Lock className="size-5" /></span>
        <h1 className="mt-5 text-3xl font-bold">PawNest Admin</h1>
        <p className="mt-1 text-ink-soft">Sign in with your staff account.</p>
        <div className="mt-6 space-y-4">
          <Field label="Email"><input required type="email" autoComplete="username" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password"><input required type="password" autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        </div>
        {err && <p className="mt-4 rounded-xl bg-coral-soft px-3 py-2 text-sm font-medium text-coral">{err}</p>}
        <button className="btn btn-dark mt-6 w-full py-3" disabled={busy}>{busy ? <Spinner /> : 'Sign in'}</button>
        <button type="button" onClick={() => setForm({ email: 'admin@pawnest.in', password: 'Admin@123' })} className="mt-4 w-full text-center text-xs text-ink-soft underline">Use demo admin: admin@pawnest.in / Admin@123</button>
      </form>
    </div>
  );
}
