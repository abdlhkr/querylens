import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import './Landing.css';

const LANGUAGES = [
  'Türkçe', 'English', 'Deutsch', 'Français', 'Español', 'العربية',
  '日本語', '한국어', 'Português', 'Italiano', 'Русский', '中文',
  'Polski', 'Nederlands', 'Čeština', 'Svenska',
];

export default function Landing() {
  const { t } = useTranslation();
  const [yearly, setYearly] = useState(false);

  // Scroll reveal
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const reveal = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const features = [
    { num: '01', title: t('landing.f1_title'), desc: t('landing.f1_desc') },
    { num: '02', title: t('landing.f2_title'), desc: t('landing.f2_desc') },
    { num: '03', title: t('landing.f3_title'), desc: t('landing.f3_desc') },
    { num: '04', title: t('landing.f4_title'), desc: t('landing.f4_desc') },
    { num: '05', title: t('landing.f5_title'), desc: t('landing.f5_desc') },
    { num: '06', title: t('landing.f6_title'), desc: t('landing.f6_desc') },
  ];

  const steps = [
    { idx: 'STEP 01', title: t('landing.step1_title'), desc: t('landing.step1_desc') },
    { idx: 'STEP 02', title: t('landing.step2_title'), desc: t('landing.step2_desc') },
    { idx: 'STEP 03', title: t('landing.step3_title'), desc: t('landing.step3_desc') },
    { idx: 'STEP 04', title: t('landing.step4_title'), desc: t('landing.step4_desc') },
  ];

  const securityPoints = [
    { title: t('landing.sec1_title'), desc: t('landing.sec1_desc') },
    { title: t('landing.sec2_title'), desc: t('landing.sec2_desc') },
    { title: t('landing.sec3_title'), desc: t('landing.sec3_desc') },
    { title: t('landing.sec4_title'), desc: t('landing.sec4_desc') },
  ];

  const proFeatures = [
    t('pricing.pro_users'),
    t('pricing.pro_db'),
    t('pricing.pro_lang'),
    t('pricing.pro_charts'),
    t('pricing.pro_perms'),
    t('pricing.pro_support'),
  ];

  const entFeatures = [
    t('pricing.ent_users'),
    t('pricing.ent_db'),
    t('pricing.ent_lang'),
    t('pricing.ent_dash'),
    t('pricing.ent_perms'),
    t('pricing.ent_audit'),
    t('pricing.ent_support'),
    t('pricing.ent_onboard'),
  ];

  return (
    <div className="landing">
      {/* ─ NAV ─ */}
      <nav className="landing-nav">
        <a href="#" className="ql-logo">
          Query<em>Lens</em>
        </a>
        <div className="nav-links">
          <a href="#features" className="nav-link">
            {t('landing.features_eyebrow')}
          </a>
          <a href="#security" className="nav-link">
            {t('landing.security_eyebrow')}
          </a>
          <a href="#pricing" className="nav-link">
            {t('landing.pricing_eyebrow')}
          </a>
        </div>
        <div className="nav-right">
          <LanguageToggle />
          <Link to="/auth/login" className="nav-link">
            {t('landing.hero_login')}
          </Link>
          <Link to="/auth/register" className="nav-cta">
            {t('landing.hero_cta')}
          </Link>
        </div>
      </nav>

      {/* ─ HERO ─ */}
      <section className="hero-section">
        <div className="hero-text">
          <div className="hero-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">{t('landing.hero_eyebrow')}</span>
          </div>
          <h1 className="hero-title">
            {t('landing.hero_title').split('\n').map((line, i) => {
              const highlight = t('landing.hero_title_highlight');
              if (line.trim() === highlight.trim()) {
                return (
                  <span key={i}>
                    <span className="gold">{line}</span>
                    <br />
                  </span>
                );
              }
              return (
                <span key={i}>
                  {line}
                  <br />
                </span>
              );
            })}
          </h1>
          <p className="hero-lead">{t('landing.hero_subtitle')}</p>
          <div className="hero-actions">
            <Link to="/auth/register" className="lbtn-primary">
              {t('landing.hero_cta')}
            </Link>
            <a href="#how" className="lbtn-outline">
              {t('landing.hero_secondary')}
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="terminal-card">
            <div className="tc-bar">
              <div className="tc-dot r" />
              <div className="tc-dot y" />
              <div className="tc-dot g" />
              <span className="tc-label">{t('landing.demo_label')}</span>
            </div>
            <div className="tc-body">
              <div className="tc-row">
                <span className="tc-tag">you</span>
                <span className="tc-user">{t('landing.demo_user_q')}</span>
              </div>
              <div className="tc-row">
                <span className="tc-tag">───</span>
                <span className="tc-divider">─────────────────────────────────────────</span>
              </div>
              <div className="tc-row">
                <span className="tc-tag">sql</span>
                <span className="tc-sql">{t('landing.demo_sql1')}</span>
              </div>
              <div className="tc-row" style={{ paddingLeft: 60 }}>
                <span className="tc-sql">{t('landing.demo_sql2')}</span>
              </div>
              <div className="tc-row">
                <span className="tc-tag">───</span>
                <span className="tc-divider">─────────────────────────────────────────</span>
              </div>
              <div className="tc-row">
                <span className="tc-tag">ans</span>
                <span className="tc-result">{t('landing.demo_result')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ LANGUAGE STRIP ─ */}
      <div className="lang-strip">
        <div className="lang-track">
          {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
            <span key={i} className="lang-item">
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* ─ FEATURES ─ */}
      <section className="ql-section" id="features">
        <div ref={reveal} className="ql-reveal">
          <div className="section-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">{t('landing.features_eyebrow')}</span>
          </div>
          <h2 className="ql-section-title">{t('landing.features_title')}</h2>
          <p className="section-lead">{t('landing.features_lead')}</p>
        </div>

        <div ref={reveal} className="features-grid ql-reveal">
          {features.map((f) => (
            <div key={f.num} className="ql-feature-card">
              <div className="feature-num">{f.num}</div>
              <div className="ql-feature-title">{f.title}</div>
              <p className="ql-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─ HOW IT WORKS ─ */}
      <div className="how-section" id="how">
        <section className="how-inner">
          <div ref={reveal} className="ql-reveal">
            <div className="section-eyebrow">
              <div className="eyebrow-line" />
              <span className="eyebrow-text">{t('landing.how_eyebrow')}</span>
            </div>
            <h2 className="ql-section-title">{t('landing.how_title')}</h2>
          </div>

          <div ref={reveal} className="steps-grid ql-reveal">
            {steps.map((s) => (
              <div key={s.idx} className="step-card">
                <div className="step-index">{s.idx}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div ref={reveal} className="docker-snippet ql-reveal">
            <span>$</span>
            <code>docker run -d -p 8080:8080 querylens/app:latest</code>
          </div>
        </section>
      </div>

      {/* ─ SECURITY ─ */}
      <div className="security-section" id="security">
        <section className="security-inner">
          <div ref={reveal} className="ql-reveal">
            <div className="section-eyebrow">
              <div className="eyebrow-line" />
              <span className="eyebrow-text">{t('landing.security_eyebrow')}</span>
            </div>
            <h2 className="ql-section-title">{t('landing.security_title')}</h2>
            <p className="section-lead">{t('landing.security_lead')}</p>

            <div className="security-points">
              {securityPoints.map((sp, i) => (
                <div key={i} className="security-point">
                  <div className="sp-icon">◈</div>
                  <div>
                    <div className="sp-title">{sp.title}</div>
                    <p className="sp-desc">{sp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={reveal} className="ql-reveal">
            <div className="security-stat-block">
              <div className="stat-num">0</div>
              <div className="stat-label">{t('landing.stat_label')}</div>
              <div className="stat-divider" />
              <div className="stat-note">{t('landing.stat_note')}</div>
            </div>
          </div>
        </section>
      </div>

      {/* ─ DB PERMISSIONS ─ */}
      <section className="db-section">
        <div ref={reveal} className="ql-reveal">
          <div className="section-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">{t('landing.db_eyebrow')}</span>
          </div>
          <h2 className="ql-section-title">{t('landing.db_title')}</h2>
          <p className="section-lead">{t('landing.db_lead')}</p>
          <p className="section-lead" style={{ marginTop: 16 }}>
            {t('landing.db_lead2')}
          </p>
        </div>

        <div ref={reveal} className="db-visual ql-reveal">
          <div className="db-visual-header">DATABASE USERS · ACCESS LEVELS</div>
          <div className="db-visual-body">
            <div className="db-user-row">
              <span className="db-user-name">finance_user</span>
              <span className="db-user-perm perm-read">SELECT only</span>
            </div>
            <div className="db-user-row">
              <span className="db-user-name">operations_manager</span>
              <span className="db-user-perm perm-write">SELECT + INSERT</span>
            </div>
            <div className="db-user-row">
              <span className="db-user-name">reporting_analyst</span>
              <span className="db-user-perm perm-read">SELECT only</span>
            </div>
            <div className="db-user-row">
              <span className="db-user-name">db_admin</span>
              <span className="db-user-perm perm-admin">Full access</span>
            </div>
            <div className="db-note">{t('landing.db_note')}</div>
          </div>
        </div>
      </section>

      {/* ─ PRICING ─ */}
      <div className="pricing-section" id="pricing">
        <section className="pricing-inner">
          <div ref={reveal} className="ql-reveal">
            <div className="section-eyebrow">
              <div className="eyebrow-line" />
              <span className="eyebrow-text">{t('landing.pricing_eyebrow')}</span>
            </div>
            <h2 className="ql-section-title">{t('landing.pricing_title')}</h2>
            <p className="section-lead">{t('landing.pricing_lead')}</p>
          </div>

          <div ref={reveal} className="ql-billing-toggle ql-reveal">
            <span className={`toggle-label ${!yearly ? 'active' : ''}`}>
              {t('landing.pricing_monthly')}
            </span>
            <div
              className={`toggle-switch ${yearly ? 'yearly' : ''}`}
              onClick={() => setYearly(!yearly)}
            >
              <div className="toggle-knob" />
            </div>
            <span className={`toggle-label ${yearly ? 'active' : ''}`}>
              {t('landing.pricing_yearly')}
            </span>
            <span className="save-badge">{t('landing.pricing_yearly_badge')}</span>
          </div>

          <div ref={reveal} className="plans-grid ql-reveal">
            {/* Professional */}
            <div className="plan-card">
              <div className="plan-name">{t('landing.pro_name')}</div>
              <div className="plan-tagline">{t('landing.pro_tagline')}</div>
              <div className="plan-price-wrap">
                <div className="plan-price">
                  <sup>$</sup>
                  {yearly ? '119' : '149'}
                </div>
              </div>
              <div className="plan-price-note">
                {yearly
                  ? `per month · billed annually ($1,428/yr)`
                  : 'per month · billed monthly'}
              </div>
              <div className="plan-divider" />
              <ul className="plan-features">
                {proFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <Link to="/auth/register" className="plan-btn ghost">
                {t('pricing.pro_cta')}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="plan-card featured">
              <div className="plan-tag">RECOMMENDED</div>
              <div className="plan-name">{t('landing.ent_name')}</div>
              <div className="plan-tagline">{t('landing.ent_tagline')}</div>
              <div className="plan-price-wrap">
                <div className="plan-price">
                  <sup>$</sup>
                  {yearly ? '279' : '349'}
                </div>
              </div>
              <div className="plan-price-note">
                {yearly
                  ? `per month · billed annually ($3,348/yr)`
                  : 'per month · billed monthly'}
              </div>
              <div className="plan-divider" />
              <ul className="plan-features">
                {entFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <Link to="/auth/register" className="plan-btn solid">
                {t('pricing.ent_cta')}
              </Link>
            </div>
          </div>

          <p ref={reveal} className="pricing-footnote ql-reveal">
            {t('landing.pricing_footnote')}
          </p>
        </section>
      </div>

      {/* ─ FINAL CTA ─ */}
      <section className="final-cta">
        <h2 ref={reveal} className="ql-reveal">
          {t('landing.cta_title')}
        </h2>
        <p ref={reveal} className="ql-reveal">
          {t('landing.cta_lead')}
        </p>
        <div ref={reveal} className="ql-reveal">
          <Link
            to="/auth/register"
            className="lbtn-primary"
            style={{ fontSize: 15, padding: '16px 40px' }}
          >
            {t('landing.cta_btn')}
          </Link>
        </div>
      </section>

      {/* ─ FOOTER ─ */}
      <footer className="landing-footer">
        <a href="#" className="ql-logo">
          Query<em>Lens</em>
        </a>
        <div className="footer-links">
          <a href="#">{t('landing.footer_docs')}</a>
          <a href="#">{t('landing.footer_privacy')}</a>
          <a href="#">{t('landing.footer_security')}</a>
          <a href="#">{t('landing.footer_contact')}</a>
        </div>
        <div className="footer-copy">© 2026 QueryLens. {t('landing.footer_rights')}</div>
      </footer>
    </div>
  );
}
