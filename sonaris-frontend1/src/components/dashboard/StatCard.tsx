import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  suffix,
  tag,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  suffix?: string;
  tag?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        {icon && <span className="text-signal-500/70">{icon}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold text-slate-100 font-mono tabular-nums">{value}</span>
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
      {tag && <div className="mt-1">{tag}</div>}
    </div>
  );
}
