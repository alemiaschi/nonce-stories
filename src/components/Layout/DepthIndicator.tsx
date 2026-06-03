interface DepthIndicatorProps {
  depth: number;
  maxDepth: number;
}

export function DepthIndicator({ depth, maxDepth }: DepthIndicatorProps) {
  const effectiveMax = Math.max(maxDepth, 6);
  const dotCount = Math.min(effectiveMax + 1, 8);

  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] text-stone-500 tracking-widest uppercase">
        depth {depth}
      </span>
      {/* Dot sequence — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-1.5">
        {Array.from({ length: dotCount }).map((_, i) => {
          const isCurrent = i === depth;
          const isPast = i < depth;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width:  isCurrent ? 7 : 5,
                height: isCurrent ? 7 : 5,
                background: isCurrent ? '#44403c' : isPast ? '#a8a29e' : '#e7e5e4',
                boxShadow: isCurrent ? '0 0 0 2px #fafaf9, 0 0 0 3px #78716c' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
