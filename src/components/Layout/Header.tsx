import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { InfoModal } from './InfoModal';

const NAV_LINKS = [
  { to: '/',        label: 'read'    },
  { to: '/map',     label: 'map'     },
  { to: '/atlas',   label: 'atlas'   },
  { to: '/stories', label: 'stories' },
  { to: '/stats',   label: 'stats'   },
];

export function Header() {
  const { pathname } = useLocation();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="block group shrink-0">
            <h1 className="font-serif text-base font-medium text-stone-700 leading-tight group-hover:text-stone-900 transition-colors">
              The Brolm
            </h1>
            <p className="text-[10px] text-stone-400 tracking-[0.2em] uppercase mt-0.5">
              Nonce Stories
            </p>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 text-xs rounded transition-colors font-mono tracking-wide whitespace-nowrap ${
                  pathname === to
                    ? 'bg-stone-800 text-stone-100'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => setShowInfo(true)}
              className="ml-1 w-7 h-7 shrink-0 rounded-full border border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 transition-colors text-xs font-medium font-mono flex items-center justify-center"
              aria-label="About this project"
              title="About"
            >
              ?
            </button>
          </nav>
        </div>
      </header>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
