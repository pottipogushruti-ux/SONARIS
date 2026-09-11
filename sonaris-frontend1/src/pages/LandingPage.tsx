import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, MapPinned, Radar, Waves, MapPin, BrainCircuit, ClipboardCheck } from 'lucide-react';
import { SonarisLogo } from '../components/layout/SonarisLogo';
import { useJudgeMode } from '../components/judge/JudgeModeContext';

export function LandingPage() {
  const { start } = useJudgeMode();

  return (
    <div className="min-h-screen bg-abyss-950 sonar-grid-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <SonarisLogo />
        <Link to="/dashboard" className="btn-ghost">
          Enter platform
          <ArrowRight size={15} />
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-16 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-signal-400 uppercase">
          Smart India Hackathon · SIH26057
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold text-slate-100 leading-tight">
          From side-scan sonar<br className="hidden sm:block" /> to actionable intelligence.
        </h1>
        <p className="mt-5 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          SONARIS assists operators in identifying and prioritizing possible underwater anomalies
          from side-scan sonar imagery.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/sonar-analysis" className="btn-primary w-full sm:w-auto">
            <Waves size={16} />
            Analyze Sonar
          </Link>
          <button onClick={start} className="btn-secondary w-full sm:w-auto">
            <Gavel size={16} />
            Start Judge Demo
          </button>
          <Link to="/case-studies" className="btn-secondary w-full sm:w-auto">
            <MapPinned size={16} />
            Explore Real Missions
          </Link>
        </div>
      </section>

      {/* Workflow strip */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="panel p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 items-stretch">
            <FlowStep icon={Waves} label="Raw sonar" />
            <FlowArrow />
            <FlowStep icon={BrainCircuit} label="AI" />
            <FlowArrow />
            <FlowStep icon={MapPin} label="Location" />
            <FlowArrow />
            <FlowStep icon={ClipboardCheck} label="Decision" />
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <div className="space-y-1">
          <p className="text-lg sm:text-xl font-medium text-slate-200">See the unseen.</p>
          <p className="text-lg sm:text-xl font-medium text-slate-200">Filter the noise.</p>
          <p className="text-lg sm:text-xl font-medium text-signal-400">Find the hazard.</p>
        </div>
      </section>

      {/* Honesty note */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="panel p-5 flex items-start gap-3">
          <Radar size={18} className="text-signal-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400 leading-relaxed">
            Every result in SONARIS is labeled as either <span className="text-signal-400 font-medium">AI inference</span> or{' '}
            <span className="text-amber-400 font-medium">demo inference</span>, and every coordinate is labeled as real,
            simulated, or unavailable. Nothing is presented as a live model result unless it came from the model.
          </p>
        </div>
      </section>

      <footer className="border-t border-abyss-700 px-6 py-6 text-center text-xs text-slate-600">
        SONARIS — AI-Powered Underwater Anomaly Detection · SIH26057
      </footer>
    </div>
  );
}

function FlowStep({ icon: Icon, label }: { icon: typeof Waves; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-signal-500/30 bg-abyss-850 text-signal-400">
        <Icon size={18} />
      </div>
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-abyss-600 sm:rotate-0 rotate-90">
      <ArrowRight size={18} />
    </div>
  );
}
