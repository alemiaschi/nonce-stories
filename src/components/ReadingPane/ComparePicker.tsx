import { useEffect, useCallback } from 'react';
import type { AppData } from '../../types';
import { getStoryPreview } from '../../utils/tree';

interface ComparePickerProps {
  data: AppData;
  currentStoryId: string;
  onSelect: (storyId: string) => void;
  onClose: () => void;
}

interface StoryEntry {
  id: string;
  label: string;
  depth: number;
  parentWord: string | null;
  preview: string;
}

function makeEntry(id: string, data: AppData): StoryEntry {
  const story = data.stories[id];
  return {
    id,
    label: data.breadcrumb_labels[id] ?? id,
    depth: story?.depth ?? 0,
    parentWord: story?.parent_word ?? null,
    preview: getStoryPreview(id, data, 12),
  };
}

function StoryRow({ entry, onSelect }: { entry: StoryEntry; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(entry.id)}
      className="w-full text-left px-4 py-2.5 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0 group"
    >
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="font-mono text-[11px] text-stone-700 group-hover:text-amber-800 transition-colors">
          {entry.label}
        </span>
        <span className="text-[9px] font-mono bg-stone-100 text-stone-500 px-1 py-0.5 rounded shrink-0">
          depth {entry.depth}
        </span>
        {entry.parentWord && (
          <span className="text-[9px] font-mono text-amber-600 shrink-0">
            ↳ {entry.parentWord}
          </span>
        )}
      </div>
      {entry.preview && (
        <p className="font-serif text-[0.75rem] text-stone-400 italic leading-snug line-clamp-1">
          {entry.preview}
        </p>
      )}
    </button>
  );
}

export function ComparePicker({ data, currentStoryId, onSelect, onClose }: ComparePickerProps) {
  const currentStory = data.stories[currentStoryId];

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const allOtherIds = Object.keys(data.stories).filter(id => id !== currentStoryId);

  if (allOtherIds.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg mx-4 p-8 text-center"
          onClick={e => e.stopPropagation()}
        >
          <p className="font-serif text-stone-500 italic text-[0.95rem] leading-relaxed">
            No other stories exist yet. As the tree grows, you will be able to compare stories side by side.
          </p>
          <button
            onClick={onClose}
            className="mt-6 text-[10px] font-mono text-stone-400 hover:text-stone-700 transition-colors"
          >
            close
          </button>
        </div>
      </div>
    );
  }

  // Build groups
  const parentId = currentStory?.parent ?? null;
  const childIds = allOtherIds.filter(id => data.stories[id]?.parent === currentStoryId);
  const siblingIds = parentId
    ? allOtherIds.filter(id => id !== currentStoryId && data.stories[id]?.parent === parentId)
    : [];
  const parentAndChildAndSiblingIds = new Set([
    ...(parentId ? [parentId] : []),
    ...childIds,
    ...siblingIds,
  ]);
  const otherIds = allOtherIds.filter(id => !parentAndChildAndSiblingIds.has(id));

  // Suggestions: parent, first child, first sibling
  const suggestionIds: string[] = [];
  if (parentId) suggestionIds.push(parentId);
  if (childIds.length > 0) suggestionIds.push(childIds[0]);
  if (siblingIds.length > 0) suggestionIds.push(siblingIds[0]);

  const groups: Array<{ title: string; ids: string[] }> = [];
  if (suggestionIds.length > 0) groups.push({ title: 'Suggested', ids: suggestionIds });
  if (parentId) groups.push({ title: 'Parent', ids: [parentId] });
  if (childIds.length > 0) groups.push({ title: 'Children', ids: childIds });
  if (siblingIds.length > 0) groups.push({ title: 'Siblings', ids: siblingIds });
  if (otherIds.length > 0) groups.push({ title: 'All stories', ids: otherIds });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg mx-4 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50 rounded-t-xl shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
            Choose a story to compare
          </span>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm font-mono transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Groups */}
        <div className="overflow-y-auto flex-1">
          {groups.map(group => (
            <div key={group.title}>
              <div className="px-4 py-2 bg-stone-50 border-b border-stone-100">
                <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">
                  {group.title}
                </span>
              </div>
              <div>
                {group.ids.map(id => (
                  <StoryRow key={id} entry={makeEntry(id, data)} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
