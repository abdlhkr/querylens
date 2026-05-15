import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { usersApi } from '../../api/users';
import { authApi } from '../../api/auth';
import type { Gender, CreateUserRequest, AccountStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { User, Trash2, X, Shield, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import './Settings.css';

const GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

export default function Settings() {
  const { t } = useTranslation();
  const { profile, setProfile, clearProfile } = useUserStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateUserRequest>({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    age: profile?.age ?? 18,
    gender: profile?.gender ?? 'MALE',
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'send' | 'verify'>('send');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Account status
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);

  // Set Password modal
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [setPasswordStep, setSetPasswordStep] = useState<'send' | 'confirm'>('send');
  const [setPasswordForm, setSetPasswordForm] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);

  // Change Email modal
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [changeEmailStep, setChangeEmailStep] = useState<'send' | 'confirm'>('send');
  const [changeEmailForm, setChangeEmailForm] = useState({ code: '', newEmail: '' });
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);

  useEffect(() => {
    authApi.getAccountStatus()
      .then(res => setAccountStatus(res.data))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersApi.updateUser(form);
      if (res.data.data) setProfile(res.data.data);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteStep('send');
    setDeleteCode('');
    setShowDeleteModal(true);
  };

  const handleSendDeleteCode = async () => {
    setDeleting(true);
    try {
      await authApi.sendDeleteAccountCode();
      toast.success(t('app.code_sent'));
      setDeleteStep('verify');
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await authApi.deleteAccount(Number(deleteCode));
      clearProfile();
      navigate('/auth/login');
    } catch {
      toast.error(t('errors.server_error'));
      setDeleting(false);
    }
  };

  // ─── Set Password ───────────────────────────────────────────────────────────

  const openSetPasswordModal = async () => {
    setSetPasswordStep('send');
    setSetPasswordForm({ code: '', newPassword: '', confirmPassword: '' });
    setShowSetPasswordModal(true);
  };

  const handleSendSetPasswordCode = async () => {
    setSetPasswordLoading(true);
    try {
      await authApi.sendSetPasswordCode();
      toast.success(t('app.code_sent'));
      setSetPasswordStep('confirm');
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleConfirmSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPasswordForm.newPassword !== setPasswordForm.confirmPassword) {
      toast.error(t('app.password_mismatch'));
      return;
    }
    setSetPasswordLoading(true);
    try {
      await authApi.setPassword(setPasswordForm);
      toast.success(t('common.success'));
      setAccountStatus(prev => prev ? { ...prev, passwordSet: true } : prev);
      setShowSetPasswordModal(false);
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setSetPasswordLoading(false);
    }
  };

  // ─── Change Email ───────────────────────────────────────────────────────────

  const openChangeEmailModal = () => {
    setChangeEmailStep('send');
    setChangeEmailForm({ code: '', newEmail: '' });
    setShowChangeEmailModal(true);
  };

  const handleSendChangeEmailCode = async () => {
    setChangeEmailLoading(true);
    try {
      await authApi.sendChangeEmailCode();
      toast.success(t('app.code_sent'));
      setChangeEmailStep('confirm');
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setChangeEmailLoading(false);
    }
  };

  const handleConfirmChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeEmailLoading(true);
    try {
      await authApi.changeEmail(changeEmailForm);
      toast.success(t('common.success'));
      setAccountStatus(prev => prev ? { ...prev, email: changeEmailForm.newEmail } : prev);
      setShowChangeEmailModal(false);
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setChangeEmailLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('nav.settings')}</h1>
      </div>

      <div className="settings-layout">
        {/* Profile Card */}
        <div className="card">
          <div className="settings-section-header">
            <User size={18} />
            <h2 className="settings-section-title">{t('app.update_profile')}</h2>
          </div>

          <form onSubmit={handleSave} className="settings-form">
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('onboarding.first_name')} *</label>
                <input
                  className="input"
                  required
                  value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">{t('onboarding.last_name')} *</label>
                <input
                  className="input"
                  required
                  value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('onboarding.age')} *</label>
                <input
                  className="input"
                  type="number"
                  required
                  min={0}
                  max={150}
                  value={form.age}
                  onChange={e => setForm(p => ({ ...p, age: +e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">{t('onboarding.gender')} *</label>
                <select
                  className="input select"
                  value={form.gender}
                  onChange={e => setForm(p => ({ ...p, gender: e.target.value as Gender }))}
                >
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${saving ? 'btn-loading' : ''}`}
              disabled={saving}
            >
              {!saving && t('app.update_profile')}
            </button>
          </form>
        </div>

        {/* Security Card */}
        {accountStatus && (
          <div className="card">
            <div className="settings-section-header">
              <Shield size={18} />
              <h2 className="settings-section-title">{t('app.security')}</h2>
            </div>

            {/* Current Email display */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {t('app.current_email')}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{accountStatus.email}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Set Password — only for Google-only accounts */}
              {!accountStatus.passwordSet && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
                      {t('app.set_password')}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {t('app.set_password_desc')}
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    onClick={openSetPasswordModal}
                  >
                    <Lock size={15} /> {t('app.set_password')}
                  </button>
                </div>
              )}

              {/* Change Email */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
                    {t('app.change_email')}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {t('app.change_email_desc')}
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={openChangeEmailModal}
                >
                  <Mail size={15} /> {t('app.change_email')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card danger-zone">
          <div className="settings-section-header">
            <Trash2 size={18} style={{ color: 'var(--error)' }} />
            <h2 className="settings-section-title" style={{ color: 'var(--error)' }}>
              {t('app.delete_account')}
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {t('app.delete_confirm')}
          </p>
          <button className="btn btn-danger" onClick={openDeleteModal}>
            <Trash2 size={15} /> {t('app.delete_account')}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--error)' }}>
                {t('app.delete_account')}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>

            {deleteStep === 'send' ? (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {t('app.delete_confirm')}
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn btn-ghost w-full"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    {t('app.cancel')}
                  </button>
                  <button
                    className={`btn btn-danger w-full ${deleting ? 'btn-loading' : ''}`}
                    onClick={handleSendDeleteCode}
                    disabled={deleting}
                  >
                    {!deleting && t('app.send_code')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {t('app.delete_account_verify_hint')}
                </p>
                <div className="input-group">
                  <label className="input-label">{t('app.verification_code')} *</label>
                  <input
                    className="input"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={deleteCode}
                    onChange={e => setDeleteCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="flex gap-3" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => setDeleteStep('send')}
                  >
                    {t('app.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-danger w-full ${deleting ? 'btn-loading' : ''}`}
                    disabled={deleting || deleteCode.length !== 6}
                  >
                    {!deleting && t('app.confirm')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showSetPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowSetPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                {t('app.set_password')}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSetPasswordModal(false)}>
                <X size={18} />
              </button>
            </div>

            {setPasswordStep === 'send' ? (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {t('app.set_password_desc')}
                </p>
                <button
                  className={`btn btn-primary w-full ${setPasswordLoading ? 'btn-loading' : ''}`}
                  onClick={handleSendSetPasswordCode}
                  disabled={setPasswordLoading}
                >
                  {!setPasswordLoading && t('app.send_code')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">{t('app.verification_code')} *</label>
                  <input
                    className="input"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={setPasswordForm.code}
                    onChange={e => setSetPasswordForm(p => ({ ...p, code: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('app.new_password')} *</label>
                  <input
                    className="input"
                    type="password"
                    required
                    value={setPasswordForm.newPassword}
                    onChange={e => setSetPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('app.confirm_password')} *</label>
                  <input
                    className="input"
                    type="password"
                    required
                    value={setPasswordForm.confirmPassword}
                    onChange={e => setSetPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => setSetPasswordStep('send')}
                  >
                    {t('app.send_code')}
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary w-full ${setPasswordLoading ? 'btn-loading' : ''}`}
                    disabled={setPasswordLoading}
                  >
                    {!setPasswordLoading && t('app.confirm')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showChangeEmailModal && (
        <div className="modal-backdrop" onClick={() => setShowChangeEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                {t('app.change_email')}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowChangeEmailModal(false)}>
                <X size={18} />
              </button>
            </div>

            {changeEmailStep === 'send' ? (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {t('app.change_email_desc')}
                </p>
                <button
                  className={`btn btn-primary w-full ${changeEmailLoading ? 'btn-loading' : ''}`}
                  onClick={handleSendChangeEmailCode}
                  disabled={changeEmailLoading}
                >
                  {!changeEmailLoading && t('app.send_code')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmChangeEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">{t('app.verification_code')} *</label>
                  <input
                    className="input"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={changeEmailForm.code}
                    onChange={e => setChangeEmailForm(p => ({ ...p, code: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('app.new_email')} *</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={changeEmailForm.newEmail}
                    onChange={e => setChangeEmailForm(p => ({ ...p, newEmail: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => setChangeEmailStep('send')}
                  >
                    {t('app.send_code')}
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary w-full ${changeEmailLoading ? 'btn-loading' : ''}`}
                    disabled={changeEmailLoading}
                  >
                    {!changeEmailLoading && t('app.confirm')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
