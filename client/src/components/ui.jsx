import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { FALLBACK_IMG, imageUrl, srcSet, money, discountPct } from '../lib/api.js';

export function Img({ src, alt = '', width = 600, sizes = '(min-width: 1024px) 25vw, 50vw', className = '', eager = false, ...rest }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const real = failed ? FALLBACK_IMG : imageUrl(src, width);
  return (
    <img
      src={real}
      srcSet={failed ? undefined : srcSet(src)}
      sizes={srcSet(src) ? sizes : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${className} transition-[opacity,transform] duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      {...rest}
    />
  );
}

export function Price({ price, mrp, size = 'md', free }) {
  const off = discountPct(price, mrp);
  const big = size === 'lg';
  if (free) return <span className={`${big ? 'text-3xl' : 'text-lg'} font-display font-bold text-leaf`}>Free adoption</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`${big ? 'text-3xl' : 'text-lg'} font-display font-bold text-ink`}>{money(price)}</span>
      {off > 0 && (
        <>
          <span className={`${big ? 'text-base' : 'text-sm'} text-ink-soft line-through`}>{money(mrp)}</span>
          <span className={`${big ? 'text-base' : 'text-sm'} font-semibold text-coral`}>{off}% off</span>
        </>
      )}
    </span>
  );
}

export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(value) ? 'fill-yolk-deep text-yolk-deep' : 'fill-line text-line'} />
      ))}
    </span>
  );
}

export function Rating({ rating, count }) {
  if (!count) return <span className="text-xs text-ink-soft">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <Stars value={rating} />
      <span className="font-semibold text-ink">{rating?.toFixed(1)}</span>({count})
    </span>
  );
}

export function QtyStepper({ value, onChange, max = 20, small }) {
  const s = small ? 'size-8' : 'size-11';
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button type="button" aria-label="Decrease quantity" className={`${s} grid place-items-center rounded-full hover:bg-mist disabled:opacity-40`} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label="Increase quantity" className={`${s} grid place-items-center rounded-full hover:bg-mist disabled:opacity-40`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function SectionHead({ title, sub, link, linkLabel = 'See all' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {sub && <p className="mt-2 max-w-xl text-ink-soft">{sub}</p>}
      </div>
      {link && (
        <Link to={link} className="link shrink-0 text-sm">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i}>
      <div className="skeleton aspect-[4/5]" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/3" />
    </div>
  ));
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid size-16 place-items-center rounded-full bg-yolk-soft">
          <Icon className="size-7 text-ink" />
        </span>
      )}
      <h3 className="text-xl font-bold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && nums[i - 1] !== n - 1 && <span className="px-1 text-ink-soft">…</span>}
          <button type="button" onClick={() => onChange(n)} className={`size-10 rounded-full text-sm font-semibold ${n === page ? 'bg-ink text-white' : 'hover:bg-mist'}`} aria-current={n === page ? 'page' : undefined}>
            {n}
          </button>
        </span>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

export function Crumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5" />}
          {it.to ? <Link to={it.to} className="hover:text-ink">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-coral">{error}</span>}
    </label>
  );
}

export function Spinner({ className = 'size-5' }) {
  return <span className={`${className} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`} aria-hidden />;
}
