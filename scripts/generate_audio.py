#!/usr/bin/env python3
"""
generate_audio.py — Audio Narration Layer for The Brolm
========================================================
Generates one WAV/MP3 audio file per story using Piper TTS (local, no API).
Nonce words are wrapped in SSML <phoneme> tags using the IPA pronunciation
guide from the memory file, so they are spoken correctly.

Usage:
  python scripts/generate_audio.py              # generate all missing audio
  python scripts/generate_audio.py --story story_0   # one story only
  python scripts/generate_audio.py --force      # regenerate even if up-to-date

Requirements:
  1. Piper binary installed (see SETUP below)
  2. A Piper voice model downloaded (see SETUP below)

SETUP
-----
Install Piper (choose one method):

  a) Download binary from https://github.com/rhasspy/piper/releases
     and place in ~/piper/ or anywhere on your $PATH.

  b) pip install piper-tts   (installs Python wrapper + binary)

Download a voice model:
  mkdir -p ~/piper/models
  cd ~/piper/models
  # Download en_US-lessac-medium (recommended)
  wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
  wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

Then set PIPER_BINARY and PIPER_MODEL below, or use env vars:
  export PIPER_BINARY=~/piper/piper
  export PIPER_MODEL=~/piper/models/en_US-lessac-medium.onnx

Optional (for MP3 conversion): install ffmpeg
  sudo apt install ffmpeg   # or brew install ffmpeg on macOS
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

# ── Configuration ─────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
MEMORY_PATH  = ROOT / "data" / "nonce_stories_memory.json"
STORIES_PATH = ROOT / "data" / "stories_data.json"
MANIFEST_PATH = ROOT / "data" / "audio_manifest.json"
AUDIO_DIR    = ROOT / "public" / "audio"

# Override via environment variables or edit here
PIPER_BINARY = os.environ.get("PIPER_BINARY", "piper")
PIPER_MODEL  = os.environ.get(
    "PIPER_MODEL",
    str(Path.home() / "piper" / "models" / "en_US-lessac-medium.onnx"),
)
USE_MP3 = True   # set False to keep WAV (requires ffmpeg for MP3)


# ── Helpers ───────────────────────────────────────────────────────────────────

def check_piper() -> bool:
    """Return True if the Piper binary is accessible."""
    try:
        result = subprocess.run(
            [PIPER_BINARY, "--version"],
            capture_output=True, timeout=5,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def check_ffmpeg() -> bool:
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def tokens_to_plain_text(tokens: list) -> str:
    """Reconstruct plain readable text from a story's token list."""
    parts = []
    for tok in tokens:
        text = tok["text"]
        if text == "\n\n":
            parts.append("\n\n")
        elif text == "\n":
            parts.append(" ")
        else:
            parts.append(text)
    return "".join(parts).strip()


def tokens_to_ssml(tokens: list, pronunciation_map: dict) -> str:
    """
    Build SSML from story tokens, wrapping nonce words in <phoneme> tags
    using the IPA guide from the memory file.

    pronunciation_map: { lemma: { "ipa": "/brɒlm/", ... } }
    """
    parts = ['<speak>']
    for tok in tokens:
        text = tok["text"]
        tok_type = tok.get("type", "function")

        if text == "\n\n":
            parts.append('<break time="600ms"/>')
        elif text == "\n":
            parts.append('<break time="200ms"/>')
        elif tok_type == "nonce":
            lemma = tok.get("lemma", text.lower())
            pron = pronunciation_map.get(lemma)
            if pron and pron.get("ipa"):
                # Strip surrounding slashes from IPA if present
                ipa = pron["ipa"].strip("/")
                parts.append(
                    f'<phoneme alphabet="ipa" ph="{ipa}">{text}</phoneme>'
                )
            else:
                parts.append(text)
        else:
            # Escape XML special characters
            escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            parts.append(escaped)

    parts.append('</speak>')
    return "".join(parts)


def get_audio_duration(wav_path: Path) -> float:
    """Return duration of a WAV file in seconds using ffprobe, or 0 on failure."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet", "-print_format", "json",
                "-show_streams", str(wav_path),
            ],
            capture_output=True, text=True, timeout=10,
        )
        info = json.loads(result.stdout)
        streams = info.get("streams", [])
        if streams:
            return float(streams[0].get("duration", 0))
    except Exception:
        pass
    return 0.0


def run_piper(ssml: str, output_wav: Path) -> bool:
    """Call Piper to synthesise SSML → WAV. Returns True on success."""
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = subprocess.run(
            [
                PIPER_BINARY,
                "--model", PIPER_MODEL,
                "--output_file", str(output_wav),
                "--ssml",
            ],
            input=ssml,
            text=True,
            capture_output=True,
            timeout=120,
        )
        if result.returncode != 0:
            print(f"    Piper error: {result.stderr.strip()}", file=sys.stderr)
            return False
        return output_wav.exists()
    except FileNotFoundError:
        print(f"    ERROR: Piper binary not found at '{PIPER_BINARY}'", file=sys.stderr)
        return False
    except subprocess.TimeoutExpired:
        print("    ERROR: Piper timed out", file=sys.stderr)
        return False


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> bool:
    """Convert WAV to MP3 using ffmpeg. Returns True on success."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(wav_path),
                "-codec:a", "libmp3lame", "-qscale:a", "4",
                str(mp3_path),
            ],
            capture_output=True, timeout=60,
        )
        return result.returncode == 0 and mp3_path.exists()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate audio for Nonce Stories")
    parser.add_argument("--story", help="Generate audio for one story ID only")
    parser.add_argument("--force", action="store_true", help="Regenerate even if file exists")
    args = parser.parse_args()

    # ── Pre-flight checks ──────────────────────────────────────────────────
    print("Checking dependencies...")

    if not check_piper():
        print(
            f"\nERROR: Piper not found at '{PIPER_BINARY}'.\n"
            "Set the PIPER_BINARY environment variable or install Piper.\n"
            "See the SETUP section at the top of this script.\n"
        )
        sys.exit(1)
    print(f"  ✓ Piper binary: {PIPER_BINARY}")

    model_path = Path(PIPER_MODEL)
    if not model_path.exists():
        print(
            f"\nERROR: Piper model not found at '{PIPER_MODEL}'.\n"
            "Set the PIPER_MODEL environment variable or download a model.\n"
            "See the SETUP section at the top of this script.\n"
        )
        sys.exit(1)
    print(f"  ✓ Piper model:  {PIPER_MODEL}")

    has_ffmpeg = check_ffmpeg()
    if USE_MP3 and not has_ffmpeg:
        print("  ⚠ ffmpeg not found — audio will be saved as WAV instead of MP3")
    elif has_ffmpeg:
        print("  ✓ ffmpeg: available")

    # ── Load data ──────────────────────────────────────────────────────────
    print(f"\nReading {STORIES_PATH}...")
    with open(STORIES_PATH, encoding="utf-8") as f:
        stories_data = json.load(f)

    print(f"Reading {MEMORY_PATH}...")
    with open(MEMORY_PATH, encoding="utf-8") as f:
        memory = json.load(f)

    # Build pronunciation map: lemma → { ipa, stress, rhymes_with }
    pronunciation_map = {
        lemma: entry["pronunciation"]
        for lemma, entry in memory.get("lexicon", {}).items()
        if entry.get("pronunciation")
    }
    print(f"  Pronunciation entries: {len(pronunciation_map)}")

    # Load existing manifest
    manifest: dict = {}
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, encoding="utf-8") as f:
            manifest = json.load(f)

    # ── Choose stories to process ──────────────────────────────────────────
    stories = stories_data.get("stories", {})
    if args.story:
        if args.story not in stories:
            print(f"ERROR: story '{args.story}' not found in stories_data.json")
            sys.exit(1)
        to_process = {args.story: stories[args.story]}
    else:
        to_process = stories

    # ── Generate audio ─────────────────────────────────────────────────────
    ext = "mp3" if (USE_MP3 and has_ffmpeg) else "wav"
    generated = 0
    skipped = 0
    failed = 0

    print(f"\nGenerating audio ({ext}) for {len(to_process)} stories...\n")

    for story_id, story in to_process.items():
        out_file = AUDIO_DIR / f"{story_id}.{ext}"
        rel_path = f"audio/{story_id}.{ext}"

        if not args.force and out_file.exists() and story_id in manifest:
            print(f"  [{story_id}] skipped (already exists)")
            skipped += 1
            continue

        print(f"  [{story_id}] generating...")
        tokens = story.get("tokens", [])

        # Build SSML
        ssml = tokens_to_ssml(tokens, pronunciation_map)

        # Log any nonce words without pronunciation
        nonce_lemmas = set(
            tok.get("lemma", tok["text"].lower())
            for tok in tokens if tok.get("type") == "nonce"
        )
        missing_pron = nonce_lemmas - set(pronunciation_map.keys())
        if missing_pron:
            print(
                f"    ⚠ No pronunciation guide for: {', '.join(sorted(missing_pron))}"
                " — Piper will guess pronunciation"
            )

        # Run Piper → WAV
        wav_path = AUDIO_DIR / f"{story_id}.wav"
        ok = run_piper(ssml, wav_path)
        if not ok:
            print(f"    ✗ Failed to generate audio for {story_id}")
            failed += 1
            continue

        # Convert to MP3 if needed
        if USE_MP3 and has_ffmpeg:
            mp3_ok = wav_to_mp3(wav_path, out_file)
            if mp3_ok:
                wav_path.unlink(missing_ok=True)   # remove intermediate WAV
            else:
                print(f"    ⚠ MP3 conversion failed — keeping WAV")
                out_file = wav_path
                rel_path = f"audio/{story_id}.wav"

        duration = get_audio_duration(out_file)
        manifest[story_id] = {
            "file": rel_path,
            "duration_seconds": round(duration, 1),
            "generated": str(date.today()),
        }
        print(f"    ✓ {out_file.name}  ({duration:.1f}s)")
        generated += 1

    # ── Write manifest ─────────────────────────────────────────────────────
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\nManifest written to {MANIFEST_PATH}")

    # ── Summary ────────────────────────────────────────────────────────────
    print(f"\nDone.")
    print(f"  Generated : {generated}")
    print(f"  Skipped   : {skipped}")
    print(f"  Failed    : {failed}")

    if generated > 0:
        print(
            "\nNEXT STEP: Run build_stories_data.py to embed the manifest "
            "in stories_data.json, then commit and push."
        )
        print("  python3 scripts/build_stories_data.py")


if __name__ == "__main__":
    main()
