import { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import type { Detection, VerificationDecision } from '../../types/api';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceValue } from '../common/AnalysisModeBadge';
import { verifyDetection } from '../../services/api';
import { Spinner } from '../common/States';

interface Props {
  detections: Detection[];
  onVerified?: (detectionId: number, status: Detection['status']) => void;
}

export function DetectionTable({ detections, onVerified }: Props) {
  if (detections.length === 0) {
    return (
      <div className="panel p-6 text-center text-sm text-slate-500">
        No candidate objects were identified in this frame.
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-abyss-700 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-medium">Object</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Risk</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Verify</th>
          </tr>
        </thead>
        <tbody>
          {detections.map((d) => (
            <DetectionRow key={d.id} detection={d} onVerified={onVerified} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetectionRow({ detection, onVerified }: { detection: Detection; onVerified?: Props['onVerified'] }) {
  const [status, setStatus] = useState(detection.status);
  const [pending, setPending] = useState<VerificationDecision | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDecision = async (decision: VerificationDecision) => {
    setPending(decision);
    setErrorMsg(null);
    try {
      const res = await verifyDetection(detection.id, decision);
      setStatus(res.status);
      onVerified?.(detection.id, res.status);
      setNotice(
        decision === 'CONFIRM'
          ? 'Marked as verified by operator.'
          : decision === 'REJECT'
          ? 'Detection rejected.'
          : 'Flagged for expert review.'
      );
      setTimeout(() => setNotice(null), 3500);
    } catch {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setPending(null);
    }
  };

  const isFinal = status === 'VERIFIED_BY_OPERATOR' || status === 'REJECTED';

  return (
    <tr className="border-b border-abyss-800 last:border-0 align-top">
      <td className="px-4 py-3 font-medium text-slate-200">{detection.object_label}</td>
      <td className="px-4 py-3">
        <ConfidenceValue confidence={detection.confidence} />
      </td>
      <td className="px-4 py-3">
        <RiskBadge risk={detection.risk} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <StatusBadge status={status} />
          {notice && <span className="text-xs text-signal-400">{notice}</span>}
          {errorMsg && <span className="text-xs text-risk-high">{errorMsg}</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <VerifyButton
            title="Confirm"
            active={status === 'VERIFIED_BY_OPERATOR'}
            disabled={isFinal || pending !== null}
            pending={pending === 'CONFIRM'}
            icon={Check}
            onClick={() => handleDecision('CONFIRM')}
          />
          <VerifyButton
            title="Reject"
            active={status === 'REJECTED'}
            disabled={isFinal || pending !== null}
            pending={pending === 'REJECT'}
            icon={X}
            onClick={() => handleDecision('REJECT')}
          />
          <VerifyButton
            title="Needs review"
            active={status === 'REQUIRES_EXPERT_REVIEW'}
            disabled={isFinal || pending !== null}
            pending={pending === 'NEEDS_REVIEW'}
            icon={Eye}
            onClick={() => handleDecision('NEEDS_REVIEW')}
          />
        </div>
      </td>
    </tr>
  );
}

function VerifyButton({
  title,
  icon: Icon,
  active,
  disabled,
  pending,
  onClick,
}: {
  title: string;
  icon: typeof Check;
  active: boolean;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors
        ${active ? 'border-signal-500 bg-signal-500/15 text-signal-400' : 'border-abyss-600 text-slate-400 hover:text-slate-200 hover:border-abyss-500'}
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {pending ? <Spinner size={14} /> : <Icon size={14} />}
    </button>
  );
}
