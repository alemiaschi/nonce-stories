import { useMemo } from 'react';
import type { AppData } from '../types';

export interface TreeNode {
  id: string;
  depth: number;
  parent: string | null;
  parentWord: string | null;
  state: 'root' | 'expanded' | 'frontier' | 'dead';
  children: TreeNode[];
  week: number;
  deathNote?: string | null;
}

export function useTreeData(data: AppData): TreeNode {
  return useMemo(() => {
    // Build canonical tree from parent relationships, not from token links.
    // Each story appears exactly once — as a child of the story it was
    // originally expanded from. Cross-links (the same word appearing in
    // multiple stories) are intentionally not shown here.
    const childrenOf: Record<string, string[]> = {};
    for (const [id, story] of Object.entries(data.stories)) {
      const parent = story.parent ?? null;
      if (parent) {
        if (!childrenOf[parent]) childrenOf[parent] = [];
        childrenOf[parent].push(id);
      }
    }

    const buildNode = (storyId: string): TreeNode => {
      const story = data.stories[storyId];
      const canonicalChildren = childrenOf[storyId] ?? [];

      const hasAnyExpanded = canonicalChildren.length > 0;
      const allNonceExpanded = story?.tokens
        .filter(t => t.type === 'nonce')
        .every(t => t.child_story != null) ?? false;

      let state: TreeNode['state'] = 'frontier';
      if (story?.status === 'dead') state = 'dead';
      else if (story?.depth === 0) state = 'root';
      else if (hasAnyExpanded || allNonceExpanded) state = 'expanded';

      return {
        id: storyId,
        depth: story?.depth ?? 0,
        parent: story?.parent ?? null,
        parentWord: story?.parent_word ?? null,
        state,
        week: story?.week ?? 0,
        deathNote: story?.death_note,
        children: canonicalChildren.map(buildNode),
      };
    };

    return buildNode('story_0');
  }, [data]);
}
