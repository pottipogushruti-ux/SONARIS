import { CheckCircle2, XCircle, Eye, Sparkles, HelpCircle } from 'lucide-react';
import type { VerificationStatus } from '../../types/api';

const CONFIG: Record<VerificationStatus, { className: string; icon: typeof CheckCircle2; label: string }> = {
  AI_DETECTED: { className: 'badge-status', icon: Sparkles, label: 'AI detected' },
  VERIFIED_BY_OPERATOR: {
    className: 'badge border-signal-500/40 bg-signal-500/10 text-signal-400',
    icon: CheckCircle2,
    label: 'Verified by operator',
  },
  REJECTED: {
    className: 'badge border-slate-600/40 bg-slate-700/20 text-slate-400 line-through decoration-slate-500',
    icon: XCircle,
    label: 'Rejected',
  },
  REQUIRES_EXPERT_REVIEW: {
    className: 'badge border-amber-500/40 bg-amber-500/10 text-amber-400',
    icon: Eye,
    label: 'Requires expert review',
  },
};

/**
 * `status` comes straight from the backend response. If the backend ever
 * sends a value outside the four we know about (different casing, a typo,
 * a status we haven't mapped yet), fall back to a neutral badge showing the
 * raw value instead of crashing the page. A malformed field from the API
 * should degrade gracefully, not take down the whole view.
 */
export function StatusBadge({ status }: { status: VerificationStatus | string }) {
  const cfg = CONFIG[status as VerificationStatus];

  if (!cfg) {
    return (
      <span className="badge border-slate-600/40 bg-slate-700/10 text-slate-500" title="Unrecognized status value from backend">
        <HelpCircle size={13} />
        {String(status) || 'Unknown'}
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
