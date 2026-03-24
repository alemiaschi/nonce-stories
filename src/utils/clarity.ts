import type { CSSProperties } from 'react';
import type { AppData } from '../types';

// Collect all stories along the branch starting from storyId down to leaves.
// Uses visited set to handle DAG cross-links safely.
function collectBranchStories(storyId: string, data: AppData, visited = new Set<string>()): string[] {
  if (visited.has(storyId)) return [];
  visited.add(storyId);
  const story = data.stories[storyId];
  if (!story) return [];
  const childIds = [...new Set(
    story.tokens.filter(t => t.type === 'nonce' && t.child_story).map(t => t.child_story!)
  )];
  const descendants = childIds.flatMap(id => collectBranchStories(id, data, new Set(visited)));
  return [storyId, ...descendants];
}

function nonceDensity(storyId: string, data: AppData): number {
  const story = data.stories[storyId];
  if (!story) return 1;
  const words = story.tokens.filter(t => t.type === 'nonce' || t.type === 'content');
  if (words.length === 0) return 1;
  const nonces = words.filter(t => t.type === 'nonce').length;
  return nonces / words.length;
}

export interface ClarityInfo {
  score: number;       // 0.0 – 1.0
  avgDensity: number;  // average nonce density along branch
  branchLength: number;
  hasSubStory: boolean;
}

/**
 * clarity = 1 - average_nonce_density_along_branch
 *
 * Frontier words (no sub-story) → 0.
 * A depth-1 sub-story at 93% nonce → clarity = 0.07 (7%).
 * Clarity only rises meaningfully when the branch reaches stories
 * with substantial real English (depth 4-6).
 */
export function computeClarity(childStoryId: string | null | undefined, data: AppData): ClarityInfo {
  if (!childStoryId) return { score: 0, avgDensity: 1, branchLength: 0, hasSubStory: false };
  const branch = collectBranchStories(childStoryId, data);
  if (branch.length === 0) return { score: 0, avgDensity: 1, branchLength: 0, hasSubStory: true };
  const avgDensity = branch.reduce((sum, id) => sum + nonceDensity(id, data), 0) / branch.length;
  const score = Math.max(0, Math.min(1, 1 - avgDensity));
  return { score, avgDensity, branchLength: branch.length, hasSubStory: true };
}

/**
 * Visual opacity mapping — non-linear so low-clarity words remain
 * ghostly but still legible:
 *   opacity = 0.12 + clarity * 0.88
 * Even 0% clarity → 12% opacity (visible fog), 100% → full opacity.
 */
export function clarityToStyle(score: number): CSSProperties {
  const opacity = 0.12 + score * 0.88;
  // blur: faint at 0, none at clarity > 0.3
  const blur = Math.max(0, 0.6 * (1 - score * 3.3));
  // color: cool gray (stone-400) at 0 → warm dark brown (stone-800) at 1
  const t = score;
  const r = Math.round(168 + (41 - 168) * t);
  const g = Math.round(162 + (37 - 162) * t);
  const b = Math.round(158 + (36 - 158) * t);
  return {
    opacity,
    filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
    color: `rgb(${r},${g},${b})`,
    transition: 'opacity 0.3s, filter 0.3s',
  };
}

export function clarityLabel(score: number): string {
  if (score < 0.05) return 'deep fog — no exploration yet';
  if (score < 0.15) return 'faint — first stories written, still mostly opaque';
  if (score < 0.30) return 'emerging — meaning starting to crystallize';
  if (score < 0.50) return 'forming — substantial English footholds';
  if (score < 0.75) return 'clearing — largely comprehensible';
  return 'clear — fully explored to intelligible leaves';
}
