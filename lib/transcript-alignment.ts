/**
 * Character-level timing, the shape the ElevenLabs transcript viewer consumes.
 * Mirrors `CharacterAlignmentResponseModel` from the ElevenLabs SDK so the app
 * does not need that SDK just for a type.
 */
export interface CharacterAlignmentResponseModel {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}

/** One timed token from speech-to-text (Scribe returns these per word). */
export interface TimedWord {
  text: string;
  start: number;
  end: number;
  type?: 'word' | 'spacing' | 'audio_event';
}

/**
 * Spread each word's duration evenly over its characters, putting a single
 * space between words. Gives the viewer something to highlight as audio plays.
 */
export function wordsToAlignment(words: TimedWord[]): CharacterAlignmentResponseModel {
  const characters: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];

  let previousEnd = 0;
  for (const word of words) {
    if (word.type === 'spacing' || word.type === 'audio_event') continue;
    const text = word.text.trim();
    if (!text) continue;

    if (characters.length > 0) {
      characters.push(' ');
      starts.push(previousEnd);
      ends.push(word.start);
    }

    const chars = Array.from(text);
    const step = Math.max(word.end - word.start, 0) / chars.length;
    chars.forEach((ch, i) => {
      characters.push(ch);
      starts.push(word.start + step * i);
      ends.push(word.start + step * (i + 1));
    });
    previousEnd = word.end;
  }

  return {
    characters,
    characterStartTimesSeconds: starts,
    characterEndTimesSeconds: ends,
  };
}
