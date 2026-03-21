import { useRef, useState, useEffect, useCallback } from 'react';
import type { AudioEntry } from '../../types';

interface AudioPlayerProps {
  entry: AudioEntry;
  baseUrl: string;
}

const SPEEDS = [0.75, 1, 1.25] as const;
type Speed = typeof SPEEDS[number];

export function AudioPlayer({ entry, baseUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–1
  const [speed, setSpeed] = useState<Speed>(1);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = `${baseUrl}${entry.file}`;

  // Sync speed with audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Reset on story change
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setLoaded(false);
  }, [src]);

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
  }, []);

  const onEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = frac * el.duration;
    setProgress(frac);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed(s => {
      const idx = SPEEDS.indexOf(s);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  const formatTime = (frac: number) => {
    const secs = Math.round(frac * entry.duration_seconds);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onCanPlay={() => setLoaded(true)}
        preload="metadata"
      />

      {/* Speaker toggle — always visible */}
      <button
        onClick={() => { setExpanded(e => !e); }}
        title={expanded ? 'Hide audio controls' : 'Listen to this story'}
        className="text-stone-400 hover:text-stone-600 transition-colors p-0.5"
        aria-label="Toggle audio player"
      >
        {/* Speaker icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          {playing ? (
            // Pause icon when playing
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          ) : (
            // Speaker icon
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          )}
        </svg>
      </button>

      {/* Expanded controls */}
      {expanded && (
        <div className="flex items-center gap-2">
          {/* Play/pause */}
          <button
            onClick={togglePlay}
            disabled={!loaded}
            className="text-stone-500 hover:text-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={playing ? 'Pause' : 'Play'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              {playing
                ? <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                : <path d="M8 5v14l11-7L8 5z"/>
              }
            </svg>
          </button>

          {/* Progress bar */}
          <div
            className="w-28 sm:w-40 h-1 bg-stone-200 rounded-full cursor-pointer relative"
            onClick={seek}
            title={`${formatTime(progress)} / ${formatTime(1)}`}
          >
            <div
              className="h-full bg-stone-400 rounded-full transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Time */}
          <span className="text-[10px] font-mono text-stone-400 tabular-nums hidden sm:inline">
            {formatTime(progress)}
          </span>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="text-[10px] font-mono text-stone-400 hover:text-stone-600 transition-colors w-8 text-center"
            title="Cycle playback speed"
          >
            {speed}×
          </button>
        </div>
      )}
    </div>
  );
}
