import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppData, StoryToken } from '../../types';
import { computeClarity, clarityToStyle, type ClarityInfo } from '../../utils/clarity';

interface FogPageProps { data: AppData; }

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  word: string;
  lemma: string;
  clarity: ClarityInfo;
  childStory: string | null;
}

export function FogPage({ data }: FogPageProps) {
  const navigate = useNavigate();
  const stories = Object.values(data.stories);
  const [selectedId, setSelectedId] = useState('story_0');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const story = data.stories[selectedId];

  // Build paragraphs from tokens (split on \n\n)
  const paragraphs: StoryToken[][] = [];
  if (story) {
    let current: StoryToken[] = [];
    for (const token of story.tokens) {
      if (token.text === '\n\n') {
        if (current.length > 0) { paragraphs.push(current); current = []; }
      } else {
        current.push(token);
      }
    }
    if (current.length > 0) paragraphs.push(current);
  }

  // Compute clarity for all nonce tokens
  const clarityMap = new Map<string, ClarityInfo>(); // lemma → clarity
  if (story) {
    for (const token of story.tokens) {
      if (token.type === 'nonce') {
        const lemma = token.lemma ?? token.text.toLowerCase();
        if (!clarityMap.has(lemma)) {
          clarityMap.set(lemma, computeClarity(token.child_story, data));
        }
      }
    }
  }

  // Stats
  const allClarities = Array.from(clarityMap.values());
  const avgClarity = allClarities.length > 0
    ? allClarities.reduce((s, c) => s + c.score, 0) / allClarities.length
    : 0;
  const tiers = [
    { label: '0–0.25', count: allClarities.filter(c => c.score < 0.25).length },
    { label: '0.25–0.5', count: allClarities.filter(c => c.score >= 0.25 && c.score < 0.5).length },
    { label: '0.5–0.75', count: allClarities.filter(c => c.score >= 0.5 && c.score < 0.75).length },
    { label: '0.75–1.0', count: allClarities.filter(c => c.score >= 0.75).length },
  ];
  const emergingCount = allClarities.filter(c => c.score > 0).length;
  const emergingPct = allClarities.length > 0 ? Math.round(emergingCount / allClarities.length * 100) : 0;

  function handleTokenClick(token: StoryToken) {
    if (token.type !== 'nonce' || !token.child_story) return;
    navigate('/read', { state: { storyId: token.child_story } });
  }

  function handleTokenHover(e: React.MouseEvent, token: StoryToken) {
    if (token.type !== 'nonce') { setTooltip(null); return; }
    const lemma = token.lemma ?? token.text.toLowerCase();
    const clarity = clarityMap.get(lemma) ?? { score: 0, branchDepth: 0, coverage: 0, hasSubStory: false };
    const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      word: token.text,
      lemma,
      clarity,
      childStory: token.child_story ?? null,
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-2">Fog of Meaning</p>
        <h2 className="font-serif text-2xl text-stone-800 italic mb-3">What has solidified, and what remains mist</h2>
        <p className="text-sm text-stone-500 font-serif leading-relaxed">
          Each nonce word's visibility reflects how deeply its branch has been explored.
          Unexplored words recede into the fog. Thoroughly explored words emerge as solid ink.
        </p>
      </div>

      {/* Story selector */}
      {stories.length > 1 && (
        <div className="mb-8">
          <label className="font-mono text-[10px] uppercase tracking-widest text-stone-400 block mb-1.5">
            Story
          </label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="font-serif text-sm text-stone-700 bg-white border border-stone-200 rounded px-3 py-1.5 focus:outline-none focus:border-stone-400"
          >
            {stories.map(s => (
              <option key={s.id} value={s.id}>
                {data.breadcrumb_labels[s.id] ?? s.id} (depth {s.depth})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clarity legend */}
      <div className="mb-10">
        <div
          className="h-2 rounded-full mb-1.5"
          style={{
            background: 'linear-gradient(to right, rgba(120,113,108,0.15), rgba(28,25,23,1))',
          }}
        />
        <div className="flex justify-between text-[10px] font-mono text-stone-400">
          <span>unexplored</span>
          <span>fully explored</span>
        </div>
      </div>

      {/* Story text with fog effect */}
      {story ? (
        <div ref={containerRef} className="relative mb-12">
          {paragraphs.map((para, pi) => (
            <p key={pi} className="mb-7 leading-[1.9] text-[1.05rem]">
              {para.map((token, ti) => {
                if (token.type !== 'nonce') {
                  return (
                    <span key={ti} className="text-stone-800">
                      {token.text}
                    </span>
                  );
                }
                const lemma = token.lemma ?? token.text.toLowerCase();
                const clarity = clarityMap.get(lemma) ?? { score: 0, branchDepth: 0, coverage: 0, hasSubStory: false };
                const fogStyle = clarityToStyle(clarity.score);
                const isClickable = !!token.child_story;
                return (
                  <span
                    key={ti}
                    style={{
                      ...fogStyle,
                      fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
                      fontSize: '0.88em',
                      cursor: isClickable ? 'pointer' : 'default',
                      display: 'inline',
                    }}
                    onMouseMove={e => handleTokenHover(e, token)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => handleTokenClick(token)}
                  >
                    {token.text}
                  </span>
                );
              })}
            </p>
          ))}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 bg-stone-800 text-stone-100 rounded-lg shadow-xl px-3 py-2 pointer-events-none max-w-[200px]"
              style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
            >
              <p className="font-mono text-[11px] font-medium mb-0.5">{tooltip.word}</p>
              {tooltip.lemma !== tooltip.word.toLowerCase() && (
                <p className="font-mono text-[9px] text-stone-400 mb-1">lemma: {tooltip.lemma}</p>
              )}
              <p className="text-[10px] text-stone-300 mb-0.5">
                clarity: {(tooltip.clarity.score * 100).toFixed(0)}%
              </p>
              {tooltip.clarity.hasSubStory ? (
                <>
                  <p className="text-[10px] text-stone-400">depth: {tooltip.clarity.branchDepth}</p>
                  <p className="text-[10px] text-stone-400">coverage: {(tooltip.clarity.coverage * 100).toFixed(0)}%</p>
                  {tooltip.childStory && (
                    <p className="text-[10px] text-amber-400 mt-1">click to explore →</p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-stone-500 italic">not yet expanded</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-stone-400 font-serif italic">Story not found.</p>
      )}

      {/* Summary stats */}
      <div className="border-t border-stone-200 pt-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-5">Clarity Summary</p>
        <div className="grid grid-cols-2 gap-6 mb-6 sm:grid-cols-4">
          {tiers.map(tier => (
            <div key={tier.label} className="text-center">
              <p className="text-2xl font-serif text-stone-700 font-medium">{tier.count}</p>
              <p className="font-mono text-[9px] text-stone-400 mt-0.5">{tier.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm text-stone-500 font-serif">
          <p>Average clarity across nonce words: <strong className="text-stone-700">{(avgClarity * 100).toFixed(1)}%</strong></p>
          <p>{emergingPct}% of this story's words have begun emerging from the fog
            {emergingPct === 0 && ' — the text is entirely shrouded, waiting to be explored.'}
          </p>
        </div>
      </div>
    </div>
  );
}
