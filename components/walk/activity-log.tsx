'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Camera,
  Check,
  FileText,
  Mic,
  Pause,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import { db, type Entry, type Note } from '@/lib/db';
import { cn } from '@/lib/utils';
import { useBlobUrl } from '@/hooks/use-blob-url';
import { MessageShell } from '@/components/walk/message-shell';
import { NoteWaveform } from '@/components/walk/note-waveform';
import { TranscriptDialog } from '@/components/walk/transcript-dialog';

export interface ActivityLogProps {
  specimens: Entry[];
  notes: Note[];
  /** Walk start time, shown as the first line of the log. */
  startedAt?: number;
  /** Called when the user asks to read more about a find */
  onOpenEntry?: (entryId: string) => void;
  className?: string;
}

type LogItem =
  | { kind: 'photo'; at: number; entry: Entry }
  | { kind: 'voice'; at: number; note: Note }
  | { kind: 'text'; at: number; note: Note };

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * The chat-like activity log of a walk. Every photo and voice note the walker
 * makes lands here as a message, oldest at the top, newest at the bottom.
 */
export function ActivityLog({
  specimens,
  notes,
  startedAt,
  onOpenEntry,
  className,
}: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo<LogItem[]>(() => {
    const all: LogItem[] = [
      ...specimens.map((entry): LogItem => ({ kind: 'photo', at: entry.createdAt, entry })),
      ...notes.map((note): LogItem => ({
        kind: note.kind === 'text' ? 'text' : 'voice',
        at: note.createdAt,
        note,
      })),
    ];
    return all.sort((a, b) => a.at - b.at);
  }, [specimens, notes]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [items.length]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Walk activity"
      className={cn('flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4', className)}
    >
      {startedAt && (
        <p className="self-center rounded-full bg-muted/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Walk started · {formatClock(startedAt)}
        </p>
      )}

      {items.length === 0 ? (
        <div className="my-auto flex flex-col items-center gap-2 px-6 py-8 text-center">
          <div className="flex items-center gap-2 text-primary/70">
            <Camera className="h-5 w-5" />
            <Mic className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">Nothing noticed yet</p>
          <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
            Photos you take and voice notes you record will appear here as you walk.
          </p>
        </div>
      ) : (
        items.map((item) =>
          item.kind === 'photo' ? (
            <PhotoMessage
              key={`p-${item.entry.id}`}
              entry={item.entry}
              onOpen={() => onOpenEntry?.(item.entry.id)}
            />
          ) : item.kind === 'text' ? (
            <TextMessage key={`t-${item.note.id}`} note={item.note} />
          ) : (
            <VoiceMessage key={`v-${item.note.id}`} note={item.note} />
          ),
        )
      )}
    </div>
  );
}

function PhotoMessage({ entry, onOpen }: { entry: Entry; onOpen: () => void }) {
  const photoUrl = useBlobUrl(entry.thumbnail ?? entry.photo);
  const fetchingRef = useRef(false);

  const title = entry.confirmed?.wikipediaTitle || entry.confirmed?.scientificName;

  // Once a species is confirmed, fetch the Wikipedia facts for this message.
  useEffect(() => {
    if (!entry.confirmed || entry.facts || fetchingRef.current || !title) return;
    fetchingRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wikipediaTitle: title }),
        });
        if (!res.ok) return;
        const data = await res.json();
        await db.entries.update(entry.id, {
          facts: {
            summary: data.summary,
            facts: data.facts,
            sourceUrl: data.sourceUrl,
            ...(data.lookClosely ? { lookClosely: data.lookClosely } : {}),
            // Matches what the entry page stores so its fact card can cite sentences.
            ...(data.sentences ? { sentences: data.sentences } : {}),
          } as Entry['facts'],
        });
      } catch (err) {
        console.error('Failed to fetch facts for log entry:', err);
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [entry.confirmed, entry.facts, entry.id, title]);

  let heading: string;
  // Unidentified finds are just a photo in the log: no caption
  let showHeading = true;
  let sub: string | null = null;
  if (entry.confirmed) {
    heading = entry.confirmed.commonName;
    sub = entry.confirmed.scientificName;
  } else if (entry.status === 'scene') {
    // A scenic photo: the caption is the only text it carries
    heading = entry.caption?.trim() || 'Photo';
    showHeading = !!entry.caption?.trim();
  } else if (entry.status === 'unidentified') {
    heading = 'Photo';
    showHeading = false;
  } else {
    heading = 'Photo saved';
  }

  const summary = entry.facts?.summary;

  return (
    <MessageShell
      at={entry.createdAt}
      label={heading}
      actions={[
        {
          id: 'delete',
          label: 'Delete photo',
          icon: Trash2,
          destructive: true,
          onSelect: () => void db.entries.delete(entry.id),
        },
      ]}
    >
      <div className="relative overflow-hidden rounded-xl bg-muted">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={heading} className="max-h-56 w-full object-cover" />
        ) : (
          <div className="h-32 w-full animate-pulse" />
        )}
      </div>

      <div className="space-y-1 px-1 pb-0.5">
        {showHeading && (
          <p className="text-sm font-semibold leading-tight text-foreground">{heading}</p>
        )}
        {sub && <p className="text-xs italic text-muted-foreground">{sub}</p>}

        {entry.confirmed &&
          (summary ? (
            <p className="line-clamp-4 text-xs leading-relaxed text-foreground/80">{summary}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Gathering facts from Wikipedia…</p>
          ))}

        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="flex cursor-pointer items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
          >
            Open entry <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </MessageShell>
  );
}

function VoiceMessage({ note }: { note: Note }) {
  const audioUrl = useBlobUrl(note.audio ?? null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioUrl) return;
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
      };
      audioRef.current = audio;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(console.warn);
      setPlaying(true);
    }
  };

  return (
    <>
      <MessageShell
        at={note.createdAt}
        label="Voice note"
        bubbleClassName="flex-row items-center gap-3"
        actions={[
          {
            id: 'transcribe',
            label: 'Transcribe',
            icon: FileText,
            onSelect: () => setTranscriptOpen(true),
          },
          {
            id: 'delete',
            label: 'Delete voice note',
            icon: Trash2,
            destructive: true,
            onSelect: () => void db.notes.delete(note.id),
          },
        ]}
      >
        <button
          type="button"
          onClick={toggle}
          disabled={!audioUrl}
          aria-label={playing ? 'Pause voice note' : 'Play voice note'}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:cursor-default disabled:opacity-40"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <NoteWaveform audio={note.audio} seed={note.id} progress={progress} className="flex-1" />
      </MessageShell>

      <TranscriptDialog note={note} open={transcriptOpen} onOpenChange={setTranscriptOpen} />
    </>
  );
}

function TextMessage({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.transcript);

  const save = async () => {
    const text = draft.trim();
    setEditing(false);
    if (!text) {
      await db.notes.delete(note.id);
      return;
    }
    if (text !== note.transcript) await db.notes.update(note.id, { transcript: text });
  };

  if (editing) {
    return (
      <div className="flex w-full max-w-[calc(100%-6rem)] flex-col gap-2 self-end rounded-2xl rounded-br-md border border-primary/40 bg-primary/10 p-2.5">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(note.transcript);
              setEditing(false);
            }}
            aria-label="Cancel edit"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void save()}
            aria-label="Save note"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <MessageShell
      at={note.createdAt}
      label="Text note"
      actions={[
        { id: 'edit', label: 'Edit note', icon: Pencil, onSelect: () => setEditing(true) },
        {
          id: 'delete',
          label: 'Delete note',
          icon: Trash2,
          destructive: true,
          onSelect: () => void db.notes.delete(note.id),
        },
      ]}
    >
      <p className="whitespace-pre-wrap break-words px-1 py-0.5 text-sm leading-relaxed text-foreground">
        {note.transcript}
      </p>
    </MessageShell>
  );
}
