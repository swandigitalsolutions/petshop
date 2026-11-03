import { useRef, useState } from 'react';
import { ImagePlus, Star, Trash2, ArrowLeft, ArrowRight, Link2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { Img, Spinner } from './ui.jsx';
import { useToast } from './Toast.jsx';

// Multi-image uploader: drag & drop or browse, reorder, set cover, remove, or add by URL.
// Uploaded files are compressed to WebP on the server.
export default function ImageUploader({ value = [], onChange, max = 10 }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState('');
  const toast = useToast();

  const upload = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, max - value.length);
    if (!list.length) return;
    const fd = new FormData();
    list.forEach((f) => fd.append('images', f));
    setBusy(true);
    try {
      const { urls } = await api('/admin/upload', { method: 'POST', body: fd });
      onChange([...value, ...urls]);
      toast(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded`);
    } catch (e) {
      toast(e.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const move = (i, d) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const cover = (i) => onChange([value[i], ...value.filter((_, n) => n !== i)]);
  const remove = (i) => onChange(value.filter((_, n) => n !== i));
  const addUrl = () => {
    if (!/^https?:\/\/|^\//.test(url.trim())) { toast('Enter a full image link starting with https://', { type: 'error' }); return; }
    onChange([...value, url.trim()]);
    setUrl('');
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
            <Img src={src} width={300} className="size-full object-cover" />
            {i === 0 && <span className="badge absolute left-1.5 top-1.5 bg-ink text-white">Cover</span>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded-lg bg-white/95 shadow" aria-label="Move left"><ArrowLeft className="size-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded-lg bg-white/95 shadow" aria-label="Move right"><ArrowRight className="size-3.5" /></button>
              </div>
              <div className="flex gap-1">
                {i !== 0 && <button type="button" onClick={() => cover(i)} className="grid size-7 place-items-center rounded-lg bg-white/95 shadow" aria-label="Make cover photo"><Star className="size-3.5" /></button>}
                <button type="button" onClick={() => remove(i)} className="grid size-7 place-items-center rounded-lg bg-white/95 text-coral shadow" aria-label="Remove photo"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
            className={`grid aspect-square place-items-center rounded-xl border-2 border-dashed text-center text-sm transition ${over ? 'border-ink bg-yolk-soft' : 'border-line hover:border-ink-soft'}`}
          >
            {busy ? <Spinner className="size-6" /> : <span className="px-2"><ImagePlus className="mx-auto mb-1 size-6" />Add photos<span className="block text-xs text-ink-soft">or drop them here</span></span>}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} placeholder="…or paste an image link" className="input pl-9" />
        </div>
        <button type="button" onClick={addUrl} className="btn btn-outline" disabled={!url.trim()}>Add</button>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">The first photo is the cover shown on the store. Photos are compressed automatically for fast loading.</p>
    </div>
  );
}
