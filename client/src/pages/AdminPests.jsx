import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import PestDetailModal from '../components/PestDetailModal';
import { getPestKnowledge } from '../data/pestKnowledge';
import api from '../api/axios';
import './AdminPests.css';

const CROPS = ['Groundnut', 'Potato', 'Chilli'];
const EMPTY = { pestName: '', crop: 'Groundnut', description: '', symptoms: '', treatment: '' };

// symptoms/treatment may be stored as text or as a list; show either as plain text
const toText = (v) => (Array.isArray(v) ? v.join('\n') : v || '');
const label = (name) => (name || '').replace(/_/g, ' ');

const AdminPests = () => {
  const [pests, setPests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crop, setCrop] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null = closed, otherwise the pest being added/edited
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [detailPest, setDetailPest] = useState(null);

  const load = () =>
    api
      .get('/pests')
      .then(({ data }) => setPests(data.data || []))
      .catch(() => setMsg({ type: 'error', text: 'Could not load the pest library' }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY, crop: crop || 'Groundnut' }); setFormError(''); };
  const openEdit = (p) => {
    setForm({ _id: p._id, pestName: p.pestName, crop: p.crop, description: toText(p.description), symptoms: toText(p.symptoms), treatment: toText(p.treatment) });
    setFormError('');
  };
  const closeForm = () => { if (!saving) setForm(null); };
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.pestName.trim()) return setFormError('Pest name is required');
    if (!form.crop) return setFormError('Choose a crop');
    setSaving(true);
    setFormError('');
    const body = {
      pestName: form.pestName.trim(),
      crop: form.crop,
      description: form.description.trim(),
      symptoms: form.symptoms.trim(),
      treatment: form.treatment.trim(),
    };
    try {
      if (form._id) await api.put(`/pests/${form._id}`, body);
      else await api.post('/pests', body);
      setMsg({ type: 'ok', text: form._id ? 'Pest updated.' : 'Pest added to the library.' });
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save the pest');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${label(p.pestName)}"? Existing reports that use it will lose the pest name.`)) return;
    try {
      await api.delete(`/pests/${p._id}`);
      setMsg({ type: 'ok', text: `${label(p.pestName)} was deleted.` });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not delete the pest' });
    }
  };

  const q = search.trim().toLowerCase();
  const shown = pests.filter(
    (p) => (!crop || p.crop === crop) && (!q || label(p.pestName).toLowerCase().includes(q))
  );
  const countFor = (c) => pests.filter((p) => p.crop === c).length;

  return (
    <div className="ap">
      <BackButton />
      <header className="ap-head">
        <div>
          <h1>Pest library</h1>
          <p>{pests.length} pests across {CROPS.length} crops. Farmers and the AI results read from this list.</p>
        </div>
        <div className="ap-head-actions">
          <Link to="/dashboard" className="ap-back">Back to dashboard</Link>
          <button className="ap-primary" onClick={openAdd}>Add pest</button>
        </div>
      </header>

      <div className="ap-bar">
        <div className="ap-tabs" role="tablist" aria-label="Filter by crop">
          <button className={!crop ? 'on' : ''} onClick={() => setCrop('')}>All ({pests.length})</button>
          {CROPS.map((c) => (
            <button key={c} className={crop === c ? 'on' : ''} onClick={() => setCrop(c)}>{c} ({countFor(c)})</button>
          ))}
        </div>
        <input type="search" placeholder="Search pests" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search pests" />
      </div>

      {msg.text && <p className={msg.type === 'ok' ? 'ap-ok' : 'ap-err'} role="status">{msg.text}</p>}

      {loading ? (
        <p className="ap-muted">Loading pests…</p>
      ) : shown.length === 0 ? (
        <div className="ap-empty">
          {pests.length === 0 ? 'The library is empty. Add the first pest to get started.' : 'No pests match your filters.'}
        </div>
      ) : (
        <div className="ap-list">
          {shown.map((p) => {
            return (
              <article key={p._id} className={`ap-card crop-${p.crop}`}>
                <div className="ap-card-top">
                  <div>
                    <h3>{label(p.pestName)}</h3>
                    <span className="ap-crop">{p.crop}</span>
                  </div>
                  <div className="ap-card-actions">
                    <button onClick={() => openEdit(p)}>Edit</button>
                    <button className="danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </div>
                <p className="ap-desc">{toText(p.description) || 'No description yet.'}</p>
                {(toText(p.symptoms) || toText(p.treatment) || getPestKnowledge(p)) && (
                  <button className="ap-toggle" onClick={() => setDetailPest(p)}>
                    Show symptoms and treatment
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {form && (
        <div className="ap-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
          <form className="ap-modal" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="ap-form-title">
            <h2 id="ap-form-title">{form._id ? 'Edit pest' : 'Add a pest'}</h2>

            <label htmlFor="ap-name">Pest name</label>
            <input id="ap-name" value={form.pestName} onChange={setField('pestName')} autoFocus />
            <small>Keep this the same as the name the AI service uses, so detection results match this entry.</small>

            <label htmlFor="ap-crop">Crop</label>
            <select id="ap-crop" value={form.crop} onChange={setField('crop')}>
              {CROPS.map((c) => <option key={c}>{c}</option>)}
            </select>

            <label htmlFor="ap-desc">Description</label>
            <textarea id="ap-desc" rows="3" value={form.description} onChange={setField('description')} />

            <label htmlFor="ap-sym">Symptoms</label>
            <textarea id="ap-sym" rows="3" value={form.symptoms} onChange={setField('symptoms')} />

            <label htmlFor="ap-treat">Treatment and prevention</label>
            <textarea id="ap-treat" rows="3" value={form.treatment} onChange={setField('treatment')} />

            {formError && <p className="ap-err">{formError}</p>}

            <div className="ap-modal-actions">
              <button type="button" onClick={closeForm} disabled={saving}>Cancel</button>
              <button type="submit" className="ap-primary" disabled={saving}>{saving ? 'Saving…' : form._id ? 'Save changes' : 'Add pest'}</button>
            </div>
          </form>
        </div>
      )}

      {detailPest && <PestDetailModal pest={detailPest} onClose={() => setDetailPest(null)} />}
    </div>
  );
};

export default AdminPests;