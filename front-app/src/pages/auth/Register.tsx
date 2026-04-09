import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authApi } from '../../api/auth';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = t('errors.required');
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('errors.invalid_email');
    if (!form.password) e.password = t('errors.required');
    else if (form.password.length < 8) e.password = t('errors.password_min');
    if (form.password !== form.confirmPassword) e.confirmPassword = t('errors.password_mismatch');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authApi.register({ email: form.email, password: form.password });
      navigate('/onboarding');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('errors.server_error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card">
        <div className="auth-lang">
          <LanguageToggle />
        </div>

        <div className="auth-logo">
          <span className="ql-logo">Query<em>Lens</em></span>
        </div>
        <p className="auth-eyebrow">Query Intelligence Platform</p>

        <h1 className="auth-title">{t('auth.register')}</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">{t('auth.email')}</label>
            <div className="input-icon-wrap">
              <Mail size={15} className="input-icon" />
              <input
                id="reg-email"
                type="email"
                className={`input input-iconed ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">{t('auth.password')}</label>
            <div className="input-icon-wrap">
              <Lock size={15} className="input-icon" />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className={`input input-iconed input-iconed-right ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <button type="button" className="input-icon-right" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">{t('auth.confirm_password')}</label>
            <div className="input-icon-wrap">
              <Lock size={15} className="input-icon" />
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`input input-iconed input-iconed-right ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                autoComplete="new-password"
              />
              <button type="button" className="input-icon-right" onClick={() => setShowConfirm(p => !p)}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
          </div>

          <button
            id="reg-submit"
            type="submit"
            className={`btn btn-primary w-full btn-lg ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {!loading && t('auth.register')}
          </button>
        </form>

        <div className="divider">veya / or</div>

        <a
          href={authApi.getGoogleAuthUrl()}
          className="btn btn-secondary w-full google-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.google')}
        </a>

        <p className="auth-switch">
          {t('auth.has_account')}{' '}
          <Link to="/auth/login" className="auth-link">{t('auth.sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}
