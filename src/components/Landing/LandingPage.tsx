import { Link } from 'react-router-dom';

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
    to: '/fog',
    label: 'Fog',
    mono: 'fog',
    description: 'See the text through a clarity lens — unexplored words recede into mist, explored ones solidify into ink.',
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
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-6 py-16">

      {/* Hero image — warm glow behind, ring shadow in front */}
      <div className="mb-8 w-full max-w-[340px] relative">
        <div
          className="absolute inset-0 -z-10 scale-125 blur-3xl rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.22) 0%, transparent 70%)' }}
        />
        <img
          src={`${import.meta.env.BASE_URL}the_brolm.png`}
          alt="The Brolm"
          className="w-full rounded-2xl shadow-xl"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(214,211,209,0.5)' }}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1
          className="font-serif font-medium text-stone-800 italic mb-4 leading-tight tracking-tight"
          style={{ fontSize: 'clamp(2.6rem, 6vw, 3.75rem)' }}
        >
          The Brolm
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-10 bg-stone-200" />
          <p className="font-mono text-[10px] text-stone-400 tracking-[0.35em] uppercase">
            Nonce Stories
          </p>
          <div className="h-px w-10 bg-stone-200" />
        </div>
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
            className="group border border-stone-200 rounded-xl px-5 py-4 bg-white hover:border-amber-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-amber-600 transition-colors mb-1.5">
              {mono}
            </p>
            <p className="font-serif text-stone-700 font-medium mb-1">{label}</p>
            <p className="text-xs text-stone-400 leading-relaxed">{description}</p>
          </Link>
        ))}
      </div>

      {/* Credits */}
      <div className="mt-12 flex items-center gap-4">
        <div className="h-px w-10 bg-stone-200" />
        <p className="text-xs text-stone-400 font-serif italic text-center">
          created by{' '}
          <a
            href="https://alemiaschi.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-700 transition-colors"
          >
            Alessio Miaschi
          </a>
          {' '}in collaboration with{' '}
          <a href="https://claude.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 transition-colors">Claude</a>
          {' '}&amp;{' '}
          <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 transition-colors">Claude Code</a>
        </p>
        <div className="h-px w-10 bg-stone-200" />
      </div>

    </div>
  );
}
