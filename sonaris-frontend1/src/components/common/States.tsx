import type { ReactNode } from 'react';
import { AlertOctagon, Inbox, Loader2, WifiOff } from 'lucide-react';
import type { SonarisApiError } from '../../services/api';

export function Spinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-24 w-full ${className}`} role="status" aria-label="Loading" />;
}

export function SkeletonRow() {
  return <div className="skeleton h-10 w-full" role="status" aria-label="Loading" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
      <div className="text-slate-600">{icon ?? <Inbox size={32} />}</div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && <p className="text-xs text-slate-500 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error as SonarisApiError;
  const isOffline = apiError?.kind === 'OFFLINE';
  const message =
    apiError?.message ||
    'Something went wrong while talking to the SONARIS backend.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
      <div className="text-risk-high">
        {isOffline ? <WifiOff size={32} /> : <AlertOctagon size={32} />}
      </div>
      <p className="text-sm font-medium text-slate-200">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-1" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function LocationUnavailable() {
  return <span className="text-xs text-slate-500 italic">Location metadata unavailable.</span>;
}
