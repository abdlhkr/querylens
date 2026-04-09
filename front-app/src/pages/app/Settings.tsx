import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { usersApi } from '../../api/users';
import type { Gender, CreateUserRequest } from '../../types';
import { useNavigate } from 'react-router-dom';
import { User, Trash2, X } from 'lucide-react';
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
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await usersApi.deleteUser();
      clearProfile();
      navigate('/auth/login');
    } catch {
      toast.error(t('errors.server_error'));
      setDeleting(false);
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
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={15} /> {t('app.delete_account')}
          </button>
        </div>
      </div>

      {/* Delete Confirm Modal */}
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
                onClick={handleDelete}
                disabled={deleting}
              >
                {!deleting && t('app.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
