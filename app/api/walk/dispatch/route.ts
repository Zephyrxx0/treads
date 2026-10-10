import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const WalkDispatchSchema = z.object({
  dispatch: z
    .string()
    .describe(
      "A poetic, evocative 2-3 sentence field naturalist dispatch summarizing this specific walk, its finds, and atmosphere in the voice of an observant outdoor naturalist (e.g., Aldo Leopold)."
    ),
  connections: z
    .array(
      z.object({
        speciesA: z.string().describe("First species observed on this walk."),
        speciesB: z.string().describe("Second species observed on this walk."),
        relationship: z
          .string()
          .describe(
            "A concise, scientifically accurate description of their direct ecological relationship (e.g. food source, shelter, pollination, host plant, mycorrhizal connection)."
          ),
      })
    )
    .describe(
      "Direct ecological relationships between pairs of observed species on this walk. Return an empty array if there are no direct known interactions."
    ),
});

export interface WalkDispatchResponse {
  success: boolean;
  dispatch: string;
  connections: Array<{
    speciesA: string;
    speciesB: string;
    relationship: string;
  }>;
  mock?: boolean;
}

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, 'dispatch');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for walk dispatch' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  let body: {
    species?: string[];
    notes?: string[];
    duration?: number;
    distance?: number;
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400, headers: rateLimit.headers }
    );
  }

  const species = Array.isArray(body.species) ? body.species.filter(Boolean) : [];
  const notes = Array.isArray(body.notes) ? body.notes.filter(Boolean) : [];
  const distanceKm = body.distance ? (body.distance / 1000).toFixed(2) : null;
  const durationMin = body.duration ? Math.round(body.duration / 60) : null;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      getFallbackDispatch(species, distanceKm, durationMin),
      { status: 200, headers: rateLimit.headers }
    );
  }

  const modelId = process.env.FACTS_MODEL_ID || 'gemma-4-26b-a4b-it';

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelId);

    const prompt = `You are a field naturalist chronicler synthesizing a nature walk journal entry.

Walk Details:
- Species observed: ${species.length > 0 ? species.join(', ') : 'None formally identified'}
${distanceKm ? `- Distance covered: ${distanceKm} km` : ''}
${durationMin ? `- Walk duration: ~${durationMin} minutes` : ''}
${notes.length > 0 ? `- Voice / field notes recorded: "${notes.join('" | "')}"` : ''}

INSTRUCTIONS:
1. Dispatch: Write a crisp, evocative 2-3 sentence field naturalist journal dispatch reflecting the journey, its observations, and the quiet beauty of the outdoors. Reference the actual species observed if any.
2. Ecological Connections: Examine the list of observed species. If there are real, documented ecological relationships between any of them (such as pollination, food web, canopy shelter, host plant, or soil fungi), describe up to 3 direct relationships between pairs of species.
3. CRITICAL CONSTRAINT FOR CONNECTIONS: If there are NO direct known ecological relationships between the observed species (or if fewer than 2 species were observed), return an empty array [] for connections. NEVER invent or hallucinate fictional relationships.`;

    const { object } = await generateObject({
      model,
      schema: WalkDispatchSchema,
      prompt,
    });

    const responsePayload: WalkDispatchResponse = {
      success: true,
      dispatch: object.dispatch,
      connections: object.connections || [],
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: rateLimit.headers,
    });
  } catch (err) {
    console.error('Walk dispatch generation failed:', err);
    return NextResponse.json(
      getFallbackDispatch(species, distanceKm, durationMin),
      { status: 200, headers: rateLimit.headers }
    );
  }
}

function getFallbackDispatch(
  species: string[],
  distanceKm: string | null,
  durationMin: number | null
): WalkDispatchResponse {
  if (species.length > 0) {
    const speciesList = species.slice(0, 3).join(', ');
    return {
      success: true,
      mock: true,
      dispatch: `A rewarding trail crossing paths with ${speciesList}${species.length > 3 ? `, and ${species.length - 3} other living finds` : ''}. Each observation marks a quiet encounter with the seasonal landscape.`,
      connections: [],
    };
  }

  return {
    success: true,
    mock: true,
    dispatch: `A quiet walk through the landscape${distanceKm ? ` covering ${distanceKm} km` : ''}, attentive to the trail and the subtle rhythms of the outdoors.`,
    connections: [],
  };
}

