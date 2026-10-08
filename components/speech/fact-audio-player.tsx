'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  computeSpeechHash,
  getCachedSpeech,
  saveCachedSpeech,
  speakWithBrowserUtterance,
  stopBrowserUtterance,
} from '@/lib/speech';

export interface FactAudioPlayerProps {
  text: string;
  voiceId?: string;
  className?: string;
}

export function FactAudioPlayer({
  text,
  voiceId = 'nature-narrator',
  className = '',
}: FactAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeviceVoice, setIsDeviceVoice] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Clean up audio on unmount or text change
  useEffect(() => {
    return () => {
      stopBrowserUtterance();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [text]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      if (isDeviceVoice) {
        stopBrowserUtterance();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    // If audio is already loaded, resume
    if (audioRef.current && !isDeviceVoice) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().catch(console.warn);
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check client-side Dexie speechCache by SHA-256 hash (per SPK-02, D-12)
      const textHash = await computeSpeechHash(text, voiceId);
      let audioBlob = await getCachedSpeech(textHash);

      if (!audioBlob) {
        // 2. Fetch from /api/speak
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId }),
        });

        const contentType = res.headers.get('content-type') || '';

        if (res.ok && contentType.includes('audio/mpeg')) {
          audioBlob = await res.blob();
          // Cache in Dexie for zero-cost replay
          await saveCachedSpeech(textHash, audioBlob);
        } else {
          // Fallback to browser speechSynthesis
          setIsDeviceVoice(true);
          speakWithBrowserUtterance(text, {
            rate: playbackRate,
            onEnd: () => setIsPlaying(false),
            onError: () => setIsPlaying(false),
          });
          setIsPlaying(true);
          setIsLoading(false);
          return;
        }
      }

      // Play loaded audio blob
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = playbackRate;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration || 0);
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime || 0);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        await audio.play();
        setIsPlaying(true);
        setIsDeviceVoice(false);
      }
    } catch (err) {
      console.warn('Speech playback error, attempting browser utterance:', err);
      setIsDeviceVoice(true);
      speakWithBrowserUtterance(text, {
        rate: playbackRate,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
      setIsPlaying(true);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, isDeviceVoice, text, voiceId, playbackRate]);

  // Toggle speed between 1.0x and 1.2x
  const toggleSpeed = () => {
    const nextRate = playbackRate === 1.0 ? 1.2 : 1.0;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-muted/50 border border-border/60 ${className}`}
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={togglePlayback}
        disabled={isLoading}
        className="h-8 px-2 text-xs font-semibold gap-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
        aria-label={isPlaying ? 'Pause speech narration' : 'Listen to fact card narration'}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
        <span>{isPlaying ? 'Pause' : 'Listen'}</span>
      </Button>

      {/* Progress & Time Indicator */}
      {(isPlaying || duration > 0) && !isDeviceVoice && (
        <div className="flex items-center gap-2 pr-1">
          <div className="w-16 bg-border/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
            {Math.floor(currentTime)}s/{Math.floor(duration)}s
          </span>
        </div>
      )}

      {/* Speed toggle pill */}
      <button
        type="button"
        onClick={toggleSpeed}
        className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        title="Toggle playback speed"
      >
        {playbackRate.toFixed(1)}x
      </button>

      {/* Subtle device voice fallback badge */}
      {isDeviceVoice && (
        <Badge
          variant="outline"
          className="text-[10px] font-normal border-border/40 text-muted-foreground px-1.5 py-0"
        >
          Device voice
        </Badge>
      )}
    </div>
  );
}

