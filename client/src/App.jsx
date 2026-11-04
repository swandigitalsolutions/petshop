import { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';

// Route-level code splitting keeps the first load small.
const Puppies = lazy(() => import('./pages/Puppies.jsx'));
const PuppyDetail = lazy(() => import('./pages/PuppyDetail.jsx'));
const Breeds = lazy(() => import('./pages/Breeds.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const Visit = lazy(() => import('./pages/Visit.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const Stories = lazy(() => import('./pages/Stories.jsx'));
const Info = lazy(() => import('./pages/Info.jsx'));

function PageLoader() {
  return <div className="grid min-h-[50vh] place-items-center text-ink-soft"><Spinner className="size-8" /></div>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout fallback={<PageLoader />} />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Puppies />} />
        <Route path="puppies" element={<Puppies />} />
        <Route path="search" element={<Puppies />} />
        <Route path="adopt" element={<Puppies adopt />} />
        <Route path="puppies/:slug" element={<PuppyDetail />} />
        <Route path="breeds" element={<Breeds />} />
        <Route path="breeds/:slug" element={<Navigate to="/breeds" replace />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Protected><Checkout /></Protected>} />
        <Route path="order/:id" element={<Protected><OrderSuccess /></Protected>} />
        <Route path="visit" element={<Visit />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="account/*" element={<Protected><Account /></Protected>} />
        <Route path="stories" element={<Stories />} />
        <Route path="about" element={<Info page="about" />} />
        <Route path="contact" element={<Info page="contact" />} />
        <Route path="faq" element={<Info page="faq" />} />
        <Route path="policies" element={<Info page="policies" />} />
        <Route path="*" element={<Info page="404" />} />
      </Route>
    </Routes>
  );
}
