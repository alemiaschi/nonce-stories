import type { AppData, Story } from '../../types';

interface AnnotationOverlayProps {
  story: Story;
  data: AppData;
  active: boolean;
  onToggle: () => void;
}

export function AnnotationOverlay({ story, data, active, onToggle }: AnnotationOverlayProps) {
  // Check if any nonce word in this story has an annotation
  const annotatedWords = story.tokens
    .filter(t => t.type === 'nonce' && t.lemma && data.lexicon[t.lemma]?.annotation)
    .map(t => t.lemma!)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  if (annotatedWords.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className="text-[10px] font-mono text-stone-400 hover:text-stone-600 transition-colors border border-stone-200 hover:border-stone-400 rounded px-2 py-1"
      >
        {active ? 'hide annotations' : 'show annotations'}
      </button>

      {active && (
        <div className="mt-4 space-y-3 border-l-2 border-amber-200 pl-4">
          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mb-3">
            Annotations
          </p>
          {annotatedWords.map(word => {
            const entry = data.lexicon[word];
            return entry?.annotation ? (
              <div key={word}>
                <span className="font-mono text-xs text-stone-600 font-medium">{word}</span>
                <p className="text-sm text-stone-500 italic mt-0.5 leading-relaxed font-serif">
                  {entry.annotation}
                </p>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
