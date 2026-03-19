import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppData } from '../../types';

interface WordTrailProps {
  lemma: string;
  x: number;
  y: number;
  data: AppData;
  morphForms: Record<string, string[]>;
  onNavigate: (storyId: string, highlight?: string) => void;
  onClose: () => void;
}

const POS_LABEL: Record<string, string> = {
  noun: 'noun', verb: 'verb', adjective: 'adj', adverb: 'adv',
  'adjective/noun': 'adj/n', 'noun/verb': 'n/v',
};

export function WordTrail({ lemma, x, y, data, morphForms, onNavigate, onClose }: WordTrailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const entry = data.lexicon[lemma];

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Constrain popup to viewport
  const popupW = 280;
  const popupH = 320;
  const left = Math.min(x + 8, window.innerWidth - popupW - 12);
  const top  = Math.min(y + 8, window.innerHeight - popupH - 12);

  if (!entry) return null;

  const forms   = morphForms[lemma] ?? [lemma];
  const pos     = POS_LABEL[entry.pos] ?? entry.pos;
  const storyLinks = entry.appears_in ?? [];
  const childStories = entry.stories_about ?? [];
  const isExpanded = childStories.length > 0;

  const handleGoToStory = (storyId: string) => {
    onClose();
    onNavigate(storyId, lemma);
  };

  const handleTraceInMap = () => {
    onClose();
    navigate('/map', { state: { highlight: lemma } });
  };

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, zIndex: 300, width: popupW }}
      className="bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
        <div>
          <span className="font-mono text-[1rem] text-amber-800">{lemma}</span>
          <span className="ml-2 text-[10px] font-mono bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">{pos}</span>
          {isExpanded && (
            <span className="ml-1.5 text-[10px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">expanded</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 text-sm font-mono ml-2 mt-0.5"
          aria-label="Close"
        >✕</button>
      </div>

      <div className="px-4 py-3 space-y-3 max-h-[260px] overflow-y-auto">
        {/* Morphological forms */}
        {forms.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">Forms in text</p>
            <div className="flex flex-wrap gap-1">
              {forms.map(f => (
                <span key={f} className="font-mono text-[11px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Story appearances */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
            Appears in {storyLinks.length} {storyLinks.length === 1 ? 'story' : 'stories'}
          </p>
          <ul className="space-y-0.5">
            {storyLinks.map(sid => {
              const label = data.breadcrumb_labels[sid] ?? sid;
              return (
                <li key={sid}>
                  <button
                    onClick={() => handleGoToStory(sid)}
                    className="font-mono text-[11px] text-amber-700 hover:text-amber-900 hover:underline transition-colors"
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Child stories (expansions) */}
        {isExpanded && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">Expanded in</p>
            <ul className="space-y-0.5">
              {childStories.map(sid => {
                const label = data.breadcrumb_labels[sid] ?? sid;
                return (
                  <li key={sid}>
                    <button
                      onClick={() => handleGoToStory(sid)}
                      className="font-mono text-[11px] text-stone-600 hover:text-stone-900 hover:underline transition-colors"
                    >
                      ↳ {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Footer: trace button */}
      <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50">
        <button
          onClick={handleTraceInMap}
          className="text-[10px] font-mono text-stone-500 hover:text-stone-800 transition-colors"
        >
          ◎ trace in story map
        </button>
      </div>
    </div>
  );
}
