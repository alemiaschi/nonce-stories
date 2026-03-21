import type { CSSProperties } from 'react';
import type { AppData } from '../types';

// Recursively find max depth of any branch starting from storyId
function branchMaxDepth(storyId: string, data: AppData, visited = new Set<string>()): number {
  if (visited.has(storyId)) return 0;
  visited.add(storyId);
  const story = data.stories[storyId];
  if (!story) return 0;
  const childIds = story.tokens
    .filter(t => t.type === 'nonce' && t.child_story)
    .map(t => t.child_story!);
  if (childIds.length === 0) return 0;
  return 1 + Math.max(...childIds.map(id => branchMaxDepth(id, data, new Set(visited))));
}

function storyCoverage(storyId: string, data: AppData): number {
  const story = data.stories[storyId];
  if (!story) return 0;
  const nonces = story.tokens.filter(t => t.type === 'nonce');
  if (nonces.length === 0) return 1;
  const expanded = nonces.filter(t => t.child_story != null).length;
  return expanded / nonces.length;
}

export interface ClarityInfo {
  score: number;       // 0.0 – 1.0
  branchDepth: number;
  coverage: number;
  hasSubStory: boolean;
}

export function computeClarity(childStoryId: string | null | undefined, data: AppData): ClarityInfo {
  if (!childStoryId) return { score: 0, branchDepth: 0, coverage: 0, hasSubStory: false };
  const globalMax = Math.max(data.meta.max_depth, 1);
  const depth = branchMaxDepth(childStoryId, data);
  const coverage = storyCoverage(childStoryId, data);
  const normalizedDepth = Math.min(depth / globalMax, 1);
  const score = normalizedDepth * 0.6 + coverage * 0.4;
  return { score, branchDepth: depth, coverage, hasSubStory: true };
}

export function clarityToStyle(score: number): CSSProperties {
  // opacity: 0.15 (score=0) → 1.0 (score=1.0)
  const opacity = 0.15 + score * 0.85;
  // blur: 0.8px (score=0) → 0px (score=1.0)
  const blur = Math.max(0, 0.8 * (1 - score));
  // color: interpolate from cool gray to warm dark brown
  // gray: rgb(120,113,108) = stone-500, warm: rgb(28,25,23) = stone-900
  const t = score;
  const r = Math.round(120 + (28 - 120) * t);
  const g = Math.round(113 + (25 - 113) * t);
  const b = Math.round(108 + (23 - 108) * t);
  return {
    opacity,
    filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
    color: `rgb(${r},${g},${b})`,
    transition: 'opacity 0.3s, filter 0.3s',
  };
}
