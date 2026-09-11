import { useEffect, useState } from 'react';
import { getHealth } from '../../services/api';

type Status = 'checking' | 'online' | 'offline';

export function BackendStatusIndicator({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await getHealth();
        if (!cancelled) setStatus('online');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }

    check();
    const interval = setInterval(check, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dotClass =
    status === 'online' ? 'bg-signal-400' : status === 'offline' ? 'bg-risk-high' : 'bg-slate-500';
  const label =
    status === 'online' ? 'Backend online' : status === 'offline' ? 'Backend offline' : 'Checking backend…';

  if (compact) {
    return <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} aria-label={label} title={label} />;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
