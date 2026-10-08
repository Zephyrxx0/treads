/**
 * Audio Recording and Web Audio AnalyserNode utilities for Treads.
 * Supports cross-browser MediaRecorder with Opus compression,
 * Web Audio frequency analysis, and Web Speech API fallback.
 */

export interface AudioAnalyserSetup {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  frequencyData: Uint8Array;
}

export function createAudioContext(): AudioContext {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  const ctx = new AudioContextClass();
  if (ctx.state === 'suspended') {
    ctx.resume().catch((err) => {
      console.warn('Failed to resume AudioContext:', err);
    });
  }
  return ctx;
}

export function setupAudioAnalyser(
  stream: MediaStream,
  audioContext: AudioContext
): AudioAnalyserSetup {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 64; // Yields 32 frequency bins
  analyser.smoothingTimeConstant = 0.8;

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  return { audioContext, analyser, source, frequencyData };
}

export function getPreferredAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

export function startMediaRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = getPreferredAudioMimeType();
  const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
  return new MediaRecorder(stream, options);
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      track.stop();
    }
  } catch (err) {
    console.warn('Error stopping media tracks:', err);
  }
}

export interface WebSpeechResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export class BrowserSpeechRecognitionSession {
  private recognition: any = null;
  private isListening = false;

  constructor(
    private onResult: (res: WebSpeechResult) => void,
    private onError: (err: any) => void
  ) {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          this.onResult({
            transcript: text.trim(),
            isFinal: Boolean(finalTranscript),
            confidence: event.results[0]?.[0]?.confidence,
          });
        }
      };

      this.recognition.onerror = (err: any) => {
        this.onError(err);
      };
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.recognition);
  }

  public start(): void {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      } finally {
        this.isListening = false;
      }
    }
  }
}

