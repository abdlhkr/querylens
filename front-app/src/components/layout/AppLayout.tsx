import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Database, Terminal, Settings, LogOut, ChevronRight } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useUserStore } from '../../store/userStore';
import { LanguageToggle } from '../ui/LanguageToggle';
import './AppLayout.css';

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, clearProfile } = useUserStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearProfile();
      navigate('/auth/login');
    }
  };

  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/app/databases', icon: Database, label: t('nav.databases') },
    { to: '/app/query', icon: Terminal, label: t('nav.query') },
    { to: '/app/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Database size={14} />
            </div>
            <span className="logo-text">Query<em>Lens</em></span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {profile?.firstName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{profile?.firstName} {profile?.lastName}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <LanguageToggle />
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title={t('nav.logout')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
