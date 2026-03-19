import type { Story } from '../types';

export interface StoryStats {
  wordCount: number;    // content + nonce tokens
  nonceCount: number;   // all nonce tokens (with repetitions)
  uniqueNonce: number;  // unique nonce lemmas
  expandedChildren: number; // unique expanded child stories
  frontierChildren: number; // unique unexpanded nonce lemmas
  nonceDensity: number; // nonceCount / wordCount
}

export function computeStoryStats(story: Story): StoryStats {
  const contentTokens = story.tokens.filter(t => t.type === 'content');
  const nonceTokens   = story.tokens.filter(t => t.type === 'nonce');

  const wordCount  = contentTokens.length + nonceTokens.length;
  const nonceCount = nonceTokens.length;

  const allLemmas      = new Set(nonceTokens.map(t => t.lemma ?? t.text.toLowerCase()));
  const expandedLemmas = new Set(
    nonceTokens.filter(t => t.child_story != null).map(t => t.lemma ?? t.text.toLowerCase())
  );

  const uniqueNonce       = allLemmas.size;
  const expandedChildren  = expandedLemmas.size;
  const frontierChildren  = uniqueNonce - expandedChildren;
  const nonceDensity      = wordCount > 0 ? nonceCount / wordCount : 0;

  return { wordCount, nonceCount, uniqueNonce, expandedChildren, frontierChildren, nonceDensity };
}
