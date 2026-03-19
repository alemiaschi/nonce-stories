import { useState } from 'react';
import type { AppData } from '../../types';
import { useStoryNavigation } from '../../hooks/useStoryNavigation';
import { useMorphForms } from '../../utils/morphForms';
import { StoryText } from './StoryText';
import { Breadcrumb } from './Breadcrumb';
import { PreviouslyOn } from './PreviouslyOn';
import { WordTrail } from './WordTrail';
import { ReadingPaths } from './ReadingPaths';
import { DepthIndicator } from '../Layout/DepthIndicator';
import { WeeklyBadge } from '../Layout/WeeklyBadge';

interface ReadingPaneProps {
  data: AppData;
  initialStoryId?: string;
  onStoryChange?: (storyId: string) => void;
}

interface WordTrailState {
  lemma: string;
  x: number;
  y: number;
}

export function ReadingPane({ data, onStoryChange }: ReadingPaneProps) {
  const { currentStory, navigateTo, breadcrumbPath, highlightedLemma, clearHighlight } =
    useStoryNavigation(data);
  const morphForms = useMorphForms(data);
  const [wordTrail, setWordTrail] = useState<WordTrailState | null>(null);

  const handleNavigate = (storyId: string, highlight?: string) => {
    navigateTo(storyId, highlight);
    onStoryChange?.(storyId);
    setWordTrail(null);
  };

  const handleWordTrail = (lemma: string, x: number, y: number) => {
    setWordTrail({ lemma, x, y });
  };

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 font-serif italic">
        Story not found.
      </div>
    );
  }

  // Background warmth shifts subtly with depth: cooler at depth 0, warmer at depth 6+
  const depthWarmth = Math.min(currentStory.depth / 6, 1);
  const bgOpacity = Math.round(depthWarmth * 8);
  const bgStyle = bgOpacity > 0
    ? { backgroundColor: `color-mix(in srgb, #fef3c7 ${bgOpacity}%, #fafaf9)` }
    : undefined;

  return (
    <div className="min-h-screen transition-colors duration-700" style={bgStyle}>
      <div className="max-w-[640px] mx-auto px-6 py-14">

        {/* Depth + badge + reading paths row */}
        <div className="flex items-center justify-between mb-8">
          <DepthIndicator depth={currentStory.depth} maxDepth={data.meta.max_depth} />
          <div className="flex items-center gap-3">
            <ReadingPaths data={data} onNavigate={handleNavigate} />
            <WeeklyBadge week={currentStory.week} latestWeek={data.meta.latest_week} />
          </div>
        </div>

        {/* Breadcrumb (only when depth > 0) */}
        <Breadcrumb path={breadcrumbPath} data={data} onNavigate={handleNavigate} />

        {/* Story title (root only) */}
        {currentStory.depth === 0 && currentStory.title && (
          <h2 className="font-serif text-[1.4rem] font-medium text-stone-600 mb-10 italic leading-snug">
            {currentStory.title}
          </h2>
        )}

        {/* Previously On banner (depth > 0) */}
        <PreviouslyOn currentStory={currentStory} data={data} onNavigate={handleNavigate} />

        {/* Dead branch notice */}
        {currentStory.status === 'dead' && (
          <div className="mb-8 border border-stone-300 bg-stone-100/70 rounded px-5 py-4 text-stone-500">
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">† Withered branch</p>
            <p className="font-serif text-[0.95rem] leading-relaxed italic">
              {currentStory.death_note ?? 'This branch of the story has been declared closed.'}
            </p>
          </div>
        )}

        {/* Story text */}
        <StoryText
          story={currentStory}
          data={data}
          onNavigate={handleNavigate}
          onWordTrail={handleWordTrail}
          highlightedLemma={highlightedLemma}
        />

        {/* Footer metadata */}
        <div className="mt-14 pt-6 border-t border-stone-200 text-[11px] text-stone-400 font-mono flex flex-wrap gap-x-4 gap-y-1">
          <span>{Object.keys(data.lexicon).length} nonce words</span>
          <span>·</span>
          <span>{data.meta.total_concepts_discovered} concepts discovered</span>
          <span>·</span>
          <span>week {currentStory.week}</span>
          <span>·</span>
          <span>{currentStory.created}</span>
        </div>
      </div>

      {/* Word Trail popup */}
      {wordTrail && (
        <WordTrail
          lemma={wordTrail.lemma}
          x={wordTrail.x}
          y={wordTrail.y}
          data={data}
          morphForms={morphForms}
          onNavigate={handleNavigate}
          onClose={() => { setWordTrail(null); clearHighlight(); }}
        />
      )}
    </div>
  );
}
