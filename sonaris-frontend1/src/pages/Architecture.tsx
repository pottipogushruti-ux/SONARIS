import { ArrowDown } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

const PIPELINE = [
  { label: 'Sonar data', tech: 'Side-scan sonar files' },
  { label: 'Ingestion', tech: 'FastAPI' },
  {
    label: 'Preprocessing',
    tech: 'OpenCV',
    sub: ['Noise reduction', 'Contrast enhancement', 'Normalization', 'Geometric correction (where metadata permits)'],
  },
  { label: 'AI model', tech: 'YOLO' },
  { label: 'Object detection', tech: 'Python' },
  { label: 'Confidence filter', tech: 'Python' },
  { label: 'Human verification', tech: 'React' },
  { label: 'Geo-tagging', tech: 'FastAPI' },
  { label: 'Map', tech: 'Leaflet' },
  { label: 'Database', tech: 'SQLite' },
  { label: 'Report', tech: 'FastAPI' },
];

const TECH_STACK = ['Python', 'OpenCV', 'YOLO', 'FastAPI', 'SQLite', 'Leaflet', 'React', 'TypeScript'];

export function Architecture() {
  return (
    <div className="pb-16">
      <PageHeader title="Architecture" description="How a sonar frame flows from upload to reported result." />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
        <div className="panel p-6 sm:p-8 sonar-grid-bg">
          <div className="flex flex-col items-center max-w-md mx-auto">
            {PIPELINE.map((stage, i) => (
              <div key={stage.label} className="w-full flex flex-col items-center">
                <div className="w-full panel-raised px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-200">{stage.label}</span>
                  <span className="text-[11px] font-mono text-signal-400/80 shrink-0">{stage.tech}</span>
                </div>
                {stage.sub && (
                  <ul className="w-[92%] mt-1.5 mb-1.5 grid grid-cols-2 gap-1.5">
                    {stage.sub.map((s) => (
                      <li
                        key={s}
                        className="text-[11px] text-slate-500 border border-abyss-700 rounded px-2 py-1 text-center"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                {i < PIPELINE.length - 1 && <ArrowDown size={16} className="text-abyss-600 my-1.5" />}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h2 className="field-label mb-3">Technology stack</h2>
            <div className="flex flex-wrap gap-1.5">
              {TECH_STACK.map((t) => (
                <span key={t} className="badge border-abyss-600 bg-abyss-850 text-slate-300 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="field-label mb-2">Responsibility boundary</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-2">
              <span className="text-slate-200 font-medium">Frontend owns:</span> UI, navigation, visualization,
              API calls, map rendering, judge experience.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-medium">Backend owns:</span> image processing, AI inference,
              risk calculation, database, verification persistence, report generation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
