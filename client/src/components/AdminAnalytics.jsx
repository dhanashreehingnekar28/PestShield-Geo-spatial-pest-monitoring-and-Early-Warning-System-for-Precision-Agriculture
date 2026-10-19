import { useEffect, useState } from 'react';
import api from '../api/axios';
import '../pages/Dashboard.css';

const SEVERITY_COLORS = { Low: '#e0b400', Medium: '#f08a24', High: '#d62f2f' };
const dayLabel = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000));

const BarList = ({ title, note, rows, empty = 'No data yet.' }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div className="db-card">
      <h3>{title}</h3>
      {note && <p className="db-muted db-card-note">{note}</p>}
      {rows.length === 0 || total === 0 ? (
        <p className="db-muted">{empty}</p>
      ) : (
        rows.map((r) => (
          <div key={r.label} className="db-bar-row">
            <span className="db-bar-label" title={r.label}>{r.label}</span>
            <div className="db-bar"><div className="db-bar-fill" style={{ width: `${(r.count / max) * 100}%`, ...(r.color ? { background: r.color } : {}) }} /></div>
            <b>{r.count}</b>
          </div>
        ))
      )}
    </div>
  );
};

// One bar per crop, split into verified / pending / rejected
const CropStatusCard = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.total));
  const any = rows.some((r) => r.total > 0);
  return (
    <div className="db-card">
      <h3>Reports by crop</h3>
      {!any ? (
        <p className="db-muted">No reports yet.</p>
      ) : (
        <>
          {rows.map((r) => (
            <div key={r.crop} className="db-bar-row">
              <span className="db-bar-label">{r.crop}</span>
              <div className="db-bar db-stack" title={`${r.Verified} verified, ${r.Pending} pending, ${r.Rejected} rejected`}>
                <div className="db-seg v" style={{ width: `${(r.Verified / max) * 100}%` }} />
                <div className="db-seg p" style={{ width: `${(r.Pending / max) * 100}%` }} />
                <div className="db-seg r" style={{ width: `${(r.Rejected / max) * 100}%` }} />
              </div>
              <b>{r.total}</b>
            </div>
          ))}
          <p className="db-legend">
            <span><i className="db-seg v" /> Verified</span>
            <span><i className="db-seg p" /> Pending</span>
            <span><i className="db-seg r" /> Rejected</span>
          </p>
        </>
      )}
    </div>
  );
};

const TrendCard = ({ trend }) => {
  const max = Math.max(1, ...trend.map((d) => d.count));
  const total = trend.reduce((s, d) => s + d.count, 0);
  const peak = trend.reduce((best, d) => (d.count > best.count ? d : best), trend[0] || { count: 0 });
  return (
    <div className="db-card">
      <h3>Reports, last {trend.length} days</h3>
      {total === 0 ? (
        <p className="db-muted">No reports in the last {trend.length} days.</p>
      ) : (
        <>
          <p className="db-muted db-card-note">{total} report{total === 1 ? '' : 's'} · busiest day {dayLabel(peak.date)} ({peak.count})</p>
          <div className="db-trend" role="img" aria-label={`${total} reports over the last ${trend.length} days, most on ${dayLabel(peak.date)}`}>
            {trend.map((d) => (
              <div key={d.date} className="db-trend-col" title={`${dayLabel(d.date)}: ${d.count}`}>
                <div className="db-trend-bar" style={{ height: `${(d.count / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="db-trend-axis">
            <span>{dayLabel(trend[0].date)}</span>
            <span>peak {max}/day</span>
            <span>{dayLabel(trend[trend.length - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
};

// refreshKey changes when the dashboard's counts change, so the numbers reload after a review
const AdminAnalytics = ({ refreshKey }) => {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(({ data: res }) => { setData(res.data); setFailed(false); })
      .catch(() => setFailed(true));
  }, [refreshKey]);

  if (!data) {
    return (
      <section className="db-section">
        <h2>System overview</h2>
        <div className="db-empty">{failed ? 'Analytics are unavailable right now.' : 'Loading…'}</div>
      </section>
    );
  }

  const { totals, alerts, trend } = data;
  const suspended = Math.max(0, totals.farmers - totals.activeFarmers);

  return (
    <section className="db-section">
      <h2>System overview</h2>
      <p className="db-muted db-overview-note">
        {totals.farmers} farmer{totals.farmers === 1 ? '' : 's'}{suspended > 0 ? ` (${suspended} suspended)` : ''} · {totals.farms} farm{totals.farms === 1 ? '' : 's'}
        {totals.pendingReports > 0 && totals.oldestPendingAt ? ` · oldest pending report is ${daysSince(totals.oldestPendingAt)} day${daysSince(totals.oldestPendingAt) === 1 ? '' : 's'} old` : ''}
      </p>
      <div className="db-stats">
        <div className="db-stat"><b>{totals.reports}</b><span>Total reports</span></div>
        <div className="db-stat"><b>{totals.verifiedReports}</b><span>Verified reports</span></div>
        <div className="db-stat"><b>{totals.rejectedReports}</b><span>Rejected reports</span></div>
        <div className="db-stat" title="Verified reports as a share of reviewed (verified + rejected) reports">
          <b>{totals.verificationRate === null ? '–' : `${totals.verificationRate}%`}</b><span>Verification rate</span>
        </div>
        <div className="db-stat"><b>{alerts.resolved}</b><span>Resolved outbreaks</span></div>
      </div>
      <div className="db-analytics">
        <CropStatusCard rows={data.reportsByCropStatus} />
        <BarList title="Farms by crop" rows={data.farmsByCrop.map((r) => ({ label: r.crop, count: r.count }))} empty="No farms yet." />
        <BarList
          title="Most reported pests"
          note="Rejected reports and healthy plants are not counted."
          rows={data.topPests.map((p) => ({ label: `${p.pest} · ${p.crop}`, count: p.count }))}
          empty="No reports with an identified pest yet."
        />
        <BarList
          title="Reports by severity"
          note="Rejected reports are not counted."
          rows={data.reportsBySeverity.map((r) => ({ label: r.severity, count: r.count, color: SEVERITY_COLORS[r.severity] }))}
          empty="No reports yet."
        />
        <TrendCard trend={trend} />
      </div>
    </section>
  );
};

export default AdminAnalytics;
