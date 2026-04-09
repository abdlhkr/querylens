import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  const toggle = () => {
    const next = current === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(next);
  };

  return (
    <button onClick={toggle} className="lang-toggle btn btn-ghost btn-sm" title="Change language">
      <span className={current === 'tr' ? 'lang-active' : ''}>TR</span>
      <span className="lang-sep">|</span>
      <span className={current === 'en' ? 'lang-active' : ''}>EN</span>
      <style>{`
        .lang-toggle { gap: 4px; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; color: var(--text-muted); font-family: var(--font-mono); }
        .lang-toggle:hover { color: var(--text-body); background: transparent; }
        .lang-active { color: var(--gold); }
        .lang-sep { color: var(--border-mid); }
      `}</style>
    </button>
  );
}
