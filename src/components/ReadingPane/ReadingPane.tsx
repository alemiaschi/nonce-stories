import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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
import { StoryPanel } from './StoryPanel';
import { ComparePicker } from './ComparePicker';

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
  const location = useLocation();
  const locationState = location.state as { storyId?: string; highlight?: string } | null;
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentStory, navigateTo, breadcrumbPath, highlightedLemma, clearHighlight } =
    useStoryNavigation(data);
  const morphForms = useMorphForms(data);
  const [wordTrail, setWordTrail] = useState<WordTrailState | null>(null);

  // Compare state
  const initialLeftId = searchParams.get('left') ?? locationState?.storyId ?? 'story_0';
  const initialRightId = searchParams.get('right') ?? null;

  const [leftId, setLeftId] = useState<string>(initialLeftId);
  const [rightId, setRightId] = useState<string | null>(initialRightId);
  const [sharedHoverLemma, setSharedHoverLemma] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const isCompareMode = rightId !== null;

  const handleNavigate = (storyId: string, highlight?: string) => {
    navigateTo(storyId, highlight);
    onStoryChange?.(storyId);
    setWordTrail(null);
    // In single mode, also keep leftId in sync so opening compare starts from current story
    setLeftId(storyId);
    // Update URL left param
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('left', storyId);
      return next;
    }, { replace: true });
  };

  const handleWordTrail = (lemma: string, x: number, y: number) => {
    setWordTrail({ lemma, x, y });
  };

  const handleLeftNavigated = (storyId: string) => {
    setLeftId(storyId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('left', storyId);
      return next;
    }, { replace: true });
  };

  const handleRightNavigated = (storyId: string) => {
    setRightId(storyId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('right', storyId);
      return next;
    }, { replace: true });
  };

  const handleCompareSelect = (storyId: string) => {
    setRightId(storyId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('left', leftId);
      next.set('right', storyId);
      return next;
    }, { replace: true });
  };

  const handleCloseCompare = () => {
    setRightId(null);
    setSharedHoverLemma(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('right');
      return next;
    }, { replace: true });
  };

  // Compare mode layout
  if (isCompareMode) {
    const leftLabel = data.breadcrumb_labels[leftId] ?? leftId;
    const rightLabel = data.breadcrumb_labels[rightId] ?? rightId;

    return (
      <div className="flex flex-col min-h-screen">
        {/* Compare header bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-stone-200 flex items-center justify-between px-4 py-2 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest shrink-0">comparing</span>
            <span className="font-mono text-[11px] text-stone-600 truncate">{leftLabel}</span>
            <span className="text-stone-300 shrink-0">⊞</span>
            <span className="font-mono text-[11px] text-stone-600 truncate">{rightLabel}</span>
          </div>
          <button
            onClick={handleCloseCompare}
            className="text-[10px] font-mono text-stone-400 hover:text-stone-700 hover:bg-stone-100 px-2 py-1 rounded transition-colors border border-stone-200 hover:border-stone-300 shrink-0 ml-3"
          >
            × close compare
          </button>
        </div>

        {/* Two panels */}
        <div className="flex flex-col sm:flex-row flex-1">
          {/* Left panel */}
          <div className="flex-1 min-w-0 overflow-y-auto border-b sm:border-b-0 sm:border-r border-stone-200">
            <StoryPanel
              data={data}
              initialStoryId={leftId}
              sharedHoverLemma={sharedHoverLemma}
              onHoverLemma={setSharedHoverLemma}
              onNavigated={handleLeftNavigated}
            />
          </div>
          {/* Right panel */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <StoryPanel
              data={data}
              initialStoryId={rightId}
              sharedHoverLemma={sharedHoverLemma}
              onHoverLemma={setSharedHoverLemma}
              onNavigated={handleRightNavigated}
            />
          </div>
        </div>
      </div>
    );
  }

  // Single-story mode (same as before, with compare button added)
  if (!currentStory) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 font-serif italic">
        Story not found.
      </div>
    );
  }

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
            <button
              onClick={() => setShowPicker(true)}
              className="text-[10px] font-mono text-stone-400 hover:text-stone-600 hover:bg-stone-100 px-2 py-1 rounded transition-colors border border-stone-200 hover:border-stone-300"
              title="Compare with another story"
            >
              ⊞ compare
            </button>
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

      {/* Compare picker modal */}
      {showPicker && (
        <ComparePicker
          data={data}
          currentStoryId={leftId}
          onSelect={handleCompareSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
