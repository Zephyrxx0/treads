import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getWikipediaLeadSentences } from '@/lib/wikipedia';
import {
  validateCitations,
  containsSafetyViolations,
  getFallbackFact,
  sanitizeFactText,
  FactItem,
} from '@/lib/facts-safety';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const FactsSchema = z.object({
  summary: z
    .string()
    .describe('A crisp, educational 2-3 sentence overview of this organism (max 40 words).'),
  facts: z
    .array(
      z.object({
        sentenceNumber: z
          .number()
          .int()
          .describe(
            'The exact 1-indexed sentence number from the provided Wikipedia extract where this fact was derived.'
          ),
        text: z
          .string()
          .describe(
            'An engaging biological or ecological fact (max 20 words). Strictly avoid any claims about edibility, recipes, taste, foraging, medicinal remedies, or toxicity.'
          ),
      })
    )
    .describe('Up to 3 distinct biological facts citing source sentence numbers.'),
  lookClosely: z
    .string()
    .optional()
    .describe(
      'A 1-sentence tactile, sensory observation prompt directing the walker to look closely at a physical feature of the organism right in front of them (e.g., leaf veins, underside texture, bark ridges, pollen sacs, wing patterns).'
    ),
});

export interface FactsResponse {
  success: boolean;
  summary: string;
  facts: FactItem[];
  lookClosely?: string;
  sourceUrl: string;
  sentences: Array<{ index: number; text: string }>;
  cached?: boolean;
  mock?: boolean;
  warning?: string;
}

// In-memory cache by Wikipedia title (per FACT-06)
const factsCache = new Map<string, FactsResponse>();

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, 'facts');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for facts generation' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  let body: {
    wikipediaTitle?: string;
    scientificName?: string;
    commonName?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400, headers: rateLimit.headers }
    );
  }

  const title = body.wikipediaTitle || body.scientificName || body.commonName;
  if (!title) {
    return NextResponse.json(
      { error: 'Missing wikipediaTitle or species identifier in request' },
      { status: 400, headers: rateLimit.headers }
    );
  }

  const cacheKey = title.trim().toLowerCase();
  if (factsCache.has(cacheKey)) {
    const cached = factsCache.get(cacheKey)!;
    return NextResponse.json(
      { ...cached, cached: true },
      { status: 200, headers: rateLimit.headers }
    );
  }

  // 1. Fetch Wikipedia lead extract segmented into indexed sentences
  const wikiData = await getWikipediaLeadSentences(title);
  if (!wikiData.sentences || wikiData.sentences.length === 0) {
    return NextResponse.json(
      {
        error: `Could not retrieve Wikipedia lead extract for "${title}"`,
        sourceUrl: wikiData.sourceUrl,
      },
      { status: 404, headers: rateLimit.headers }
    );
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // 2. Mock Fallback when Google AI API key is not configured
  if (!apiKey) {
    const fallbackFacts: FactItem[] = wikiData.sentences.slice(0, 3).map((s) => ({
      sentenceNumber: s.index,
      text: sanitizeFactText(s.text.split('.')[0] + '.'),
    }));

    const mockResponse: FactsResponse = {
      success: true,
      mock: true,
      warning: 'GOOGLE_GENERATIVE_AI_API_KEY not configured. Returning Wikipedia extract fallback.',
      summary: sanitizeFactText(wikiData.sentences[0].text),
      facts: validateCitations(fallbackFacts, wikiData.sentences.length),
      lookClosely: 'Examine the fine vein structure and subtle variations in texture along the margins.',
      sourceUrl: wikiData.sourceUrl,
      sentences: wikiData.sentences,
    };

    factsCache.set(cacheKey, mockResponse);
    return NextResponse.json(mockResponse, {
      status: 200,
      headers: rateLimit.headers,
    });
  }

  // 3. Grounded Synthesis via Gemma/Gemini
  const modelId = process.env.FACTS_MODEL_ID || 'gemma-4-26b-a4b-it';

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelId);

    const numberedSentencesText = wikiData.sentences
      .map((s) => `[${s.index}] ${s.text}`)
      .join('\n');

    const prompt = `You are a nature educator synthesizing facts about ${title} for field naturalists.

Here is the verified lead section from Wikipedia:
${numberedSentencesText}

INSTRUCTIONS:
1. Write a short summary (max 40 words) describing the organism.
2. Select up to 3 interesting biological facts (max 20 words each).
3. For each fact, cite the exact sentence index where the information was found.
4. "Look Closely" sensory prompt: Write 1 direct, engaging sentence instructing the walker to physically examine a specific tactile or visual detail right in front of them (e.g. leaf veins, bark grooves, petal margins, pollen sacs, wing borders).
5. STRICT NEGATIVE CONSTRAINT: Do NOT include any claims about edibility, foraging, culinary recipes, taste, medicinal remedies, cures, or human toxicity. If a sentence mentions these, ignore it completely.`;

    const { object } = await generateObject({
      model,
      schema: FactsSchema,
      prompt,
    });

    // 4. Multi-layer safety scrubbing and citation validation
    let validFacts = validateCitations(object.facts, wikiData.sentences.length);

    // If all facts were dropped or none generated, use verified Sentence #1 fallback (FACT-04)
    if (validFacts.length === 0) {
      validFacts = getFallbackFact(wikiData.sentences);
    }

    // Clean and verify summary
    let summary = sanitizeFactText(object.summary);
    if (containsSafetyViolations(summary) || summary.length < 10) {
      summary = sanitizeFactText(wikiData.sentences[0].text);
    }

    // Clean and verify lookClosely prompt
    let lookClosely = object.lookClosely ? sanitizeFactText(object.lookClosely) : undefined;
    if (!lookClosely || containsSafetyViolations(lookClosely)) {
      lookClosely = 'Examine the fine surface patterns and observe how light and shadow fall across its form.';
    }

    const responsePayload: FactsResponse = {
      success: true,
      summary,
      facts: validFacts,
      lookClosely,
      sourceUrl: wikiData.sourceUrl,
      sentences: wikiData.sentences,
      cached: false,
    };

    factsCache.set(cacheKey, responsePayload);

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: rateLimit.headers,
    });
  } catch (err) {
    console.error('Facts generation failed, applying deterministic fallback:', err);
    // Deterministic fallback ensures no blank screens
    const fallbackResponse: FactsResponse = {
      success: true,
      summary: sanitizeFactText(wikiData.sentences[0].text),
      facts: getFallbackFact(wikiData.sentences),
      lookClosely: 'Examine the fine surface details and textures right in front of you.',
      sourceUrl: wikiData.sourceUrl,
      sentences: wikiData.sentences,
      warning: 'AI generation error. Reverted to verified Wikipedia extract.',
    };

    return NextResponse.json(fallbackResponse, {
      status: 200,
      headers: rateLimit.headers,
    });
  }
}

