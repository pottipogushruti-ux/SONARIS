import { Gauge, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorState, LoadingBlock } from '../components/common/States';
import { useApiData } from '../hooks/useApiData';
import { getModelMetrics } from '../services/api';

export function Performance() {
  const { data: metrics, loading, error, refetch } = useApiData(() => getModelMetrics(), []);

  return (
    <div className="pb-16">
      <PageHeader
        title="Performance"
        description="Genuine model evaluation metrics, when they exist. Processing time is a system measurement, not an accuracy claim."
      />

      <div className="px-6">
        {loading && <LoadingBlock label="Loading evaluation metrics…" />}
        {Boolean(error) && <ErrorState error={String(error)} onRetry={refetch} />}

        {!loading && !error && metrics && (
          metrics.evaluated ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricCard label="Precision" value={metrics.precision} />
              <MetricCard label="Recall" value={metrics.recall} />
              <MetricCard label="F1 score" value={metrics.f1} />
              <MetricCard label="mAP@0.5" value={metrics.map50} />
              <MetricCard label="mAP@0.5:0.95" value={metrics.map50_95} />
              <MetricCard
                label="Inference time"
                value={metrics.inference_time_ms}
                suffix="ms"
                icon={<Clock size={14} />}
              />
            </div>
          ) : (
            <div className="panel p-8 flex flex-col items-center text-center gap-3">
              <Gauge size={28} className="text-slate-600" />
              <p className="text-sm font-medium text-slate-300">EVALUATION PENDING</p>
              <p className="text-xs text-slate-500 max-w-sm">
                No genuine model evaluation has been recorded yet. Accuracy metrics will appear here once the
                backend reports a completed evaluation run — they are never estimated or fabricated in the
                frontend.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        {icon && <span className="text-signal-500/70">{icon}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-slate-100 font-mono tabular-nums">
          {value != null ? value.toFixed(suffix ? 0 : 3) : '—'}
        </span>
        {suffix && value != null && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}
