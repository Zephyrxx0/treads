import { getUserSettings } from '@/lib/db';

/**
 * Native device tactile vibration feedback engine.
 * Safely checks for navigator.vibrate support and user preferences in db.settings.
 */

async function canVibrate(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!('vibrate' in navigator)) return false;

  try {
    const settings = await getUserSettings();
    return settings.hapticsEnabled ?? true;
  } catch {
    return true;
  }
}

/**
 * Crisp single tap (25ms) on camera shutter or candidate selection.
 */
export async function triggerCaptureHaptic(): Promise<void> {
  if (!(await canVibrate())) return;
  try {
    navigator.vibrate(25);
  } catch {
    // Swallow vibration errors silently on unsupported environments
  }
}

/**
 * Resonant double pulse [40ms, 60ms, 80ms] on organism confirmation.
 */
export async function triggerConfirmHaptic(): Promise<void> {
  if (!(await canVibrate())) return;
  try {
    navigator.vibrate([40, 60, 80]);
  } catch {
    // Swallow vibration errors
  }
}

/**
 * Celebratory double/triple pulse on daily hunt milestone victory.
 */
export async function triggerHuntWinHaptic(): Promise<void> {
  if (!(await canVibrate())) return;
  try {
    navigator.vibrate([40, 60, 80]);
  } catch {
    // Swallow vibration errors
  }
}

