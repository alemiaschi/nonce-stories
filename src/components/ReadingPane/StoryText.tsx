import type { AppData, Story, StoryToken } from '../../types';
import { NonceWord } from './NonceWord';

interface StoryTextProps {
  story: Story;
  data: AppData;
  onNavigate: (storyId: string) => void;
  onWordTrail: (lemma: string, x: number, y: number) => void;
  highlightedLemma: string | null;
}

export function StoryText({ story, data, onNavigate, onWordTrail, highlightedLemma }: StoryTextProps) {
  // Split tokens into paragraphs on "\n\n" boundaries
  const paragraphs: StoryToken[][] = [];
  let current: StoryToken[] = [];

  for (const token of story.tokens) {
    if (token.text === '\n\n') {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) paragraphs.push(current);

  return (
    <div className="story-enter">
      {paragraphs.map((para, pi) => (
        <p key={pi} className="mb-7 leading-[1.9] text-stone-800 text-[1.05rem]">
          {para.map((token, ti) => {
            if (token.type === 'nonce') {
              return (
                <NonceWord
                  key={ti}
                  token={token}
                  data={data}
                  onNavigate={onNavigate}
                  onWordTrail={onWordTrail}
                  highlightedLemma={highlightedLemma}
                />
              );
            }
            // Render newlines within a paragraph as line breaks
            if (token.text === '\n') return <br key={ti} />;
            return <span key={ti}>{token.text}</span>;
          })}
        </p>
      ))}
    </div>
  );
}
