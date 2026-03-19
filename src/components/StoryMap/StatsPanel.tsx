import type { AppData } from '../../types';

interface StatsPanelProps {
  data: AppData;
}

export function StatsPanel({ data }: StatsPanelProps) {
  const { meta, lexicon } = data;
  const totalFrontier = Object.values(lexicon).filter(e => e.stories_about.length === 0).length;
  const totalExpanded = Object.values(lexicon).filter(e => e.stories_about.length > 0).length;
  const pctExplored = meta.total_words > 0
    ? Math.round((totalExpanded / meta.total_words) * 100)
    : 0;

  const stats = [
    { label: 'stories', value: meta.total_stories },
    { label: 'nonce words', value: meta.total_words },
    { label: 'concepts found', value: meta.total_concepts_discovered },
    { label: 'max depth', value: meta.max_depth },
    { label: 'frontier', value: totalFrontier },
    { label: '% explored', value: `${pctExplored}%` },
  ];

  return (
    <div className="border-t border-stone-300 bg-stone-100 px-5 py-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {stats.map(s => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-semibold text-stone-800">{s.value}</span>
            <span className="text-[10px] text-stone-500 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
