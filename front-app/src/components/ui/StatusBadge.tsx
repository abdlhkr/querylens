import type { ConnectionStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: ConnectionStatus;
}

const icons: Record<ConnectionStatus, string> = {
  PENDING: '⏳',
  VERIFIED: '✓',
  FAILED: '✗',
};

const cls: Record<ConnectionStatus, string> = {
  PENDING: 'badge-pending',
  VERIFIED: 'badge-verified',
  FAILED: 'badge-failed',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const labels: Record<ConnectionStatus, string> = {
    PENDING: t('app.status_pending'),
    VERIFIED: t('app.status_verified'),
    FAILED: t('app.status_failed'),
  };

  return (
    <span className={`badge ${cls[status]}`}>
      {icons[status]} {labels[status]}
    </span>
  );
}
