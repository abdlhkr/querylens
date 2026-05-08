import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import toast from 'react-hot-toast';
import './Auth.css';

type VerifyType = 'login' | 'register';

export default function VerifyCode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { email: string; type: VerifyType } | null;
  const email = state?.email ?? '';
  const type = state?.type ?? 'login';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) { navigate('/auth/login'); return; }
    inputs.current[0]?.focus();
  }, [email, navigate]);

  const handleChange = (idx: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.some(d => !d)) {
      toast.error(t('errors.code_incomplete'));
      return;
    }
    const code = parseInt(digits.join(''), 10);
    setLoading(true);
    try {
      if (type === 'register') {
        await authApi.verifyRegister({ email, code });
      } else {
        await authApi.verifyLogin({ email, code });
      }
      const { usersApi } = await import('../../api/users');
      try {
        await usersApi.getMe();
        navigate('/app');
      } catch (err: any) {
        if (err?.response?.status === 404) navigate('/onboarding');
        else navigate('/app');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('errors.server_error'));
    } finally {
      setLoading(false);
    }
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

        <h1 className="auth-title">{t('auth.verify_title')}</h1>
        <p className="auth-subtitle">{t('auth.verify_hint', { email })}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="otp-group">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-input${d ? ' otp-filled' : ''}`}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary w-full btn-lg ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {!loading && t('auth.verify_btn')}
          </button>
        </form>

        <p className="auth-switch">
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
            onClick={() => navigate(-1)}
          >
            {t('common.back')}
          </button>
        </p>
      </div>
    </div>
  );
}
