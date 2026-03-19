import { useState } from 'react';
import type { AppData, Story, StoryToken } from '../../types';

interface PreviouslyOnProps {
  currentStory: Story;
  data: AppData;
  onNavigate: (storyId: string) => void;
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
  // Skip leading whitespace
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

export function PreviouslyOn({ currentStory, data, onNavigate }: PreviouslyOnProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!currentStory.parent || !currentStory.parent_word) return null;

  const parentStory = data.stories[currentStory.parent];
  if (!parentStory) return null;

  const parentWord = currentStory.parent_word.toLowerCase();
  const tokens = parentStory.tokens;

  // Find first nonce token matching parent_word
  const targetIdx = tokens.findIndex(
    t => t.type === 'nonce' && (t.lemma === parentWord || t.text.toLowerCase() === parentWord)
  );
  if (targetIdx === -1) return null;

  const contextTokens = extractSentenceContext(tokens, targetIdx);
  const parentLabel = data.breadcrumb_labels[currentStory.parent] ?? currentStory.parent;

  return (
    <div className="mb-8 border border-stone-200 rounded bg-stone-50/60">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
          ↖ This story explores{' '}
          <span className="text-amber-700">{currentStory.parent_word}</span>
          {' '}from{' '}
          <button
            onClick={e => { e.stopPropagation(); onNavigate(currentStory.parent!); }}
            className="underline underline-offset-2 decoration-dotted text-stone-500 hover:text-stone-800 transition-colors"
          >
            {parentLabel}
          </button>
        </span>
        <span className="text-stone-400 font-mono text-[10px] ml-4 shrink-0">
          {collapsed ? '▸ show' : '▾ hide'}
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 font-serif text-[0.9rem] leading-relaxed text-stone-600 italic border-t border-stone-200 pt-2.5">
          {contextTokens.map((t, i) => {
            const isTarget = t.type === 'nonce' && (
              t.lemma === parentWord || t.text.toLowerCase() === parentWord
            );
            return isTarget
              ? <span key={i} className="font-mono not-italic text-amber-700 bg-amber-50 px-0.5 rounded">{t.text}</span>
              : <span key={i}>{t.text}</span>;
          })}
        </div>
      )}
    </div>
  );
}
