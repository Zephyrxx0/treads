'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const BAR_COUNT = 36;

/** Deterministic placeholder bars, so a note without decodable audio still looks like a clip. */
function placeholderPeaks(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BAR_COUNT }, () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h ^= h >>> 13;
    return 0.2 + ((h >>> 0) % 1000) / 1250;
  });
}

/** Downsample decoded audio into BAR_COUNT normalised peak values (0..1). */
async function computePeaks(blob: Blob): Promise<number[]> {
  const Ctx: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buffer.getChannelData(0);
    const block = Math.max(1, Math.floor(data.length / BAR_COUNT));
    const peaks: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let max = 0;
      const start = i * block;
      const end = Math.min(start + block, data.length);
      for (let j = start; j < end; j++) max = Math.max(max, Math.abs(data[j]));
      peaks.push(max);
    }
    const top = Math.max(...peaks, 0.0001);
    return peaks.map((p) => Math.max(0.12, p / top));
  } finally {
    void ctx.close();
  }
}

export interface NoteWaveformProps {
  audio?: Blob | null;
  /** Stable id used for the placeholder shape */
  seed: string;
  /** 0..1 playback position; bars before it are drawn solid */
  progress?: number;
  className?: string;
}

/** A waveform generated from the recorded clip itself. */
export function NoteWaveform({ audio, seed, progress = 0, className }: NoteWaveformProps) {
  const [peaks, setPeaks] = useState<number[]>(() => placeholderPeaks(seed));

  useEffect(() => {
    if (!audio) return;
    let cancelled = false;
    computePeaks(audio)
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch(() => undefined); // keep the placeholder
    return () => {
      cancelled = true;
    };
  }, [audio]);

  return (
    <div aria-hidden className={cn('flex h-8 items-center gap-[2px]', className)}>
      {peaks.map((p, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] flex-1 rounded-full transition-colors',
            i / peaks.length < progress ? 'bg-primary' : 'bg-primary/30',
          )}
          style={{ height: `${Math.round(p * 100)}%` }}
        />
      ))}
    </div>
  );
}
