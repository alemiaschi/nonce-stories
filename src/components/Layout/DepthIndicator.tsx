interface DepthIndicatorProps {
  depth: number;
  maxDepth: number;
}

export function DepthIndicator({ depth, maxDepth }: DepthIndicatorProps) {
  const effectiveMax = Math.max(maxDepth, 6);
  // At depth 0: most opaque. At max depth: most clear.
  const clarity = Math.min(depth / effectiveMax, 1);

  const labels = ['opaque', '', '', '', '', '', 'clear'];
  const label = labels[Math.min(depth, labels.length - 1)] ?? '';

  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] text-stone-500 tracking-widest uppercase w-14">
        depth {depth}
      </span>
      {/* Gradient bar: dark left → light right, indicator moves right as depth increases */}
      <div className="relative w-24 h-1.5 rounded-full overflow-hidden bg-gradient-to-r from-stone-400 to-stone-100">
        {/* Cursor showing current position */}
        <div
          className="absolute top-0 h-full w-1 bg-stone-600 rounded-full shadow-sm transition-all duration-500"
          style={{ left: `${clarity * 88}%` }}
        />
      </div>
      {label && (
        <span className="text-[10px] text-stone-500 italic">{label}</span>
      )}
    </div>
  );
}
