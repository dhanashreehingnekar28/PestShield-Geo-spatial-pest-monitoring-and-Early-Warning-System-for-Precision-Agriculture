import { useEffect, useRef } from 'react';
import { getPestKnowledge } from '../data/pestKnowledge';

// symptoms/treatment may be stored as text or as a list; show either as plain text
const toText = (v) => (Array.isArray(v) ? v.join('\n') : v || '');
const label = (name) => (name || '').replace(/_/g, ' ');
const isBlank = (t) => !t || /^(n\/a|na|none|-)$/i.test(t.trim());

const List = ({ items }) => (
  <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
);

const Section = ({ title, children }) => (
  <section className="pd-section">
    <h3>{title}</h3>
    {children}
  </section>
);

const PestDetailModal = ({ pest, onClose }) => {
  const closeRef = useRef(null);
  const k = getPestKnowledge(pest);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const desc = toText(pest.description);
  const symptoms = toText(pest.symptoms);
  const treatment = toText(pest.treatment);
  const hasLibraryText = !isBlank(desc) || !isBlank(symptoms) || !isBlank(treatment);

  return (
    <div className="ap-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pd-modal" role="dialog" aria-modal="true" aria-labelledby="pd-title">
        <header className="pd-head">
          <div>
            <h2 id="pd-title">{label(pest.pestName)}</h2>
            <p className="pd-sub">
              <span className={`pd-crop crop-${pest.crop}`}>{pest.crop}</span>
              {k?.cause && <span> · {k.cause}</span>}
            </p>
          </div>
          <button ref={closeRef} className="pd-x" onClick={onClose} aria-label="Close details">×</button>
        </header>

        <div className="pd-body">
          {!k && !hasLibraryText && (
            <p className="pd-empty">No detailed information has been added for this pest yet. Use Edit to add a description, symptoms and treatment.</p>
          )}

          {hasLibraryText && (
            <Section title="Library notes">
              {!isBlank(desc) && <p><strong>About:</strong> {desc}</p>}
              {!isBlank(symptoms) && <p><strong>Symptoms:</strong> {symptoms}</p>}
              {!isBlank(treatment) && <p><strong>Treatment:</strong> {treatment}</p>}
            </Section>
          )}

          {k && (
            <>
              <Section title="Symptoms">
                <h4>Early signs</h4>
                <List items={k.early} />
                <h4>Advanced signs</h4>
                <List items={k.advanced} />
              </Section>
              <Section title="How to identify it"><List items={k.identify} /></Section>
              <Section title="Immediate steps"><List items={k.immediate} /></Section>
              <Section title="Treatment options"><List items={k.treatment} /></Section>
              <Section title="Prevention"><List items={k.prevention} /></Section>
              {k.precautions.length > 0 && (
                <Section title="Application precautions"><List items={k.precautions} /></Section>
              )}
              <p className="pd-note">Doses are indicative. Always follow the product label and check with your local agriculture officer before spraying.</p>
            </>
          )}

          {!k && hasLibraryText && (
            <p className="pd-note">Only the library notes are available for this pest. Early and advanced signs, prevention and precautions have not been added yet.</p>
          )}
        </div>

        <footer className="pd-foot">
          <button className="ap-primary" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
};

export default PestDetailModal;
