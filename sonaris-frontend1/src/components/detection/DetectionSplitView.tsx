import type { PreprocessingImages } from '../../types/api';
import { resolveImageUrl } from '../../utils/url';

export function DetectionSplitView({ images }: { images: PreprocessingImages }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FramePanel label="Original sonar" url={images.original} />
      <FramePanel label="Annotated result" url={images.annotated} highlight />
    </div>
  );
}

function FramePanel({ label, url, highlight }: { label: string; url: string | null; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">{label}</span>
      <div
        className={`panel sonar-grid-bg flex items-center justify-center min-h-[240px] p-3 ${
          highlight ? 'border-signal-500/30' : ''
        }`}
      >
        {url ? (
          <img
            src={resolveImageUrl(url)}
            alt={label}
            className="max-h-[380px] w-auto rounded-md object-contain"
          />
        ) : (
          <p className="text-sm text-slate-600 px-4 text-center">Image not returned by backend.</p>
        )}
      </div>
    </div>
  );
}
