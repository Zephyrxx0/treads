'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  TranscriptViewerAudio,
  TranscriptViewerContainer,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
  TranscriptViewerWords,
} from '@/components/ui/transcript-viewer';
import { useBlobUrl } from '@/hooks/use-blob-url';
import { db, type Note } from '@/lib/db';
import { wordsToAlignment } from '@/lib/transcript-alignment';

export interface TranscriptDialogProps {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AudioKind =
  'audio/webm' | 'audio/ogg' | 'audio/mpeg' | 'audio/wav' | 'audio/mp3' | 'audio/m4a' | 'audio/aac';

/**
 * Shows a voice note's transcript in the ElevenLabs transcript viewer. Notes
 * recorded before word timings were stored are transcribed again on demand.
 */
export function TranscriptDialog({ note, open, onOpenChange }: TranscriptDialogProps) {
  const audioUrl = useBlobUrl(note.audio ?? null);
  const [loading, setLoading] = useState(false);
  const attemptedRef = useRef(false);

  const needsTranscription = !note.words?.length && !!note.audio;

  useEffect(() => {
    if (!open) {
      attemptedRef.current = false;
      return;
    }
    if (!needsTranscription || attemptedRef.current || !note.audio) return;
    attemptedRef.current = true;
    setLoading(true);
    (async () => {
      try {
        const formData = new FormData();
        formData.append('file', note.audio as Blob);
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
        if (!res.ok) return;
        const data = await res.json();
        // Without an API key the route returns a canned line; don't overwrite the real note.
        if (data.fallback || !data.transcript) return;
        await db.notes.update(note.id, {
          transcript: data.transcript,
          words: Array.isArray(data.words) ? data.words : [],
          language: data.language,
        });
      } catch (err) {
        console.warn('Transcription failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, needsTranscription, note.audio, note.id]);

  const alignment = useMemo(() => wordsToAlignment(note.words ?? []), [note.words]);
  const hasTimings = alignment.characters.length > 0 && !!audioUrl;
  const audioType = (note.audio?.type?.split(';')[0] || 'audio/webm') as AudioKind;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">Transcript</DialogTitle>
          <DialogDescription className="text-xs">
            {note.language ? `Detected language: ${note.language}` : 'Voice note'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Transcribing…
          </div>
        ) : hasTimings ? (
          <TranscriptViewerContainer
            key={audioUrl}
            audioSrc={audioUrl as string}
            audioType={audioType}
            alignment={alignment}
            className="flex flex-col gap-4"
          >
            <TranscriptViewerAudio className="sr-only" />
            <TranscriptViewerWords className="max-h-56 overflow-y-auto text-base leading-relaxed" />
            <TranscriptViewerScrubBar />
            <TranscriptViewerPlayPauseButton className="w-full" size="default">
              {({ isPlaying }: { isPlaying: boolean }) =>
                isPlaying ? (
                  <>
                    <Pause className="size-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-4" /> Play
                  </>
                )
              }
            </TranscriptViewerPlayPauseButton>
          </TranscriptViewerContainer>
        ) : (
          <p className="max-h-56 overflow-y-auto rounded-xl bg-muted/50 p-3 text-sm leading-relaxed text-foreground/90">
            {note.transcript?.trim() || 'No transcript available for this note.'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
