import { useState } from 'react';
import type { AppData } from '../../types';
import { useMorphForms } from '../../utils/morphForms';
import { StoryText } from './StoryText';
import { Breadcrumb } from './Breadcrumb';
import { PreviouslyOn } from './PreviouslyOn';
import { WordTrail } from './WordTrail';
import { DepthIndicator } from '../Layout/DepthIndicator';
import { getAncestorPath } from '../../utils/tree';

interface StoryPanelProps {
  data: AppData;
  initialStoryId: string;
  sharedHoverLemma: string | null;
  onHoverLemma: (lemma: string | null) => void;
  onNavigated?: (storyId: string) => void;
}

interface WordTrailState {
  lemma: string;
  x: number;
  y: number;
}

export function StoryPanel({ data, initialStoryId, sharedHoverLemma, onHoverLemma, onNavigated }: StoryPanelProps) {
  const [currentStoryId, setCurrentStoryId] = useState(initialStoryId);
  const [wordTrail, setWordTrail] = useState<WordTrailState | null>(null);
  const morphForms = useMorphForms(data);

  const story = data.stories[currentStoryId] ?? null;
  const breadcrumbPath = getAncestorPath(currentStoryId, data);

  const handleNavigate = (storyId: string) => {
    setCurrentStoryId(storyId);
    onNavigated?.(storyId);
    setWordTrail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!story) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 font-serif italic">
        Story not found.
      </div>
    );
  }

  const depthWarmth = Math.min(story.depth / 6, 1);
  const bgOpacity = Math.round(depthWarmth * 8);
  const bgStyle = bgOpacity > 0
    ? { backgroundColor: `color-mix(in srgb, #fef3c7 ${bgOpacity}%, #fafaf9)` }
    : undefined;

  return (
    <div className="min-h-full transition-colors duration-700 relative" style={bgStyle}>
      <div className="px-6 py-10">
        {/* Depth indicator */}
        <div className="mb-6">
          <DepthIndicator depth={story.depth} maxDepth={data.meta.max_depth} />
        </div>

        {/* Breadcrumb */}
        <Breadcrumb path={breadcrumbPath} data={data} onNavigate={handleNavigate} />

        {/* Story title (root only) */}
        {story.depth === 0 && story.title && (
          <h2 className="font-serif text-[1.3rem] font-medium text-stone-600 mb-8 italic leading-snug">
            {story.title}
          </h2>
        )}

        {/* Previously On banner */}
        <PreviouslyOn currentStory={story} data={data} onNavigate={handleNavigate} />

        {/* Dead branch notice */}
        {story.status === 'dead' && (
          <div className="mb-6 border border-stone-300 bg-stone-100/70 rounded px-4 py-3 text-stone-500">
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-1">† Withered branch</p>
            <p className="font-serif text-[0.9rem] leading-relaxed italic">
              {story.death_note ?? 'This branch of the story has been declared closed.'}
            </p>
          </div>
        )}

        {/* Story text */}
        <StoryText
          story={story}
          data={data}
          onNavigate={handleNavigate}
          onWordTrail={(lemma, x, y) => setWordTrail({ lemma, x, y })}
          highlightedLemma={sharedHoverLemma}
          onHoverLemma={onHoverLemma}
        />

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-stone-200 text-[10px] text-stone-400 font-mono flex flex-wrap gap-x-3 gap-y-1">
          <span>depth {story.depth}</span>
          <span>·</span>
          <span>week {story.week}</span>
          <span>·</span>
          <span>{story.created}</span>
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
          onClose={() => setWordTrail(null)}
        />
      )}
    </div>
  );
}
