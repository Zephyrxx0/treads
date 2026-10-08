import { db } from '@/lib/db';

const MAX_CACHED_CLIPS = 50;

/**
 * Computes deterministic SHA-256 hex string for a given text and voiceId.
 * Normalized to lowercase and trimmed to maximize cache hits.
 */
export async function computeSpeechHash(
  text: string,
  voiceId: string = 'nature-narrator'
): Promise<string> {
  const normalized = `${voiceId}:${text.trim().toLowerCase()}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback for test runner
  const nodeCrypto = await import('crypto');
  return nodeCrypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Checks Dexie speechCache for existing synthesized audio blob.
 */
export async function getCachedSpeech(textHash: string): Promise<Blob | null> {
  try {
    const record = await db.speechCache.where('textHash').equals(textHash).first();
    if (!record || !record.audio) return null;

    if (record.audio instanceof Blob) {
      return record.audio;
    } else if (typeof record.audio === 'string') {
      // Base64 or object URL fallback
      const buffer = Buffer.from(record.audio, 'base64');
      return new Blob([buffer], { type: 'audio/mpeg' });
    }
    return null;
  } catch (err) {
    console.warn('Error reading speechCache:', err);
    return null;
  }
}

/**
 * Saves synthesized audio blob in Dexie speechCache and applies LRU eviction (max 50 clips).
 */
export async function saveCachedSpeech(
  textHash: string,
  audio: Blob
): Promise<void> {
  try {
    const existing = await db.speechCache.where('textHash').equals(textHash).first();
    if (existing) return;

    await db.speechCache.add({
      id: crypto.randomUUID(),
      textHash,
      audio,
      createdAt: Date.now(),
    });

    // Enforce LRU pruning if count exceeds threshold
    const totalCount = await db.speechCache.count();
    if (totalCount > MAX_CACHED_CLIPS) {
      const oldest = await db.speechCache
        .orderBy('createdAt')
        .limit(totalCount - MAX_CACHED_CLIPS)
        .toArray();

      for (const item of oldest) {
        await db.speechCache.delete(item.id);
      }
    }
  } catch (err) {
    console.warn('Error saving to speechCache:', err);
  }
}

/**
 * Native browser SpeechSynthesis fallback with sentence-level stability.
 */
export function speakWithBrowserUtterance(
  text: string,
  options?: {
    rate?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options?.onError?.(new Error('speechSynthesis not supported on this device'));
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      options?.onEnd?.();
    };

    utterance.onerror = (err) => {
      console.warn('speechSynthesis utterance error:', err);
      options?.onError?.(err);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Failed to start browser speech synthesis:', err);
    options?.onError?.(err);
  }
}

export function stopBrowserUtterance(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
