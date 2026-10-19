import './MapDetailPanel.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const RISK_COLORS = { Low: '#e0b400', Medium: '#f08a24', High: '#d62f2f' };
const LOW_CONFIDENCE = 0.6; // same threshold used in the report review popup

const label = (name) => (name || '').replace(/_/g, ' ');
// The AI puts the crop in front of its class names (GROUNDNUT_RUST); the pest library does not
const nice = (name) => label(name).trim().toLowerCase().replace(/^(groundnut|potato|chilli|chili)\s+/, '').replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown');
const coords = (f) => `${Number(f.geometry.coordinates[1]).toFixed(4)}, ${Number(f.geometry.coordinates[0]).toFixed(4)}`;

const Row = ({ name, children }) => (
  <div className="md-row"><dt>{name}</dt><dd>{children}</dd></div>
);

const RISK_WHY = {
  High: 'High risk: 5 or more nearby verified reports confirm this pest.',
  Medium: 'Medium risk: 3 or 4 nearby verified reports confirm this pest.',
  Low: 'Low risk: fewer verified reports than usual are linked to this zone.',
};

// selected: { type: 'zone' | 'report', id }
// zones / reports: GeoJSON features currently loaded on the map
const MapDetailPanel = ({ selected, zones, reports, onSelect, onClose }) => {
  if (!selected) return null;

  if (selected.type === 'zone') {
    const z = zones.find((f) => String(f.properties.id) === String(selected.id));
    if (!z) return null;
    const p = z.properties;
    const ids = (p.reportIds || []).map(String);
    const shown = ids.map((id) => reports.find((r) => String(r.properties.id) === id)).filter(Boolean);
    const actions = Array.isArray(p.recommendedActions) ? p.recommendedActions.filter(Boolean) : [];
    const color = RISK_COLORS[p.riskLevel] || RISK_COLORS.Medium;
    const total = p.reportCount ?? ids.length;

    return (
      <aside className="md-panel" role="dialog" aria-label="Outbreak zone details">
        <header className="md-head">
          <div>
            <h3>{label(p.pestName)} on {p.crop}</h3>
            <div className="md-badges">
              <span className="md-badge" style={{ background: color }}>{p.riskLevel} risk</span>
              <span className={`md-badge status ${p.status === 'Resolved' ? 'done' : ''}`}>{p.status}</span>
            </div>
          </div>
          <button className="md-x" onClick={onClose} aria-label="Close details">×</button>
        </header>

        <div className="md-body">
          <section>
            <h4>Why this zone?</h4>
            <p>{p.message || 'No description was recorded for this outbreak.'}</p>
            <p className="md-note">{RISK_WHY[p.riskLevel] || ''}</p>
          </section>

          <section>
            <h4>Zone details</h4>
            <dl>
              <Row name="Verified reports">{total}</Row>
              <Row name="Radius">{p.radiusKm} km</Row>
              <Row name="Centre">{coords(z)}</Row>
              <Row name="First detected">{fmtDateTime(p.detectedAt)}</Row>
              {p.updatedAt && String(p.updatedAt) !== String(p.detectedAt) && <Row name="Last updated">{fmtDateTime(p.updatedAt)}</Row>}
            </dl>
          </section>

          <section>
            <h4>Reports behind this zone</h4>
            {ids.length === 0 ? (
              <p className="md-muted">The linked reports are not available.</p>
            ) : shown.length === 0 ? (
              <p className="md-muted">None of the {total} reports match the current crop and date filters.</p>
            ) : (
              <>
                <ul className="md-list">
                  {shown.map((r) => (
                    <li key={r.properties.id}>
                      <button onClick={() => onSelect({ type: 'report', id: r.properties.id })}>
                        <span>{label(r.properties.pestName)}</span>
                        <small>{r.properties.severity} · {fmtDate(r.properties.reportedAt)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
                {shown.length < total && <p className="md-muted">{shown.length} of {total} are shown with the current filters.</p>}
              </>
            )}
          </section>

          {actions.length > 0 && (
            <section>
              <h4>Recommended actions</h4>
              <ul className="md-bullets">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <p className="md-muted">Follow the product label and check with your agriculture officer before spraying.</p>
            </section>
          )}
        </div>
      </aside>
    );
  }

  // report
  const rf = reports.find((f) => String(f.properties.id) === String(selected.id));
  if (!rf) return null;
  const p = rf.properties;
  const color = RISK_COLORS[p.severity] || RISK_COLORS.Medium;
  const inZones = zones.filter((z) => (z.properties.reportIds || []).map(String).includes(String(p.id)));
  const hasAi = p.aiPredictedPest !== undefined; // sent to admins only
  const conf = Number.isFinite(p.aiConfidence) ? p.aiConfidence : null;
  const imageUrl = p.image ? `${API_ORIGIN}${p.image}` : '';

  return (
    <aside className="md-panel" role="dialog" aria-label="Report details">
      <header className="md-head">
        <div>
          <h3>{label(p.pestName)}</h3>
          <div className="md-badges">
            <span className="md-badge" style={{ background: color }}>{p.severity} severity</span>
            <span className="md-badge status">Verified</span>
          </div>
        </div>
        <button className="md-x" onClick={onClose} aria-label="Close details">×</button>
      </header>

      <div className="md-body">
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer" title="Open the full image in a new tab">
            <img className="md-photo" src={imageUrl} alt={`${p.crop} photo for this report`} />
          </a>
        )}
        <section>
          <h4>Report details</h4>
          <dl>
            <Row name="Crop">{p.crop}</Row>
            <Row name="Reported">{fmtDate(p.reportedAt)}</Row>
            <Row name="Method">{p.detectionMethod === 'AI-Assisted' ? 'AI-assisted' : 'Picked manually'}</Row>
            <Row name="Location">{coords(rf)}</Row>
            {hasAi && (
              <Row name="AI prediction">
                {p.aiPredictedPest ? nice(p.aiPredictedPest) : 'None'}
                {conf !== null && <span className={`md-conf ${conf < LOW_CONFIDENCE ? 'low' : ''}`}> · {Math.round(conf * 100)}% confident</span>}
              </Row>
            )}
            {hasAi && <Row name="Farmer's note">{p.description?.trim() ? p.description : 'No description'}</Row>}
          </dl>
          <p className="md-note">Farmer details are not shown on the map.</p>
        </section>

        <section>
          <h4>Outbreak zone</h4>
          {inZones.length === 0 ? (
            <p className="md-muted">This report is not part of an active outbreak zone.</p>
          ) : (
            <ul className="md-list">
              {inZones.map((z) => (
                <li key={z.properties.id}>
                  <button onClick={() => onSelect({ type: 'zone', id: z.properties.id })}>
                    <span>{label(z.properties.pestName)} · {z.properties.riskLevel} risk</span>
                    <small>{z.properties.reportCount} reports within {z.properties.radiusKm} km</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
};

export default MapDetailPanel;
