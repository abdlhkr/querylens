import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, RefreshCw, Wifi, Database, User } from 'lucide-react';
import { usersApi } from '../api/users';
import { devicesApi } from '../api/devices';
import { useUserStore } from '../store/userStore';
import type { Gender, CreateUserRequest, DbType, CreateDatabaseRequest } from '../types';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import toast from 'react-hot-toast';
import './Onboarding.css';

const DB_TYPES: DbType[] = ['POSTGRESQL', 'MYSQL', 'MSSQL', 'ORACLE'];

const STEP_ICONS = [User, Wifi, Database];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setProfile } = useUserStore();

  const [step, setStep] = useState(0);

  // Step 1 state
  const [profileForm, setProfileForm] = useState<CreateUserRequest>({
    firstName: '', lastName: '', age: 18, gender: 'MALE',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Step 2 state
  const [registryId, setRegistryId] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [checkingConn, setCheckingConn] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 3 state
  const [dbForm, setDbForm] = useState<CreateDatabaseRequest>({
    host: '', port: 5432, databaseName: '', username: '', password: '', dbType: 'POSTGRESQL', displayName: '',
  });
  const [savingDb, setSavingDb] = useState(false);

  // Fetch agent code when entering step 2
  useEffect(() => {
    if (step === 1) fetchCode();
  }, [step]);

  const fetchCode = async () => {
    setLoadingCode(true);
    try {
      const res = await devicesApi.registerDevice();
      if (res.data.data?.deviceRegistryId) setRegistryId(res.data.data.deviceRegistryId);
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setLoadingCode(false);
    }
  };

  const dockerCommand = registryId
    ? `docker run -d -i \\\n  --name querylens-agent \\\n  --restart unless-stopped \\\n  -v querylens-data:/app/data \\\n  -e GATEWAY_WS_URL=wss://querylensio.com \\\n  -e GATEWAY_HTTP_URL=https://querylensio.com \\\n  -e REGISTRY_ID=${registryId} \\\n  querylensio/main-app:latest`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(dockerCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckConnection = async () => {
    setCheckingConn(true);
    try {
      const res = await devicesApi.checkDevice();
      if (res.data.data === true) {
        toast.success('✓ ' + t('app.connected'));
        setStep(2);
      } else {
        toast.error(t('app.agent_disconnected'));
      }
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setCheckingConn(false);
    }
  };

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!profileForm.firstName.trim()) e.firstName = t('errors.required');
    if (!profileForm.lastName.trim()) e.lastName = t('errors.required');
    if (profileForm.age < 0 || profileForm.age > 150) e.age = t('errors.age_invalid');
    return e;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSavingProfile(true);
    try {
      const res = await usersApi.createUser(profileForm);
      if (res.data.data) setProfile(res.data.data);
      setStep(1);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('errors.server_error');
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDb(true);
    try {
      await devicesApi.createDatabase(dbForm);
      toast.success(t('common.success'));
      navigate('/app');
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setSavingDb(false);
    }
  };

  const steps = [
    t('onboarding.step1_title'),
    t('onboarding.step2_title'),
    t('onboarding.step3_title'),
  ];

  return (
    <div className="onboarding-bg">
      <div className="onboarding-glow" />

      <div className="onboarding-wrapper">
        {/* Header */}
        <div className="onboarding-header">
          <div className="ob-logo">
            <div className="logo-icon-lg">⚡</div>
            <span className="logo-text-lg">QueryAI</span>
          </div>
          <LanguageToggle />
        </div>

        {/* Stepper */}
        <div className="stepper">
          {steps.map((label, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={i} className="stepper-item">
                <div className={`stepper-icon ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  {i < step ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={`stepper-label ${i === step ? 'active-label' : ''}`}>{label}</span>
                {i < steps.length - 1 && <div className={`stepper-line ${i < step ? 'done' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="onboarding-card card-glass">

          {/* Step 1: Profile */}
          {step === 0 && (
            <form onSubmit={handleProfileSubmit} className="ob-form">
              <h2 className="ob-title">{t('onboarding.step1_title')}</h2>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">{t('onboarding.first_name')} *</label>
                  <input
                    className={`input ${profileErrors.firstName ? 'input-error' : ''}`}
                    value={profileForm.firstName}
                    onChange={e => { setProfileForm(p => ({ ...p, firstName: e.target.value })); setProfileErrors(p => ({ ...p, firstName: '' })); }}
                  />
                  {profileErrors.firstName && <p className="field-error">{profileErrors.firstName}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('onboarding.last_name')} *</label>
                  <input
                    className={`input ${profileErrors.lastName ? 'input-error' : ''}`}
                    value={profileForm.lastName}
                    onChange={e => { setProfileForm(p => ({ ...p, lastName: e.target.value })); setProfileErrors(p => ({ ...p, lastName: '' })); }}
                  />
                  {profileErrors.lastName && <p className="field-error">{profileErrors.lastName}</p>}
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">{t('onboarding.age')} *</label>
                  <input
                    type="number"
                    className={`input ${profileErrors.age ? 'input-error' : ''}`}
                    min={0} max={150}
                    value={profileForm.age}
                    onChange={e => { setProfileForm(p => ({ ...p, age: +e.target.value })); setProfileErrors(p => ({ ...p, age: '' })); }}
                  />
                  {profileErrors.age && <p className="field-error">{profileErrors.age}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('onboarding.gender')} *</label>
                  <select
                    className="input select"
                    value={profileForm.gender}
                    onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value as Gender }))}
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary w-full btn-lg ${savingProfile ? 'btn-loading' : ''}`}
                disabled={savingProfile}
              >
                {!savingProfile && t('onboarding.next')}
              </button>
            </form>
          )}

          {/* Step 2: Agent */}
          {step === 1 && (
            <div className="ob-form">
              <h2 className="ob-title">{t('onboarding.step2_title')}</h2>
              <p className="ob-desc">{t('onboarding.agent_desc')}</p>

              <div className="agent-code-box">
                {loadingCode ? (
                  <div className="spinner" style={{ margin: '0 auto' }} />
                ) : (
                  <>
                    <pre className="agent-code-text">{dockerCommand || '—'}</pre>
                    <button className="btn btn-ghost btn-sm" onClick={handleCopy} disabled={!registryId} style={{ alignSelf: 'flex-start' }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? t('onboarding.copied') : t('onboarding.copy')}
                    </button>
                  </>
                )}
              </div>

              <p className="ob-hint">{t('onboarding.valid_30')}</p>

              <div className="flex gap-3">
                <button
                  className={`btn btn-secondary w-full ${loadingCode ? 'btn-loading' : ''}`}
                  onClick={fetchCode}
                  disabled={loadingCode}
                >
                  {!loadingCode && <><RefreshCw size={14} /> {t('onboarding.refresh_code')}</>}
                </button>
                <button
                  className={`btn btn-primary w-full ${checkingConn ? 'btn-loading' : ''}`}
                  onClick={handleCheckConnection}
                  disabled={checkingConn}
                >
                  {!checkingConn && <><Wifi size={14} /> {t('onboarding.check_connection')}</>}
                </button>
              </div>

              <button
                className="btn btn-ghost w-full"
                style={{ marginTop: '8px' }}
                onClick={() => setStep(2)}
              >
                {t('onboarding.skip')} →
              </button>
            </div>
          )}

          {/* Step 3: Database */}
          {step === 2 && (
            <form onSubmit={handleDbSubmit} className="ob-form">
              <h2 className="ob-title">{t('onboarding.step3_title')}</h2>

              <div className="input-group">
                <label className="input-label">{t('onboarding.display_name')}</label>
                <input
                  className="input"
                  placeholder="Production DB"
                  value={dbForm.displayName}
                  onChange={e => setDbForm(p => ({ ...p, displayName: e.target.value }))}
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">{t('onboarding.host')} *</label>
                  <input className="input" required placeholder="localhost" value={dbForm.host} onChange={e => setDbForm(p => ({ ...p, host: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('onboarding.port')} *</label>
                  <input className="input" type="number" required min={1} max={65535} value={dbForm.port} onChange={e => setDbForm(p => ({ ...p, port: +e.target.value }))} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{t('onboarding.database_name')} *</label>
                <input className="input" required value={dbForm.databaseName} onChange={e => setDbForm(p => ({ ...p, databaseName: e.target.value }))} />
              </div>

              <div className="input-group">
                <label className="input-label">{t('onboarding.username')} *</label>
                <input className="input" required value={dbForm.username} onChange={e => setDbForm(p => ({ ...p, username: e.target.value }))} />
              </div>

              <div className="input-group">
                <label className="input-label">{t('onboarding.db_password')} *</label>
                <input className="input" type="password" required value={dbForm.password} onChange={e => setDbForm(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
              </div>

              <div className="input-group">
                <label className="input-label">{t('onboarding.db_type')} *</label>
                <select className="input select" value={dbForm.dbType} onChange={e => setDbForm(p => ({ ...p, dbType: e.target.value as DbType }))}>
                  {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost w-full" onClick={() => navigate('/app')}>
                  {t('onboarding.skip')}
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${savingDb ? 'btn-loading' : ''}`}
                  disabled={savingDb}
                >
                  {!savingDb && t('onboarding.add')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
