#!/usr/bin/env python3
"""
build_stories_data.py
Transforms data/nonce_stories_memory.json → data/stories_data.json
The memory file is NEVER modified by this script.
"""

import json
import re
import os
from pathlib import Path
from itertools import combinations

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
MEMORY_PATH = ROOT_DIR / "data" / "nonce_stories_memory.json"
OUTPUT_PATH = ROOT_DIR / "data" / "stories_data.json"


def build_morph_map(lexicon: dict) -> dict:
    """
    Build a dict mapping every surface form → lemma.
    Covers all explicit morphology entries plus derivational forms.
    """
    morph_map = {}

    # Derivational suffix patterns
    DERIV_SUFFIXES = [
        ("ik", None),    # noun_to_adj
        ("om", None),    # verb_to_noun_act
        ("ath", None),   # adj_to_noun_quality
    ]

    for lemma, entry in lexicon.items():
        # Map lemma → itself
        morph_map[lemma.lower()] = lemma

        morphology = entry.get("morphology", {}) or {}
        for key, surface in morphology.items():
            if surface:
                morph_map[surface.lower()] = lemma

        # Derivational forms: also map lemma+suffix → lemma
        for suffix, _ in DERIV_SUFFIXES:
            derived = lemma + suffix
            morph_map[derived.lower()] = lemma

    return morph_map


def strip_english_inflections(word: str, lemma_set: set) -> str | None:
    """
    Try stripping English-style inflections from a word to find a lemma.
    Returns the lemma if found, else None.
    """
    w = word.lower()

    # Past tense: -ed
    if w.endswith("ed") and len(w) > 4:
        stem = w[:-2]
        if stem in lemma_set:
            return stem
        # also try dropping the doubling: -ned → -n
        if len(w) > 5 and w[-3] == w[-4]:
            stem2 = w[:-3]
            if stem2 in lemma_set:
                return stem2

    # Participle: -ing
    if w.endswith("ing") and len(w) > 5:
        stem = w[:-3]
        if stem in lemma_set:
            return stem
        # -ing after vowel: add back the e
        stem_e = stem + "e"
        if stem_e in lemma_set:
            return stem_e

    # Adverb: -ly
    if w.endswith("ly") and len(w) > 4:
        stem = w[:-2]
        if stem in lemma_set:
            return stem

    return None


def tokenize(text: str) -> list[dict]:
    """
    Tokenize story text into a list of raw token dicts with 'text' only.
    Splits on whitespace (preserving \n, \n\n) and separates punctuation.
    """
    tokens = []
    # Split text preserving paragraph breaks and newlines
    # We'll process character by character to keep all structure
    i = 0
    n = len(text)

    while i < n:
        # Double newline (paragraph break)
        if text[i] == '\n' and i + 1 < n and text[i + 1] == '\n':
            tokens.append({"text": "\n\n"})
            i += 2
            # Skip any additional newlines
            while i < n and text[i] == '\n':
                i += 1
            continue

        # Single newline
        if text[i] == '\n':
            tokens.append({"text": "\n"})
            i += 1
            continue

        # Space (or other horizontal whitespace)
        if text[i] == ' ' or text[i] == '\t':
            tokens.append({"text": text[i]})
            i += 1
            continue

        # Collect a word (including possible trailing punctuation)
        j = i
        while j < n and text[j] not in (' ', '\t', '\n'):
            j += 1
        chunk = text[i:j]
        i = j

        # Split chunk into leading punct + word + trailing punct
        # Leading punctuation (e.g., opening quotes, em-dashes)
        lead_match = re.match(r'^([^\w]+)', chunk)
        lead = lead_match.group(1) if lead_match else ''

        # Trailing punctuation (e.g., comma, period, colon, closing quotes)
        trail_match = re.search(r'([^\w]+)$', chunk)
        trail = trail_match.group(1) if trail_match else ''

        word_part = chunk[len(lead):len(chunk) - len(trail)] if trail else chunk[len(lead):]

        if lead:
            tokens.append({"text": lead})
        if word_part:
            tokens.append({"text": word_part})
        if trail:
            tokens.append({"text": trail})

    return tokens


def classify_token(
    text: str,
    morph_map: dict,
    functional_set: set,
    story_children: dict,
) -> dict:
    """
    Given a raw text token, return a fully classified StoryToken dict.
    """
    # Whitespace / punctuation → function
    stripped = text.strip()
    if not stripped or not re.search(r'\w', text):
        return {"text": text, "type": "function"}

    word_lower = text.lower()

    # Check nonce via morph_map
    lemma = morph_map.get(word_lower)
    if lemma is not None:
        # Determine state
        child_story = story_children.get(lemma)  # None means frontier, str means expanded
        if child_story is not None:
            state = "expanded"
        else:
            state = "frontier"
        token: dict = {
            "text": text,
            "type": "nonce",
            "state": state,
            "child_story": child_story,
        }
        # Include lemma only if it differs from displayed text (morphological variant)
        if lemma != word_lower:
            token["lemma"] = lemma
        else:
            token["lemma"] = lemma
        return token

    # Check English-style inflection stripping
    lemma_set = set(morph_map.values())
    en_lemma = strip_english_inflections(word_lower, lemma_set)
    if en_lemma is not None:
        child_story = story_children.get(en_lemma)
        state = "expanded" if child_story is not None else "frontier"
        return {
            "text": text,
            "type": "nonce",
            "state": state,
            "child_story": child_story,
            "lemma": en_lemma,
        }

    # Functional word check (case-insensitive)
    if word_lower in functional_set:
        return {"text": text, "type": "function"}

    # Real English content word
    return {"text": text, "type": "content"}


def is_deep_solved(story_id: str, story_tree: dict) -> bool:
    """Recursively check if all nonce word branches are expanded."""
    story = story_tree.get(story_id)
    if not story:
        return False
    children = story.get("children", {})
    for lemma, child_id in children.items():
        if child_id is None:
            return False
        if not is_deep_solved(child_id, story_tree):
            return False
    return True


def update_deep_solved_states(tokens: list[dict], story_id: str, story_tree: dict) -> list[dict]:
    """
    After initial tokenization, upgrade 'expanded' nonce tokens to 'deep_solved'
    where applicable.
    """
    updated = []
    for token in tokens:
        if token.get("type") == "nonce" and token.get("state") == "expanded":
            child = token.get("child_story")
            if child and is_deep_solved(child, story_tree):
                token = dict(token)
                token["state"] = "deep_solved"
        updated.append(token)
    return updated


def build_breadcrumb_label(story: dict, lexicon: dict) -> str:
    """Return breadcrumb label for a story."""
    if story["depth"] == 0:
        return story.get("title") or "The Root"
    parent_word = story.get("parent_nonce_word") or story.get("id")
    return parent_word


def compute_stats(memory: dict) -> dict:
    """Compute all aggregate statistics for the frontend stats page."""
    meta = memory["meta"]
    lexicon = memory["lexicon"]
    story_tree = memory["story_tree"]
    expansion_log = memory.get("expansion_log", [])

    # ── 1. POS distribution ───────────────────────────────────────────────
    POS_MAP = {
        "noun": "noun", "verb": "verb", "adjective": "adj", "adverb": "adv",
        "adjective/noun": "adj/n", "noun/verb": "n/v",
    }
    raw_counts: dict = {}
    for entry in lexicon.values():
        mapped = POS_MAP.get(entry["pos"], entry["pos"])
        raw_counts[mapped] = raw_counts.get(mapped, 0) + 1
    POS_ORDER = ["noun", "verb", "adj", "adv", "adj/n", "n/v"]
    pos_distribution = [{"pos": p, "count": raw_counts[p]} for p in POS_ORDER if p in raw_counts]
    for p, c in raw_counts.items():
        if p not in POS_ORDER:
            pos_distribution.append({"pos": p, "count": c})

    # ── 2. Concepts ───────────────────────────────────────────────────────
    total_words = len(lexicon)
    discovered = sum(1 for e in lexicon.values() if e.get("concept") is not None)
    concepts = {"discovered": discovered, "undiscovered": total_words - discovered, "total": total_words}

    # ── 3. Words per week ─────────────────────────────────────────────────
    week_new_words: dict = {}
    for entry in lexicon.values():
        story = story_tree.get(entry["introduced_in"], {})
        w = story.get("week", 0)
        week_new_words[w] = week_new_words.get(w, 0) + 1
    cum = 0
    words_per_week = []
    for w in sorted(week_new_words):
        cum += week_new_words[w]
        words_per_week.append({"week": w, "new": week_new_words[w], "cumulative": cum})

    # ── 4. Stories per depth ──────────────────────────────────────────────
    depth_story: dict = {}
    for s in story_tree.values():
        d = s["depth"]
        depth_story[d] = depth_story.get(d, 0) + 1
    stories_per_depth = [{"depth": d, "count": depth_story[d]} for d in sorted(depth_story)]

    # ── 5. Frontier per depth ─────────────────────────────────────────────
    depth_frontier: dict = {}
    for entry in lexicon.values():
        if not entry.get("stories_about"):
            d = entry["depth_introduced"]
            depth_frontier[d] = depth_frontier.get(d, 0) + 1
    frontier_per_depth = [{"depth": d, "count": depth_frontier[d]} for d in sorted(depth_frontier)]

    # ── 6. Story density scatter ──────────────────────────────────────────
    density_curve_meta = meta.get("density_curve", {})
    story_density_scatter = []
    for sid, s in story_tree.items():
        depth = s["depth"]
        actual = s.get("nonce_density_actual", 0)
        target = float(density_curve_meta.get(str(depth), density_curve_meta.get("leaf", 0)))
        story_density_scatter.append({
            "story_id": sid, "depth": depth, "actual": actual,
            "target": target, "word_count": s.get("word_count", 0),
        })

    # ── 7. Density curve (target overlay) ────────────────────────────────
    density_curve = [
        {"depth": d, "target": float(density_curve_meta[str(d)])}
        for d in range(7) if str(d) in density_curve_meta
    ]
    if "leaf" in density_curve_meta:
        density_curve.append({"depth": 7, "target": float(density_curve_meta["leaf"])})

    # ── 8. Length curve ───────────────────────────────────────────────────
    length_curve_meta = meta.get("length_curve", {})
    length_curve = []
    for d in range(7):
        key = str(d)
        if key in length_curve_meta:
            rng = length_curve_meta[key]
            length_curve.append({"depth": d, "min": rng[0], "max": rng[1], "mid": (rng[0] + rng[1]) / 2})

    # ── 9. Top words by appearance count ─────────────────────────────────
    word_appearances = sorted(
        [{"word": lem, "count": len(e.get("appears_in", []))} for lem, e in lexicon.items()],
        key=lambda x: (-x["count"], x["word"])
    )
    top_words_by_appearance = word_appearances[:20]

    # ── 10. Reuse per story ───────────────────────────────────────────────
    reuse_per_story = []
    for sid, s in sorted(story_tree.items(), key=lambda x: (x[1].get("week", 0), x[1].get("created", ""))):
        used = len(s.get("nonce_words_used", []))
        new = len(s.get("nonce_words_new", []))
        reuse_per_story.append({
            "story_id": sid, "date": s.get("created", ""), "week": s.get("week", 0),
            "new_words": new, "reused_words": max(0, used - new), "total_words": used,
        })

    # ── 11. Word co-occurrence (top pairs by stories shared) ─────────────
    pair_counts: dict = {}
    for s in story_tree.values():
        words = sorted(s.get("nonce_words_used", []))
        for a, b in combinations(words, 2):
            pair_counts[(a, b)] = pair_counts.get((a, b), 0) + 1
    top_pairs = sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)[:30]
    word_cooccurrence = [{"word_a": k[0], "word_b": k[1], "count": v} for k, v in top_pairs]

    # ── 12. Cumulative growth by week ─────────────────────────────────────
    week_stories: dict = {}
    for s in story_tree.values():
        w = s.get("week", 0)
        week_stories[w] = week_stories.get(w, 0) + 1
    all_weeks = sorted(set(list(week_stories) + list(week_new_words)))
    cum_s = cum_w = 0
    cumulative_growth = []
    for w in all_weeks:
        cum_s += week_stories.get(w, 0)
        cum_w += week_new_words.get(w, 0)
        cumulative_growth.append({"week": w, "stories": cum_s, "words": cum_w, "concepts": discovered})

    # ── 13. Root coverage ─────────────────────────────────────────────────
    children_0 = story_tree.get("story_0", {}).get("children", {})
    expanded_0 = sum(1 for v in children_0.values() if v is not None)
    root_coverage = expanded_0 / len(children_0) if children_0 else 0.0

    # ── 14. Weekly changelog ──────────────────────────────────────────────
    weekly_changelog = [{
        "week": e.get("week", 0), "date": e.get("date", ""),
        "action": e.get("action", ""), "story_id": e.get("story_id", ""),
        "words_introduced": e.get("words_introduced", 0), "notes": e.get("notes", ""),
    } for e in expansion_log]

    return {
        "pos_distribution": pos_distribution,
        "concepts": concepts,
        "words_per_week": words_per_week,
        "stories_per_depth": stories_per_depth,
        "frontier_per_depth": frontier_per_depth,
        "story_density_scatter": story_density_scatter,
        "density_curve": density_curve,
        "length_curve": length_curve,
        "top_words_by_appearance": top_words_by_appearance,
        "reuse_per_story": reuse_per_story,
        "word_cooccurrence": word_cooccurrence,
        "cumulative_growth": cumulative_growth,
        "root_coverage": root_coverage,
        "weekly_changelog": weekly_changelog,
    }


def main():
    print(f"Reading {MEMORY_PATH}...")
    with open(MEMORY_PATH, "r", encoding="utf-8") as f:
        memory = json.load(f)

    meta = memory["meta"]
    lexicon = memory["lexicon"]
    story_tree = memory["story_tree"]
    expansion_log = memory.get("expansion_log", [])
    functional_words = set(w.lower() for w in meta.get("functional_words", []))

    # Build morphological surface → lemma map
    morph_map = build_morph_map(lexicon)

    print(f"  Lexicon entries: {len(lexicon)}")
    print(f"  Morph map entries: {len(morph_map)}")
    print(f"  Stories: {len(story_tree)}")

    # Process stories
    out_stories = {}
    all_nonce_token_counts = 0

    for story_id, story_data in story_tree.items():
        text = story_data.get("text", "")
        children = story_data.get("children", {})
        # children maps lemma → story_id_or_null

        # Tokenize
        raw_tokens = tokenize(text)

        # Classify
        classified = []
        for raw in raw_tokens:
            tok = classify_token(
                raw["text"],
                morph_map,
                functional_words,
                children,
            )
            classified.append(tok)

        # Update deep_solved states
        classified = update_deep_solved_states(classified, story_id, story_tree)

        # Count nonce words
        nonce_count = sum(1 for t in classified if t["type"] == "nonce")
        all_nonce_token_counts += nonce_count

        out_story = {
            "id": story_id,
            "depth": story_data["depth"],
            "parent": story_data.get("parent"),
            "parent_word": story_data.get("parent_nonce_word"),
            "tokens": classified,
            "week": story_data.get("week", 0),
            "created": story_data.get("created", ""),
            "status": story_data.get("status", "active"),
            "death_note": story_data.get("death_note"),
        }
        if "title" in story_data and story_data["title"]:
            out_story["title"] = story_data["title"]

        out_stories[story_id] = out_story

    # Build lexicon output (NEVER include concept or context_notes)
    out_lexicon = {}
    for lemma, entry in lexicon.items():
        out_entry = {
            "id": entry["id"],
            "pos": entry["pos"],
            "has_concept": entry.get("concept") is not None,
            "introduced_in": entry["introduced_in"],
            "depth_introduced": entry["depth_introduced"],
            "appears_in": entry.get("appears_in", []),
            "stories_about": entry.get("stories_about", []),
        }
        # annotation is reader-facing — include it if present
        annotation = entry.get("annotation")
        if annotation is not None:
            out_entry["annotation"] = annotation
        out_lexicon[lemma] = out_entry

    # Build breadcrumb labels
    breadcrumb_labels = {}
    for story_id, story_data in story_tree.items():
        breadcrumb_labels[story_id] = build_breadcrumb_label(story_data, lexicon)

    # Build meta
    total_concepts = sum(
        1 for e in lexicon.values() if e.get("concept") is not None
    )
    max_depth = max((s["depth"] for s in story_tree.values()), default=0)
    latest_week = max((s.get("week", 0) for s in story_tree.values()), default=0)

    out_meta = {
        "total_stories": len(story_tree),
        "total_words": len(lexicon),
        "total_concepts_discovered": total_concepts,
        "max_depth": max_depth,
        "latest_week": latest_week,
        "last_updated": meta.get("last_updated", ""),
    }

    # Build expansion log (strip concept/context_notes if present)
    out_expansion_log = []
    for entry in expansion_log:
        log_entry = {
            "week": entry.get("week", 0),
            "date": entry.get("date", ""),
            "action": entry.get("action", ""),
            "story_id": entry.get("story_id", ""),
        }
        if "notes" in entry:
            log_entry["notes"] = entry["notes"]
        out_expansion_log.append(log_entry)

    # Compute aggregate statistics
    stats = compute_stats(memory)

    output = {
        "stories": out_stories,
        "lexicon": out_lexicon,
        "meta": out_meta,
        "breadcrumb_labels": breadcrumb_labels,
        "expansion_log": out_expansion_log,
        "stats": stats,
    }

    print(f"Writing {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("Done.")
    print(f"  Stories processed: {len(out_stories)}")
    print(f"  Lexicon entries: {len(out_lexicon)}")
    print(f"  Nonce tokens found: {all_nonce_token_counts}")

    # Sanity check: report any words from nonce_words_used that weren't found
    for story_id, story_data in story_tree.items():
        used = set(story_data.get("nonce_words_used", []))
        found = set()
        for tok in out_stories[story_id]["tokens"]:
            if tok["type"] == "nonce":
                found.add(tok.get("lemma", tok["text"].lower()))
        missing = used - found
        if missing:
            print(f"  WARNING: {story_id} — nonce lemmas used but not found in tokens: {sorted(missing)}")


if __name__ == "__main__":
    main()
