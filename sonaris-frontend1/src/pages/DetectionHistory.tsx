import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, History as HistoryIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingBlock } from '../components/common/States';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceValue } from '../components/common/AnalysisModeBadge';
import { useApiData } from '../hooks/useApiData';
import { getDetections } from '../services/api';
import type { Detection, RiskLevel, VerificationStatus } from '../types/api';

type SortKey = 'timestamp' | 'confidence' | 'risk';

const RISK_ORDER: Record<RiskLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function DetectionHistory() {
  const { data: detections, loading, error, refetch } = useApiData(() => getDetections(), []);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('ALL');
  const [missionFilter, setMissionFilter] = useState<number | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const missionOptions = useMemo(() => {
    const ids = new Set((detections ?? []).map((d) => d.mission_id));
    return Array.from(ids).sort((a, b) => a - b);
  }, [detections]);

  const filtered = useMemo(() => {
    let rows = detections ?? [];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((d) => d.object_label.toLowerCase().includes(q));
    }
    if (riskFilter !== 'ALL') rows = rows.filter((d) => d.risk === riskFilter);
    if (statusFilter !== 'ALL') rows = rows.filter((d) => d.status === statusFilter);
    if (missionFilter !== 'ALL') rows = rows.filter((d) => d.mission_id === missionFilter);

    const sorted = [...rows].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'timestamp') diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortKey === 'confidence') diff = a.confidence - b.confidence;
      if (sortKey === 'risk') diff = RISK_ORDER[a.risk] - RISK_ORDER[b.risk];
      return sortDir === 'asc' ? diff : -diff;
    });

    return sorted;
  }, [detections, search, riskFilter, statusFilter, missionFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="pb-16">
      <PageHeader
        title="Detection History"
        description="Every detection recorded by the backend across all missions."
      />

      <div className="px-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by object label…"
              className="w-full rounded-md border border-abyss-600 bg-abyss-850 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-signal-500 outline-none"
            />
          </div>

          <FilterSelect
            label="Risk"
            value={riskFilter}
            onChange={(v) => setRiskFilter(v as RiskLevel | 'ALL')}
            options={[
              { value: 'ALL', label: 'All risk levels' },
              { value: 'HIGH', label: 'High' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LOW', label: 'Low' },
            ]}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as VerificationStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'All statuses' },
              { value: 'AI_DETECTED', label: 'AI detected' },
              { value: 'VERIFIED_BY_OPERATOR', label: 'Verified' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'REQUIRES_EXPERT_REVIEW', label: 'Needs review' },
            ]}
          />

          <FilterSelect
            label="Mission"
            value={missionFilter === 'ALL' ? 'ALL' : String(missionFilter)}
            onChange={(v) => setMissionFilter(v === 'ALL' ? 'ALL' : Number(v))}
            options={[
              { value: 'ALL', label: 'All missions' },
              ...missionOptions.map((id) => ({ value: String(id), label: `Mission #${id}` })),
            ]}
          />
        </div>

        {loading && <LoadingBlock label="Loading detection history…" />}
        {Boolean(error) && <ErrorState error={String(error)} onRetry={refetch} />}

        {!loading && !error && (
          filtered.length === 0 ? (
            <EmptyState
              icon={<HistoryIcon size={32} />}
              title="No detections recorded yet."
              description="Detections will appear here once sonar frames have been analyzed."
            />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-abyss-700 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Mission</th>
                    <th className="px-4 py-3 font-medium">Object</th>
                    <SortableHeader label="Confidence" active={sortKey === 'confidence'} dir={sortDir} onClick={() => toggleSort('confidence')} />
                    <SortableHeader label="Risk" active={sortKey === 'risk'} dir={sortDir} onClick={() => toggleSort('risk')} />
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <SortableHeader label="Date" active={sortKey === 'timestamp'} dir={sortDir} onClick={() => toggleSort('timestamp')} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <HistoryRow key={d.id} detection={d} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function HistoryRow({ detection }: { detection: Detection }) {
  const loc = detection.location;
  return (
    <tr className="border-b border-abyss-800 last:border-0 hover:bg-abyss-800/40 transition-colors">
      <td className="px-4 py-3 text-slate-400 font-mono text-xs">#{detection.mission_id}</td>
      <td className="px-4 py-3 font-medium text-slate-200">{detection.object_label}</td>
      <td className="px-4 py-3">
        <ConfidenceValue confidence={detection.confidence} />
      </td>
      <td className="px-4 py-3">
        <RiskBadge risk={detection.risk} />
      </td>
      <td className="px-4 py-3 text-xs">
        {loc?.latitude != null && loc?.longitude != null ? (
          <span className={`font-mono ${loc.source === 'SIMULATED' ? 'text-amber-400' : 'text-slate-400'}`}>
            {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}
            {loc.source === 'SIMULATED' && ' (sim)'}
          </span>
        ) : (
          <span className="text-slate-600 italic">unavailable</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={detection.status} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 font-mono">
        {new Date(detection.timestamp).toLocaleDateString()}
      </td>
    </tr>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        onClick={onClick}
        className={`flex items-center gap-1 hover:text-slate-200 transition-colors ${active ? 'text-signal-400' : ''}`}
      >
        {label}
        <ArrowUpDown size={12} className={active && dir === 'asc' ? 'rotate-180' : ''} />
      </button>
    </th>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: T) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-abyss-600 bg-abyss-850 px-3 py-2 text-sm text-slate-200 focus:border-signal-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
