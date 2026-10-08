import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, 'spike');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (apiKey) {
    return NextResponse.json(
      {
        success: true,
        provider: 'elevenlabs',
        available: true,
        message: 'ElevenLabs API key detected and configured.',
      },
      { status: 200, headers: rateLimit.headers }
    );
  }

  return NextResponse.json(
    {
      success: true,
      provider: 'browser-web-speech',
      available: false,
      fallback: true,
      warning:
        'ELEVENLABS_API_KEY not configured. Falling back to browser Web Speech API (speechSynthesis / webkitSpeechRecognition).',
    },
    { status: 200, headers: rateLimit.headers }
  );
}
