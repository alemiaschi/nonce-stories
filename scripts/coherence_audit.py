#!/usr/bin/env python3
"""
Coherence Audit — Step 1: Payload Extraction
=============================================
Reads nonce_stories_memory.json and extracts usage_log entries for each
nonce word, stripping all authorial/interpretive fields (concept,
concept_discovered_from, context_notes, annotation).

Output: data/audit_payloads.json — ready to hand to Claude Code for
        distributional consistency analysis (Step 2).

Run: python scripts/coherence_audit.py

When to run: once the project has ~30–50 stories and multiple words
             appear in 2+ stories. For now (1 story) it will extract
             payloads but all words will be flagged as "single_story"
             and skipped in the evaluation phase.
"""

import json
import sys
from pathlib import Path
from datetime import date

ROOT = Path(__file__).parent.parent
MEMORY_FILE = ROOT / "data" / "nonce_stories_memory.json"
OUTPUT_FILE = ROOT / "data" / "audit_payloads.json"


def load_memory() -> dict:
    if not MEMORY_FILE.exists():
        print(f"ERROR: {MEMORY_FILE} not found.", file=sys.stderr)
        sys.exit(1)
    with open(MEMORY_FILE, encoding="utf-8") as f:
        return json.load(f)


def extract_payloads(memory: dict) -> dict:
    lexicon = memory.get("lexicon", {})
    story_tree = memory.get("story_tree", {})

    # Build a quick lookup: story_id -> depth
    story_depths = {sid: s.get("depth", 0) for sid, s in story_tree.items()}

    payloads = []
    skipped_no_log = []
    skipped_single_story = []

    for word_id, entry in lexicon.items():
        usage_log = entry.get("usage_log", [])
        appears_in = entry.get("appears_in", [])

        # usage_log not yet populated for this word
        if not usage_log:
            skipped_no_log.append(word_id)
            continue

        # Only meaningful to audit words appearing in 2+ stories
        if len(appears_in) < 2:
            skipped_single_story.append(word_id)
            continue

        # Strip authorial/interpretive fields — auditor sees ONLY usage patterns
        clean_entries = []
        for u in usage_log:
            clean_entries.append({
                "story_id":      u.get("story_id"),
                "story_depth":   story_depths.get(u.get("story_id", ""), "?"),
                "surface_form":  u.get("surface_form"),
                "sentence":      u.get("sentence"),
                "syntactic_role": u.get("syntactic_role"),
                "nearby_words":  u.get("nearby_words", []),
                "semantic_hints": u.get("semantic_hints", []),
            })

        payloads.append({
            "word":        word_id,
            "pos":         entry.get("pos"),
            "appearances": len(appears_in),
            "stories":     appears_in,
            "usage_log":   clean_entries,
        })

    return {
        "extraction_date": str(date.today()),
        "memory_file": str(MEMORY_FILE.name),
        "total_lexicon": len(lexicon),
        "words_to_audit": len(payloads),
        "skipped_no_usage_log": len(skipped_no_log),
        "skipped_single_story": len(skipped_single_story),
        "skip_notes": {
            "no_usage_log": (
                "These words have no usage_log yet. usage_log is populated by "
                "Claude (author-side) when writing stories. Once the memory file "
                "is updated with usage logs, rerun this script."
            ),
            "single_story": (
                "These words appear in only one story — no cross-story comparison "
                "is possible. They will be auditable once they are reused in a "
                "second story."
            ),
        },
        "skipped_words": {
            "no_usage_log": skipped_no_log,
            "single_story": skipped_single_story,
        },
        "payloads": payloads,
    }


def main():
    print(f"Reading {MEMORY_FILE}...")
    memory = load_memory()

    result = extract_payloads(memory)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Written {OUTPUT_FILE}")
    print(f"  Total lexicon entries : {result['total_lexicon']}")
    print(f"  Words to audit        : {result['words_to_audit']}")
    print(f"  Skipped (no log)      : {result['skipped_no_usage_log']}")
    print(f"  Skipped (1 story)     : {result['skipped_single_story']}")

    if result["words_to_audit"] == 0:
        print()
        print("NOTE: No words are ready to audit yet.")
        if result["skipped_no_usage_log"] > 0:
            print(
                f"  → {result['skipped_no_usage_log']} words have no usage_log. "
                "Ask Claude (author-side) to populate usage_log entries as part "
                "of the next story-generation session."
            )
        if result["skipped_single_story"] > 0:
            print(
                f"  → {result['skipped_single_story']} words appear in only one "
                "story so far. Run again when more stories are written."
            )
    else:
        print()
        print("NEXT STEP:")
        print(f"  Give {OUTPUT_FILE} to Claude Code and ask:")
        print(
            '  "Read data/audit_payloads.json. For each word in payloads[], '
            "evaluate whether its usage_log entries are consistent with a single "
            "coherent concept. Judge only from syntactic roles, nearby words, and "
            "semantic hints — never guess meanings. Output data/audit_report.json "
            'with your consistency ratings."'
        )


if __name__ == "__main__":
    main()
