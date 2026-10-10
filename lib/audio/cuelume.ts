import { getUserSettings } from '@/lib/db';

let audioCtx: AudioContext | null = null;

/**
 * Lazily instantiate and resume the Web Audio AudioContext upon user gesture.
 * Complies with modern mobile browser autoplay policies.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Unlock audio on initial user touch or interaction to satisfy mobile autoplay policies.
 */
export function unlockAudio(): void {
  getAudioContext();
}

/**
 * Synthesizes a warm, organic bell tone with exponential decay envelope.
 */
function synthesizeChimeTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number = 0.8,
  peakGain: number = 0.15,
  type: OscillatorType = 'sine'
) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Exponential decay envelope
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.warn('[Cuelume] Failed to synthesize chime tone:', err);
  }
}

/**
 * Specimen confirmation chime:
 * Warm major-third dual chime (E5: 659.25 Hz and G#5: 830.61 Hz)
 * with a slight 30ms offset for an organic field bell timbre.
 */
export async function playCaptureChime(force: boolean = false): Promise<void> {
  // Synchronously capture/resume context within active user gesture stack
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (!force) {
      const settings = await getUserSettings();
      if (!settings.soundEnabled) return;
    }

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Primary E5 tone
    synthesizeChimeTone(ctx, 659.25, now, 0.8, 0.14, 'sine');
    // Subtle triangle overtone for warmth
    synthesizeChimeTone(ctx, 659.25, now, 0.5, 0.04, 'triangle');

    // Major third G#5 tone offset by 30ms
    synthesizeChimeTone(ctx, 830.61, now + 0.03, 0.85, 0.12, 'sine');
  } catch (err) {
    console.warn('[Cuelume] playCaptureChime error:', err);
  }
}

/**
 * Daily Hunt victory chime:
 * Joyful 4-note ascending arpeggio (C5 -> E5 -> G5 -> C6)
 * spaced at 120ms intervals with smooth decay.
 */
export async function playHuntChime(force: boolean = false): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (!force) {
      const settings = await getUserSettings();
      if (!settings.soundEnabled) return;
    }

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, offset: 0.00 }, // C5
      { freq: 659.25, offset: 0.12 }, // E5
      { freq: 783.99, offset: 0.24 }, // G5
      { freq: 1046.50, offset: 0.36 }, // C6
    ];

    for (const note of notes) {
      synthesizeChimeTone(ctx, note.freq, now + note.offset, 0.7, 0.13, 'sine');
    }
  } catch (err) {
    console.warn('[Cuelume] playHuntChime error:', err);
  }
}
