import { AlertTriangle, AlertCircle, CircleCheck, HelpCircle } from 'lucide-react';
import type { RiskLevel } from '../../types/api';

const CONFIG: Record<RiskLevel, { className: string; icon: typeof AlertTriangle; label: string }> = {
  HIGH: { className: 'badge-risk-high', icon: AlertTriangle, label: 'High risk' },
  MEDIUM: { className: 'badge-risk-medium', icon: AlertCircle, label: 'Medium risk' },
  LOW: { className: 'badge-risk-low', icon: CircleCheck, label: 'Low risk' },
};

/** See StatusBadge for why an unrecognized value renders a fallback instead of crashing. */
export function RiskBadge({ risk }: { risk: RiskLevel | string }) {
  const cfg = CONFIG[risk as RiskLevel];

  if (!cfg) {
    return (
      <span className="badge border-slate-600/40 bg-slate-700/10 text-slate-500" title="Unrecognized risk value from backend">
        <HelpCircle size={13} />
        {String(risk) || 'Unknown'}
      </span>
    );
  }

  const Icon = cfg.icon;
  return (
    <span className={cfg.className}>
      <Icon size={13} />
      {cfg.label}
    </span>
  );
}
