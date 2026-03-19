import type { AppData } from '../types';
import { getAncestorPath } from './tree';

export interface ReadingPath {
  id: string;
  label: string;
  description: string;
  storyIds: string[];
}

export function computeGoDeepPath(data: AppData): ReadingPath {
  let deepestId = 'story_0';
  let maxDepth = 0;
  for (const [id, story] of Object.entries(data.stories)) {
    if (story.depth > maxDepth && story.status !== 'dead') {
      maxDepth = story.depth;
      deepestId = id;
    }
  }
  return {
    id: 'deep',
    label: 'Go Deep',
    description: 'Follow the longest branch from root to its deepest point.',
    storyIds: getAncestorPath(deepestId, data),
  };
}

export function computeGoWidePath(data: AppData): ReadingPath {
  const depth1 = Object.values(data.stories)
    .filter(s => s.depth === 1 && s.status !== 'dead')
    .sort((a, b) => a.created.localeCompare(b.created))
    .map(s => s.id);
  return {
    id: 'wide',
    label: 'Go Wide',
    description: 'Read the root, then every direct expansion.',
    storyIds: ['story_0', ...depth1],
  };
}

export function computeLatestPath(data: AppData): ReadingPath {
  const ordered = Object.values(data.stories)
    .filter(s => s.status !== 'dead')
    .sort((a, b) => a.week - b.week || a.created.localeCompare(b.created))
    .map(s => s.id);
  return {
    id: 'latest',
    label: 'Latest',
    description: 'Read stories in the order they were written.',
    storyIds: ordered,
  };
}

export function computeRandomWalkPath(data: AppData): ReadingPath {
  const path: string[] = ['story_0'];
  let currentId = 'story_0';
  while (true) {
    const story = data.stories[currentId];
    if (!story) break;
    const expandedIds = [...new Set(
      story.tokens
        .filter(t => t.type === 'nonce' && t.child_story && data.stories[t.child_story]?.status !== 'dead')
        .map(t => t.child_story!)
    )];
    if (expandedIds.length === 0) break;
    const next = expandedIds[Math.floor(Math.random() * expandedIds.length)];
    path.push(next);
    currentId = next;
  }
  return {
    id: 'random',
    label: 'Random Walk',
    description: 'Follow random expanded words through the tree.',
    storyIds: path,
  };
}
