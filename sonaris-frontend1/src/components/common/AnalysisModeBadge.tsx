import { BrainCircuit, FlaskConical, Info } from 'lucide-react';
import type { AnalysisMode, ModelInfo } from '../../types/api';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  mode: AnalysisMode;
  model?: ModelInfo | null;
  showExplanation?: boolean;
}

/**
 * Every detection result must carry this. It is the single place that
 * distinguishes a real model prediction from the demo pipeline — never
 * relabel one as the other.
 */
export function AnalysisModeBadge({ mode, model, showExplanation = true }: Props) {
  if (mode === 'AI_INFERENCE') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-ai">
            <BrainCircuit size={13} />
            AI INFERENCE
          </span>
          {model?.name && (
            <span className="text-xs text-slate-500 font-mono">
              {model.name}
              {model.version ? ` · v${model.version}` : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="badge-demo">
        <FlaskConical size={13} />
        DEMO INFERENCE
      </span>
      {showExplanation && (
        <p className="text-xs text-slate-500 flex items-start gap-1.5 max-w-md">
          <Info size={13} className="mt-0.5 shrink-0" />
          Demo analysis uses the configured demonstration pipeline and is not a trained model prediction.
        </p>
      )}
    </div>
  );
}

export function ConfidenceValue({ confidence }: { confidence: number }) {
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono tabular-nums">{pct.toFixed(0)}%</span>
      <InfoTooltip text="Confidence represents the model's confidence in this prediction. It does not prove that the object is actually present." />
    </span>
  );
}
