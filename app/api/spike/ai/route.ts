import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const IdentificationResponseSchema = z.object({
  isLivingOrganism: z
    .boolean()
    .describe(
      'False if image or description represents a non-organism (e.g. cup, bicycle, phone, furniture) or human person. True for wild/domestic plants, trees, animals, birds, insects, fungi.'
    ),
  refusalReason: z
    .string()
    .optional()
    .describe("Explanation if not a living organism or human, e.g. 'Can\\'t tell, try a closer shot' or 'Not a wild or domestic living organism'"),
  candidates: z
    .array(
      z.object({
        scientificName: z.string().describe('Binomial nomenclature, e.g. Quercus alba'),
        commonName: z.string().describe('Common vernacular name, e.g. White Oak'),
        kind: z.string().describe('Organism kind: tree, plant, bird, insect, fungus, mammal, etc.'),
        confidence: z.enum(['Likely', 'Possible', 'Unsure']),
        wikipediaTitle: z.string().describe('Exact Wikipedia article title'),
      })
    )
    .describe('Up to 3 candidate species. Empty if not a living organism.'),
});

const MOCK_RESPONSE = {
  success: true,
  mock: true,
  warning: 'GOOGLE_GENERATIVE_AI_API_KEY not configured. Returning mock candidate.',
  modelUsed: 'mock-fixture',
  latencyMs: 12,
  isLivingOrganism: true,
  candidates: [
    {
      scientificName: 'Quercus alba',
      commonName: 'White Oak',
      kind: 'tree',
      confidence: 'Likely' as const,
      wikipediaTitle: 'Quercus alba',
    },
    {
      scientificName: 'Quercus robur',
      commonName: 'English Oak',
      kind: 'tree',
      confidence: 'Possible' as const,
      wikipediaTitle: 'Quercus robur',
    },
  ],
};

async function handleAiSpike(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, 'spike');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(MOCK_RESPONSE, {
      status: 200,
      headers: rateLimit.headers,
    });
  }

  let body: { image?: string; prompt?: string; model?: string } = {};
  if (req.method === 'POST') {
    try {
      body = await req.json();
    } catch {
      // Body may be empty or invalid JSON
    }
  }

  const hasImage = Boolean(body.image);
  const modelId = body.model || (hasImage
    ? process.env.IDENTIFY_MODEL_ID || 'gemma-4-26b-a4b-it'
    : process.env.FACTS_MODEL_ID || 'gemma-4-26b-a4b-it');

  const startTime = Date.now();

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelId);

    const userPrompt =
      body.prompt ||
      'Identify the organism in this image or description. Return up to 3 candidate species with scientific and common names, kind, confidence rating, and Wikipedia article title. If this is a non-organism (inanimate object) or a human person, mark isLivingOrganism as false and refuse identification honestly.';

    const content: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: string | URL }
    > = [{ type: 'text', text: userPrompt }];

    if (body.image) {
      content.push({
        type: 'image',
        image: body.image,
      });
    }

    const { object } = await generateObject({
      model,
      schema: IdentificationResponseSchema,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        mock: false,
        modelUsed: modelId,
        latencyMs,
        isLivingOrganism: object.isLivingOrganism,
        refusalReason: object.refusalReason,
        candidates: object.candidates,
      },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[AI Spike Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Google AI Studio request failed',
        mockFallback: MOCK_RESPONSE,
        latencyMs,
      },
      { status: 502, headers: rateLimit.headers }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleAiSpike(req);
}

export async function POST(req: NextRequest) {
  return handleAiSpike(req);
}
