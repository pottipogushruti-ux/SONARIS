import { Check, Loader2 } from 'lucide-react';

export const PIPELINE_STAGES = [
  'Receiving sonar',
  'Validating image',
  'Preprocessing',
  'Reducing noise',
  'Enhancing contrast',
  'Running detection',
  'Filtering candidates',
  'Calculating risk',
  'Saving mission',
] as const;

/**
 * Represents real progress, not a fake timer. `activeIndex` should track
 * actual request lifecycle (upload progress vs. awaiting response) — when
 * the backend responds quickly, the caller should jump straight to complete
 * rather than animate through stages that didn't really happen.
 */
export function ProcessingPipeline({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="space-y-2.5">
      {PIPELINE_STAGES.map((stage, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <li key={stage} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs
                ${isDone ? 'border-signal-500 bg-signal-500/15 text-signal-400' : ''}
                ${isActive ? 'border-signal-400 text-signal-400' : ''}
                ${!isDone && !isActive ? 'border-abyss-600 text-slate-600' : ''}
              `}
            >
              {isDone ? <Check size={13} /> : isActive ? <Loader2 size={13} className="animate-spin" /> : i + 1}
            </span>
            <span className={`text-sm ${isDone || isActive ? 'text-slate-200' : 'text-slate-600'}`}>{stage}…</span>
          </li>
        );
      })}
    </ol>
  );
}
