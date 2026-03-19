import { useState, useMemo } from 'react';
import type { AppData } from '../../types';
import {
  computeGoDeepPath,
  computeGoWidePath,
  computeLatestPath,
  computeRandomWalkPath,
  type ReadingPath,
} from '../../utils/readingPaths';

interface ReadingPathsProps {
  data: AppData;
  onNavigate: (storyId: string) => void;
}

export function ReadingPaths({ data, onNavigate }: ReadingPathsProps) {
  const [open, setOpen] = useState(false);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [randomPath, setRandomPath] = useState<ReadingPath | null>(null);

  const staticPaths = useMemo(() => [
    computeGoDeepPath(data),
    computeGoWidePath(data),
    computeLatestPath(data),
  ], [data]);

  const paths = randomPath ? [...staticPaths, randomPath] : staticPaths;

  const handleRandomize = () => {
    const p = computeRandomWalkPath(data);
    setRandomPath(p);
    setActivePathId('random');
  };

  const activePath = paths.find(p => p.id === activePathId) ?? null;

  const storyLabel = (sid: string) => data.breadcrumb_labels[sid] ?? sid;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-[10px] font-mono text-stone-400 hover:text-stone-700 transition-colors tracking-wide"
        title="Reading paths"
      >
        ↩ paths
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-50 w-72 bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Reading Paths</span>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-700 text-xs font-mono">✕</button>
          </div>

          {/* Path tabs */}
          <div className="flex border-b border-stone-100 overflow-x-auto">
            {staticPaths.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePathId(p.id)}
                className={`px-3 py-2 text-[10px] font-mono whitespace-nowrap transition-colors ${
                  activePathId === p.id
                    ? 'text-stone-800 border-b-2 border-stone-700 -mb-px'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={handleRandomize}
              className={`px-3 py-2 text-[10px] font-mono whitespace-nowrap transition-colors ${
                activePathId === 'random'
                  ? 'text-stone-800 border-b-2 border-stone-700 -mb-px'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Random ↻
            </button>
          </div>

          {/* Path content */}
          {activePath ? (
            <div className="max-h-64 overflow-y-auto">
              <p className="px-4 pt-3 pb-1 text-[10px] text-stone-400 font-serif italic">{activePath.description}</p>
              <ol className="px-4 pb-3 space-y-1">
                {activePath.storyIds.map((sid, i) => (
                  <li key={sid} className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-stone-300 w-4 shrink-0">{i + 1}</span>
                    <button
                      onClick={() => { onNavigate(sid); setOpen(false); }}
                      className="text-[11px] font-mono text-amber-700 hover:text-amber-900 hover:underline transition-colors text-left"
                    >
                      {storyLabel(sid)}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="px-4 py-4 text-[11px] text-stone-400 font-serif italic">
              Select a path above to see a reading sequence.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
