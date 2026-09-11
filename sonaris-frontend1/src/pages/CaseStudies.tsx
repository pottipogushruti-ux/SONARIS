import { ExternalLink, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

interface CaseStudy {
  name: string;
  date: string;
  location: string;
  whatHappened: string;
  whySonar: string;
  howSonarWasUsed: string;
  howSonarisCouldAssist: string;
  source: string;
  sourceUrl: string;
}

/**
 * These are real, independently documented incidents. SONARIS was not
 * involved in any of them — the case studies illustrate the domain SONARIS
 * is built for, not a track record. Do not alter this framing.
 */
const CASE_STUDIES: CaseStudy[] = [
  {
    name: 'MV Dali — Francis Scott Key Bridge collapse',
    date: '26 March 2024',
    location: 'Patapsco River, Baltimore, Maryland, USA',
    whatHappened:
      'A container ship lost power and struck a bridge support, collapsing the Francis Scott Key Bridge into the river and blocking the shipping channel with wreckage.',
    whySonar:
      'Divers could not safely inspect murky river water full of twisted steel and concrete, so responders needed a way to map submerged debris before recovery and channel-clearing work could begin.',
    howSonarWasUsed:
      'Survey teams used side-scan and multibeam sonar to map the collapsed structure and wreckage field on the riverbed, guiding salvage and channel-reopening operations.',
    howSonarisCouldAssist:
      'In a similar debris field, automated triage of sonar frames could help operators quickly flag likely hazards, prioritize survey passes, and reduce the manual review burden during a time-critical channel reopening.',
    source: 'U.S. Army Corps of Engineers / news coverage of the response effort',
    sourceUrl: 'https://www.usace.army.mil',
  },
  {
    name: 'Titanic wreck site surveys',
    date: 'Ongoing since 1985',
    location: 'North Atlantic Ocean, ~3,800m depth',
    whatHappened:
      'The wreck of RMS Titanic, lost in 1912, has been the subject of repeated deep-sea survey expeditions to document its condition and surroundings.',
    whySonar:
      'At extreme depth with no natural light, side-scan and synthetic-aperture sonar are essential for locating and mapping the wreck and its debris field before any visual or ROV work.',
    howSonarWasUsed:
      "Sonar surveys have mapped the wreck's two main sections and scattered debris field, tracking structural decay over decades of expeditions.",
    howSonarisCouldAssist:
      'For a large, cluttered debris field like this one, automated anomaly flagging could help expedition teams prioritize which sonar contacts merit follow-up imaging or ROV inspection.',
    source: 'RMS Titanic Inc. / NOAA Ocean Exploration expedition reports',
    sourceUrl: 'https://oceanexplorer.noaa.gov',
  },
  {
    name: 'AI4Shipwrecks — Great Lakes shipwreck survey initiative',
    date: '2023 – ongoing',
    location: 'Lake Huron and other U.S. Great Lakes',
    whatHappened:
      'Researchers compiled a large dataset of side-scan sonar imagery covering known and suspected shipwrecks across the Great Lakes to support automated detection research.',
    whySonar:
      'The Great Lakes contain thousands of undiscovered wrecks; sonar survey is the practical way to scan large areas of lakebed for hazards and historical sites.',
    howSonarWasUsed:
      'Side-scan sonar surveys generated the imagery, which was then labeled to build a public benchmark dataset for shipwreck detection research.',
    howSonarisCouldAssist:
      'This is the kind of dataset SONARIS-style detection pipelines are evaluated against — see the Data & AI page for how it may factor into training or benchmarking.',
    source: 'University of Michigan — AI4Shipwrecks project',
    sourceUrl: 'https://ai4shipwrecks.github.io',
  },
];

export function CaseStudies() {
  return (
    <div className="pb-16">
      <PageHeader
        title="Case Studies"
        description="Real, independently documented incidents that illustrate why underwater sonar survey matters."
      />

      <div className="px-6">
        <div className="panel p-4 mb-6 flex items-start gap-3">
          <ShieldAlert size={17} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            These are real historical cases, sourced independently.{' '}
            <span className="text-slate-200 font-medium">SONARIS was not used in any of them.</span> They are
            included to show the kind of problem SONARIS is designed to help with.
          </p>
        </div>

        <div className="space-y-5">
          {CASE_STUDIES.map((c) => (
            <CaseStudyCard key={c.name} study={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <article className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="badge border-slate-500/40 bg-slate-500/10 text-slate-300">REAL CASE</span>
      </div>
      <h2 className="text-base font-semibold text-slate-100">{study.name}</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        {study.date} · {study.location}
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <Field term="What happened" desc={study.whatHappened} />
        <Field term="Why sonar was needed" desc={study.whySonar} />
        <Field term="How sonar was used" desc={study.howSonarWasUsed} />
        <Field term="How SONARIS could assist in a similar case" desc={study.howSonarisCouldAssist} />
      </dl>

      <div className="mt-4 pt-4 divider flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-600">Source: {study.source}</span>
        <a
          href={study.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="link-inline text-xs flex items-center gap-1"
        >
          View source
          <ExternalLink size={11} />
        </a>
      </div>
    </article>
  );
}

function Field({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt className="field-label">{term}</dt>
      <dd className="mt-1 text-slate-400 leading-relaxed">{desc}</dd>
    </div>
  );
}
