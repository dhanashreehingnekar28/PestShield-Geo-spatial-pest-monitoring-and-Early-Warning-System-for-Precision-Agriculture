import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import './Landing.css';

const Icon = ({ name, size = 20, strokeWidth = 1.8 }) => {
  const icons = {
    'arrow-right': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    'arrow-up-right': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /><path d="M12 10a2 2 0 1 0-4 0c0 2 2 4 2 4s2-2 2-4Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /><path d="M19 3l2 2M5 3 3 5" /></>,
    sprout: <><path d="M12 22v-9" /><path d="M12 13C5 13 4 8 4 4c5 0 9 2 9 8" /><path d="M12 16c0-5 3-8 8-8 0 4-1 9-8 9" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    leaf: <><path d="M20 4c-7 0-13 2-15 8-1 3 1 6 4 6 6 0 9-6 11-14Z" /><path d="M4 21c3-5 7-8 12-11" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    crosshair: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></>,
    activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
};

const features = [
  { icon: 'scan', label: '01 / DETECTION', title: 'AI Pest Detection', text: 'Turn a crop image into actionable insight. Identify pest threats with intelligent image analysis.', detail: 'A clearer picture of crop health' },
  { icon: 'map', label: '02 / INTELLIGENCE', title: 'Geo-spatial Monitoring', text: 'See beyond a single field. Track pest activity and understand outbreak patterns across locations.', detail: 'Local insights. A wider perspective.' },
  { icon: 'bell', label: '03 / PREVENTION', title: 'Early Warnings', text: 'Stay a step ahead of emerging threats with timely alerts that help you act before damage spreads.', detail: 'The right information, at the right time' },
  { icon: 'sprout', label: '04 / MANAGEMENT', title: 'Farm Management', text: 'Bring your fields, crop observations, and pest reports together in one organized workspace.', detail: 'Your whole farm, connected' },
];
const steps = [
  { icon: 'scan', name: 'Detect', text: 'Capture a crop image and spot the first signs of pest activity.' },
  { icon: 'crosshair', name: 'Analyze', text: 'Let AI identify potential threats and turn observations into insights.' },
  { icon: 'map', name: 'Monitor', text: 'Follow geo-spatial patterns and keep an eye on emerging hotspots.' },
  { icon: 'shield', name: 'Protect', text: 'Use early warnings to take informed action and protect your crops.' },
];

const Landing = () => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const targets = document.querySelectorAll('.pestshield .ps-hero-copy, .pestshield .ps-field-target, .pestshield .ps-insight, .pestshield .ps-capability-row > *, .pestshield .ps-section-heading, .pestshield .ps-step, .pestshield .ps-feature-heading, .pestshield .ps-feature, .pestshield .ps-why-photo, .pestshield .ps-why-copy, .pestshield .ps-final-inner');
    targets.forEach((target, index) => {
      target.classList.add('ps-motion-ready');
      target.style.setProperty('--ps-motion-order', index % 4);
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('ps-motion-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ps-motion-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  if (user) return <Navigate to="/dashboard" replace />;

  return <div className="pestshield">
    <header className="ps-header">
      <div className="ps-container ps-header-inner">
        <Link to="/" aria-label="PestShield home"><Brand /></Link>
        <nav className={menuOpen ? 'ps-nav ps-nav-open' : 'ps-nav'} aria-label="Main navigation">
          {[['How it works', '#how-it-works'], ['Features', '#features'], ['Why PestShield', '#why-pestshield']].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        </nav>
        <div className="ps-header-actions">
          <Link className="ps-button ps-button-ghost" to="/login">Login <Icon name="arrow-up-right" size={15} /></Link>
          <Link className="ps-button ps-button-primary ps-nav-cta" to="/register">Get Started <Icon name="arrow-right" /></Link>
          <button type="button" className="ps-button ps-button-ghost ps-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        </div>
      </div>
    </header>

    <main>
      <section className="ps-hero">
        <img className="ps-hero-image" src="/pestshield-fields.jpg" width="1920" height="1024" alt="Lush green farmland with precise crop rows, viewed from above" fetchpriority="high" />
        <div className="ps-hero-shade" />
        <div className="ps-container ps-hero-inner">
          <div className="ps-hero-copy">
            <span className="ps-eyebrow ps-hero-eyebrow"><span className="ps-live-dot" /> INTELLIGENCE ROOTED IN AGRICULTURE</span>
            <h1>Detect Crop Threats<br />Before They <span>Spread.</span></h1>
            <p>Healthier crops start with smarter insights. AI-powered pest detection, geo-spatial monitoring, and early warnings — all in one place.</p>
            <div className="ps-hero-actions"><Link className="ps-button ps-button-primary" to="/register">Get Started <Icon name="arrow-right" /></Link><a className="ps-button ps-button-outline" href="#how-it-works">Discover how it works <Icon name="chevron" /></a></div>
            <div className="ps-hero-trust"><Icon name="shield" size={17} /><span>Early detection. Informed decisions. Resilient farms.</span></div>
          </div>
          <div className="ps-field-target" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span className="ps-radar-ring" key={index} />)}<span className="ps-radar-orbit" /><Icon name="crosshair" size={30} /><small>FIELD INTELLIGENCE</small></div>
          <div className="ps-insight"><div className="ps-insight-icon"><Icon name="leaf" size={22} /></div><div><span className="ps-insight-label">A smarter way to grow</span><strong>Every field. Every early sign.</strong></div><Icon name="activity" size={23} /><span className="ps-demo-label">VISION</span></div>
          <div className="ps-hero-bottom"><span>PRECISION AGRICULTURE, POWERED BY AI</span><a href="#features">Explore PestShield <Icon name="arrow-right" size={16} /></a></div>
        </div>
      </section>

      <section className="ps-capabilities" aria-label="Core capabilities"><div className="ps-container ps-capability-row"><span>One platform.<br /><strong>A healthier harvest.</strong></span><div><Icon name="scan" /> AI-powered detection</div><div><Icon name="map" /> Geo-spatial intelligence</div><div><Icon name="bell" /> Proactive protection</div></div></section>

      <section id="how-it-works" className="ps-section ps-work"><div className="ps-container">
        <div className="ps-section-heading"><span className="ps-eyebrow">FROM INSIGHT TO ACTION</span><h2>Smarter protection. <span>Four simple steps.</span></h2><p>A connected approach to crop health, from the first sign to the bigger picture.</p></div>
        <div className="ps-steps">{steps.map((step, i) => <div className="ps-step" key={step.name}><div className="ps-step-top"><span className="ps-step-icon"><Icon name={step.icon} size={25} strokeWidth={1.6} /></span><span className="ps-step-number">0{i + 1}</span>{i < 3 && <span className="ps-step-arrow"><Icon name="arrow-right" size={20} /></span>}</div><h3>{step.name}</h3><p>{step.text}</p></div>)}</div>
      </div></section>

      <section id="features" className="ps-section ps-features"><div className="ps-container"><div className="ps-feature-heading"><div><span className="ps-eyebrow">BUILT FOR THE FIELD. DESIGNED FOR THE FUTURE.</span><h2>Better insights.<br /><span>Stronger crop protection.</span></h2></div><p>Purpose-built tools that connect artificial intelligence with the realities of your farm.</p></div><div className="ps-feature-grid">{features.map(feature => <article className="ps-feature" key={feature.title}><div className="ps-feature-top"><span className="ps-feature-icon"><Icon name={feature.icon} size={25} strokeWidth={1.6} /></span><span>{feature.label}</span></div><h3>{feature.title}</h3><p>{feature.text}</p><div className="ps-feature-detail"><span>{feature.detail}</span><Icon name="arrow-up-right" size={18} /></div></article>)}</div></div></section>

      <section id="why-pestshield" className="ps-section ps-why"><div className="ps-container ps-why-grid"><div className="ps-why-photo"><img src="/pestshield-fields.jpg" width="1920" height="1024" loading="lazy" alt="Healthy, evenly planted agricultural fields" /><div className="ps-photo-caption"><Icon name="shield" size={24} /><span>Built around what matters.<strong>Your land. Your livelihood.</strong></span></div></div><div className="ps-why-copy"><span className="ps-eyebrow">WHY PESTSHIELD?</span><h2>A little foresight.<br /><span>A lot more protection.</span></h2><p>Pest threats don't stop at field boundaries. Neither should your insights. PestShield connects crop-level detection with location-based intelligence to help you see what's coming.</p><ul><li><span><Icon name="check" size={15} /></span><div><strong>Act earlier, not after the damage</strong><p>Catch warning signs and make proactive decisions.</p></div></li><li><span><Icon name="check" size={15} /></span><div><strong>See your farm in context</strong><p>Understand local activity and the bigger outbreak picture.</p></div></li><li><span><Icon name="check" size={15} /></span><div><strong>Grow with greater confidence</strong><p>Bring clarity to crop protection with connected insights.</p></div></li></ul></div></div></section>

      <section className="ps-final"><div className="ps-container ps-final-inner"><div><span className="ps-eyebrow"><Icon name="sprout" size={17} /> THE FUTURE OF FARMING IS PROACTIVE</span><h2>Protect your crops.<br />Empower your next harvest.</h2><p>Bring a new level of intelligence to your fields with PestShield.</p></div><Link className="ps-button ps-button-primary" to="/register">Get Started with PestShield <Icon name="arrow-right" /></Link></div><span className="ps-final-leaf" aria-hidden="true"><Icon name="leaf" size={260} strokeWidth={0.6} /></span></section>
    </main>

    <footer className="ps-footer"><div className="ps-container"><div className="ps-footer-top"><div><Link to="/" aria-label="PestShield home"><Brand /></Link><p>Smarter insights. Healthier fields. A resilient future.</p></div><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#why-pestshield">Why PestShield</a></nav></div><div className="ps-footer-bottom"><span>© 2026 PestShield. All rights reserved.</span><span><Icon name="leaf" size={14} /> Cultivating intelligence. Protecting agriculture.</span></div></div></footer>
  </div>;
};

export default Landing;
