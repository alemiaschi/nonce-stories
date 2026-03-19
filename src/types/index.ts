export interface StoryToken {
  text: string;
  type: "function" | "nonce" | "content";
  state?: "frontier" | "expanded" | "deep_solved";
  child_story?: string | null;
  lemma?: string;
}

export interface Story {
  id: string;
  depth: number;
  parent: string | null;
  parent_word: string | null;
  tokens: StoryToken[];
  week: number;
  created: string;
  title?: string;
  status?: "active" | "dead";
  death_note?: string | null;
}

export interface LexiconEntry {
  id: string;
  pos: string;
  has_concept: boolean;
  introduced_in: string;
  depth_introduced: number;
  appears_in: string[];
  stories_about: string[];
  annotation?: string | null;
}

export interface ExpansionLogEntry {
  week: number;
  date: string;
  action: string;
  story_id: string;
  notes?: string;
}

export interface AppMeta {
  total_stories: number;
  total_words: number;
  total_concepts_discovered: number;
  max_depth: number;
  latest_week: number;
  last_updated: string;
}

// ── Stats page types ──────────────────────────────────────────────────────

export interface PosEntry { pos: string; count: number; }
export interface WeeklyWords { week: number; new: number; cumulative: number; }
export interface DepthCount { depth: number; count: number; }
export interface DensityPoint { story_id: string; depth: number; actual: number; target: number; word_count: number; }
export interface CurvePoint { depth: number; target: number; }
export interface LengthPoint { depth: number; min: number; max: number; mid: number; }
export interface WordAppearance { word: string; count: number; }
export interface ReuseStory { story_id: string; date: string; week: number; new_words: number; reused_words: number; total_words: number; }
export interface CooccurrenceEntry { word_a: string; word_b: string; count: number; }
export interface GrowthPoint { week: number; stories: number; words: number; concepts: number; }
export interface ChangelogEntry { week: number; date: string; action: string; story_id: string; words_introduced: number; notes: string; }

export interface AppStats {
  pos_distribution: PosEntry[];
  concepts: { discovered: number; undiscovered: number; total: number };
  words_per_week: WeeklyWords[];
  stories_per_depth: DepthCount[];
  frontier_per_depth: DepthCount[];
  story_density_scatter: DensityPoint[];
  density_curve: CurvePoint[];
  length_curve: LengthPoint[];
  top_words_by_appearance: WordAppearance[];
  reuse_per_story: ReuseStory[];
  word_cooccurrence: CooccurrenceEntry[];
  cumulative_growth: GrowthPoint[];
  root_coverage: number;
  weekly_changelog: ChangelogEntry[];
}

export interface AppData {
  stories: Record<string, Story>;
  lexicon: Record<string, LexiconEntry>;
  meta: AppMeta;
  breadcrumb_labels: Record<string, string>;
  expansion_log: ExpansionLogEntry[];
  stats: AppStats;
}
