import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface JudgeStep {
  key: string;
  title: string;
  body: string;
  path: string;
}

export const JUDGE_STEPS: JudgeStep[] = [
  {
    key: 'problem',
    title: '1 · The problem',
    body: 'Side-scan sonar surveys generate huge volumes of imagery. Operators must manually scan every frame for shipwrecks, debris, and hazards — slow, fatiguing, and easy to miss things in.',
    path: '/dashboard',
  },
  {
    key: 'input',
    title: '2 · The input',
    body: 'SONARIS accepts raw side-scan sonar images — the same noisy, low-contrast frames an operator would review by eye.',
    path: '/sonar-analysis',
  },
  {
    key: 'preprocessing',
    title: '3 · Preprocessing',
    body: 'Before detection, SONARIS denoises, enhances contrast, and normalizes the frame so faint returns become visible.',
    path: '/sonar-analysis',
  },
  {
    key: 'ai',
    title: '4 · The AI',
    body: 'A detection model scans the processed frame for candidate objects. Every result is clearly labeled AI INFERENCE or DEMO INFERENCE — never blurred together.',
    path: '/sonar-analysis',
  },
  {
    key: 'result',
    title: '5 · The result',
    body: 'Detections are drawn as bounding boxes on the annotated frame, next to the original, so the operator can compare directly.',
    path: '/sonar-analysis',
  },
  {
    key: 'location',
    title: '6 · Location',
    body: 'When real coordinates exist, detections are geo-tagged on the mission map. If a coordinate is simulated or missing, SONARIS says so — it never invents a position.',
    path: '/mission-map',
  },
  {
    key: 'risk',
    title: '7 · Risk',
    body: 'Each detection gets a HIGH / MEDIUM / LOW operational priority — a triage aid for operators, not a certified maritime safety assessment.',
    path: '/sonar-analysis',
  },
  {
    key: 'verification',
    title: '8 · Human verification',
    body: 'A human operator confirms, rejects, or flags each detection for expert review. The AI proposes; a person decides.',
    path: '/sonar-analysis',
  },
  {
    key: 'report',
    title: '9 · Report',
    body: 'Every mission can be exported as a PDF, CSV, or JSON report for logging, handoff, or further analysis.',
    path: '/reports',
  },
  {
    key: 'relevance',
    title: '10 · Real-world relevance',
    body: 'Underwater hazard identification matters for port safety, wreck salvage, pipeline inspection, and disaster response — see Case Studies for real historical incidents.',
    path: '/case-studies',
  },
  {
    key: 'impact',
    title: '11 · Impact',
    body: 'By triaging sonar imagery automatically, SONARIS lets a small survey team cover more ground and focus expert attention where it matters most.',
    path: '/about',
  },
];

interface JudgeModeContextValue {
  active: boolean;
  stepIndex: number;
  currentStep: JudgeStep;
  start: () => void;
  exit: () => void;
  next: () => void;
  back: () => void;
}

const JudgeModeContext = createContext<JudgeModeContextValue | null>(null);

export function JudgeModeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
    navigate(JUDGE_STEPS[0].path);
  }, [navigate]);

  const exit = useCallback(() => setActive(false), []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      const nextIndex = Math.min(i + 1, JUDGE_STEPS.length - 1);
      navigate(JUDGE_STEPS[nextIndex].path);
      return nextIndex;
    });
  }, [navigate]);

  const back = useCallback(() => {
    setStepIndex((i) => {
      const prevIndex = Math.max(i - 1, 0);
      navigate(JUDGE_STEPS[prevIndex].path);
      return prevIndex;
    });
  }, [navigate]);

  const value = useMemo(
    () => ({ active, stepIndex, currentStep: JUDGE_STEPS[stepIndex], start, exit, next, back }),
    [active, stepIndex, start, exit, next, back]
  );

  return <JudgeModeContext.Provider value={value}>{children}</JudgeModeContext.Provider>;
}

export function useJudgeMode() {
  const ctx = useContext(JudgeModeContext);
  if (!ctx) throw new Error('useJudgeMode must be used within JudgeModeProvider');
  return ctx;
}
