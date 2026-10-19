import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import BackButton from '../components/BackButton';
import './Activities.css';
import './ActivitiesPlan.css';

const TYPES = ['Ploughing', 'Sowing', 'Irrigation', 'Fertilizer', 'Spraying', 'Weeding', 'Harvesting', 'Inspection', 'Other'];
// Today's date in the farmer's own time zone, as YYYY-MM-DD
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const toInput = (d) => new Date(d).toISOString().slice(0, 10);
const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const dueOf = (a) => a.dueDate || a.date;
const SOURCE_LABEL = { plan: 'Recommended', pest: 'From pest report' };

const periodText = (a) => {
  const due = dueOf(a);
  if (a.windowStart && fmt(a.windowStart) !== fmt(due)) return `Do between ${fmt(a.windowStart)} and ${fmt(due)}`;
  return `Due ${fmt(due)}`;
};

const Activities = () => {
  const [farms, setFarms] = useState([]);
  const [ready, setReady] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmFilter, setFarmFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const location = useLocation();
  // A notice can arrive from another page, e.g. after a pest report adds tasks
  const [msg, setMsg] = useState(() => (location.state?.notice ? { type: 'ok', text: location.state.notice } : { type: '', text: '' }));
  const [sowing, setSowing] = useState('');

  // Load the farmer's farms, then make sure each one has its recommended schedule.
  // The server only adds tasks that are missing, so this is safe to run every time.
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data } = await api.get('/farms/my');
        const list = data.data || [];
        if (!on) return;
        setFarms(list);
        await Promise.allSettled(list.map((f) => api.post('/activities/generate', { farm: f._id })));
      } catch { /* the list below shows its own error if loading fails */ }
      finally { if (on) setReady(true); }
    })();
    return () => { on = false; };
  }, []);

  const load = () =>
    api
      .get('/activities', { params: { farm: farmFilter || undefined, type: typeFilter || undefined } })
      .then(({ data }) => setActivities(data.data || []))
      .catch(() => setMsg({ type: 'error', text: 'Could not load activities' }))
      .finally(() => setLoading(false));

  useEffect(() => { if (ready) load(); }, [ready, farmFilter, typeFilter]);

  const selectedFarm = farms.find((f) => f._id === farmFilter);
  const farmSowing = selectedFarm?.sowingDate ? toInput(selectedFarm.sowingDate) : '';
  useEffect(() => { setSowing(farmSowing); }, [farmFilter, farmSowing]);

  const saveSowing = async () => {
    try {
      // The server rebuilds the pending recommended tasks when the sowing date changes
      await api.put(`/farms/${farmFilter}`, { sowingDate: sowing });
      const { data } = await api.get('/farms/my');
      setFarms(data.data || []);
      setMsg({ type: 'ok', text: 'Sowing date saved and schedule rebuilt.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not save the sowing date' });
    }
  };

  const todo = activities.filter((a) => a.status === 'Pending').sort((a, b) => new Date(dueOf(a)) - new Date(dueOf(b)));
  const done = activities.filter((a) => a.status !== 'Pending').sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));
  const overdue = todo.filter((a) => a.isOverdue).length;

  const openAdd = () => {
    setForm({ farm: farmFilter || farms[0]?._id || '', type: 'Irrigation', title: '', date: today(), product: '', notes: '', done: false });
    setFormError('');
  };
  const openEdit = (a) => {
    setForm({ _id: a._id, farm: a.farm?._id, type: a.type, title: a.title || '', date: toInput(dueOf(a)), product: a.product || '', notes: a.notes || '', done: a.status !== 'Pending' });
    setFormError('');
  };
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.farm) return setFormError('Choose a farm');
    setSaving(true);
    setFormError('');
    try {
      const body = { type: form.type, title: form.title.trim() || form.type, dueDate: form.date, product: form.product.trim(), notes: form.notes.trim() };
      if (form._id) await api.put(`/activities/${form._id}`, body);
      else await api.post('/activities', { ...body, farm: form.farm, status: form.done ? 'Completed' : 'Pending' });
      setMsg({ type: 'ok', text: form._id ? 'Activity updated.' : 'Activity added.' });
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save the activity');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (a, status) => {
    try {
      await api.patch(`/activities/${a._id}/status`, { status });
      setMsg({ type: 'ok', text: status === 'Completed' ? 'Marked as done.' : 'Moved back to to-do.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not update the activity' });
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title || a.type}"?`)) return;
    try {
      await api.delete(`/activities/${a._id}`);
      setMsg({ type: 'ok', text: 'Activity deleted.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not delete the activity' });
    }
  };

  const refreshSchedule = async () => {
    if (!window.confirm('Rebuild the recommended schedule for this farm from its current sowing date? Tasks you completed are kept.')) return;
    try {
      await api.post('/activities/generate', { farm: farmFilter, reset: true });
      setMsg({ type: 'ok', text: 'Schedule refreshed.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not refresh the schedule' });
    }
  };

  const renderItem = (a, isDone) => (
    <li key={a._id} className={`fa-item ty-${a.type}${a.isOverdue ? ' overdue' : ''}${isDone ? ' is-done' : ''}`}>
      <div className="fa-date">
        <b>{fmt(isDone ? a.completedAt || a.date : dueOf(a))}</b>
        <span>{new Date(isDone ? a.completedAt || a.date : dueOf(a)).getFullYear()}</span>
      </div>
      <div className="fa-main">
        <div className="fa-title">
          <strong>{a.title || a.type}</strong>
          <span className="fa-farm">{a.farm?.farmName || 'Deleted farm'}</span>
          {a.isOverdue && <span className="fa-badge over">Overdue</span>}
          {SOURCE_LABEL[a.source] && <span className={`fa-badge${a.source === 'pest' ? ' pest' : ''}`}>{SOURCE_LABEL[a.source]}</span>}
        </div>
        <span className="fa-period">{a.type}{a.stage ? ` · ${a.stage}` : ''} · {isDone ? `Done ${fmt(a.completedAt || a.date)}` : periodText(a)}</span>
        {a.instructions && <p className="fa-why">{a.instructions}</p>}
        {a.product && <span className="fa-product">Used: {a.product}</span>}
        {a.notes && <p>{a.notes}</p>}
      </div>
      <div className="fa-tools">
        {isDone
          ? <button onClick={() => setStatus(a, 'Pending')}>Undo</button>
          : <button className="done-btn" onClick={() => setStatus(a, 'Completed')}>Mark done</button>}
        <button onClick={() => openEdit(a)}>Edit</button>
        <button className="danger" onClick={() => remove(a)}>Delete</button>
      </div>
    </li>
  );

  return (
    <div className="fa">
      <BackButton />
      <header className="fa-head">
        <div>
          <h1>Field activities</h1>
          <p>Recommended jobs for each farm, based on its crop and sowing date, plus your own entries.</p>
        </div>
        {farms.length > 0 && <button className="fa-primary" onClick={openAdd}>Add custom activity</button>}
      </header>

      {farms.length === 0 ? (
        <div className="fa-empty">You need a farm before you get a schedule. <Link to="/create-farm">Add a farm</Link></div>
      ) : (
        <>
          <div className="fa-bar">
            <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)} aria-label="Filter by farm">
              <option value="">All farms</option>
              {farms.map((f) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by activity">
              <option value="">All activities</option>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {farmFilter && <button onClick={refreshSchedule}>Refresh schedule</button>}
          </div>
          {farmFilter && selectedFarm && (
            <div className="fa-sow">
              <label htmlFor="fa-sow">Sowing date</label>
              <input id="fa-sow" type="date" value={sowing} onChange={(e) => setSowing(e.target.value)} />
              <button onClick={saveSowing} disabled={!sowing || sowing === farmSowing}>Save date</button>
            </div>
          )}
          {msg.text && <p className={msg.type === 'ok' ? 'fa-ok' : 'fa-err'} role="status">{msg.text}</p>}

          {loading ? (
            <p className="fa-muted">Loading activities…</p>
          ) : (
            <>
              <h2 className="fa-sec">To do <span className="fa-count">{todo.length}</span>{overdue > 0 && <span className="fa-count over">{overdue} overdue</span>}</h2>
              {todo.length === 0
                ? <div className="fa-empty">Nothing to do right now. New recommendations appear as each stage of your crop approaches.</div>
                : <ul className="fa-list">{todo.map((a) => renderItem(a, false))}</ul>}

              <h2 className="fa-sec">Done <span className="fa-count">{done.length}</span></h2>
              {done.length === 0
                ? <div className="fa-empty">Completed activities will show here.</div>
                : <ul className="fa-list">{done.map((a) => renderItem(a, true))}</ul>}
            </>
          )}
        </>
      )}

      {form && (
        <div className="fa-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && setForm(null)}>
          <form className="fa-modal" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="fa-title">
            <h2 id="fa-title">{form._id ? 'Edit activity' : 'Add a custom activity'}</h2>
            <label htmlFor="fa-farm">Farm</label>
            <select id="fa-farm" value={form.farm} onChange={setField('farm')} disabled={!!form._id}>
              {farms.map((f) => <option key={f._id} value={f._id}>{f.farmName} ({f.cropType})</option>)}
            </select>
            <label htmlFor="fa-type">Activity</label>
            <select id="fa-type" value={form.type} onChange={setField('type')}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <label htmlFor="fa-name">Task name (optional)</label>
            <input id="fa-name" maxLength={120} placeholder="e.g. Second weeding" value={form.title} onChange={setField('title')} />
            <label htmlFor="fa-date">{form.done ? 'Date' : 'Deadline'}</label>
            <input id="fa-date" type="date" value={form.date} onChange={setField('date')} required />
            <label htmlFor="fa-product">Product used (optional)</label>
            <input id="fa-product" maxLength={100} placeholder="e.g. neem oil, urea" value={form.product} onChange={setField('product')} />
            <label htmlFor="fa-notes">Notes (optional)</label>
            <textarea id="fa-notes" rows="3" maxLength={500} value={form.notes} onChange={setField('notes')} />
            {!form._id && (
              <label className="fa-check">
                <input type="checkbox" checked={form.done} onChange={(e) => setForm((f) => ({ ...f, done: e.target.checked }))} />
                I have already done this
              </label>
            )}
            {formError && <p className="fa-err">{formError}</p>}
            <div className="fa-modal-actions">
              <button type="button" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="fa-primary" disabled={saving}>{saving ? 'Saving…' : form._id ? 'Save changes' : 'Add activity'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Activities;