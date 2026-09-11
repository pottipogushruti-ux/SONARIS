import { Database, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

interface Dataset {
  name: string;
  purpose: string;
  classes: string;
  license: string;
  source: string;
  sourceUrl: string;
}

const DATASETS: Dataset[] = [
  {
    name: 'AI4Shipwrecks',
    purpose: 'Side-scan sonar imagery of Great Lakes shipwrecks for automated detection research.',
    classes: 'Shipwreck / no-shipwreck (object-level annotations on sonar mosaics)',
    license: 'Research use — see project page for current terms',
    source: 'University of Michigan',
    sourceUrl: 'https://ai4shipwrecks.github.io',
  },
  {
    name: 'DRISHTI-SSS',
    purpose: 'Side-scan sonar dataset curated for underwater target/anomaly detection research in Indian waters context.',
    classes: 'Varies by release — see dataset documentation',
    license: 'See dataset documentation for current terms',
    source: 'Dataset publisher (see documentation)',
    sourceUrl: '#',
  },
];

export function DataAI() {
  return (
    <div className="pb-16">
      <PageHeader
        title="Data & AI"
        description="Datasets referenced for this problem domain, and what SONARIS does and does not claim about training."
      />

      <div className="px-6 space-y-6">
        <div className="panel p-4 flex items-start gap-3">
          <ShieldCheck size={17} className="text-signal-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            SONARIS does not claim to have been trained on a dataset unless that has actually been done by the
            model team and confirmed by the backend. Datasets listed here describe the problem domain and
            legally usable sources — not a guaranteed training pedigree.
          </p>
        </div>

        <div className="space-y-4">
          {DATASETS.map((d) => (
            <DatasetCard key={d.name} dataset={d} />
          ))}
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 text-slate-200 font-medium text-sm mb-2">
            <Database size={16} className="text-signal-500" />
            Other legally usable datasets
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Additional side-scan sonar datasets exist from academic and government marine survey programs.
            Any dataset actually used for training or evaluation should be listed here by name, class list,
            size, and license once confirmed by the model/backend team — placeholders are not added in their
            place.
          </p>
        </div>
      </div>
    </div>
  );
}

function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <div className="panel p-5">
      <h2 className="text-sm font-semibold text-slate-100">{dataset.name}</h2>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Field term="Purpose" value={dataset.purpose} />
        <Field term="Classes" value={dataset.classes} />
        <Field term="License" value={dataset.license} />
        <Field term="Source" value={dataset.source} />
      </dl>
    </div>
  );
}

function Field({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="field-label">{term}</dt>
      <dd className="mt-0.5 text-slate-400">{value}</dd>
    </div>
  );
}
