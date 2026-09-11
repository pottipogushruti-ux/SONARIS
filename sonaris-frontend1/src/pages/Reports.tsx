import { useState } from 'react';
import { FileDown, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingBlock, Spinner } from '../components/common/States';
import { AnalysisModeBadge } from '../components/common/AnalysisModeBadge';
import { useApiData } from '../hooks/useApiData';
import { getMissions, downloadCSV, downloadJSON, downloadPDF } from '../services/api';
import type { Mission } from '../types/api';
import { resolveImageUrl } from '../utils/url';

export function Reports() {
  const { data: missions, loading, error, refetch } = useApiData(() => getMissions(), []);

  return (
    <div className="pb-16">
      <PageHeader title="Reports" description="Export mission results for logging, handoff, or further analysis." />

      <div className="px-6">
        {loading && <LoadingBlock label="Loading missions…" />}
        {error && <ErrorState error={error} onRetry={refetch} />}

        {!loading && !error && (
          (missions ?? []).length === 0 ? (
            <EmptyState
              icon={<FileText size={32} />}
              title="No missions available."
              description="Reports can be generated once at least one mission has been analyzed."
            />
          ) : (
            <div className="space-y-3">
              {missions!.map((m) => (
                <MissionReportCard key={m.id} mission={m} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MissionReportCard({ mission }: { mission: Mission }) {
  const [downloading, setDownloading] = useState<'pdf' | 'csv' | 'json' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'csv' | 'json') => {
    setDownloading(format);
    setErrorMsg(null);
    try {
      if (format === 'pdf') await downloadPDF(mission.id);
      if (format === 'csv') await downloadCSV(mission.id);
      if (format === 'json') await downloadJSON(mission.id);
    } catch {
      setErrorMsg('Report generation failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {mission.image_thumbnail ? (
          <img
            src={resolveImageUrl(mission.image_thumbnail)}
            alt=""
            className="h-14 w-14 rounded-md border border-abyss-600 object-cover shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-md border border-abyss-600 bg-abyss-850 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">
            {mission.name ?? `Mission #${mission.id}`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{new Date(mission.date).toLocaleString()}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <AnalysisModeBadge mode={mission.analysis_mode} showExplanation={false} />
            <span className="text-xs text-slate-500">
              {mission.detection_count} detections · {mission.high_risk_count} high risk
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ReportButton icon={FileText} label="PDF" busy={downloading === 'pdf'} onClick={() => handleDownload('pdf')} />
        <ReportButton icon={FileSpreadsheet} label="CSV" busy={downloading === 'csv'} onClick={() => handleDownload('csv')} />
        <ReportButton icon={FileJson} label="JSON" busy={downloading === 'json'} onClick={() => handleDownload('json')} />
      </div>

      {errorMsg && <p className="text-xs text-risk-high sm:hidden">{errorMsg}</p>}
    </div>
  );
}

function ReportButton({
  icon: Icon,
  label,
  busy,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button className="btn-secondary !px-3" onClick={onClick} disabled={busy} title={`Download ${label}`}>
      {busy ? <Spinner size={14} /> : <Icon size={14} />}
      {label}
      <FileDown size={12} className="opacity-50" />
    </button>
  );
}
