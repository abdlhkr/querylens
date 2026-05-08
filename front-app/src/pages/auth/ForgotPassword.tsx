import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/auth';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [passwords, setPasswords] = useState({ newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: t('errors.invalid_email') });
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep(2);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (digits.some(d => !d)) errs.code = t('errors.code_incomplete');
    if (!passwords.newPassword) errs.newPassword = t('errors.required');
    else if (passwords.newPassword.length < 8) errs.newPassword = t('errors.password_min');
    if (passwords.newPassword !== passwords.confirm) errs.confirm = t('errors.password_mismatch');
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const code = parseInt(digits.join(''), 10);
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, passwords.newPassword);
      toast.success(t('auth.reset_success'));
      navigate('/auth/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (idx: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent) => {
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

        {step === 1 ? (
          <>
            <h1 className="auth-title">{t('auth.forgot_title')}</h1>
            <p className="auth-subtitle">{t('auth.forgot_hint')}</p>

            <form onSubmit={handleSendCode} className="auth-form">
              <div className="input-group">
                <label className="input-label">{t('auth.email')}</label>
                <div className="input-icon-wrap">
                  <Mail size={15} className="input-icon" />
                  <input
                    type="email"
                    className={`input input-iconed ${errors.email ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors({}); }}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full btn-lg ${loading ? 'btn-loading' : ''}`}
                disabled={loading}
              >
                {!loading && t('auth.send_code')}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">{t('auth.reset_title')}</h1>
            <p className="auth-subtitle">{t('auth.verify_hint', { email })}</p>

            <form onSubmit={handleReset} className="auth-form">
              <div className="input-group">
                <label className="input-label">{t('auth.verification_code')}</label>
                <div className="otp-group">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`otp-input${d ? ' otp-filled' : ''}${errors.code ? ' otp-error' : ''}`}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      autoComplete="off"
                    />
                  ))}
                </div>
                {errors.code && <p className="field-error">{errors.code}</p>}
              </div>

              <div className="input-group">
                <label className="input-label">{t('auth.new_password')}</label>
                <div className="input-icon-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`input input-iconed input-iconed-right ${errors.newPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={passwords.newPassword}
                    onChange={e => { setPasswords(p => ({ ...p, newPassword: e.target.value })); setErrors(p => ({ ...p, newPassword: '' })); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="input-icon-right" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.newPassword && <p className="field-error">{errors.newPassword}</p>}
              </div>

              <div className="input-group">
                <label className="input-label">{t('auth.confirm_password')}</label>
                <div className="input-icon-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`input input-iconed input-iconed-right ${errors.confirm ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={passwords.confirm}
                    onChange={e => { setPasswords(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="input-icon-right" onClick={() => setShowConfirm(p => !p)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirm && <p className="field-error">{errors.confirm}</p>}
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full btn-lg ${loading ? 'btn-loading' : ''}`}
                disabled={loading}
              >
                {!loading && t('auth.reset_btn')}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          <Link to="/auth/login" className="auth-link">{t('common.back')}</Link>
        </p>
      </div>
    </div>
  );
}
