import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorState, LoadingBlock, EmptyState } from '../components/common/States';
import { useApiData } from '../hooks/useApiData';
import { getDetections } from '../services/api';
import { DetectionPopup } from '../components/map/DetectionPopup';
import type { Detection, RiskLevel } from '../types/api';
import { MapPinOff } from 'lucide-react';

const RISK_COLOR: Record<RiskLevel, string> = {
  HIGH: '#f87171',
  MEDIUM: '#fbbf24',
  LOW: '#4ade80',
};

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #050b14;box-shadow:0 0 0 2px ${color}55"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const DEFAULT_CENTER: [number, number] = [15.0, 73.5]; // Arabian Sea coastline, used only as a fallback map view

export function MissionMap() {
  const { data: detections, loading, error, refetch } = useApiData(() => getDetections(), []);

  const located = useMemo(
    () => (detections ?? []).filter((d) => d.location?.latitude != null && d.location?.longitude != null),
    [detections]
  );
  const unlocated = useMemo(
    () => (detections ?? []).filter((d) => !d.location || d.location.latitude == null || d.location.longitude == null),
    [detections]
  );

  const hasSimulated = located.some((d) => d.location?.source === 'SIMULATED');

  const trackPath = useMemo<[number, number][]>(
    () =>
      located
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((d) => [d.location!.latitude as number, d.location!.longitude as number]),
    [located]
  );

  const center: [number, number] = located.length
    ? [located[0].location!.latitude as number, located[0].location!.longitude as number]
    : DEFAULT_CENTER;

  return (
    <div className="pb-16 h-full flex flex-col">
      <PageHeader
        title="Mission Map"
        description="Detection locations reported by the backend. Simulated or missing coordinates are always labeled as such."
        actions={hasSimulated ? <span className="badge-demo">SIMULATED LOCATION PRESENT</span> : undefined}
      />

      <div className="px-6 flex-1 flex flex-col min-h-[420px]">
        {loading && <LoadingBlock label="Loading detection locations…" />}
        {Boolean(error) && <ErrorState error={String(error)} onRetry={refetch} />}

        {!loading && !error && (
          <>
            {located.length === 0 ? (
              <EmptyState
                icon={<MapPinOff size={32} />}
                title="No geo-tagged detections yet."
                description="Detections will appear here once the backend reports coordinates for them."
              />
            ) : (
              <div className="panel overflow-hidden h-[60vh] min-h-[360px]">
                <MapContainer center={center} zoom={9} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {trackPath.length > 1 && (
                    <Polyline positions={trackPath} pathOptions={{ color: '#2dd4bf', weight: 2, opacity: 0.6, dashArray: '4 6' }} />
                  )}
                  {located.map((d) => (
                    <Marker key={d.id} position={[d.location!.latitude as number, d.location!.longitude as number]} icon={markerIcon(RISK_COLOR[d.risk] ?? '#94a3b8')}>
                      <Popup>
                        <DetectionPopup detection={d} />
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {unlocated.length > 0 && (
              <UnlocatedList detections={unlocated} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UnlocatedList({ detections }: { detections: Detection[] }) {
  return (
    <div className="panel p-4 mt-4">
      <p className="text-sm font-medium text-slate-300 mb-2">
        {detections.length} detection{detections.length === 1 ? '' : 's'} without map coordinates
      </p>
      <ul className="space-y-1.5">
        {detections.map((d) => (
          <li key={d.id} className="flex items-center justify-between text-sm text-slate-500">
            <span>{d.object_label}</span>
            <span className="text-xs italic">Location metadata unavailable.</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
