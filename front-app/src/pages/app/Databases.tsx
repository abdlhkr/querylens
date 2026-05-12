import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, RefreshCw, Pencil, Database, X } from 'lucide-react';
import { devicesApi } from '../../api/devices';
import type { DatabaseConnection, CreateDatabaseRequest, DbType } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import './Databases.css';

const DB_TYPES: DbType[] = ['POSTGRESQL', 'MYSQL', 'MSSQL', 'ORACLE'];

const emptyForm: CreateDatabaseRequest = {
  host: '', port: 5432, databaseName: '', username: '', password: '', dbType: 'POSTGRESQL', displayName: '',
};

export default function Databases() {
  const { t } = useTranslation();
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<DatabaseConnection | null>(null);
  const [form, setForm] = useState<CreateDatabaseRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDatabases = useCallback(async () => {
    try {
      const res = await devicesApi.getDatabases();
      setDatabases(res.data.data ?? []);
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadDatabases(); }, [loadDatabases]);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (db: DatabaseConnection) => {
    setEditTarget(db);
    setForm({ host: db.host, port: db.port, databaseName: db.databaseName, username: db.username, password: '', dbType: db.dbType, displayName: db.displayName ?? '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await devicesApi.updateDatabase(editTarget.id, form);
        toast.success(t('common.success'));
      } else {
        await devicesApi.createDatabase(form);
        toast.success(t('common.success'));
      }
      setShowModal(false);
      loadDatabases();
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await devicesApi.testConnection(id);
      if (res.data.data?.success) {
        toast.success(`✓ ${t('app.status_verified')}`);
      } else {
        toast.error(res.data.data?.error ?? t('errors.server_error'));
      }
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await devicesApi.deleteDatabase(id);
      toast.success(t('common.success'));
      setDatabases(prev => prev.filter(d => d.id !== id));
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('nav.databases')}</h1>
          <p className="page-subtitle">{databases.length} {t('app.total_databases').toLowerCase()}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('app.add_database')}
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner" /></div>
      ) : databases.length === 0 ? (
        <div className="empty-state card text-center">
          <Database size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{t('app.add_database')}</p>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('app.add_database')}</button>
        </div>
      ) : (
        <div className="db-grid">
          {databases.map((db) => (
            <div key={db.id} className="db-card card">
              <div className="db-card-header">
                <div className="db-icon">
                  <Database size={20} />
                </div>
                <div className="db-info">
                  <h3 className="db-name">{db.displayName || db.databaseName}</h3>
                  <p className="db-host">{db.host}:{db.port} — <span className="db-type-tag">{db.dbType}</span></p>
                </div>
                <StatusBadge status={db.status} />
              </div>
              {db.lastError && (
                <div className="alert alert-error" style={{ marginTop: '12px', fontSize: '12px' }}>
                  {db.lastError}
                </div>
              )}
              <div className="db-card-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTest(db.id)}
                  disabled={testingId === db.id}
                >
                  <RefreshCw size={13} className={testingId === db.id ? 'spin-icon' : ''} />
                  {t('app.test_connection')}
                </button>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(db)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(db.id)}
                    disabled={deletingId === db.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editTarget ? t('app.edit') : t('app.add_database')}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">{t('onboarding.display_name')}</label>
                <input className="input" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Production DB" />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">{t('onboarding.host')} *</label>
                  <input className="input" required value={form.host} onChange={e => setForm(p => ({ ...p, host: e.target.value }))} placeholder="host.docker.internal" />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('onboarding.port')} *</label>
                  <input className="input" type="number" required min={1} max={65535} value={form.port} onChange={e => setForm(p => ({ ...p, port: +e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">{t('onboarding.database_name')} *</label>
                <input className="input" required value={form.databaseName} onChange={e => setForm(p => ({ ...p, databaseName: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('onboarding.username')} *</label>
                <input className="input" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('onboarding.db_password')} *</label>
                <input className="input" type="password" required={!editTarget} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
              </div>
              <div className="input-group">
                <label className="input-label">{t('onboarding.db_type')} *</label>
                <select className="input select" value={form.dbType} onChange={e => setForm(p => ({ ...p, dbType: e.target.value as DbType }))}>
                  {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-3" style={{ marginTop: '4px' }}>
                <button type="button" className="btn btn-ghost w-full" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className={`btn btn-primary w-full ${submitting ? 'btn-loading' : ''}`} disabled={submitting}>
                  {submitting ? '' : (editTarget ? t('app.save') : t('onboarding.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
