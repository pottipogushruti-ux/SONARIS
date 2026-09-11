import { Images, Target, AlertTriangle, ShieldCheck, Compass, Timer } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { ErrorState, SkeletonCard } from '../components/common/States';
import { useApiData } from '../hooks/useApiData';
import { getDashboardStats } from '../services/api';

export function Dashboard() {
  const { data: stats, loading, error, refetch } = useApiData(getDashboardStats, []);

  return (
    <div className="pb-10">
      <PageHeader
        title="Dashboard"
        description="Live operational summary pulled directly from the SONARIS backend."
        actions={
          stats?.is_demo_data ? (
            <span className="badge-demo">DEMO DATA</span>
          ) : (
            !loading && !error && <span className="badge-status">LIVE DATABASE</span>
          )
        }
      />

      <div className="px-6">
        {Boolean(error) && <ErrorState error={String(error)} onRetry={refetch} />}

        {!error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading || !stats ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  label="Sonar images analyzed"
                  value={stats.sonar_images_analyzed}
                  icon={<Images size={16} />}
                />
                <StatCard
                  label="Objects detected"
                  value={stats.objects_detected}
                  icon={<Target size={16} />}
                />
                <StatCard
                  label="High risk objects"
                  value={stats.high_risk_objects}
                  icon={<AlertTriangle size={16} />}
                  tag={stats.high_risk_objects > 0 ? <span className="badge-risk-high">Needs attention</span> : undefined}
                />
                <StatCard
                  label="Verified detections"
                  value={stats.verified_detections}
                  icon={<ShieldCheck size={16} />}
                />
                <StatCard
                  label="Current mission"
                  value={stats.current_mission ?? '—'}
                  icon={<Compass size={16} />}
                />
                <StatCard
                  label="Avg. processing time"
                  value={stats.avg_processing_time_ms != null ? stats.avg_processing_time_ms.toLocaleString() : '—'}
                  suffix={stats.avg_processing_time_ms != null ? 'ms' : undefined}
                  icon={<Timer size={16} />}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
