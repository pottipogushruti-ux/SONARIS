import type { Detection } from '../../types/api';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceValue } from '../common/AnalysisModeBadge';

export function DetectionPopup({ detection }: { detection: Detection }) {
  const loc = detection.location;
  const isSimulated = loc?.source === 'SIMULATED';

  return (
    <div className="min-w-[200px] text-sm font-display">
      <p className="font-semibold text-abyss-950">{detection.object_label}</p>

      <div className="mt-2 space-y-1.5 text-abyss-800">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-abyss-600">Confidence</span>
          <ConfidenceValue confidence={detection.confidence} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-abyss-600">Risk</span>
          <RiskBadge risk={detection.risk} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-abyss-600">Latitude</span>
          <span className="font-mono text-xs">{loc?.latitude != null ? loc.latitude.toFixed(5) : '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-abyss-600">Longitude</span>
          <span className="font-mono text-xs">{loc?.longitude != null ? loc.longitude.toFixed(5) : '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-abyss-600">Location</span>
          <span className={`text-xs font-medium ${isSimulated ? 'text-amber-600' : ''}`}>
            {isSimulated ? 'Simulated location' : 'GPS'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-abyss-600">Timestamp</span>
          <span className="text-xs font-mono">{new Date(detection.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-abyss-600">Status</span>
          <StatusBadge status={detection.status} />
        </div>
      </div>
    </div>
  );
}
