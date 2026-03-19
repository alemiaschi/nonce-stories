/**
 * Chart sub-components for the Stats page.
 * Pure declarative SVG — no D3 DOM manipulation, no useRef.
 * All SVGs use width="100%" + viewBox so they scale on mobile.
 * Legends are rendered as HTML outside SVGs to avoid truncation.
 */
import * as d3 from 'd3';
import type {
  PosEntry, DepthCount, DensityPoint, CurvePoint, LengthPoint,
  WordAppearance, ReuseStory, GrowthPoint, ChangelogEntry,
} from '../../types';

// ── SVG helpers ───────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle - Math.PI / 2), y: cy + r * Math.sin(angle - Math.PI / 2) };
}

function donutSlice(cx: number, cy: number, r: number, ri: number, a0: number, a1: number) {
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  const o1 = polar(cx, cy, r, a0); const o2 = polar(cx, cy, r, a1);
  const i1 = polar(cx, cy, ri, a0); const i2 = polar(cx, cy, ri, a1);
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${lg} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${ri} ${ri} 0 ${lg} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// Shared font/fill tokens used in all SVGs
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";
const FONT_SERIF = "'Lora', Georgia, serif";
const FILL_AXIS = '#78716c';   // stone-500
const FILL_LABEL = '#a8a29e'; // stone-400
const STROKE_GRID = '#e7e5e4'; // stone-200
const STROKE_AXIS = '#d6d3d1'; // stone-300

const POS_COLORS: Record<string, string> = {
  noun: '#92400e', verb: '#44403c', adj: '#78716c',
  adv: '#b45309', 'adj/n': '#c2410c', 'n/v': '#7c2d12',
};
const POS_LABEL: Record<string, string> = {
  noun: 'Nouns', verb: 'Verbs', adj: 'Adjectives',
  adv: 'Adverbs', 'adj/n': 'Adj/Noun', 'n/v': 'Noun/Verb',
};

// ── Card wrapper ──────────────────────────────────────────────────────────

export function ChartCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm">
      <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-stone-400 mb-3 font-serif italic">{subtitle}</p>}
      {children}
    </div>
  );
}

// ── HTML legend helper ────────────────────────────────────────────────────

function HtmlLegend({ items }: { items: Array<{ color: string; label: string; dash?: boolean }> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.dash ? (
            <svg width={16} height={10}>
              <line x1={0} x2={16} y1={5} y2={5} stroke={item.color} strokeWidth={1.5} strokeDasharray="4,3" />
            </svg>
          ) : (
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: item.color }} />
          )}
          <span className="text-[11px] text-stone-500 font-serif italic">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── 1. POS Donut ──────────────────────────────────────────────────────────

export function PosDonut({ data }: { data: PosEntry[] }) {
  // SVG contains only the ring; legend is HTML below
  const VW = 200, VH = 190, cx = 100, cy = 95, r = 75, ri = 50;
  const total = data.reduce((s, d) => s + d.count, 0);

  let angle = 0;
  const slices = data.map(d => {
    const a0 = angle;
    const a1 = angle + (d.count / total) * 2 * Math.PI;
    angle = a1;
    return { ...d, a0, a1 };
  });

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ maxWidth: VW, display: 'block', margin: '0 auto' }}>
        {slices.map(s => (
          <path key={s.pos} d={donutSlice(cx, cy, r, ri, s.a0, s.a1)}
            fill={POS_COLORS[s.pos] ?? '#a8a29e'} stroke="white" strokeWidth={2.5}>
            <title>{POS_LABEL[s.pos] ?? s.pos}: {s.count}</title>
          </path>
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fontFamily={FONT_MONO}
          fontSize={24} fontWeight={700} fill="#292524">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontFamily={FONT_SERIF}
          fontSize={12} fill="#78716c" fontStyle="italic">words</text>
      </svg>

      {/* Legend as HTML grid — never truncated */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 px-2">
        {slices.map(s => (
          <div key={s.pos} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0 inline-block"
              style={{ background: POS_COLORS[s.pos] ?? '#a8a29e' }} />
            <span className="text-[11px] text-stone-600 font-serif italic">
              {POS_LABEL[s.pos] ?? s.pos}
            </span>
            <span className="text-[11px] font-mono font-semibold text-stone-800 ml-auto">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 2. Concepts Ring ─────────────────────────────────────────────────────

export function ConceptRing({ discovered, total }: { discovered: number; total: number }) {
  const VW = 160, VH = 160, cx = 80, cy = 80, r = 58, stroke = 16;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? discovered / total : 0;
  const dash = pct * circumference;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ maxWidth: VW, display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={STROKE_GRID} strokeWidth={stroke} />
      {pct > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#92400e" strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fontFamily={FONT_MONO}
        fontSize={22} fontWeight={700} fill="#292524">{discovered}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontFamily={FONT_SERIF}
        fontSize={11} fill="#78716c" fontStyle="italic">of {total} discovered</text>
      {pct === 0 && (
        <text x={cx} y={cy + 30} textAnchor="middle" fontFamily={FONT_SERIF}
          fontSize={10} fill="#a8a29e" fontStyle="italic">journey begins</text>
      )}
    </svg>
  );
}

// ── 3. Depth Bars ─────────────────────────────────────────────────────────

export function DepthBars({ stories, frontier }: { stories: DepthCount[]; frontier: DepthCount[] }) {
  const VW = 300, VH = 170, padL = 36, padB = 34, padR = 12, padT = 12;
  const maxDepth = Math.max(...stories.map(d => d.depth), ...frontier.map(d => d.depth), 3);
  const maxCount = Math.max(...stories.map(d => d.count), 1);

  const xScale = d3.scaleBand()
    .domain(Array.from({ length: maxDepth + 1 }, (_, i) => String(i)))
    .range([padL, VW - padR]).padding(0.35);

  const yScale = d3.scaleLinear().domain([0, maxCount]).range([VH - padB, padT]).nice();
  const bw = xScale.bandwidth();
  const storyMap = Object.fromEntries(stories.map(d => [d.depth, d.count]));

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%">
      {yScale.ticks(3).map(t => (
        <g key={t}>
          <line x1={padL} x2={VW - padR} y1={yScale(t)} y2={yScale(t)} stroke={STROKE_GRID} strokeWidth={1} />
          <text x={padL - 5} y={yScale(t) + 4} textAnchor="end"
            fontFamily={FONT_MONO} fontSize={11} fill={FILL_LABEL}>{t}</text>
        </g>
      ))}
      {Array.from({ length: maxDepth + 1 }, (_, d) => {
        const x = xScale(String(d))!;
        const count = storyMap[d] ?? 0;
        const y = yScale(count);
        const bH = (VH - padB) - y;
        return (
          <g key={d}>
            <rect x={x} y={count > 0 ? y : VH - padB} width={bw}
              height={count > 0 ? bH : 2} rx={2}
              fill={count > 0 ? '#44403c' : '#e7e5e4'} opacity={0.9}>
              <title>Depth {d}: {count} {count === 1 ? 'story' : 'stories'}</title>
            </rect>
            <text x={x + bw / 2} y={VH - padB + 16} textAnchor="middle"
              fontFamily={FONT_MONO} fontSize={11} fill={FILL_AXIS}>{d}</text>
          </g>
        );
      })}
      <text x={(padL + VW - padR) / 2} y={VH - 4} textAnchor="middle"
        fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic">depth</text>
      <line x1={padL} x2={VW - padR} y1={VH - padB} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
    </svg>
  );
}

// ── 4. Density Scatter ───────────────────────────────────────────────────

export function DensityScatter({ points, curve }: { points: DensityPoint[]; curve: CurvePoint[] }) {
  const VW = 340, VH = 210, padL = 44, padB = 36, padR = 16, padT = 14;
  const maxDepth = Math.max(...curve.map(c => c.depth), ...points.map(p => p.depth), 6);

  const xScale = d3.scaleLinear().domain([0, maxDepth]).range([padL, VW - padR]);
  const yScale = d3.scaleLinear().domain([0, 1.05]).range([VH - padB, padT]);

  const curvePoints = curve
    .slice().sort((a, b) => a.depth - b.depth)
    .map(c => `${xScale(c.depth).toFixed(1)},${yScale(c.target).toFixed(1)}`)
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%">
        {[0, 0.25, 0.5, 0.75, 1.0].map(t => (
          <g key={t}>
            <line x1={padL} x2={VW - padR} y1={yScale(t)} y2={yScale(t)}
              stroke={STROKE_GRID} strokeWidth={1} strokeDasharray={t === 1 ? '0' : '3,3'} />
            <text x={padL - 5} y={yScale(t) + 4} textAnchor="end"
              fontFamily={FONT_MONO} fontSize={10} fill={FILL_LABEL}>
              {t === 1 ? '1.0' : t === 0 ? '0' : t}
            </text>
          </g>
        ))}
        {curvePoints && (
          <polyline points={curvePoints} fill="none" stroke="#b8a898"
            strokeWidth={2} strokeDasharray="5,4" />
        )}
        {points.map(p => (
          <circle key={p.story_id} cx={xScale(p.depth)} cy={yScale(p.actual)} r={6}
            fill="#92400e" stroke="white" strokeWidth={2} opacity={0.9}>
            <title>{p.story_id} · depth {p.depth} · density {p.actual.toFixed(2)}</title>
          </circle>
        ))}
        <line x1={padL} x2={VW - padR} y1={VH - padB} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
        <line x1={padL} x2={padL} y1={padT} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
        {Array.from({ length: maxDepth + 1 }, (_, i) => (
          <text key={i} x={xScale(i)} y={VH - padB + 16} textAnchor="middle"
            fontFamily={FONT_MONO} fontSize={11} fill={FILL_AXIS}>{i}</text>
        ))}
        <text x={(padL + VW - padR) / 2} y={VH - 4} textAnchor="middle"
          fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic">depth</text>
        <text x={12} y={(padT + VH - padB) / 2} textAnchor="middle"
          fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic"
          transform={`rotate(-90,12,${(padT + VH - padB) / 2})`}>density</text>
      </svg>
      <HtmlLegend items={[
        { color: '#b8a898', label: 'target curve', dash: true },
        { color: '#92400e', label: 'actual story' },
      ]} />
    </div>
  );
}

// ── 5. Length Scatter ─────────────────────────────────────────────────────

export function LengthScatter({ points, curve }: {
  points: Array<{ story_id: string; depth: number; word_count: number }>;
  curve: LengthPoint[];
}) {
  const VW = 340, VH = 210, padL = 46, padB = 36, padR = 16, padT = 14;
  const maxDepth = Math.max(...curve.map(c => c.depth), ...points.map(p => p.depth), 6);
  const maxLen = Math.max(...curve.map(c => c.max), ...points.map(p => p.word_count), 400);

  const xScale = d3.scaleLinear().domain([0, maxDepth]).range([padL, VW - padR]);
  const yScale = d3.scaleLinear().domain([0, maxLen + 20]).range([VH - padB, padT]).nice();

  const sorted = curve.slice().sort((a, b) => a.depth - b.depth);
  const upperPts = sorted.map(c => `${xScale(c.depth).toFixed(1)},${yScale(c.max).toFixed(1)}`).join(' ');
  const lowerPts = sorted.map(c => `${xScale(c.depth).toFixed(1)},${yScale(c.min).toFixed(1)}`).join(' ');
  const areaPath = sorted.length > 0
    ? `M ${sorted.map(c => `${xScale(c.depth).toFixed(1)},${yScale(c.max).toFixed(1)}`).join(' L ')} ` +
      `L ${sorted.slice().reverse().map(c => `${xScale(c.depth).toFixed(1)},${yScale(c.min).toFixed(1)}`).join(' L ')} Z`
    : '';

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%">
        {yScale.ticks(4).map(t => (
          <g key={t}>
            <line x1={padL} x2={VW - padR} y1={yScale(t)} y2={yScale(t)} stroke={STROKE_GRID} strokeWidth={1} />
            <text x={padL - 5} y={yScale(t) + 4} textAnchor="end"
              fontFamily={FONT_MONO} fontSize={10} fill={FILL_LABEL}>{t}</text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill="#e7e5e4" opacity={0.45} />}
        {upperPts && <polyline points={upperPts} fill="none" stroke={STROKE_AXIS} strokeWidth={1.5} strokeDasharray="4,3" />}
        {lowerPts && <polyline points={lowerPts} fill="none" stroke={STROKE_AXIS} strokeWidth={1.5} strokeDasharray="4,3" />}
        {points.map(p => (
          <circle key={p.story_id} cx={xScale(p.depth)} cy={yScale(p.word_count)} r={6}
            fill="#92400e" stroke="white" strokeWidth={2} opacity={0.9}>
            <title>{p.story_id} · {p.word_count} words</title>
          </circle>
        ))}
        <line x1={padL} x2={VW - padR} y1={VH - padB} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
        <line x1={padL} x2={padL} y1={padT} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
        {Array.from({ length: maxDepth + 1 }, (_, i) => (
          <text key={i} x={xScale(i)} y={VH - padB + 16} textAnchor="middle"
            fontFamily={FONT_MONO} fontSize={11} fill={FILL_AXIS}>{i}</text>
        ))}
        <text x={(padL + VW - padR) / 2} y={VH - 4} textAnchor="middle"
          fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic">depth</text>
        <text x={12} y={(padT + VH - padB) / 2} textAnchor="middle"
          fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic"
          transform={`rotate(-90,12,${(padT + VH - padB) / 2})`}>words</text>
      </svg>
      <HtmlLegend items={[
        { color: STROKE_AXIS, label: 'target range', dash: true },
        { color: '#92400e', label: 'actual story' },
      ]} />
    </div>
  );
}

// ── 6. Top Words Bars ─────────────────────────────────────────────────────

export function TopWordsBars({ data }: { data: WordAppearance[] }) {
  const top = data.slice(0, 15);
  const maxCount = Math.max(...top.map(d => d.count), 1);
  const BAR_H = 20, GAP = 3, padL = 90, padR = 36, VW = 340;
  const VH = top.length * (BAR_H + GAP) + 8;
  const barMax = VW - padL - padR;
  const allSame = top.length > 0 && top.every(d => d.count === top[0].count);

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%">
        {top.map((d, i) => {
          const y = i * (BAR_H + GAP);
          const bw = Math.max((d.count / maxCount) * barMax, 3);
          return (
            <g key={d.word}>
              <text x={padL - 7} y={y + BAR_H * 0.68} textAnchor="end"
                fontFamily={FONT_MONO} fontSize={11} fill="#57534e">{d.word}</text>
              <rect x={padL} y={y} width={bw} height={BAR_H} rx={3}
                fill="#92400e" opacity={0.75}>
                <title>{d.word}: {d.count} {d.count === 1 ? 'story' : 'stories'}</title>
              </rect>
              <text x={padL + bw + 5} y={y + BAR_H * 0.68}
                fontFamily={FONT_MONO} fontSize={10} fill={FILL_LABEL}>{d.count}</text>
            </g>
          );
        })}
      </svg>
      {allSame && (
        <p className="text-[11px] text-stone-400 font-serif italic mt-2 text-center leading-relaxed">
          All words appear in {top[0]?.count} {top[0]?.count === 1 ? 'story' : 'stories'} — bars will diverge as more stories are added.
        </p>
      )}
    </div>
  );
}

// ── 7. Reuse Bars ─────────────────────────────────────────────────────────

export function ReuseBars({ data }: { data: ReuseStory[] }) {
  const BAR_H = 24, GAP = 7, padL = 76, padR = 36, VW = 340;
  const VH = data.length * (BAR_H + GAP) + 28;
  const barMax = VW - padL - padR;

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%">
        {data.map((d, i) => {
          const y = i * (BAR_H + GAP);
          const total = Math.max(d.total_words, 1);
          const newW = (d.new_words / total) * barMax;
          const reuseW = (d.reused_words / total) * barMax;
          const label = d.story_id.replace('story_', 's');
          return (
            <g key={d.story_id}>
              <text x={padL - 7} y={y + BAR_H * 0.68} textAnchor="end"
                fontFamily={FONT_MONO} fontSize={11} fill="#57534e">{label}</text>
              <rect x={padL} y={y} width={Math.max(newW, 3)} height={BAR_H}
                fill="#92400e" opacity={0.8} rx={3}>
                <title>{d.new_words} new words</title>
              </rect>
              {reuseW > 0 && (
                <rect x={padL + newW} y={y} width={reuseW} height={BAR_H}
                  fill="#d6d3d1" rx={3}>
                  <title>{d.reused_words} reused words</title>
                </rect>
              )}
              <text x={padL + Math.max(newW, 3) + reuseW + 5} y={y + BAR_H * 0.68}
                fontFamily={FONT_MONO} fontSize={10} fill={FILL_LABEL}>{d.total_words}</text>
            </g>
          );
        })}
      </svg>
      <HtmlLegend items={[
        { color: '#92400e', label: 'new words' },
        { color: '#d6d3d1', label: 'reused' },
      ]} />
    </div>
  );
}

// ── 8. Growth Lines ───────────────────────────────────────────────────────

export function GrowthLines({ data }: { data: GrowthPoint[] }) {
  const VW = 360, VH = 210, padL = 46, padB = 36, padR = 16, padT = 14;

  if (data.length === 0) {
    return <p className="text-xs text-stone-400 font-serif italic text-center py-8">No data yet</p>;
  }

  const maxWeek = Math.max(...data.map(d => d.week), 1);
  const maxVal = Math.max(...data.map(d => Math.max(d.stories, d.words, d.concepts)), 10);

  const xScale = d3.scaleLinear().domain([0, maxWeek]).range([padL, VW - padR]);
  const yScale = d3.scaleLinear().domain([0, maxVal]).range([VH - padB, padT]).nice();

  function linePts(key: keyof GrowthPoint) {
    return data.map(d => `${xScale(d.week).toFixed(1)},${yScale(d[key] as number).toFixed(1)}`).join(' ');
  }

  const lines = [
    { key: 'words' as const, color: '#92400e', label: 'words' },
    { key: 'stories' as const, color: '#44403c', label: 'stories' },
    { key: 'concepts' as const, color: '#b45309', label: 'concepts' },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%">
        {yScale.ticks(4).map(t => (
          <g key={t}>
            <line x1={padL} x2={VW - padR} y1={yScale(t)} y2={yScale(t)} stroke={STROKE_GRID} strokeWidth={1} />
            <text x={padL - 5} y={yScale(t) + 4} textAnchor="end"
              fontFamily={FONT_MONO} fontSize={11} fill={FILL_LABEL}>{t}</text>
          </g>
        ))}
        {lines.map(l => (
          <g key={l.key}>
            {data.length > 1 && (
              <polyline points={linePts(l.key)} fill="none" stroke={l.color} strokeWidth={2} opacity={0.85} />
            )}
            {data.map(d => (
              <circle key={d.week} cx={xScale(d.week)} cy={yScale(d[l.key] as number)} r={4}
                fill={l.color} stroke="white" strokeWidth={1.5}>
                <title>Week {d.week} · {l.label}: {d[l.key]}</title>
              </circle>
            ))}
          </g>
        ))}
        <line x1={padL} x2={VW - padR} y1={VH - padB} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
        <line x1={padL} x2={padL} y1={padT} y2={VH - padB} stroke={STROKE_AXIS} strokeWidth={1} />
        {data.map(d => (
          <text key={d.week} x={xScale(d.week)} y={VH - padB + 16} textAnchor="middle"
            fontFamily={FONT_MONO} fontSize={11} fill={FILL_AXIS}>{d.week}</text>
        ))}
        <text x={(padL + VW - padR) / 2} y={VH - 4} textAnchor="middle"
          fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic">week</text>
        <text x={12} y={(padT + VH - padB) / 2} textAnchor="middle"
          fontFamily={FONT_SERIF} fontSize={10} fill={FILL_LABEL} fontStyle="italic"
          transform={`rotate(-90,12,${(padT + VH - padB) / 2})`}>count</text>
      </svg>
      <HtmlLegend items={lines.map(l => ({ color: l.color, label: l.label }))} />
    </div>
  );
}

// ── 9. Progress Bar ───────────────────────────────────────────────────────

export function ProgressBar({ value, label, sublabel }: {
  value: number; label: string; sublabel?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-mono text-stone-600">{label}</span>
        <span className="text-xs font-mono font-semibold text-stone-800">{pct}%</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
        <div className="h-full bg-amber-800 rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
      </div>
      {sublabel && <p className="text-[11px] text-stone-400 font-serif italic mt-1">{sublabel}</p>}
    </div>
  );
}

// ── 10. Weekly Timeline ───────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  created_root: 'Root story written',
  expanded: 'Word expanded',
  added: 'Story added',
};

export function WeekTimeline({ entries }: { entries: ChangelogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-stone-400 font-serif italic text-center py-6">No history yet</p>;
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-200 border-2 border-amber-600 mt-1" />
            {i < entries.length - 1 && <div className="w-px flex-1 bg-stone-200 my-1" />}
          </div>
          <div className="pb-5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5">
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wide shrink-0">
                week {entry.week}
              </span>
              <span className="text-[10px] text-stone-400 font-serif italic">{entry.date}</span>
            </div>
            <p className="text-sm font-serif text-stone-700">
              {ACTION_LABEL[entry.action] ?? entry.action}
              {entry.story_id && (
                <span className="ml-1 font-mono text-[10px] text-stone-400">({entry.story_id})</span>
              )}
            </p>
            {entry.words_introduced > 0 && (
              <p className="text-xs font-mono text-amber-800 mt-0.5">
                +{entry.words_introduced} new words
              </p>
            )}
            {entry.notes && (
              <p className="text-[11px] text-stone-500 font-serif italic mt-1 leading-relaxed">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
