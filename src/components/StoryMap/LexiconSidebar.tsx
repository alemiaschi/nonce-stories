import { useState, useMemo } from 'react';
import type { AppData } from '../../types';

interface LexiconSidebarProps {
  data: AppData;
  onNavigate: (storyId: string) => void;
  highlightedWord?: string | null;
  onHighlight: (word: string | null) => void;
}

const POS_ABBR: Record<string, string> = {
  noun: 'n',
  verb: 'v',
  adjective: 'adj',
  'adjective/noun': 'adj/n',
  'noun/verb': 'n/v',
  adverb: 'adv',
};

export function LexiconSidebar({ data, onNavigate, highlightedWord, onHighlight }: LexiconSidebarProps) {
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const all = Object.values(data.lexicon).sort((a, b) => a.id.localeCompare(b.id));
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(e => e.id.includes(q) || e.pos.includes(q));
  }, [data.lexicon, query]);

  return (
    <aside className="w-56 border-r border-stone-300 flex flex-col bg-stone-100 shrink-0">
      <div className="px-4 pt-4 pb-3 border-b border-stone-300">
        <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-2 font-mono font-medium">Lexicon</p>
        <input
          type="text"
          placeholder="search words…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full text-xs bg-white border border-stone-300 rounded px-2 py-1.5 font-mono text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {entries.map(entry => {
          const isHighlighted = highlightedWord === entry.id;
          const hasStory = entry.stories_about.length > 0;

          return (
            <div
              key={entry.id}
              className={`px-4 py-2 cursor-pointer flex items-baseline justify-between gap-2 transition-colors group
                ${isHighlighted ? 'bg-amber-100 border-l-2 border-amber-500' : 'border-l-2 border-transparent hover:bg-stone-200'}`}
              onClick={() => onHighlight(isHighlighted ? null : entry.id)}
            >
              <span className={`font-mono text-xs truncate ${hasStory ? 'text-amber-800 font-medium' : 'text-stone-700'}`}>
                {entry.id}
              </span>
              <span className="text-[10px] text-stone-500 shrink-0 font-mono">
                {POS_ABBR[entry.pos] ?? entry.pos}
              </span>
            </div>
          );
        })}
      </div>

      {/* Jump-to panel when a word is highlighted */}
      {highlightedWord && data.lexicon[highlightedWord] && (() => {
        const entry = data.lexicon[highlightedWord];
        return (
          <div className="border-t border-stone-300 px-4 py-3 bg-amber-50">
            <p className="font-mono text-xs text-stone-800 font-semibold mb-1">{entry.id}</p>
            <p className="text-[10px] text-stone-600 mb-2">{entry.pos} · depth {entry.depth_introduced}</p>
            {entry.stories_about.length > 0 && (
              <div className="space-y-1">
                {entry.stories_about.map(sid => (
                  <button
                    key={sid}
                    onClick={() => onNavigate(sid)}
                    className="block w-full text-left text-[10px] font-mono text-amber-700 hover:text-amber-900 truncate font-medium"
                  >
                    → {sid}
                  </button>
                ))}
              </div>
            )}
            {entry.stories_about.length === 0 && (
              <p className="text-[10px] text-stone-500 italic">not yet expanded</p>
            )}
          </div>
        );
      })()}
    </aside>
  );
}
