import type { AppData } from '../../types';

interface BreadcrumbProps {
  path: string[];
  data: AppData;
  onNavigate: (storyId: string) => void;
}

export function Breadcrumb({ path, data, onNavigate }: BreadcrumbProps) {
  if (path.length <= 1) return null;

  return (
    <nav className="flex items-center flex-wrap gap-y-1 mb-10 text-xs font-mono text-stone-400">
      {path.map((storyId, i) => {
        const label = data.breadcrumb_labels[storyId] ?? storyId;
        const isLast = i === path.length - 1;
        return (
          <span key={storyId} className="flex items-center">
            {i > 0 && (
              <span className="mx-1.5 text-stone-200 select-none">→</span>
            )}
            {isLast ? (
              <span className="text-stone-600 font-medium">{label}</span>
            ) : (
              <button
                onClick={() => onNavigate(storyId)}
                className="text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2 decoration-stone-200 hover:decoration-stone-400"
              >
                {label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
