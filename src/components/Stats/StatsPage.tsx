import { useMemo } from 'react';
import type { AppData } from '../../types';
import {
  ChartCard, PosDonut, DepthBars, DensityScatter,
  LengthScatter, TopWordsBars, ReuseBars, GrowthLines,
  ProgressBar, WeekTimeline, FogClarityBars, NewWordsBar,
} from './charts';
import { computeClarity } from '../../utils/clarity';

interface StatsPageProps {
  data: AppData;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-px flex-1 bg-stone-200" />
        <h2 className="font-serif italic text-xl text-stone-700 shrink-0">{title}</h2>
        <div className="h-px flex-1 bg-stone-200" />
      </div>
      <p className="text-center text-xs text-stone-400 font-serif italic">{subtitle}</p>
    </div>
  );
}

function BigStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-4xl font-bold text-stone-800 leading-none">{value}</div>
      <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-1.5 font-mono">{label}</div>
    </div>
  );
}

export function StatsPage({ data }: StatsPageProps) {
  const { meta, stats } = data;

  // Compute fog clarity for all nonce words in story_0
  const fogStats = useMemo(() => {
    const story0 = data.stories['story_0'];
    if (!story0) return { avg: 0, top: [], allScores: [] };
    const seen = new Set<string>();
    const entries: { word: string; score: number }[] = [];
    for (const token of story0.tokens) {
      if (token.type !== 'nonce') continue;
      const lemma = token.lemma ?? token.text.toLowerCase();
      if (seen.has(lemma)) continue;
      seen.add(lemma);
      const { score } = computeClarity(token.child_story, data);
      entries.push({ word: lemma, score });
    }
    const avg = entries.length > 0
      ? entries.reduce((s, e) => s + e.score, 0) / entries.length
      : 0;
    const top = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);
    return { avg, top, allScores: entries };
  }, [data]);

  const densityPoints = stats.story_density_scatter;
  const lengthPoints = densityPoints.map(p => ({
    story_id: p.story_id,
    depth: p.depth,
    word_count: p.word_count,
  }));

  const pctExplored = meta.total_words > 0
    ? Object.values(data.lexicon).filter(e => e.stories_about.length > 0).length / meta.total_words
    : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero summary row */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="font-serif italic text-2xl text-stone-600 mb-1 text-center">
            The Shape of Nonce Stories
          </h1>
          <p className="text-xs text-stone-400 text-center font-serif italic mb-8">
            What has been written, what has been named, and what remains in the dark
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <BigStat value={meta.total_stories} label="stories written" />
            <BigStat value={meta.total_words} label="nonce words" />
            <BigStat value={`${(fogStats.avg * 100).toFixed(1)}%`} label="avg clarity" />
            <BigStat value={`${Math.round(pctExplored * 100)}%`} label="frontier explored" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* ── 1. Lexicon ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Lexicon"
            subtitle="The invented vocabulary — its parts of speech and what has been decoded"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <ChartCard title="Parts of Speech"
              subtitle="Distribution across grammatical categories">
              <div className="flex justify-center">
                <PosDonut data={stats.pos_distribution} />
              </div>
            </ChartCard>

            <ChartCard title="Fog Clarity"
              subtitle="Average comprehensibility of nonce words in the root story">
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <span className="font-mono text-4xl font-bold text-stone-700">
                    {(fogStats.avg * 100).toFixed(1)}%
                  </span>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono mt-1">
                    avg clarity
                  </p>
                </div>
                <ProgressBar
                  value={fogStats.avg}
                  label="meaning emerging"
                  sublabel="Rises as branches reach intelligible English at greater depth"
                />
                {fogStats.top.some(e => e.score > 0) && (
                  <div className="mt-1">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2">clearest words</p>
                    <FogClarityBars data={fogStats.top.filter(e => e.score > 0).slice(0, 5)} />
                  </div>
                )}
              </div>
            </ChartCard>

            <ChartCard title="New Words per Week"
              subtitle="How many lemmas are introduced each week">
              <NewWordsBar data={stats.words_per_week} />
            </ChartCard>
          </div>


        </section>

        {/* ── 2. Story Tree ──────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Story Tree"
            subtitle="The branching structure — how deep the world goes and where the frontier lies"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <ChartCard title="Stories per Depth"
              subtitle="How many stories exist at each level of the tree">
              <DepthBars stories={stats.stories_per_depth} frontier={stats.frontier_per_depth} />
            </ChartCard>

            <ChartCard title="Frontier Depth Distribution"
              subtitle="Where unexpanded words are waiting">
              <div className="space-y-3">
                {stats.frontier_per_depth.map(d => (
                  <div key={d.depth}>
                    <ProgressBar
                      value={d.count / Math.max(...stats.frontier_per_depth.map(x => x.count), 1)}
                      label={`depth ${d.depth}`}
                    />
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5 text-right">
                      {d.count} words
                    </p>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Root Coverage"
              subtitle="Fraction of the root story's nonce words that have been expanded">
              <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
                <div>
                  <div className="font-mono text-3xl font-bold text-stone-800 text-center">
                    {Math.round(stats.root_coverage * 100)}%
                  </div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest text-center mt-1 font-mono">
                    of story 0 explored
                  </p>
                </div>
                <div className="w-full">
                  <ProgressBar
                    value={stats.root_coverage}
                    label="story 0 frontier"
                    sublabel={`${Object.values(data.lexicon).filter(e => e.stories_about.length > 0).length} of ${meta.total_words} words expanded`}
                  />
                </div>
              </div>
            </ChartCard>
          </div>
        </section>

        {/* ── 3. Linguistic Density ──────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Linguistic Density"
            subtitle="How nonce-dense each story is, and whether stories follow their target curves"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <ChartCard title="Nonce Density by Depth"
              subtitle="Actual density vs target curve">
              <DensityScatter
                points={densityPoints}
                curve={stats.density_curve}
              />
            </ChartCard>

            <ChartCard title="Story Length by Depth"
              subtitle="Word count vs depth — shaded band is the target range">
              <LengthScatter
                points={lengthPoints}
                curve={stats.length_curve}
              />
            </ChartCard>
          </div>
        </section>

        {/* ── 4. Reuse & Cross-referencing ───────────────────────────── */}
        <section>
          <SectionHeader
            title="Reuse & Cross-referencing"
            subtitle="Which words recur across stories, and how the lexicon is being woven together"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <ChartCard title="Most Frequently Appearing Words"
              subtitle="Top 15 words by number of stories they appear in">
              <TopWordsBars data={stats.top_words_by_appearance} />
            </ChartCard>

            <ChartCard title="New vs Reused Words per Story"
              subtitle="Dark = newly coined, light = borrowed from existing lexicon">
              <ReuseBars data={stats.reuse_per_story} />
              {stats.reuse_per_story.every(s => s.reused_words === 0) && (
                <p className="text-[10px] text-stone-400 font-serif italic mt-3 text-center">
                  No reuse yet — all words are freshly coined. Cross-referencing begins as the lexicon grows.
                </p>
              )}
            </ChartCard>
          </div>
        </section>

        {/* ── 5. Growth Timeline ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Growth Timeline"
            subtitle="A record of what has been written, week by week"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <ChartCard title="Cumulative Growth"
              subtitle="Total stories, words, and concepts over time">
              <GrowthLines data={stats.cumulative_growth} />
            </ChartCard>

            <ChartCard title="Weekly Chronicle"
              subtitle="What happened each week of the project">
              <WeekTimeline entries={stats.weekly_changelog} />
            </ChartCard>
          </div>
        </section>

        {/* Footer note */}
        <div className="text-center pb-4">
          <p className="text-[10px] text-stone-500 font-serif italic">
            Last updated {meta.last_updated} · week {meta.latest_week}
          </p>
        </div>
      </div>
    </div>
  );
}
