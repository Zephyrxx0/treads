'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Trash2, Play, Pause, AlertCircle, Loader2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { MicSelector } from '@/components/ui/mic-selector';
import type { TimedWord } from '@/lib/transcript-alignment';
import {
  createAudioContext,
  setupAudioAnalyser,
  startMediaRecorder,
  stopMediaStream,
  BrowserSpeechRecognitionSession,
  AudioAnalyserSetup,
} from '@/lib/audio';
import { db } from '@/lib/db';

export interface VoiceRecorderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walkId?: string;
  entryId?: string;
  lat?: number;
  lng?: number;
  onNoteSaved?: (noteId: string) => void;
}

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'review' | 'permission_blocked';

const MAX_DURATION_SEC = 60;

export function VoiceRecorderSheet({
  open,
  onOpenChange,
  walkId,
  entryId,
  lat,
  lng,
  onNoteSaved,
}: VoiceRecorderSheetProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [words, setWords] = useState<TimedWord[]>([]);

  // Audio recording refs & state
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserSetupRef = useRef<AudioAnalyserSetup | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // Speech recognition fallback
  const speechSessionRef = useRef<BrowserSpeechRecognitionSession | null>(null);
  const liveTranscriptRef = useRef<string>('');

  // Review state
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('English');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Clean up all audio resources
  const cleanupRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechSessionRef.current) {
      speechSessionRef.current.stop();
      speechSessionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (analyserSetupRef.current) {
      try {
        analyserSetupRef.current.audioContext.close();
      } catch {}
      analyserSetupRef.current = null;
    }
  }, []);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      cleanupRecording();
      setRecorderState('idle');
      setSecondsElapsed(0);
      setIsHandsFree(false);
      setIsHolding(false);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setRecordedAudioBlob(null);
      setTranscript('');
      setWords([]);
    }
  }, [open, cleanupRecording, audioUrl]);

  // Handle Stop and transition to transcription
  const handleFinishRecording = useCallback(async () => {
    if (recorderState !== 'recording') return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechSessionRef.current) {
      speechSessionRef.current.stop();
    }

    setRecorderState('transcribing');

    // Wait for final chunks from MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Send to /api/transcribe
        try {
          const formData = new FormData();
          formData.append('file', audioBlob);

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            const resultText =
              data.transcript || liveTranscriptRef.current || 'Field voice observation.';
            setTranscript(resultText);
            setWords(Array.isArray(data.words) ? data.words : []);
            setDetectedLanguage(data.language === 'en' ? 'English' : data.language || 'English');
          } else {
            setTranscript(liveTranscriptRef.current || 'Recorded outdoor field observation.');
          }
        } catch (err) {
          console.warn('Transcription error, using local fallback:', err);
          setTranscript(liveTranscriptRef.current || 'Recorded outdoor field observation.');
        } finally {
          cleanupRecording();
          setRecorderState('review');
        }
      };

      mediaRecorderRef.current.stop();
    } else {
      cleanupRecording();
      setRecorderState('review');
    }
  }, [recorderState, cleanupRecording]);

  // Handle Start Recording
  const startRecording = useCallback(
    async (handsFreeMode: boolean) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        streamRef.current = stream;

        const audioCtx = createAudioContext();
        const analyserSetup = setupAudioAnalyser(stream, audioCtx);
        analyserSetupRef.current = analyserSetup;

        const mediaRecorder = startMediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        liveTranscriptRef.current = '';

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Start client speech recognition fallback in parallel
        const speechSession = new BrowserSpeechRecognitionSession(
          (res) => {
            liveTranscriptRef.current = res.transcript;
          },
          (err) => {
            console.warn('Web Speech fallback notice:', err);
          },
        );
        if (speechSession.isAvailable()) {
          speechSession.start();
          speechSessionRef.current = speechSession;
        }

        mediaRecorder.start(250); // Slice every 250ms for reliable chunks
        setIsHandsFree(handsFreeMode);
        setSecondsElapsed(0);
        setRecorderState('recording');

        // 60-second timer
        timerIntervalRef.current = setInterval(() => {
          setSecondsElapsed((prev) => {
            if (prev + 1 >= MAX_DURATION_SEC) {
              handleFinishRecording();
              return MAX_DURATION_SEC;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (err: any) {
        console.warn('Microphone permission or hardware error:', err);
        setRecorderState('permission_blocked');
      }
    },
    [handleFinishRecording, deviceId],
  );

  // Cancel/Discard mid-recording
  const handleCancelRecording = useCallback(() => {
    cleanupRecording();
    setRecorderState('idle');
    setSecondsElapsed(0);
    setIsHandsFree(false);
    setIsHolding(false);
  }, [cleanupRecording]);

  // Unified gesture handlers for Mic Button
  const handleTouchStart = (e: React.TouchEvent) => {
    if (recorderState !== 'idle') return;
    const touch = e.touches[0];
    holdStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
    holdStartTimeRef.current = Date.now();
    setIsHolding(true);
    startRecording(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isHolding || !holdStartCoordRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - holdStartCoordRef.current.x;
    // Slide left to cancel (> 60px)
    if (deltaX < -60) {
      handleCancelRecording();
    }
  };

  const handleTouchEnd = () => {
    if (!isHolding) return;
    setIsHolding(false);
    const holdDuration = Date.now() - holdStartTimeRef.current;
    if (holdDuration < 350) {
      // Short tap detected -> Switch to hands-free recording
      setIsHandsFree(true);
    } else {
      // Hold released -> finish recording
      handleFinishRecording();
    }
  };

  const handleMouseDown = () => {
    if (recorderState !== 'idle') return;
    holdStartTimeRef.current = Date.now();
    setIsHolding(true);
    startRecording(false);
  };

  const handleMouseUp = () => {
    if (!isHolding) return;
    setIsHolding(false);
    const holdDuration = Date.now() - holdStartTimeRef.current;
    if (holdDuration < 350) {
      setIsHandsFree(true);
    } else {
      handleFinishRecording();
    }
  };

  // Preview Audio playback toggle
  const togglePreviewPlay = () => {
    if (!previewAudioRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPlaybackProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlaybackProgress((audio.currentTime / audio.duration) * 100);
        }
      };
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play().catch(console.warn);
        setIsPlayingPreview(true);
      }
    }
  };

  // Save Note to Dexie
  const handleSaveNote = async () => {
    if (!transcript.trim() && !recordedAudioBlob) return;
    setIsSaving(true);
    try {
      const noteId = crypto.randomUUID();
      await db.notes.add({
        id: noteId,
        walkId,
        entryId,
        kind: 'voice',
        audio: recordedAudioBlob,
        duration: secondsElapsed,
        transcript: transcript.trim(),
        words: words.length ? words : undefined,
        language: detectedLanguage,
        lat,
        lng,
        createdAt: Date.now(),
      });

      onNoteSaved?.(noteId);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save note in Dexie:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // SVG Circular countdown calculations (r=26, circ ≈ 163.36)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = (secondsElapsed / MAX_DURATION_SEC) * 100;
  const strokeDashoffset = circumference - (timerProgress / 100) * circumference;
  const isNearLimit = secondsElapsed >= 50;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="px-6 py-6 rounded-t-3xl bg-background/95 backdrop-blur-md border-t border-border shadow-2xl max-w-lg mx-auto"
      >
        <SheetHeader className="mb-4 text-center">
          <SheetTitle className="text-xl font-bold font-sans text-foreground">
            {recorderState === 'review'
              ? 'Field Voice Note'
              : recorderState === 'recording'
                ? 'Recording Voice Note'
                : 'Voice Journal'}
          </SheetTitle>
        </SheetHeader>

        {/* 1. Permission Blocked State */}
        {recorderState === 'permission_blocked' && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
              <MicOff className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground text-base">
                Microphone access required
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Please grant microphone permissions in your browser settings to record hands-free
                voice notes.
              </p>
            </div>
            <Button variant="outline" onClick={() => setRecorderState('idle')} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* 2. Idle & Active Recording States */}
        {(recorderState === 'idle' || recorderState === 'recording') && (
          <div className="flex flex-col items-center justify-center space-y-6 py-2">
            {/* Input device picker (only before recording starts) */}
            {recorderState === 'idle' && (
              <MicSelector value={deviceId} onValueChange={setDeviceId} className="self-center" />
            )}

            {/* Live waveform while recording */}
            <div className="flex w-full items-center justify-center rounded-2xl border border-border/40 bg-muted/40 px-4 py-2">
              <LiveWaveform
                active={recorderState === 'recording'}
                deviceId={deviceId || undefined}
                mode="scrolling"
                height={54}
                barWidth={3}
                barGap={2}
                className="w-full text-primary"
              />
            </div>

            {/* Timer and Guidance */}
            <div className="flex items-center gap-3">
              <span
                className={`text-base font-mono font-semibold ${isNearLimit ? 'text-amber-500' : 'text-foreground'}`}
              >
                {Math.floor(secondsElapsed / 60)}:{String(secondsElapsed % 60).padStart(2, '0')} /
                01:00
              </span>
              {isNearLimit && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">
                  Recording ends in {MAX_DURATION_SEC - secondsElapsed}s
                </Badge>
              )}
            </div>

            {/* Microphone Button with SVG Progress Ring */}
            <div className="relative flex items-center justify-center">
              <svg
                className="absolute inset-0 w-20 h-20 -rotate-90 pointer-events-none"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="text-border/30"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                />
                {recorderState === 'recording' && (
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    className={`transition-all duration-300 ${
                      isNearLimit ? 'text-amber-500' : 'text-primary'
                    }`}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                )}
              </svg>

              <button
                type="button"
                aria-label="Microphone record button"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onClick={() => {
                  if (recorderState === 'recording' && isHandsFree) {
                    handleFinishRecording();
                  }
                }}
                className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full transition-transform active:scale-95 shadow-xl cursor-pointer ${
                  recorderState === 'recording'
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'bg-muted/80 hover:bg-muted text-foreground border border-border/80'
                }`}
              >
                <Mic
                  className={`w-7 h-7 ${recorderState === 'recording' ? 'animate-pulse text-white' : 'text-primary'}`}
                />
              </button>
            </div>

            {/* Gesture Instructions or Stop/Trash controls */}
            {recorderState === 'recording' ? (
              <div className="flex items-center justify-between w-full max-w-xs pt-1 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelRecording}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Discard
                </Button>
                {isHandsFree ? (
                  <Button
                    size="sm"
                    onClick={handleFinishRecording}
                    className="bg-primary text-primary-foreground gap-1 text-xs"
                  >
                    <Check className="w-4 h-4" />
                    Finish
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Slide left to cancel · Release to save
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Tap to toggle hands-free recording, or hold to talk
              </p>
            )}
          </div>
        )}

        {/* 3. Transcribing Skeleton State */}
        {recorderState === 'transcribing' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Transcribing field audio...</p>
          </div>
        )}

        {/* 4. Review & Edit Drawer State */}
        {recorderState === 'review' && (
          <div className="flex flex-col space-y-5 py-2">
            {/* Audio Preview Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePreviewPlay}
                  className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {isPlayingPreview ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    Recorded Audio ({secondsElapsed}s)
                  </span>
                  <div className="w-32 bg-border/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-150"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                {detectedLanguage}
              </Badge>
            </div>

            {/* Editable Transcript Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Transcript Notes
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Transcribed field notes will appear here..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setRecorderState('idle')}
                disabled={isSaving}
              >
                Discard
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !transcript.trim()}
                className="bg-primary text-primary-foreground gap-2 min-w-[110px]"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Note
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
