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
    const buildNode = (storyId: string): TreeNode => {
      const story = data.stories[storyId];

      // Find child story IDs from nonce tokens
      const childIds: Array<{ word: string; storyId: string }> = [];
      for (const token of story?.tokens ?? []) {
        if (token.type === 'nonce' && token.child_story) {
          childIds.push({ word: token.lemma ?? token.text, storyId: token.child_story });
        }
      }

      // Determine state
      const hasAnyExpanded = childIds.length > 0;
      const allExpanded = story?.tokens
        .filter(t => t.type === 'nonce')
        .every(t => t.child_story != null) ?? false;

      let state: TreeNode['state'] = 'frontier';
      if (story?.status === 'dead') state = 'dead';
      else if (story?.depth === 0) state = 'root';
      else if (hasAnyExpanded || allExpanded) state = 'expanded';

      // Deduplicate children (a lemma may appear multiple times)
      const seen = new Set<string>();
      const uniqueChildren = childIds.filter(c => {
        if (seen.has(c.storyId)) return false;
        seen.add(c.storyId);
        return true;
      });

      return {
        id: storyId,
        depth: story?.depth ?? 0,
        parent: story?.parent ?? null,
        parentWord: story?.parent_word ?? null,
        state,
        week: story?.week ?? 0,
        deathNote: story?.death_note,
        children: uniqueChildren.map(c => buildNode(c.storyId)),
      };
    };

    return buildNode('story_0');
  }, [data]);
}
