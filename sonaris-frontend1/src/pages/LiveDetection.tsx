import { useCallback, useState } from 'react';
import { PlayCircle, RotateCcw } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { ProcessingPipeline, PIPELINE_STAGES } from '../components/sonar/ProcessingPipeline';
import { PreprocessingViewer } from '../components/sonar/PreprocessingViewer';
import { DetectionSplitView } from '../components/detection/DetectionSplitView';
import { DetectionTable } from '../components/detection/DetectionTable';
import { AnalysisModeBadge } from '../components/common/AnalysisModeBadge';
import { ErrorState } from '../components/common/States';
import { analyzeSonar } from '../services/api';
import type { AnalysisResult } from '../types/api';

type Phase = 'idle' | 'running' | 'done' | 'error';

const SAMPLE_IMAGE_PATH = '/demo/sample-sonar-frame.jpg';

/**
 * "Live" here means: run the standard demo workflow against a bundled
 * sample frame, through the real backend, so a judge or operator can see
 * the full pipeline without needing their own sonar file on hand. It is
 * always run in demo mode and always labeled as such — see honesty rules.
 */
export function LiveDetection() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(async () => {
    setPhase('running');
    setError(null);
    setStageIndex(0);

    try {
      const response = await fetch(SAMPLE_IMAGE_PATH);
      if (!response.ok) {
        throw new Error('Bundled sample sonar image is missing from public/demo.');
      }
      const blob = await response.blob();
      const file = new File([blob], 'sample-sonar-frame.jpg', { type: blob.type || 'image/jpeg' });

      const analysis = await analyzeSonar(file, {
        demo: true,
        onUploadProgress: (pct) => setStageIndex(pct >= 100 ? 1 : 0),
      });
      setStageIndex(PIPELINE_STAGES.length - 2);
      await new Promise((r) => setTimeout(r, 200));
      setStageIndex(PIPELINE_STAGES.length);
      setResult(analysis);
      setPhase('done');
    } catch (err) {
      setError(err);
      setPhase('error');
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setResult(null);
    setError(null);
    setStageIndex(0);
  }, []);

  return (
    <div className="pb-16">
      <PageHeader
        title="Live Detection"
        description="Run the full detection pipeline against a bundled sample frame — useful for demos when no sonar file is on hand."
      />

      <div className="px-6 space-y-6">
        {phase === 'idle' && (
          <div className="panel p-6 max-w-lg flex flex-col gap-4">
            <p className="text-sm text-slate-400">
              This runs the standard analysis pipeline against a bundled sample sonar image through the live
              backend. Results will always be labeled <span className="text-amber-400 font-medium">DEMO INFERENCE</span>.
            </p>
            <button className="btn-primary self-start" onClick={run}>
              <PlayCircle size={16} />
              Start Live Demo
            </button>
          </div>
        )}

        {phase === 'error' && (
          <>
            <ErrorState error={String(error)} onRetry={run} />
          </>
        )}

        {phase === 'running' && (
          <div className="panel p-6 max-w-md">
            <h2 className="text-sm font-medium text-slate-200 mb-4">Running sample analysis…</h2>
            <ProcessingPipeline activeIndex={stageIndex} />
          </div>
        )}

        {phase === 'done' && result && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AnalysisModeBadge mode={result.analysis_mode} model={result.model} />
              <button className="btn-secondary" onClick={reset}>
                <RotateCcw size={15} />
                Run again
              </button>
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
          </div>
        )}
      </div>
    </div>
  );
}
