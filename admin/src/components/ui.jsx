import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { FALLBACK_IMG, imageUrl } from '../lib/api.js';

export function Img({ src, alt = '', width = 200, className = '' }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed ? FALLBACK_IMG : imageUrl(src, width)} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`bg-mist ${className}`} />;
}

export function Badge({ map, value }) {
  const [label, cls] = map[value] || [value, 'bg-mist text-ink'];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function PageHead({ title, sub, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {sub && <p className="mt-1 text-ink-soft">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Spinner({ className = 'size-4' }) {
  return <span className={`${className} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`} aria-hidden />;
}

export function Pager({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 text-sm">
      <span className="text-ink-soft">Page {page} of {pages}</span>
      <button type="button" className="btn btn-outline btn-xs" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
      <button type="button" className="btn btn-outline btn-xs" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
    </div>
  );
}

export function Tabs({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-mist p-1">
      {items.map(([v, l, n]) => (
        <button type="button" key={v} onClick={() => onChange(v)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === v ? 'bg-white shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
          {l}{n !== undefined && <span className="ml-1.5 text-xs text-ink-soft">{n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Drawer({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fade-in absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside className={`slide-in absolute inset-y-0 right-0 flex w-full flex-col bg-white ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost size-9 p-0" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

export function Stat({ label, value, sub, tone = '' }) {
  return (
    <div className={`card p-5 ${tone}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

export const useDebounced = (value, ms = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};
