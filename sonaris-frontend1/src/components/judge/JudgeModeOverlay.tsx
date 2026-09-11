import { ChevronLeft, ChevronRight, Gavel, X } from 'lucide-react';
import { JUDGE_STEPS, useJudgeMode } from './JudgeModeContext';

export function JudgeModeOverlay() {
  const { active, stepIndex, currentStep, next, back, exit } = useJudgeMode();

  if (!active) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === JUDGE_STEPS.length - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-2xl panel-raised border-signal-500/30 p-4 sm:p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-signal-400 text-xs font-medium uppercase tracking-wider">
            <Gavel size={14} />
            Judge demo · step {stepIndex + 1} of {JUDGE_STEPS.length}
          </div>
          <button className="btn-ghost !p-1.5" onClick={exit} aria-label="Exit judge mode">
            <X size={16} />
          </button>
        </div>

        <h3 className="mt-2 text-base font-semibold text-slate-100">{currentStep.title}</h3>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">{currentStep.body}</p>

        <div className="mt-3 h-1 w-full rounded-full bg-abyss-700 overflow-hidden">
          <div
            className="h-full bg-signal-500 transition-all"
            style={{ width: `${((stepIndex + 1) / JUDGE_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button className="btn-secondary" onClick={back} disabled={isFirst}>
            <ChevronLeft size={16} />
            Back
          </button>
          {isLast ? (
            <button className="btn-primary" onClick={exit}>
              Finish demo
            </button>
          ) : (
            <button className="btn-primary" onClick={next}>
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
