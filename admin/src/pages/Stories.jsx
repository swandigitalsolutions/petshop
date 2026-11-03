import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Star } from 'lucide-react';
import { api, formatDate } from '../lib/api.js';
import { PageHead, Img, Drawer, Field, Spinner, Tabs, Empty } from '../components/ui.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { useToast } from '../components/Toast.jsx';

function StoryForm({ story, onClose }) {
  const [f, setF] = useState({ name: '', city: '', petName: '', breed: '', image: '', rating: 5, quote: '', approved: true, featured: false, ...story });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true);
    const { _id, createdAt, updatedAt, __v, user, ...body } = f;
    try {
      await api(story?._id ? `/admin/testimonials/${story._id}` : '/admin/testimonials', { method: story?._id ? 'PUT' : 'POST', body });
      qc.invalidateQueries({ queryKey: ['admin-stories'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast('Story saved');
      onClose();
    } catch (e) { toast(e.message, { type: 'error' }); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this story?')) return;
    await api(`/admin/testimonials/${story._id}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['admin-stories'] });
    onClose();
  };
  return (
    <Drawer title={story?._id ? 'Edit story' : 'Add a story'} onClose={onClose}
      footer={<>{story?._id && <button type="button" className="btn btn-danger mr-auto" onClick={remove}>Delete</button>}<button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button type="button" className="btn btn-dark" onClick={save} disabled={busy || !f.name || !f.quote}>{busy ? <Spinner /> : 'Save story'}</button></>}>
      <div className="space-y-4">
        <div><p className="label">Photo of the dog</p><ImageUploader max={1} value={f.image ? [f.image] : []} onChange={(v) => set('image', v[0] || '')} /></div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Family name"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Area"><input className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Dog's name"><input className="input" value={f.petName} onChange={(e) => set('petName', e.target.value)} /></Field>
          <Field label="Breed"><input className="input" value={f.breed} onChange={(e) => set('breed', e.target.value)} /></Field>
        </div>
        <Field label="Rating"><select className="input" value={f.rating} onChange={(e) => set('rating', Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></Field>
        <Field label="Story"><textarea rows={5} className="input" value={f.quote} onChange={(e) => set('quote', e.target.value)} /></Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-ink" checked={f.approved} onChange={(e) => set('approved', e.target.checked)} />Published</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-ink" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} />Show on homepage</label>
        </div>
      </div>
    </Drawer>
  );
}

export default function Stories() {
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-stories'], queryFn: () => api('/admin/testimonials') });
  const [tab, setTab] = useState('');
  const [edit, setEdit] = useState(null);
  const qc = useQueryClient();
  const toast = useToast();
  const list = data.filter((t) => (tab === 'pending' ? !t.approved : tab === 'live' ? t.approved : true));
  const approve = async (t) => {
    await api(`/admin/testimonials/${t._id}`, { method: 'PUT', body: { approved: true } });
    qc.invalidateQueries({ queryKey: ['admin-stories'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    toast(`${t.name}'s story is now live`);
  };
  return (
    <>
      <PageHead title="Happy families" sub="Customer stories shown on the store. Stories sent by customers wait here for approval." actions={<button type="button" onClick={() => setEdit({})} className="btn btn-primary"><Plus className="size-4" />Add story</button>} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} items={[['', 'All', data.length], ['pending', 'Waiting for approval', data.filter((t) => !t.approved).length], ['live', 'Published', data.filter((t) => t.approved).length]]} /></div>
      {isLoading ? <div className="skeleton h-64" /> : !list.length ? <div className="card"><Empty title="Nothing here" /></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <article key={t._id} className="card flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Img src={t.image} width={100} className="size-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1"><p className="font-semibold">{t.name}</p><p className="truncate text-xs text-ink-soft">{t.petName} the {t.breed}, {t.city} · {formatDate(t.createdAt)}</p></div>
                <span className="flex">{Array.from({ length: t.rating }, (_, i) => <Star key={i} className="size-3.5 fill-yolk-deep text-yolk-deep" />)}</span>
              </div>
              <p className="mt-3 line-clamp-4 flex-1 text-sm text-ink-2">{t.quote}</p>
              <div className="mt-4 flex items-center gap-2">
                {t.approved ? <span className="badge bg-leaf-soft text-leaf">Published</span> : <span className="badge bg-yolk-soft text-ink">Waiting</span>}
                {t.featured && <span className="badge bg-ink text-white">On homepage</span>}
                <span className="ml-auto flex gap-1">
                  {!t.approved && <button type="button" onClick={() => approve(t)} className="btn btn-dark btn-xs">Approve</button>}
                  <button type="button" onClick={() => setEdit(t)} className="btn btn-outline btn-xs">Edit</button>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
      {edit && <StoryForm story={edit._id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}
