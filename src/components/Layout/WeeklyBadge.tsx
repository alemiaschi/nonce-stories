interface WeeklyBadgeProps {
  week: number;
  latestWeek: number;
}

export function WeeklyBadge({ week, latestWeek }: WeeklyBadgeProps) {
  if (week !== latestWeek) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full border border-amber-200 tracking-widest uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      new
    </span>
  );
}
