import { Link } from 'react-router-dom';

export function SonarisLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-signal-500/40 bg-abyss-850 shrink-0">
        <span className="absolute inline-block h-2 w-2 rounded-full bg-signal-400" />
        <span className="absolute inline-block h-2 w-2 rounded-full bg-signal-400 animate-pulseRing" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-semibold tracking-wide text-slate-100 text-[15px]">SONARIS</span>
          <span className="text-[10px] text-slate-500 tracking-wide">underwater anomaly detection</span>
        </span>
      )}
      {compact && <span className="font-semibold tracking-wide text-slate-100 text-sm">SONARIS</span>}
    </Link>
  );
}
