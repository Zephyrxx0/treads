'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, Mic, MicOff, CheckCircle2, AlertCircle, Play, Square, Loader2 } from 'lucide-react';

interface ServerSpeechStatus {
  success: boolean;
  provider: 'elevenlabs' | 'browser-web-speech';
  available: boolean;
  fallback?: boolean;
  warning?: string;
  message?: string;
}

export function SpikeSpeechRunner() {
  const [serverStatus, setServerStatus] = useState<ServerSpeechStatus | null>(null);
  const [checkingServer, setCheckingServer] = useState(true);

  // Client Web Speech API availability
  const [hasBrowserTTS, setHasBrowserTTS] = useState(false);
  const [hasBrowserSTT, setHasBrowserSTT] = useState(false);

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSampleText, setTtsSampleText] = useState(
    'Welcome to Treads. Observing nature locally, grounded in science.'
  );

  // STT State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check server key configuration
    async function checkServer() {
      try {
        const res = await fetch('/api/spike/speech');
        if (res.ok) {
          const data = await res.json();
          setServerStatus(data);
        }
      } catch (err) {
        console.warn('Failed to query /api/spike/speech', err);
      } finally {
        setCheckingServer(false);
      }
    }

    checkServer();

    // Check browser Web Speech API capability
    if (typeof window !== 'undefined') {
      setHasBrowserTTS('speechSynthesis' in window);
      setHasBrowserSTT(
        'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      );
    }
  }, []);

  const handleTestTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(ttsSampleText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTestSTT = () => {
    if (typeof window === 'undefined') return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttError('Web Speech Recognition API not supported in this browser.');
      return;
    }

    setSttError(null);
    setTranscript('');

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setSttError(`Recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setSttError(err?.message || 'Failed to initialize speech recognition.');
      setIsListening(false);
    }
  };

  return (
    <Card className="flex flex-col h-full border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold">Speech Fallback & Web Speech Spike</CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Verifies ElevenLabs API key detection and browser Web Speech API (TTS & STT)
          </CardDescription>
        </div>

        {serverStatus && (
          <div>
            {serverStatus.available ? (
              <Badge variant="default" className="bg-emerald-600 text-white">
                ElevenLabs Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10">
                Web Speech Fallback
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 p-4 pt-0">
        {/* Server & Browser Capability Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
          {/* ElevenLabs Status */}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-medium">Server Provider</span>
            {checkingServer ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : serverStatus?.available ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ElevenLabs Configured
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Key Missing (Fallback Mode)
              </span>
            )}
          </div>

          {/* Browser TTS */}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-medium">Browser TTS (Audio)</span>
            {hasBrowserTTS ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> speechSynthesis Supported
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Not Supported
              </span>
            )}
          </div>

          {/* Browser STT */}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-medium">Browser STT (Mic)</span>
            {hasBrowserSTT ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> SpeechRecognition Supported
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> SpeechRecognition Unavailable
              </span>
            )}
          </div>
        </div>

        {/* Warning banner if fallback active */}
        {serverStatus?.fallback && (
          <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            {serverStatus.warning}
          </div>
        )}

        {/* Interactive Testing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {/* TTS Panel */}
          <div className="p-3.5 rounded-lg border border-border/70 bg-card flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Volume2 className="w-4 h-4 text-primary" /> Text-to-Speech (TTS)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  speechSynthesis
                </Badge>
              </div>
              <textarea
                value={ttsSampleText}
                onChange={(e) => setTtsSampleText(e.target.value)}
                rows={2}
                className="w-full text-xs p-2 mt-2 rounded border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring resize-none font-sans"
              />
            </div>

            <Button
              onClick={handleTestTTS}
              disabled={!hasBrowserTTS}
              size="sm"
              variant={isSpeaking ? 'destructive' : 'default'}
              className="w-full h-8 text-xs gap-1.5 cursor-pointer"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Stop Playback
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Test Audio Playback (TTS)
                </>
              )}
            </Button>
          </div>

          {/* STT Panel */}
          <div className="p-3.5 rounded-lg border border-border/70 bg-card flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Mic className="w-4 h-4 text-primary" /> Speech Recognition (STT)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  webkitSpeechRecognition
                </Badge>
              </div>

              <div className="mt-2 min-h-[48px] p-2 text-xs rounded border border-input bg-muted/20 font-sans text-foreground">
                {transcript ? (
                  <span>{transcript}</span>
                ) : isListening ? (
                  <span className="text-primary italic animate-pulse">
                    Listening for voice input...
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Click test to speak via microphone...
                  </span>
                )}
              </div>

              {sttError && (
                <p className="text-[11px] text-destructive mt-1">{sttError}</p>
              )}
            </div>

            <Button
              onClick={handleTestSTT}
              disabled={!hasBrowserSTT}
              size="sm"
              variant={isListening ? 'destructive' : 'outline'}
              className="w-full h-8 text-xs gap-1.5 cursor-pointer"
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 animate-pulse" /> Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> Test Speech Recognition (STT)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
