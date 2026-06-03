import { useState } from 'react';
import type { AppData, Story, StoryToken } from '../../types';

interface PreviouslyOnProps {
  currentStory: Story;
  data: AppData;
  onNavigate: (storyId: string) => void;
  cameFromId?: string | null;
}

const SENTENCE_END = new Set(['.', '!', '?', '…', '."', '!"', '?"']);

function extractSentenceContext(tokens: StoryToken[], targetIdx: number): StoryToken[] {
  let start = targetIdx;
  while (start > 0) {
    const prev = tokens[start - 1];
    if (prev.text === '\n\n' || prev.text === '\n') break;
    if (SENTENCE_END.has(prev.text)) break;
    start--;
  }
  while (start < targetIdx && tokens[start].text.trim() === '') start++;

  let end = targetIdx + 1;
  while (end < tokens.length) {
    const curr = tokens[end];
    if (curr.text === '\n\n' || curr.text === '\n') break;
    if (SENTENCE_END.has(curr.text)) { end++; break; }
    end++;
  }
  return tokens.slice(start, end);
}

export function PreviouslyOn({ currentStory, data, onNavigate, cameFromId }: PreviouslyOnProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!currentStory.parent_word) return null;

  const parentWord = currentStory.parent_word.toLowerCase();

  const resolveParentId = (): string | null => {
    if (cameFromId && cameFromId !== currentStory.id) {
      const s = data.stories[cameFromId];
      if (s?.tokens.some(t => t.type === 'nonce' && (t.lemma === parentWord || t.text.toLowerCase() === parentWord))) {
        return cameFromId;
      }
    }
    return currentStory.parent;
  };

  const parentId = resolveParentId();
  const parentStory = parentId ? data.stories[parentId] : null;
  if (!parentStory) return null;

  const tokens = parentStory.tokens;
  const targetIdx = tokens.findIndex(
    t => t.type === 'nonce' && (t.lemma === parentWord || t.text.toLowerCase() === parentWord)
  );
  if (targetIdx === -1) return null;

  const contextTokens = extractSentenceContext(tokens, targetIdx);
  const parentLabel = data.breadcrumb_labels[parentId!] ?? parentId;

  return (
    <div className="mb-8 border-l-2 border-amber-300 bg-gradient-to-r from-amber-50/50 to-transparent rounded-r pl-4 pr-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between py-2.5 text-left gap-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 leading-relaxed">
          ↳ exploring{' '}
          <span className="text-amber-700 font-medium">{currentStory.parent_word}</span>
          {' '}from{' '}
          <button
            onClick={e => { e.stopPropagation(); onNavigate(parentId!); }}
            className="text-stone-500 hover:text-stone-800 transition-colors underline underline-offset-2 decoration-dotted"
          >
            {parentLabel}
          </button>
        </span>
        <span className="text-stone-300 font-mono text-[10px] shrink-0">
          {collapsed ? '▸' : '▾'}
        </span>
      </button>

      {!collapsed && (
        <div className="pb-3 font-serif text-[0.9rem] leading-relaxed text-stone-600 italic">
          {contextTokens.map((t, i) => {
            const isTarget = t.type === 'nonce' && (
              t.lemma === parentWord || t.text.toLowerCase() === parentWord
            );
            return isTarget
              ? <span key={i} className="font-mono not-italic text-amber-800 font-medium px-0.5">{t.text}</span>
              : <span key={i}>{t.text}</span>;
          })}
        </div>
      )}
    </div>
  );
}
