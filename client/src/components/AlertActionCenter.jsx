import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AlertMapPreview from './AlertMapPreview';

// aiConfidence is stored as 0-1 (confirmed from your real reports)
const CONFIDENCE_SCALE = 1;
const pct = (c) => (Number.isFinite(c) ? `${Math.round((c * 100) / CONFIDENCE_SCALE)}%` : 'not recorded');

const List = ({ title, items }) =>
  items?.length ? (
    <div className="ac-block">
      <h4>{title}</h4>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  ) : null;

const AlertActionCenter = ({ alert, onMarkRead }) => {
  const adv = alert.advisory;
  const [open, setOpen] = useState(false);
  const [weather, setWeather] = useState({ state: 'idle', data: null });
  const [checked, setChecked] = useState({});
  const [farmId, setFarmId] = useState(alert.affectedFarms?.[0]?._id || '');
  const [work, setWork] = useState({ busy: false, msg: '', ok: true });

  useEffect(() => {
    if (!open || weather.state !== 'idle') return;
    setWeather({ state: 'loading', data: null });
    api.get(`/alerts/${alert._id}/weather`)
      .then(({ data }) => setWeather({ state: 'done', data: data.data }))
      .catch(() => setWeather({ state: 'done', data: null }));
  }, [open, alert._id, weather.state]);

  if (!adv) return null;

  const addToFieldWork = async () => {
    if (!farmId) return setWork({ busy: false, ok: false, msg: 'None of your farms is linked to this alert.' });
    setWork({ busy: true, msg: '', ok: true });
    try {
      const { data } = await api.post('/activities/from-pest', { farm: farmId, pestName: alert.pestName, severity: alert.severity });
      const n = (data.data || []).length;
      setWork({ busy: false, ok: true, msg: n ? `${n} task${n > 1 ? 's' : ''} added to your Field Work.` : 'These tasks are already in your Field Work.' });
    } catch (err) {
      setWork({ busy: false, ok: false, msg: err.response?.data?.message || 'Could not add to Field Work' });
    }
  };

  const w = weather.data;
  const farm = alert.affectedFarms?.[0];
  const reportState = { crop: alert.crop, farmId: farm?._id, pestName: alert.pestName };

  return (
    <>
      <div className="ac-summary">
        <span>{adv.why.verifiedReports} verified reports within {adv.why.radiusKm} km in the last {adv.why.windowDays} days</span>
        <button className="db-btn-primary" onClick={() => setOpen(true)}>Take Action</button>
      </div>

      {open && (
        <div className="db-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="db-modal ac-modal" role="dialog" aria-modal="true" aria-labelledby={`ac-${alert._id}`}>
            <h2 id={`ac-${alert._id}`}>{alert.pestName} on {alert.crop} · {alert.severity} risk</h2>

            <div className="ac-block">
              <h4>Why am I seeing this?</h4>
              <p>{adv.why.verifiedReports} verified reports of {adv.why.pest} on {adv.why.crop}, within {adv.why.radiusKm} km, in the last {adv.why.windowDays} days.
                {alert.affectedFarms?.length > 0 && ` Your farm${alert.affectedFarms.length > 1 ? 's' : ''}: ${alert.affectedFarms.map((f) => f.farmName).join(', ')}.`}</p>
            </div>

            <div className="ac-block">
              <h4>Why this risk?</h4>
              <p>{adv.riskReason}</p>
            </div>

            <List title="What should I do now?" items={adv.immediate} />
            {adv.symptoms && <div className="ac-block"><h4>Symptoms to look for</h4><p>{adv.symptoms}</p></div>}
            <p className="db-muted">Treatment advice comes from: {adv.treatmentSource}. Follow the product label and ask your agriculture officer before spraying.</p>
            <List title="Next 2 days" items={adv.next2Days} />
            <List title="Prevention" items={adv.prevention} />
            <List title="Monitoring and follow-up" items={adv.monitoring} />

            <div className="ac-block">
              <h4>Checklist</h4>
              {adv.checklist.map((t, i) => (
                <label key={i} className="ac-check">
                  <input type="checkbox" checked={!!checked[i]} onChange={() => setChecked({ ...checked, [i]: !checked[i] })} />
                  <span>{t}</span>
                </label>
              ))}
            </div>

            <div className="ac-block">
              <h4>AI identification</h4>
              {!adv.ai ? (
                <p className="db-muted">No AI prediction was attached to these reports.</p>
              ) : (
                <>
                  <ul>
                    {adv.ai.predictions.map((p) => (
                      <li key={p.label}>{p.label}: {p.count} report{p.count > 1 ? 's' : ''}, average confidence {pct(p.averageConfidence)}</li>
                    ))}
                  </ul>
                  <p className="db-muted">{adv.ai.agreeing} of {adv.ai.reportsWithAi} AI predictions match the verified pest name. The AI is only a first guess; the alert is based on verified reports.</p>
                </>
              )}
            </div>

            <div className="ac-block">
              <h4>Weather at the outbreak area</h4>
              {weather.state === 'loading' && <p className="db-muted">Loading…</p>}
              {weather.state === 'done' && !w && <p className="db-muted">Weather data is unavailable right now.</p>}
              {w && (
                <p>{w.temperatureC}°C · humidity {w.humidityPct}% · rain last 3 days {w.rainLast3DaysMm} mm · forecast next 3 days {w.rainNext3DaysMm} mm
                  <span className="db-muted"> ({w.source}; for context only, it does not change the risk level)</span></p>
              )}
            </div>

            <div className="ac-block">
              <h4>Map</h4>
              <AlertMapPreview alert={alert} />
            </div>

            {alert.affectedFarms?.length > 1 && (
              <select value={farmId} onChange={(e) => setFarmId(e.target.value)} aria-label="Farm for field work">
                {alert.affectedFarms.map((f) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
              </select>
            )}
            {work.msg && <p className={work.ok ? 'db-msg-ok' : 'db-msg-err'} role="status">{work.msg}</p>}

            <div className="ac-actions">
              <button className="db-btn-primary" onClick={addToFieldWork} disabled={work.busy}>{work.busy ? 'Adding…' : 'Add to Field Work'}</button>
              <Link className="db-btn" to="/report-pest" state={reportState}>Report affected crop</Link>
               {!alert.read && <button onClick={() => onMarkRead(alert._id)}>Mark as read</button>}
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertActionCenter;
