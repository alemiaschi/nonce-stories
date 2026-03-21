import { useEffect } from 'react';

interface InfoModalProps {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">{title}</p>
      <div className="text-sm text-stone-600 font-serif leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export function InfoModal({ onClose }: InfoModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-stone-50 border border-stone-200 rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors text-lg leading-none"
          aria-label="Close"
        >✕</button>

        <div className="px-8 py-8 space-y-7">

          {/* Hero image */}
          <div className="-mx-8 -mt-8 mb-2">
            <img
              src={`${import.meta.env.BASE_URL}the_brolm.png`}
              alt="The Brolm — story tree"
              className="w-full rounded-t-xl"
            />
          </div>

          {/* Title */}
          <div>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2">About</p>
            <h2 className="font-serif text-xl font-medium text-stone-800 italic leading-snug mb-0.5">
              The Brolm
            </h2>
            <p className="text-xs font-mono text-stone-400 tracking-widest uppercase">Nonce Stories</p>
          </div>

          {/* What it is */}
          <Section title="What is this?">
            <p>
              You are reading a story written entirely in invented words. Every content word —
              nouns, verbs, adjectives, adverbs — is a <em>nonce word</em>: a pure sound with
              a part of speech but no assigned meaning. Only the grammatical skeleton is English.
            </p>
            <p>
              Each nonce word is a portal. Click one and you descend into a sub-story that places
              that word in new situations — not defining it, but illuminating it the way a child
              acquires vocabulary: through context, repetition, and inference. The deeper you go,
              the more intelligible the language becomes.
            </p>
            <p>
              Meaning is never pre-planned. It is <em>discovered in the act of writing</em>,
              retroactively, from the context in which the word first appeared.
            </p>
          </Section>

          <hr className="border-stone-200" />

          {/* How to read */}
          <Section title="Reading a story">
            <p>
              Words with a{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9em', color: '#7c5c38', opacity: 0.85, textDecoration: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#b8945a' }}>
                dotted underline
              </span>{' '}
              are <em>frontier</em> words — their story hasn't been written yet.
              Words with a{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9em', color: '#7c3d0e', textDecoration: 'underline', textDecorationColor: '#c26820', cursor: 'pointer' }}>
                solid underline
              </span>{' '}
              are <em>expanded</em> — click to go deeper into that word's story.
            </p>
            <p>
              <strong className="text-stone-700 font-medium">Right-click any nonce word</strong> to
              open the Word Trail: a panel showing every story where that word appears, its
              morphological forms, and a link to trace it across the Story Map.
            </p>
            <p>
              The breadcrumb at the top lets you resurface to any ancestor story.
              When reading a sub-story, a collapsible banner shows the exact sentence from the
              parent story where the word first appeared.
            </p>
            <p>
              The <strong className="text-stone-700 font-medium">↩ paths</strong> button offers
              four suggested reading sequences: Go Deep (follow one branch to its end),
              Go Wide (read all depth-1 expansions), Latest (chronological order),
              and Random Walk (serendipitous path through expanded words).
            </p>
          </Section>

          <hr className="border-stone-200" />

          {/* Pages */}
          <Section title="Pages">
            <p>
              <strong className="text-stone-700 font-medium">Read</strong> — the main reading
              experience. One story at a time, navigated by clicking nonce words. Right-click
              any nonce word to open the Word Trail — every story it appears in, its forms, a
              link to trace it on the Map. Use the <em>↩ paths</em> button for suggested reading
              sequences. Open <em>⊞ compare</em> to place two stories side by side: hovering
              a word in either panel highlights it in both simultaneously.
            </p>
            <p>
              <strong className="text-stone-700 font-medium">Map</strong> — an interactive tree
              of the entire story graph. Nodes are colored by state: dark for the root, amber for
              expanded stories, muted for frontier words. Zoom, pan, and click any node to open
              that story. The left sidebar lists every nonce word — click one to highlight it
              across the tree.
            </p>
            <p>
              <strong className="text-stone-700 font-medium">Fog</strong> — the story text
              rendered through a clarity lens. Unexplored nonce words recede into mist at low
              opacity; words with deep, thoroughly explored branches solidify into full ink.
              The page makes the project's progress visible on the text itself — a manuscript
              gradually becoming legible. Hover any nonce word to see its clarity score and
              branch depth; click to navigate into its sub-story.
            </p>
            <p>
              <strong className="text-stone-700 font-medium">Atlas</strong> — a searchable,
              sortable concordance of every nonce word in the project. No definitions — only
              cross-references: which stories a word appears in, its part of speech, its
              morphological forms, and whether it has been expanded. Click any story link
              to jump directly there with the word highlighted.
            </p>
            <p>
              <strong className="text-stone-700 font-medium">Stories</strong> — a sortable index
              of all stories in the tree. Each row shows the story's depth, parent, the word it
              expands, word count, nonce density, and how many of its children have been expanded.
              Click any row to open that story.
            </p>
            <p>
              <strong className="text-stone-700 font-medium">Stats</strong> — a data portrait of
              the project: lexicon composition, tree shape, linguistic density, word co-occurrence,
              and cumulative growth over time.
            </p>
          </Section>

          <hr className="border-stone-200" />

          {/* Origin */}
          <Section title="Origin">
            <p className="text-stone-500 text-xs">
              This is a collaborative creative project. The root story and lexicon were conceived
              and authored in conversation with{' '}
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                className="text-amber-700 underline hover:text-amber-900">Claude</a>{' '}
              (Anthropic). Each weekly expansion is written the same way — meaning is co-discovered,
              not pre-determined. The human author selects which frontier word to expand next and
              curates the result. The web application was built with{' '}
              <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer"
                className="text-amber-700 underline hover:text-amber-900">Claude Code</a>.
            </p>
            <p className="text-stone-500 text-xs">
              Source code and data are available on{' '}
              <a href="https://github.com/alemiaschi/nonce-stories" target="_blank" rel="noopener noreferrer"
                className="text-amber-700 underline hover:text-amber-900">GitHub</a>.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}
