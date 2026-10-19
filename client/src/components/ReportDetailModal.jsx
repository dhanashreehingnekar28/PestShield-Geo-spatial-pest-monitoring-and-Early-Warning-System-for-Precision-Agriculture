import ReportLocationMap from './ReportLocationMap';
import { useEffect, useRef, useState } from 'react';
import './ReportDetailModal.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const LOW_CONFIDENCE = 0.6; // same threshold the dashboard already uses

const label = (name) => (name || '').replace(/_/g, ' ');
// The AI names its classes with the crop in front (GROUNDNUT_RUST), the pest library does not (Rust)
const bare = (name) => label(name).trim().toLowerCase().replace(/^(groundnut|potato|chilli|chili)\s+/, '');
const same = (a, b) => bare(a) === bare(b);
const nice = (name) => bare(name).replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDate = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const hasCoords = (r) => Number.isFinite(Number(r.latitude)) && r.latitude !== null && r.latitude !== '' && Number.isFinite(Number(r.longitude)) && r.longitude !== null && r.longitude !== '';

const Row = ({ name, children }) => (
  <div className="rd-row"><dt>{name}</dt><dd>{children}</dd></div>
);

// report: one item from GET /pest-reports
// onReview(report, 'Verified' | 'Rejected') -> { ok } | { ok: false, message } | { cancelled: true }
const ReportDetailModal = ({
  report: r,
  reports = [],
  onClose,
  onReview
}) => {
  const closeRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, busy]);

  const selectedPest = r.pest?.pestName || '';
  const aiPest = r.aiPredictedPest || '';
  const title = label(selectedPest || aiPest) || 'Pest not identified';
  const hasAi = r.detectionMethod === 'AI-Assisted' || !!aiPest;
  const conf = Number.isFinite(r.aiConfidence) ? r.aiConfidence : null;
  const lowConf = conf !== null && conf < LOW_CONFIDENCE;
  const farm = r.farm && typeof r.farm === 'object' ? r.farm : null;
  const cropMismatch = farm?.cropType && r.crop && farm.cropType !== r.crop;
  const located = hasCoords(r);
  const imageUrl = r.image ? `${API_ORIGIN}${r.image}` : '';

  const act = async (status) => {
    setBusy(true);
    setError('');
    try {
      const res = await onReview(r, status);
      if (res?.ok) onClose();
      else if (res && !res.cancelled) setError(res.message || 'Could not update the report');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update the report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rd-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="rd-modal" role="dialog" aria-modal="true" aria-labelledby="rd-title">
        <header className="rd-head">
          <div>
            <h2 id="rd-title">{title}</h2>
            <p className="rd-sub">{r.crop || 'Crop not set'} · Report from {fmtDate(r.createdAt) || 'unknown date'}</p>
          </div>
          <div className="rd-head-right">
            <span className={`rd-status st-${r.status}`}>{r.status}</span>
            <button ref={closeRef} className="rd-x" onClick={onClose} disabled={busy} aria-label="Close details">×</button>
          </div>
        </header>

        <div className="rd-body">
          <div className="rd-photo">
            {imageUrl && !imgFailed ? (
              <a href={imageUrl} target="_blank" rel="noreferrer" title="Open the full image in a new tab">
                <img src={imageUrl} alt={`${r.crop || 'Crop'} photo submitted by the farmer`} onError={() => setImgFailed(true)} />
              </a>
            ) : (
              <div className="rd-noimg">{imageUrl ? 'The image could not be loaded.' : 'No image was attached to this report.'}</div>
            )}
          </div>

          <section className="rd-section">
            <h3>Pest identification</h3>
            <dl>
              <Row name="Farmer selected">{selectedPest ? label(selectedPest) : 'No pest selected'}</Row>
              <Row name="AI prediction">
                {hasAi && aiPest ? (
                  <>
                    {nice(aiPest)}
                    {conf !== null && (
                      <span className={`rd-conf ${lowConf ? 'low' : ''}`}>
                        <span className="rd-conf-bar"><span style={{ width: `${Math.round(conf * 100)}%` }} /></span>
                        {Math.round(conf * 100)}% confident
                      </span>
                    )}
                  </>
                ) : (
                  'No AI prediction on this report'
                )}
              </Row>
              <Row name="Method">{r.detectionMethod === 'AI-Assisted' ? 'AI-assisted' : 'Picked manually'}</Row>
            </dl>
            {lowConf && <p className="rd-note warn">The AI is not very sure about this one. Check the photo carefully before verifying.</p>}
            {selectedPest && aiPest && !same(selectedPest, aiPest) && (
              <p className="rd-note warn">The farmer's choice ({label(selectedPest)}) is different from the AI prediction ({nice(aiPest)}).</p>
            )}
            {selectedPest && aiPest && same(selectedPest, aiPest) && (
              <p className="rd-note ok">The farmer's choice matches the AI prediction.</p>
            )}
          </section>

          <section className="rd-section">
            <h3>Report details</h3>
            <dl>
              <Row name="Crop">{r.crop || 'Not set'}</Row>
              <Row name="Severity">{r.severity || 'Not set'}</Row>
              <Row name="Submitted">{fmtDate(r.createdAt) || 'Unknown'}</Row>
              {r.status !== 'Pending' && <Row name="Last updated">{fmtDate(r.updatedAt) || 'Unknown'}</Row>}
              <Row name="Description">{r.description?.trim() ? r.description : 'The farmer did not add a description.'}</Row>
            </dl>
          </section>

          <section className="rd-section">
            <h3>Farmer and farm</h3>
            <dl>
              <Row name="Farmer">{r.farmer?.name ? `${r.farmer.name}${r.farmer.email ? ` (${r.farmer.email})` : ''}` : 'Deleted user'}</Row>
              <Row name="Farm">{farm?.farmName || 'Farm not available (it may have been deleted)'}</Row>
              {farm?.cropType && <Row name="Farm crop">{farm.cropType}</Row>}
              {farm?.location?.district && <Row name="District">{farm.location.district}</Row>}
            </dl>
            {cropMismatch && <p className="rd-note warn">This report is for {r.crop}, but the farm is registered for {farm.cropType}.</p>}
          </section>

          <section className="rd-section">
            <h3>Location</h3>

            {located ? (
              <>
                <p className="rd-loc">
                  <strong>Coordinates:</strong>{' '}
                  {Number(r.latitude).toFixed(5)},{' '}
                  {Number(r.longitude).toFixed(5)}
                </p>

                <ReportLocationMap
                  report={r}
                  reports={reports}
                />

                <p style={{ marginTop: '10px' }}>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=15/${r.latitude}/${r.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in OpenStreetMap ↗
                  </a>
                </p>
              </>
            ) : (
              <p className="rd-note warn">
                No location was attached, so this report will not
                appear on the outbreak map or count towards an
                outbreak alert.
              </p>
            )}
          </section>
        </div>

        <footer className="rd-foot">
          {error && <p className="rd-err" role="alert">{error}</p>}
          {r.status === 'Pending' ? (
            <div className="rd-actions">
              <button className="rd-btn" onClick={onClose} disabled={busy}>Close</button>
              <button className="rd-btn no" onClick={() => act('Rejected')} disabled={busy}>Reject</button>
              <button className="rd-btn ok" onClick={() => act('Verified')} disabled={busy}>{busy ? 'Saving…' : 'Verify'}</button>
            </div>
          ) : (
            <div className="rd-actions">
              <span className="rd-done">This report has already been {r.status.toLowerCase()}.</span>
              <button className="rd-btn" onClick={onClose}>Close</button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ReportDetailModal;
