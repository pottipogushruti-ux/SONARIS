import { Waves } from 'lucide-react';

export function ShadowExplanationPanel() {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
        <Waves size={16} className="text-signal-500" />
        Why is there a shadow?
      </div>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">
        Hard underwater objects can reflect strong acoustic energy and create an acoustic shadow behind them.
        SONARIS can consider both an object's appearance and its acoustic shadow or surrounding context when
        forming a detection — but shadow interpretation is not perfect, and faint or irregular shadows can still
        be missed or misread.
      </p>
    </div>
  );
}
