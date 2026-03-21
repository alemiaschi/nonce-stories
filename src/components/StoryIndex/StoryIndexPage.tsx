import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppData } from '../../types';
import { computeStoryStats } from '../../utils/storyStats';

interface StoryIndexPageProps {
  data: AppData;
}

type SortCol = 'id' | 'depth' | 'week' | 'words' | 'density' | 'expanded' | 'frontier';
type SortDir = 'asc' | 'desc';

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-stone-100 text-stone-500',
  dead:   'bg-stone-200 text-stone-500 line-through',
};

export function StoryIndexPage({ data }: StoryIndexPageProps) {
  const navigate = useNavigate();

  const [sortCol, setSortCol] = useState<SortCol>('depth');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterDepth, setFilterDepth] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWeekMin, setFilterWeekMin] = useState<number>(0);

  const maxDepth = useMemo(() => Math.max(...Object.values(data.stories).map(s => s.depth), 0), [data]);
  const maxWeek  = useMemo(() => Math.max(...Object.values(data.stories).map(s => s.week), 0), [data]);

  const rows = useMemo(() => {
    let list = Object.values(data.stories).map(story => ({
      story,
      stats: computeStoryStats(story),
    }));

    if (filterDepth !== 'all') list = list.filter(r => r.story.depth === filterDepth);
    if (filterStatus !== 'all') list = list.filter(r => (r.story.status ?? 'active') === filterStatus);
    if (filterWeekMin > 0) list = list.filter(r => r.story.week >= filterWeekMin);

    list.sort((a, b) => {
      let v = 0;
      switch (sortCol) {
        case 'id':       v = a.story.id.localeCompare(b.story.id); break;
        case 'depth':    v = a.story.depth - b.story.depth; break;
        case 'week':     v = a.story.week - b.story.week; break;
        case 'words':    v = a.stats.wordCount - b.stats.wordCount; break;
        case 'density':  v = a.stats.nonceDensity - b.stats.nonceDensity; break;
        case 'expanded': v = a.stats.expandedChildren - b.stats.expandedChildren; break;
        case 'frontier': v = a.stats.frontierChildren - b.stats.frontierChildren; break;
      }
      return sortDir === 'asc' ? v : -v;
    });

    return list;
  }, [data, sortCol, sortDir, filterDepth, filterStatus, filterWeekMin]);

  const handleSort = (col: SortCol) => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleOpen = (storyId: string) => {
    navigate('/read', { state: { storyId } });
  };

  const arrow = (col: SortCol) =>
    sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const chipBase = 'px-2.5 py-1 rounded text-[10px] font-mono tracking-wide cursor-pointer transition-colors';
  const chipOn   = `${chipBase} bg-stone-700 text-stone-100`;
  const chipOff  = `${chipBase} bg-stone-100 text-stone-500 hover:bg-stone-200`;

  const thCls = (col: SortCol) =>
    `px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
      sortCol === col ? 'text-stone-700' : 'text-stone-400 hover:text-stone-600'
    }`;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h2 className="font-serif text-2xl text-stone-700 mb-1">Story Index</h2>
          <p className="font-serif text-sm text-stone-400 italic">
            All stories in the tree — click any row to read it.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Depth</span>
            <button onClick={() => setFilterDepth('all')} className={filterDepth === 'all' ? chipOn : chipOff}>all</button>
            {Array.from({ length: maxDepth + 1 }, (_, i) => i).map(d => (
              <button key={d} onClick={() => setFilterDepth(d)} className={filterDepth === d ? chipOn : chipOff}>{d}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Status</span>
            {['all', 'active', 'dead'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? chipOn : chipOff}>{s}</button>
            ))}
          </div>
          {maxWeek > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">From week</span>
              <input
                type="number" min={0} max={maxWeek} value={filterWeekMin}
                onChange={e => setFilterWeekMin(Number(e.target.value))}
                className="w-14 border border-stone-300 rounded bg-white text-stone-700 font-mono text-xs px-2 py-1 focus:outline-none focus:border-stone-500"
              />
            </div>
          )}
        </div>

        <p className="text-[11px] font-mono text-stone-400 mb-3">{rows.length} {rows.length === 1 ? 'story' : 'stories'}</p>

        {/* Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className={thCls('id')} onClick={() => handleSort('id')}>Story{arrow('id')}</th>
                <th className={thCls('depth')} onClick={() => handleSort('depth')}>Depth{arrow('depth')}</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-stone-400">Parent</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-stone-400">Expands</th>
                <th className={thCls('week')} onClick={() => handleSort('week')}>Week{arrow('week')}</th>
                <th className={thCls('words')} onClick={() => handleSort('words')}>Words{arrow('words')}</th>
                <th className={thCls('density')} onClick={() => handleSort('density')}>Nonce %{arrow('density')}</th>
                <th className={thCls('expanded')} onClick={() => handleSort('expanded')}>Exp{arrow('expanded')}</th>
                <th className={thCls('frontier')} onClick={() => handleSort('frontier')}>Front{arrow('frontier')}</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-stone-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ story, stats }, i) => {
                const parentLabel = story.parent
                  ? (data.breadcrumb_labels[story.parent] ?? story.parent)
                  : '—';
                const status = story.status ?? 'active';

                return (
                  <tr
                    key={story.id}
                    onClick={() => handleOpen(story.id)}
                    className={`border-b border-stone-100 cursor-pointer transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                    } hover:bg-amber-50/40`}
                  >
                    <td className="px-3 py-2.5 font-mono text-[11px] text-amber-700 whitespace-nowrap">
                      {data.breadcrumb_labels[story.id] ?? story.id}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">{story.depth}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-400 whitespace-nowrap">{parentLabel}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">
                      {story.parent_word ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">{story.week}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">{stats.wordCount}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">
                      {(stats.nonceDensity * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">{stats.expandedChildren}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">{stats.frontierChildren}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${STATUS_STYLE[status] ?? 'bg-stone-100 text-stone-400'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center font-serif italic text-stone-400">
                    No stories match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
