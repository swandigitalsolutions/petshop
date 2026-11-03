import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';

export default function WishButton({ id, name, className = '', withLabel = false }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const qc = useQueryClient();
  const on = Boolean(user?.wishlist?.some((x) => String(x) === String(id)));

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('Sign in to save puppies you love', { action: { label: 'Sign in', onClick: () => nav('/login') } });
      return;
    }
    const prev = user;
    setUser({ ...user, wishlist: on ? user.wishlist.filter((x) => String(x) !== String(id)) : [...(user.wishlist || []), id] });
    try {
      const r = await api('/auth/me/wishlist', { method: 'POST', body: { id } });
      setUser((u) => ({ ...u, wishlist: r.wishlist }));
      qc.invalidateQueries({ queryKey: ['me', 'wishlist'] });
      toast(r.added ? `Saved ${name || 'this puppy'} to your favourites` : 'Removed from favourites');
    } catch (err) {
      setUser(prev);
      toast(err.message, { type: 'error' });
    }
  };

  if (withLabel) {
    return (
      <button type="button" onClick={toggle} aria-pressed={on} className={`btn btn-outline ${className}`}>
        <Heart className={`size-5 ${on ? 'fill-coral text-coral' : ''}`} /> {on ? 'Saved' : 'Save'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? `Remove ${name || 'puppy'} from favourites` : `Save ${name || 'puppy'} to favourites`}
      className={`grid size-10 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 ${className}`}
    >
      <Heart className={`size-5 ${on ? 'fill-coral text-coral' : 'text-ink'}`} />
    </button>
  );
}
