import { useCallback, useState } from 'react';
import { RotateCcw, ScanLine } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UploadDropzone, type SelectedFile } from '../components/sonar/UploadDropzone';
import { ProcessingPipeline, PIPELINE_STAGES } from '../components/sonar/ProcessingPipeline';
import { PreprocessingViewer } from '../components/sonar/PreprocessingViewer';
import { DetectionSplitView } from '../components/detection/DetectionSplitView';
import { DetectionTable } from '../components/detection/DetectionTable';
import { ShadowExplanationPanel } from '../components/sonar/ShadowExplanationPanel';
import { AnalysisModeBadge } from '../components/common/AnalysisModeBadge';
import { ErrorState } from '../components/common/States';
import { analyzeSonar } from '../services/api';
import type { AnalysisResult } from '../types/api';

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export function SonarAnalysis() {
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<unknown>(null);

  const reset = useCallback(() => {
    if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    setSelected(null);
    setPhase('idle');
    setStageIndex(0);
    setResult(null);
    setError(null);
  }, [selected]);

  const handleAnalyze = useCallback(async () => {
    if (!selected) return;
    setPhase('uploading');
    setError(null);
    setStageIndex(0);

    // Stage 0-1 track real upload progress; stages 2+ represent backend-side
    // work we can't observe directly, so we advance them once while awaiting
    // the response rather than faking a timed animation.
    try {
      const analysis = await analyzeSonar(selected.file, {
        onUploadProgress: (pct) => {
          setStageIndex(pct >= 100 ? 1 : 0);
        },
      });
      setPhase('processing');
      setStageIndex(PIPELINE_STAGES.length - 2);
      // Brief moment to represent the final "saving mission" step completing.
      await new Promise((r) => setTimeout(r, 250));
      setStageIndex(PIPELINE_STAGES.length);
      setResult(analysis);
      setPhase('done');
    } catch (err) {
      setError(err);
      setPhase('error');
    }
  }, [selected]);

  return (
    <div className="pb-16">
      <PageHeader
        title="Sonar Analysis"
        description="Upload a side-scan sonar frame for AI-assisted anomaly detection."
      />

      <div className="px-6 space-y-6">
        {phase === 'idle' || phase === 'error' ? (
          <>
            <UploadDropzone selected={selected} onSelect={setSelected} />

            {phase === 'error' && (
              <ErrorState error={error} />
            )}

            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={handleAnalyze} disabled={!selected}>
                <ScanLine size={16} />
                Analyze Sonar
              </button>
              <button className="btn-secondary" onClick={reset} disabled={!selected}>
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </>
        ) : null}

        {(phase === 'uploading' || phase === 'processing') && (
          <div className="panel p-6 max-w-md">
            <h2 className="text-sm font-medium text-slate-200 mb-4">Analyzing sonar frame…</h2>
            <ProcessingPipeline activeIndex={stageIndex} />
          </div>
        )}

        {phase === 'done' && result && (
          <AnalysisResults result={result} onReset={reset} />
        )}
      </div>
    </div>
  );
}

function AnalysisResults({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnalysisModeBadge mode={result.analysis_mode} model={result.model} />
        <div className="flex items-center gap-3">
          {result.processing_time_ms != null && (
            <span className="text-xs text-slate-500 font-mono">
              Processed in {result.processing_time_ms.toLocaleString()}ms
            </span>
          )}
          <button className="btn-secondary" onClick={onReset}>
            <RotateCcw size={15} />
            New analysis
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Preprocessing</h2>
        <PreprocessingViewer images={result.images} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Detection result</h2>
        <DetectionSplitView images={result.images} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Detection summary</h2>
        <DetectionTable detections={result.detections} />
      </section>

      <ShadowExplanationPanel />

      <div className="panel p-4 text-xs text-slate-500">
        Risk score is an operational prioritization aid, not a certified maritime safety assessment.
      </div>
    </div>
  );
}
