import type { AppData } from '../../types';

interface BreadcrumbProps {
  path: string[];
  data: AppData;
  onNavigate: (storyId: string) => void;
}

export function Breadcrumb({ path, data, onNavigate }: BreadcrumbProps) {
  if (path.length <= 1) return null;

  return (
    <nav className="flex items-center flex-wrap gap-y-1 mb-10">
      {path.map((storyId, i) => {
        const label = data.breadcrumb_labels[storyId] ?? storyId;
        const isLast = i === path.length - 1;
        return (
          <span key={storyId} className="flex items-center">
            {i > 0 && (
              <span className="mx-2 text-stone-300 select-none text-sm font-serif">›</span>
            )}
            {isLast ? (
              <span className="font-mono text-xs text-stone-700 font-medium">{label}</span>
            ) : (
              <button
                onClick={() => onNavigate(storyId)}
                className="font-mono text-xs text-stone-400 hover:text-stone-600 transition-colors"
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
