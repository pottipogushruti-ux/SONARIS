import { useState } from 'react';
import type { PreprocessingImages } from '../../types/api';
import { resolveImageUrl } from '../../utils/url';

const STAGES: { key: keyof PreprocessingImages; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'denoised', label: 'Denoised' },
  { key: 'enhanced', label: 'Contrast enhanced' },
  { key: 'normalized', label: 'Normalized' },
  { key: 'annotated', label: 'Detection ready' },
];

export function PreprocessingViewer({ images }: { images: PreprocessingImages }) {
  const available = STAGES.filter((s) => images[s.key]);
  const [activeKey, setActiveKey] = useState(available[0]?.key ?? 'original');
  const activeUrl = images[activeKey];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Preprocessing stages">
        {available.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={activeKey === s.key}
            onClick={() => setActiveKey(s.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors
              ${
                activeKey === s.key
                  ? 'border-signal-500/50 bg-signal-500/10 text-signal-400'
                  : 'border-abyss-600 text-slate-400 hover:text-slate-200 hover:border-abyss-500'
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="panel sonar-grid-bg flex items-center justify-center min-h-[280px] p-3">
        {activeUrl ? (
          <img
            src={resolveImageUrl(activeUrl)}
            alt={`Sonar frame — ${STAGES.find((s) => s.key === activeKey)?.label} stage`}
            className="max-h-[420px] w-auto rounded-md object-contain"
          />
        ) : (
          <p className="text-sm text-slate-600">Stage image not returned by backend.</p>
        )}
      </div>
    </div>
  );
}
