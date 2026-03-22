import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { AppData } from '../types';
import { getAncestorPath } from '../utils/tree';

export function useStoryNavigation(data: AppData, initial = 'story_0') {
  const location = useLocation();
  const locationState = location.state as { storyId?: string; highlight?: string } | null;

  const [currentStoryId, setCurrentStoryId] = useState<string>(
    locationState?.storyId ?? initial
  );
  const [highlightedLemma, setHighlightedLemma] = useState<string | null>(
    locationState?.highlight ?? null
  );
  const [cameFrom, setCameFrom] = useState<string | null>(null);

  const navigateTo = useCallback((storyId: string, highlight?: string, from?: string | null) => {
    setCurrentStoryId(storyId);
    setHighlightedLemma(highlight ?? null);
    setCameFrom(from ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearHighlight = useCallback(() => setHighlightedLemma(null), []);

  const currentStory = data.stories[currentStoryId] ?? null;
  const breadcrumbPath = getAncestorPath(currentStoryId, data);

  return { currentStoryId, currentStory, navigateTo, breadcrumbPath, highlightedLemma, clearHighlight, cameFrom };
}
