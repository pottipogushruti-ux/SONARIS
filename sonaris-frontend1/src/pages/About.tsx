import { Radar, Waves, ShieldCheck, Users } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

export function About() {
  return (
    <div className="pb-16">
      <PageHeader title="About SONARIS" />

      <div className="px-6 max-w-3xl space-y-6">
        <div className="panel p-6 sm:p-8">
          <div className="flex items-center gap-2 text-signal-400 text-xs font-medium uppercase tracking-wider mb-3">
            <Radar size={14} />
            Smart India Hackathon · SIH26057
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            AI-Powered Underwater Anomaly Detection
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            SONARIS assists operators in identifying and prioritizing possible underwater anomalies from
            side-scan sonar imagery. It is built as an assistive triage tool for a human-in-the-loop
            workflow — the system surfaces candidates and priorities, and a trained operator makes the
            final call on every detection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ValueCard icon={Waves} title="See the unseen" desc="Surface faint returns in noisy, low-contrast sonar frames." />
          <ValueCard icon={Radar} title="Filter the noise" desc="Prioritize candidates by risk so operators focus where it matters." />
          <ValueCard icon={ShieldCheck} title="Find the hazard" desc="Support faster, more consistent hazard identification at scale." />
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2 text-slate-200 font-medium text-sm mb-2">
            <Users size={16} className="text-signal-500" />
            Human-in-the-loop by design
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every AI detection carries a confidence score and a risk level, and remains in an unverified
            state until a human operator confirms, rejects, or escalates it for expert review. SONARIS never
            represents an unverified detection as a confirmed hazard, and never represents demo results as
            live field data.
          </p>
        </div>

        <div className="panel p-6">
          <h2 className="field-label mb-2">Scope and limitations</h2>
          <ul className="list-disc list-inside text-sm text-slate-400 space-y-1.5">
            <li>Confidence scores reflect model certainty, not proof an object is present.</li>
            <li>Risk levels are an operational prioritization aid, not a certified maritime safety assessment.</li>
            <li>Case studies describe real historical incidents SONARIS was not involved in.</li>
            <li>Demo mode and demo data are always visibly labeled and never mixed with live results.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }: { icon: typeof Waves; title: string; desc: string }) {
  return (
    <div className="panel p-5">
      <Icon size={18} className="text-signal-500 mb-2" />
      <h3 className="text-sm font-medium text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
