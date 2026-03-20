import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InfoModal } from '../Layout/InfoModal';

const PAGES = [
  {
    to: '/read',
    label: 'Read',
    mono: 'read',
    description: 'Enter the story. Click a nonce word to descend into its sub-story.',
  },
  {
    to: '/map',
    label: 'Map',
    mono: 'map',
    description: 'See the full story tree. Navigate by clicking nodes.',
  },
  {
    to: '/atlas',
    label: 'Atlas',
    mono: 'atlas',
    description: 'A concordance of every nonce word — where it appears, its forms, its status.',
  },
  {
    to: '/stories',
    label: 'Stories',
    mono: 'stories',
    description: 'A sortable index of every story in the tree.',
  },
  {
    to: '/stats',
    label: 'Stats',
    mono: 'stats',
    description: 'Data portraits: lexicon growth, tree shape, linguistic density over time.',
  },
];

export function LandingPage() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-6 py-16">

        {/* Hero image */}
        <div className="mb-10 w-full max-w-sm">
          <img
            src={`${import.meta.env.BASE_URL}the_brolm.png`}
            alt="The Brolm"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="font-serif text-4xl font-medium text-stone-800 italic mb-2">
            The Brolm
          </h1>
          <p className="font-mono text-xs text-stone-400 tracking-[0.25em] uppercase">
            Nonce Stories
          </p>
        </div>

        {/* Tagline */}
        <p className="text-center text-stone-500 font-serif text-base leading-relaxed max-w-md mb-12">
          A story written entirely in invented words. Every content word is a portal —
          click it to descend into a sub-story that illuminates its meaning through context.
          Meaning is never defined. It is <em>discovered</em>.
        </p>

        {/* Navigation cards — 3×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
          {PAGES.map(({ to, label, mono, description }) => (
            <Link
              key={to}
              to={to}
              className="group border border-stone-200 rounded-xl px-5 py-4 bg-white hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-amber-600 transition-colors mb-1">
                {mono}
              </p>
              <p className="font-serif text-stone-700 font-medium mb-1">{label}</p>
              <p className="text-xs text-stone-400 leading-relaxed">{description}</p>
            </Link>
          ))}

          {/* About card */}
          <button
            onClick={() => setShowInfo(true)}
            className="group border border-stone-200 rounded-xl px-5 py-4 bg-white hover:border-amber-300 hover:shadow-sm transition-all text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-amber-600 transition-colors mb-1">
              about
            </p>
            <p className="font-serif text-stone-700 font-medium mb-1">About</p>
            <p className="text-xs text-stone-400 leading-relaxed">
              What this project is, how to read it, and how it was made.
            </p>
          </button>
        </div>

      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
