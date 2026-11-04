import { lazy, Suspense, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Dog, ClipboardList, CalendarDays, MessageSquare, Users, BookOpen, TicketPercent, Quote, Settings, LogOut, ExternalLink, Menu, X,
} from 'lucide-react';
import { useAuth } from './lib/auth.jsx';
import { api, STORE_URL } from './lib/api.js';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Puppies = lazy(() => import('./pages/Puppies.jsx'));
const PuppyForm = lazy(() => import('./pages/PuppyForm.jsx'));
const Reservations = lazy(() => import('./pages/Reservations.jsx'));
const Visits = lazy(() => import('./pages/Visits.jsx'));
const Enquiries = lazy(() => import('./pages/Enquiries.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Breeds = lazy(() => import('./pages/Breeds.jsx'));
const Coupons = lazy(() => import('./pages/Coupons.jsx'));
const Stories = lazy(() => import('./pages/Stories.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { data: s } = useQuery({ queryKey: ['stats'], queryFn: () => api('/admin/stats'), staleTime: 60_000 });
  const groups = [
    ['Overview', [['/', 'Dashboard', LayoutDashboard]]],
    ['Sales', [
      ['/reservations', 'Orders', ClipboardList, s?.statusCounts?.placed],
      ['/visits', 'Visits & video calls', CalendarDays, s?.upcomingVisits?.filter((v) => v.status === 'pending').length],
      ['/enquiries', 'Enquiries', MessageSquare, s?.newEnquiries],
      ['/customers', 'Customers', Users],
    ]],
    ['Catalogue', [
      ['/puppies', 'Puppies', Dog],
      ['/breeds', 'Breeds', BookOpen],
    ]],
    ['Marketing', [
      ['/coupons', 'Coupons', TicketPercent],
      ['/stories', 'Happy families', Quote, s?.pendingStories],
      ['/settings', 'Store settings', Settings],
    ]],
  ];
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-xl bg-yolk">
          <svg viewBox="0 0 64 64" className="size-5" aria-hidden><g fill="#172033"><ellipse cx="32" cy="40" rx="11" ry="9" /><circle cx="20" cy="28" r="5" /><circle cx="27" cy="20" r="5" /><circle cx="37" cy="20" r="5" /><circle cx="44" cy="28" r="5" /></g></svg>
        </span>
        <span><span className="block font-display text-lg font-bold leading-none">PawNest</span><span className="text-xs text-white/60">Store admin</span></span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Admin">
        {groups.map(([g, items]) => (
          <div key={g}>
            <p className="px-3 pb-1.5 text-xs font-semibold text-white/40">{g}</p>
            {items.map(([to, l, I, n]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'}`}>
                <I className="size-4" />
                <span className="flex-1">{l}</span>
                {n > 0 && <span className="rounded-full bg-yolk px-1.5 text-xs font-bold text-ink">{n}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a href={STORE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/6 hover:text-white"><ExternalLink className="size-4" />Open storefront</a>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-white/15 text-sm font-bold">{user?.name?.[0]}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user?.name}</span><span className="text-xs capitalize text-white/50">{user?.role}</span></span>
          <button type="button" onClick={logout} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sign out"><LogOut className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fade-in absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64"><Sidebar onNavigate={() => setOpen(false)} /></aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost size-9 p-0" aria-label="Open menu">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <span className="font-display text-lg font-bold">PawNest Admin</span>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense fallback={<div className="grid h-64 place-items-center"><Spinner className="size-7" /></div>}>
          <Routes location={loc}>
            <Route index element={<Dashboard />} />
            <Route path="puppies" element={<Puppies />} />
            <Route path="puppies/new" element={<PuppyForm />} />
            <Route path="puppies/:id" element={<PuppyForm />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="visits" element={<Visits />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="customers" element={<Customers />} />
            <Route path="breeds" element={<Breeds />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="stories" element={<Stories />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner className="size-8" /></div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={user ? <Shell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
