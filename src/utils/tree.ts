import type { AppData } from '../types';

export function isDeepSolved(storyId: string, data: AppData): boolean {
  const story = data.stories[storyId];
  if (!story) return false;
  const nonceTokens = story.tokens.filter(t => t.type === 'nonce');
  if (nonceTokens.length === 0) return true;
  return nonceTokens.every(t => {
    if (t.state !== 'expanded' && t.state !== 'deep_solved') return false;
    if (!t.child_story) return false;
    return isDeepSolved(t.child_story, data);
  });
}

export function getStoryPreview(storyId: string, data: AppData, wordCount = 10): string {
  const story = data.stories[storyId];
  if (!story) return '';
  const words = story.tokens
    .filter(t => t.text.trim().length > 0 && t.text !== '\n' && t.text !== '\n\n')
    .map(t => t.text)
    .slice(0, wordCount);
  return words.join('').trim() + '…';
}

export function getAncestorPath(storyId: string, data: AppData): string[] {
  const path: string[] = [];
  let cursor: string | null = storyId;
  while (cursor !== null) {
    path.unshift(cursor);
    const s: typeof data.stories[string] | undefined = data.stories[cursor];
    cursor = s?.parent ?? null;
  }
  return path;
}
