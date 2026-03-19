import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppData } from '../../types';
import { useMorphForms } from '../../utils/morphForms';

interface AtlasPageProps {
  data: AppData;
}

type SortKey = 'alpha' | 'frequency' | 'depth' | 'pos';
type FilterStatus = 'all' | 'expanded' | 'frontier';

const POS_ORDER = ['noun', 'verb', 'adjective', 'adverb', 'adjective/noun', 'noun/verb'];
const POS_SHORT: Record<string, string> = {
  noun: 'noun', verb: 'verb', adjective: 'adj', adverb: 'adv',
  'adjective/noun': 'adj/n', 'noun/verb': 'n/v',
};

export function AtlasPage({ data }: AtlasPageProps) {
  const navigate = useNavigate();
  const morphForms = useMorphForms(data);

  const [query, setQuery]         = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('alpha');
  const [filterPos, setFilterPos] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDepth, setFilterDepth]   = useState<number | 'all'>('all');

  const allPos = useMemo(() => {
    const seen = new Set(Object.values(data.lexicon).map(e => e.pos));
    return POS_ORDER.filter(p => seen.has(p));
  }, [data]);

  const maxDepth = useMemo(
    () => Math.max(...Object.values(data.lexicon).map(e => e.depth_introduced), 0),
    [data]
  );

  const entries = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = Object.entries(data.lexicon);

    if (q) {
      list = list.filter(([lemma, e]) => {
        const forms = morphForms[lemma] ?? [];
        return lemma.includes(q) || forms.some(f => f.includes(q));
      });
    }
    if (filterPos !== 'all') list = list.filter(([, e]) => e.pos === filterPos);
    if (filterStatus === 'expanded') list = list.filter(([, e]) => e.stories_about.length > 0);
    if (filterStatus === 'frontier') list = list.filter(([, e]) => e.stories_about.length === 0);
    if (filterDepth !== 'all') list = list.filter(([, e]) => e.depth_introduced === filterDepth);

    list.sort(([la, a], [lb, b]) => {
      switch (sortKey) {
        case 'alpha':     return la.localeCompare(lb);
        case 'frequency': return (b.appears_in.length - a.appears_in.length) || la.localeCompare(lb);
        case 'depth':     return (a.depth_introduced - b.depth_introduced) || la.localeCompare(lb);
        case 'pos':       return (POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos)) || la.localeCompare(lb);
      }
    });
    return list;
  }, [data, morphForms, query, sortKey, filterPos, filterStatus, filterDepth]);

  const handleGoToStory = (storyId: string, highlight: string) => {
    navigate('/', { state: { storyId, highlight } });
  };

  const inputCls = 'border border-stone-300 rounded bg-white text-stone-700 font-mono text-xs px-3 py-1.5 focus:outline-none focus:border-stone-500 transition-colors';
  const chipBase = 'px-2.5 py-1 rounded text-[10px] font-mono tracking-wide cursor-pointer transition-colors';
  const chipOn  = `${chipBase} bg-stone-700 text-stone-100`;
  const chipOff = `${chipBase} bg-stone-100 text-stone-500 hover:bg-stone-200`;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h2 className="font-serif text-2xl text-stone-700 mb-1">Word Atlas</h2>
          <p className="font-serif text-sm text-stone-400 italic">
            Every nonce word in the project — cross-references only, no definitions.
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-3 mb-8">
          <input
            type="search"
            placeholder="Search words or forms…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={`${inputCls} w-full py-2`}
          />

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Sort</span>
            {(['alpha', 'frequency', 'depth', 'pos'] as SortKey[]).map(k => (
              <button key={k} onClick={() => setSortKey(k)} className={sortKey === k ? chipOn : chipOff}>
                {k === 'alpha' ? 'A–Z' : k === 'frequency' ? 'freq' : k}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">POS</span>
            <button onClick={() => setFilterPos('all')} className={filterPos === 'all' ? chipOn : chipOff}>all</button>
            {allPos.map(p => (
              <button key={p} onClick={() => setFilterPos(p)} className={filterPos === p ? chipOn : chipOff}>
                {POS_SHORT[p] ?? p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Status</span>
            {(['all', 'expanded', 'frontier'] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? chipOn : chipOff}>{s}</button>
            ))}
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest ml-2">Depth</span>
            <button onClick={() => setFilterDepth('all')} className={filterDepth === 'all' ? chipOn : chipOff}>all</button>
            {Array.from({ length: maxDepth + 1 }, (_, i) => i).map(d => (
              <button key={d} onClick={() => setFilterDepth(d)} className={filterDepth === d ? chipOn : chipOff}>{d}</button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-[11px] font-mono text-stone-400 mb-4">
          {entries.length} {entries.length === 1 ? 'word' : 'words'}
        </p>

        {/* Word list */}
        <div className="space-y-px">
          {entries.map(([lemma, entry]) => {
            const forms   = morphForms[lemma] ?? [lemma];
            const pos     = POS_SHORT[entry.pos] ?? entry.pos;
            const isExpanded = entry.stories_about.length > 0;

            return (
              <div key={lemma} className="border border-stone-200 rounded-lg bg-white px-4 py-3 mb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Word + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[0.95rem] text-amber-800">{lemma}</span>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{pos}</span>
                    {isExpanded
                      ? <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">expanded</span>
                      : <span className="text-[10px] font-mono bg-stone-50 text-stone-400 px-1.5 py-0.5 rounded border border-stone-200">frontier</span>
                    }
                    <span className="text-[10px] font-mono text-stone-400">depth {entry.depth_introduced}</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {entry.appears_in.length} {entry.appears_in.length === 1 ? 'story' : 'stories'}
                  </span>
                </div>

                {/* Morphological forms */}
                {forms.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {forms.map(f => (
                      <span key={f} className="font-mono text-[10px] text-stone-500 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                )}

                {/* Story appearances */}
                {entry.appears_in.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="text-[10px] font-mono text-stone-400 self-center">appears in:</span>
                    {entry.appears_in.map(sid => {
                      const label = data.breadcrumb_labels[sid] ?? sid;
                      return (
                        <button
                          key={sid}
                          onClick={() => handleGoToStory(sid, lemma)}
                          className="text-[11px] font-mono text-amber-700 hover:text-amber-900 hover:underline transition-colors"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {entries.length === 0 && (
            <p className="text-center font-serif italic text-stone-400 py-12">
              No words match these filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
