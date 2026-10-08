import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // 1. Rate limiting check
  const rateLimit = await checkRateLimit(req, 'transcribe');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for transcription. Try again later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    let audioBlob: Blob | null = null;
    let languageHint: string = 'en';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const fileEntry = formData.get('file');
      if (fileEntry instanceof Blob) {
        audioBlob = fileEntry;
      }
      const lang = formData.get('language');
      if (typeof lang === 'string') {
        languageHint = lang;
      }
    } else if (contentType.includes('application/json')) {
      const json = await req.json();
      if (json.audioBase64) {
        const buffer = Buffer.from(json.audioBase64, 'base64');
        audioBlob = new Blob([buffer], { type: json.mimeType || 'audio/webm' });
      }
      if (json.language) {
        languageHint = json.language;
      }
    }

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // 2. Call ElevenLabs Scribe STT if API key is configured
    if (apiKey) {
      const elevenFormData = new FormData();
      elevenFormData.append('file', audioBlob, 'audio.webm');
      elevenFormData.append('model_id', 'scribe_v1');
      if (languageHint) {
        elevenFormData.append('language_code', languageHint);
      }

      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: elevenFormData,
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(
          {
            transcript: data.text || '',
            language: data.language_code || languageHint || 'en',
            fallback: false,
          },
          { status: 200, headers: rateLimit.headers }
        );
      } else {
        console.warn(
          'ElevenLabs STT API error status:',
          res.status,
          await res.text()
        );
      }
    }

    // 3. Graceful fallback when key is absent or API returned error
    return NextResponse.json(
      {
        transcript: 'Observed organism in natural habitat during field walk.',
        language: languageHint || 'en',
        fallback: true,
        warning:
          'ELEVENLABS_API_KEY not configured or unreachable. Falling back to default transcript.',
      },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (err: any) {
    console.error('Transcription route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal transcription error' },
      { status: 500, headers: rateLimit.headers }
    );
  }
}
