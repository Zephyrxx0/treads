import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

const DEFAULT_NATURE_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (warm, calm narrator)

export async function POST(req: NextRequest) {
  // 1. Rate limiting check (40 calls / day)
  const rateLimit = await checkRateLimit(req, 'speak');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for speech narration. Try again later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const body = await req.json();
    const { text, voiceId = DEFAULT_NATURE_VOICE_ID } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text parameter' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // 2. Stream audio from ElevenLabs TTS if key is present
    if (apiKey) {
      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text.slice(0, 2000), // Cap length for safety
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.55,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (elevenRes.ok && elevenRes.body) {
        return new Response(elevenRes.body, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            ...rateLimit.headers,
          },
        });
      } else {
        console.warn(
          'ElevenLabs TTS API error:',
          elevenRes.status,
          await elevenRes.text()
        );
      }
    }

    // 3. Graceful fallback when key is absent or API returned error
    return NextResponse.json(
      {
        fallback: true,
        message:
          'ELEVENLABS_API_KEY not configured or unavailable. Client should use browser speechSynthesis.',
      },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (err: any) {
    console.error('Speech narration route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal speech narration error' },
      { status: 500, headers: rateLimit.headers }
    );
  }
}

