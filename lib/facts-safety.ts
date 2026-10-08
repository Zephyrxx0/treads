/**
 * Safety and verification pipeline for Wikipedia-derived biological facts.
 * Enforces strict client-side & server-side regex scrubber dropping all
 * edibility, toxicity, culinary, foraging, or medicinal claims.
 * Per FACT-03, FACT-04, and Decisions D-10, D-11.
 */

export const EDIBILITY_SAFETY_REGEX =
  /\b(edible|inedible|eat\w*|taste|tasty|culinary|recipe|salad|soup|boil\w*|cook\w*|forag\w*|medicinal|remedy|cure|toxic|poison\w*|consumption)\b/i;

export interface FactItem {
  sentenceNumber: number;
  text: string;
}

/**
 * Checks whether a candidate sentence or text contains forbidden safety keywords
 * relating to edibility, toxicity, foraging, or medicinal ingestion.
 */
export function containsSafetyViolations(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  return EDIBILITY_SAFETY_REGEX.test(text);
}

/**
 * Strips any embedded citation brackets (e.g. "[1]", "(2)") from generated text
 * to ensure pure prose is stored and displayed cleanly.
 */
export function sanitizeFactText(text: string): string {
  return text
    .replace(/\[\d+\]/g, '')
    .replace(/\(\d+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filters a list of synthesized facts against safety rules and sentence index bounds.
 * Discards any fact that:
 * 1. References an out-of-bounds sentence number (< 1 or > maxSentenceIndex).
 * 2. Matches the edibility / toxic advice regex blacklist.
 * 3. Has an empty or overly short text body (< 5 characters).
 */
export function validateCitations(
  facts: FactItem[],
  maxSentenceIndex: number
): FactItem[] {
  if (!Array.isArray(facts) || maxSentenceIndex < 1) return [];

  return facts
    .map((fact) => ({
      sentenceNumber: Number(fact.sentenceNumber),
      text: sanitizeFactText(fact.text),
    }))
    .filter((fact) => {
      // 1. Bounds check
      if (
        !Number.isInteger(fact.sentenceNumber) ||
        fact.sentenceNumber < 1 ||
        fact.sentenceNumber > maxSentenceIndex
      ) {
        return false;
      }

      // 2. Length check
      if (fact.text.length < 5) {
        return false;
      }

      // 3. Edibility / toxicity violation check
      if (containsSafetyViolations(fact.text)) {
        return false;
      }

      return true;
    });
}

/**
 * Deterministic fallback provider (FACT-04):
 * When LLM synthesis fails or all facts are dropped by the safety scrubber,
 * returns sentence #1 of the verified Wikipedia lead section.
 */
export function getFallbackFact(
  leadSentences: Array<{ index: number; text: string }>
): FactItem[] {
  if (!leadSentences || leadSentences.length === 0) {
    return [
      {
        sentenceNumber: 1,
        text: 'A documented wild organism recorded during your exploration.',
      },
    ];
  }

  const first = leadSentences[0];
  const sanitized = sanitizeFactText(first.text);

  // Even for sentence #1, verify safety; if violated, provide neutral fallback
  if (containsSafetyViolations(sanitized)) {
    return [
      {
        sentenceNumber: first.index,
        text: 'A native biological organism documented in field observations.',
      },
    ];
  }

  return [
    {
      sentenceNumber: first.index,
      text: sanitized,
    },
  ];
}

