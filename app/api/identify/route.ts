import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyWikipediaTaxon } from '@/lib/wikipedia';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const IdentificationSchema = z.object({
  isLivingOrganism: z
    .boolean()
    .describe(
      'False if image represents a non-organism (e.g. cup, bicycle, phone, furniture, rock, road, car) or human person. True for wild or domestic plants, trees, birds, insects, mammals, fungi, reptiles, amphibians.'
    ),
  refusalReason: z
    .string()
    .optional()
    .describe(
      'Explanation if not a living organism or human portrait, e.g. "Inanimate object detected. Treads tracks living organisms in nature."'
    ),
  candidates: z
    .array(
      z.object({
        scientificName: z.string().describe('Binomial nomenclature, e.g. Quercus alba or Passer domesticus'),
        commonName: z.string().describe('Common vernacular name, e.g. White Oak or House Sparrow'),
        kind: z.enum(['tree', 'flower', 'plant', 'bird', 'insect', 'fungus', 'animal', 'other']),
        confidence: z.enum(['Likely', 'Possible', 'Unsure']),
        wikipediaTitle: z.string().describe('Exact English Wikipedia article title for this species'),
      })
    )
    .describe('Up to 3 candidate species ordered from most likely to least likely. Empty if not a living organism.'),
});

export interface IdentifyCandidate {
  scientificName: string;
  commonName: string;
  kind: 'tree' | 'flower' | 'plant' | 'bird' | 'insect' | 'fungus' | 'animal' | 'other';
  confidence: 'Likely' | 'Possible' | 'Unsure';
  wikipediaTitle: string;
  canonicalWikipediaTitle?: string;
  verified: boolean;
}

export interface IdentifyResponse {
  success: boolean;
  isLivingOrganism: boolean;
  refusalReason?: string;
  candidates: IdentifyCandidate[];
  mock?: boolean;
  warning?: string;
  latencyMs?: number;
}

const MOCK_IDENTIFY_RESPONSE: IdentifyResponse = {
  success: true,
  isLivingOrganism: true,
  mock: true,
  warning: 'GOOGLE_GENERATIVE_AI_API_KEY not configured. Returning verified mock candidates.',
  candidates: [
    {
      scientificName: 'Quercus alba',
      commonName: 'White Oak',
      kind: 'tree',
      confidence: 'Likely',
      wikipediaTitle: 'Quercus alba',
      canonicalWikipediaTitle: 'Quercus alba',
      verified: true,
    },
    {
      scientificName: 'Acer saccharum',
      commonName: 'Sugar Maple',
      kind: 'tree',
      confidence: 'Possible',
      wikipediaTitle: 'Acer saccharum',
      canonicalWikipediaTitle: 'Acer saccharum',
      verified: true,
    },
  ],
};

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, 'identify');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for identification' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  let body: {
    image?: string;
    month?: number;
    lat?: number;
    lng?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimit.headers }
    );
  }

  if (!body.image) {
    return NextResponse.json(
      { error: 'Missing image field (base64 JPEG required)' },
      { status: 400, headers: rateLimit.headers }
    );
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(MOCK_IDENTIFY_RESPONSE, {
      status: 200,
      headers: rateLimit.headers,
    });
  }

  const startTime = Date.now();
  const modelId = process.env.IDENTIFY_MODEL_ID || 'gemma-4-26b-a4b-it';

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelId);

    // Build context-aware prompt with coarse region (1 decimal) and seasonal month
    let contextDescription = '';
    if (typeof body.month === 'number') {
      contextDescription += ` Month of observation: ${body.month}.`;
    }
    if (typeof body.lat === 'number' && typeof body.lng === 'number') {
      contextDescription += ` Approximate region: ${body.lat.toFixed(1)}°N, ${body.lng.toFixed(1)}°E.`;
    }

    const systemPrompt = `You are an expert field botanist and wildlife biologist companion for nature walks.
Your task:
1. Examine the provided photo.
2. Determine if it depicts a wild or domestic living organism (plant, tree, bird, insect, animal, fungus, etc.).
3. If it is an inanimate object (e.g. coffee mug, bicycle, building, asphalt, computer, backpack) or a human person/face, mark isLivingOrganism: false and provide a polite, educational refusalReason explaining what was seen.
4. If it is a living organism, provide up to 3 candidate species ordered by likelihood. Assign confidence as 'Likely', 'Possible', or 'Unsure'.
5. Provide the exact English Wikipedia title for each candidate so taxon verification can link to it.
${contextDescription ? `Context:${contextDescription}` : ''}`;

    const imageUri = body.image.startsWith('data:')
      ? body.image
      : `data:image/jpeg;base64,${body.image}`;

    const { object } = await generateObject({
      model,
      schema: IdentificationSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            { type: 'image', image: imageUri },
          ],
        },
      ],
    });

    const latencyMs = Date.now() - startTime;

    // Handle honest refusal for non-living objects or human portraits
    if (!object.isLivingOrganism) {
      const refusalPayload: IdentifyResponse = {
        success: true,
        isLivingOrganism: false,
        refusalReason:
          object.refusalReason ||
          'We noticed an inanimate object or human person. Treads is designed to track living organisms in nature.',
        candidates: [],
        latencyMs,
      };
      return NextResponse.json(refusalPayload, {
        status: 200,
        headers: rateLimit.headers,
      });
    }

    // Verify each candidate against Wikipedia Action API
    const taxonVerifications = await Promise.allSettled(
      object.candidates.map((c) => verifyWikipediaTaxon(c.wikipediaTitle))
    );

    const enrichedCandidates: IdentifyCandidate[] = object.candidates.map((c, i) => {
      const verification = taxonVerifications[i];
      const verifiedResult = verification.status === 'fulfilled' ? verification.value : null;

      return {
        scientificName: c.scientificName,
        commonName: c.commonName,
        kind: c.kind,
        confidence: c.confidence,
        wikipediaTitle: c.wikipediaTitle,
        canonicalWikipediaTitle: verifiedResult?.canonicalTitle || c.wikipediaTitle,
        verified: verifiedResult ? verifiedResult.verified : false,
      };
    });

    const responsePayload: IdentifyResponse = {
      success: true,
      isLivingOrganism: true,
      candidates: enrichedCandidates,
      latencyMs,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: rateLimit.headers,
    });
  } catch (err) {
    console.error('Identification API error:', err);
    // On unexpected model failure, return an honest error state rather than fake placeholder species
    return NextResponse.json(
      {
        success: false,
        isLivingOrganism: false,
        error: "Couldn't identify species. Please try again with a clearer or closer shot.",
        candidates: [],
        latencyMs: Date.now() - startTime,
      },
      {
        status: 503,
        headers: rateLimit.headers,
      }
    );
  }
}
