import { useState, useRef } from 'react';
import type { StoryToken, AppData } from '../../types';
import { getStoryPreview } from '../../utils/tree';
import '../../styles/nonce-words.css';

interface NonceWordProps {
  token: StoryToken;
  data: AppData;
  onNavigate: (storyId: string) => void;
  onWordTrail: (lemma: string, x: number, y: number) => void;
  highlightedLemma: string | null;
}

export function NonceWord({ token, data, onNavigate, onWordTrail, highlightedLemma }: NonceWordProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const lemma = token.lemma ?? token.text.toLowerCase();
  const isHighlighted = highlightedLemma === lemma;

  const state = token.state ?? 'frontier';
  const childStory = token.child_story ? data.stories[token.child_story] : null;
  const isDead = childStory?.status === 'dead';

  const handleClick = () => {
    if (state === 'frontier') {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 600);
    } else if (token.child_story) {
      onNavigate(token.child_story);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onWordTrail(lemma, e.clientX, e.clientY);
  };

  const tooltipContent = () => {
    if (state === 'frontier') return "This word's story hasn't been written yet";
    if (!token.child_story) return '';
    if (isDead) {
      const note = childStory?.death_note;
      return note ? `† This branch has withered — ${note}` : '† This branch has withered';
    }
    const preview = getStoryPreview(token.child_story, data, 12);
    if (state === 'deep_solved') return `${preview} — fully explored`;
    return preview;
  };

  const stateClass =
    isDead ? 'nonce-dead' :
    state === 'frontier' ? 'nonce-frontier' :
    state === 'deep_solved' ? 'nonce-deep-solved' :
    'nonce-expanded';

  return (
    <span
      className="relative inline"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        ref={ref}
        className={`nonce-word ${stateClass}${pulsing ? ' nonce-pulsing' : ''}${isHighlighted ? ' nonce-highlighted' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        role={state !== 'frontier' ? 'button' : undefined}
        tabIndex={state !== 'frontier' ? 0 : undefined}
        aria-label={isDead ? `Withered branch for ${token.text}` : state !== 'frontier' ? `Navigate to story for ${token.text}` : token.text}
      >
        {token.text}
      </span>

      {showTooltip && (
        <span className="nonce-tooltip">
          <span className="nonce-tooltip-inner">{tooltipContent()}</span>
          <span className="nonce-tooltip-arrow" />
        </span>
      )}
    </span>
  );
}
