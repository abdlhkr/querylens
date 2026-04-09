import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { Database, Terminal, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useUserStore();

  const stats = [
    { icon: Database, label: t('app.total_databases'), value: '—', color: 'purple' },
    { icon: Activity, label: t('app.active_connections'), value: '—', color: 'green' },
    { icon: Zap, label: t('app.queries_today'), value: '—', color: 'blue' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          {t('nav.dashboard')}
        </h1>
        {profile && (
          <p className="page-subtitle">
            {profile.firstName} {profile.lastName}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="dash-stats grid-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`stat-card card color-${color}`}>
            <div className={`stat-icon-wrap color-bg-${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="stat-label">{label}</p>
              <p className="stat-value">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid-2" style={{ gap: '16px' }}>
        <div className="quick-action-card">
          <h3 className="quick-action-title">{t('app.quick_query')}</h3>
          <p className="quick-action-desc">{t('nav.query')}</p>
          <Link to="/app/query" className="btn btn-primary btn-sm">
            <Terminal size={14} /> {t('app.natural_language')}
          </Link>
        </div>

        <div className="quick-action-card">
          <h3 className="quick-action-title">{t('nav.databases')}</h3>
          <p className="quick-action-desc">{t('app.add_database')}</p>
          <Link to="/app/databases" className="btn btn-secondary btn-sm">
            <Database size={14} /> {t('app.add_database')}
          </Link>
        </div>
      </div>
    </div>
  );
}
