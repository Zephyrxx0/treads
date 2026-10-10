'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Check, CheckCircle2, HelpCircle, Plus, RotateCcw, ScanSearch, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBlobUrl } from '@/hooks/use-blob-url';
import { identifyPhoto, type IdentifyResult } from '@/lib/identify';
import type { Candidate } from '@/lib/db';
import { playCaptureChime } from '@/lib/audio/cuelume';
import { triggerConfirmHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type Stage = 'preview' | 'identifying' | 'result';
type Outcome = IdentifyResult | { kind: 'error' };

export interface CaptureFlowCardProps {
  open: boolean;
  /** The EXIF-stripped photo; `null` while it is still being prepared */
  photoBlob: Blob | null;
  isProcessing?: boolean;
  /** Skip the preview and identify straight away (a find that is already in the log) */
  autoIdentify?: boolean;
  location: { lat?: number; lng?: number };
  /** Close without saving anything */
  onDiscard: () => void;
  onConfirm: (chosen: Candidate, all: Candidate[]) => void;
  /** Not a recognisable organism: keep the photo as an unidentified find */
  onKeepUnidentified: () => void;
  /** Save the photo to the log as it is, with an optional caption, without identifying it */
  onSaveScene: (caption: string) => void;
}

const DOTS = 12;

/**
 * One centred card for the whole capture: the photo with Discard / Identify, then
 * ghost text while the identifier works, then its answer. A wrong or missing match can
 * still go into the log ("Add anyway") as an unidentified find to sort out later.
 * Confirming hands the find to the walk log, which gathers the facts on its own.
 */
export function CaptureFlowCard({
  open,
  photoBlob,
  isProcessing = false,
  autoIdentify = false,
  location,
  onDiscard,
  onConfirm,
  onKeepUnidentified,
  onSaveScene,
}: CaptureFlowCardProps) {
  const photoUrl = useBlobUrl(photoBlob);
  const [stage, setStage] = useState<Stage>('preview');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [selected, setSelected] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [caption, setCaption] = useState('');
  const locationRef = useRef(location);
  locationRef.current = location;

  // Every time the card opens it starts from the beginning.
  useEffect(() => {
    if (!open) return;
    setOutcome(null);
    setSelected(0);
    setCaption('');
    setStage(autoIdentify ? 'identifying' : 'preview');
  }, [open, autoIdentify, photoBlob]);

  // Ask the identifier while the ghost text shows.
  useEffect(() => {
    if (!open || stage !== 'identifying' || !photoBlob) return;
    const controller = new AbortController();
    identifyPhoto(photoBlob, locationRef.current, controller.signal)
      .then((result) => {
        setOutcome(result);
        setStage('result');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to identify the photo:', err);
        setOutcome({ kind: 'error' });
        setStage('result');
      });
    return () => controller.abort();
  }, [open, stage, photoBlob, attempt]);

  const candidates = outcome?.kind === 'candidates' ? outcome.candidates : [];
  const chosen = candidates[selected] ?? null;
  const allUnsure = candidates.length > 0 && candidates.every((c) => c.confidence === 'Unsure');

  const confirm = () => {
    if (!chosen) return;
    void playCaptureChime();
    void triggerConfirmHaptic();
    onConfirm(chosen, candidates);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDiscard()}>
      <DialogContent
        hideCloseButton
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[22rem] gap-2.5 overflow-y-auto rounded-2xl p-2 shadow-2xl"
      >
        <DialogTitle className="sr-only">Identify this find</DialogTitle>
        <DialogDescription className="sr-only">
          {stage === 'preview'
            ? 'Review your photo, then save it to your log, identify it, or discard it with the close button.'
            : stage === 'identifying'
              ? 'Identifying your photo.'
              : 'Review the identification, then confirm it, add it anyway, or discard the photo.'}
        </DialogDescription>

        {/* The photo stays put through all three steps */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg landscape:not-tall:aspect-video border border-border/70 bg-muted/40">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Your photo"
              className={cn(
                'h-full w-full select-none object-cover transition-[filter] duration-500',
                stage === 'identifying' && 'brightness-90 saturate-75',
              )}
            />
          ) : (
            <div
              role="status"
              aria-label={isProcessing ? 'Preparing photo' : 'No photo'}
              className="flex h-full w-full items-center justify-center"
            >
              <DottedRing />
            </div>
          )}
          {(stage === 'preview' || stage === 'result') && (
            <button
              type="button"
              onClick={onDiscard}
              aria-label="Discard photo"
              title="Discard photo"
              className="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* The part below changes with the step and takes only the height it needs */}
        <div
          key={stage}
          className="flex flex-col gap-3 px-1 pb-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
        >
          {stage === 'preview' && (
            <>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && photoBlob && !isProcessing) {
                    e.preventDefault();
                    onSaveScene(caption);
                  }
                }}
                maxLength={140}
                placeholder="Add a caption (optional)"
                aria-label="Caption for this photo"
                className="h-10 rounded-lg text-sm"
              />
              <ActionRow>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!photoBlob || isProcessing}
                  onClick={() => onSaveScene(caption)}
                  title="Save this photo to your log without identifying it"
                  className="h-11 flex-1 cursor-pointer gap-2 rounded-lg"
                >
                  <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
                  Save to log
                </Button>
                <Button
                  type="button"
                  disabled={!photoBlob || isProcessing}
                  onClick={() => setStage('identifying')}
                  className="h-11 flex-1 cursor-pointer gap-2 rounded-lg font-semibold"
                >
                  <ScanSearch className="h-4 w-4" />
                  Identify
                </Button>
              </ActionRow>
            </>
          )}

          {stage === 'identifying' && (
            <div role="status" aria-live="polite" className="space-y-2.5 pt-1">
              <span className="sr-only">Identifying…</span>
              <GhostLine className="w-2/5" delay={0} />
              <GhostLine className="w-full" delay={150} />
              <GhostLine className="w-4/5" delay={300} />
            </div>
          )}

          {stage === 'result' && outcome?.kind === 'candidates' && chosen && (
            <>
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {candidates.length > 1 ? 'Pick the closest match' : 'Best match'}
                </legend>
                {candidates.map((c, i) => (
                  <CandidateRow
                    key={`${c.scientificName}-${i}`}
                    candidate={c}
                    checked={i === selected}
                    onSelect={() => setSelected(i)}
                  />
                ))}
              </fieldset>
              {(outcome.warning || allUnsure) && (
                <p className="px-0.5 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                  {outcome.warning ||
                    'Light or angle makes this one tricky. Check it before you confirm.'}
                </p>
              )}
              <ActionRow>
                <AddAnywayButton onClick={onKeepUnidentified} title="None of these? Add it to your log as an unidentified find" />
                <Button
                  type="button"
                  onClick={confirm}
                  className="h-11 flex-1 cursor-pointer gap-2 rounded-lg font-semibold"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
              </ActionRow>
            </>
          )}

          {stage === 'result' && outcome?.kind === 'refused' && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HelpCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-tight text-foreground">
                    Not a living thing I can name
                  </p>
                  <p className="line-clamp-3 text-xs leading-snug text-muted-foreground">
                    {outcome.reason ||
                      'Try a closer shot of leaves, bark, petals or feathers.'}
                  </p>
                </div>
              </div>
              <ActionRow>
                <AddAnywayButton
                  onClick={onKeepUnidentified}
                  title="Add it to your log as an unidentified find"
                  primary
                />
              </ActionRow>
            </>
          )}

          {stage === 'result' && outcome?.kind === 'error' && (
            <>
              <div className="space-y-0.5">
                <p className="text-base font-bold leading-tight text-foreground">
                  Couldn&apos;t reach the identifier
                </p>
                <p className="text-xs leading-snug text-muted-foreground">
                  Check your connection and try again, or add the photo to your log for later.
                </p>
              </div>
              <ActionRow>
                <AddAnywayButton
                  onClick={onKeepUnidentified}
                  title="Add it to your log as an unidentified find"
                />
                <Button
                  type="button"
                  onClick={() => {
                    setOutcome(null);
                    setStage('identifying');
                    setAttempt((n) => n + 1);
                  }}
                  className="h-11 flex-1 cursor-pointer gap-2 rounded-lg font-semibold"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try again
                </Button>
              </ActionRow>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddAnywayButton({
  onClick,
  title,
  primary = false,
}: {
  onClick: () => void;
  title: string;
  primary?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={primary ? 'default' : 'outline'}
      onClick={onClick}
      title={title}
      className={cn('h-11 flex-1 cursor-pointer gap-2 rounded-lg', primary && 'font-semibold')}
    >
      <Plus className={cn('h-4 w-4', !primary && 'text-muted-foreground')} />
      Add anyway
    </Button>
  );
}

/** One possible match: a real radio underneath, so arrow keys and screen readers just work. */
function CandidateRow({
  candidate,
  checked,
  onSelect,
}: {
  candidate: Candidate;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border/70 hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <input
        type="radio"
        name="candidate"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )}
      >
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight text-foreground">
              {candidate.commonName}
            </span>
            <span className="block truncate text-xs italic text-muted-foreground">
              {candidate.scientificName}
            </span>
          </span>
          <ConfidenceBadge confidence={candidate.confidence} />
        </span>
        {checked && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-border/60 text-[11px] capitalize">
              {candidate.kind}
            </Badge>
            {candidate.verified && (
              <Badge
                variant="secondary"
                className="gap-1 border border-primary/20 bg-primary/10 text-[11px] text-primary"
              >
                <CheckCircle2 className="h-3 w-3" />
                Verified taxon
              </Badge>
            )}
          </span>
        )}
      </span>
    </label>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2.5">{children}</div>;
}

function GhostLine({ className, delay }: { className?: string; delay: number }) {
  return (
    <div
      className={cn('h-3 rounded-full bg-muted-foreground/15 motion-safe:animate-pulse', className)}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/** A ring of dots that breathe in turn: the photo is being prepared. */
function DottedRing() {
  return (
    <div className="relative h-14 w-14" aria-hidden="true">
      {Array.from({ length: DOTS }, (_, i) => {
        const angle = (i / DOTS) * 2 * Math.PI;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/60 motion-safe:animate-pulse"
            style={{
              left: `${50 + Math.cos(angle) * 42}%`,
              top: `${50 + Math.sin(angle) * 42}%`,
              animationDelay: `${i * 90}ms`,
              animationDuration: '1.1s',
            }}
          />
        );
      })}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Candidate['confidence'] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'px-2 py-0.5 text-[11px] capitalize',
        confidence === 'Likely' &&
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        confidence === 'Possible' &&
          'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400',
        confidence === 'Unsure' && 'border-border bg-muted text-muted-foreground',
      )}
    >
      {confidence}
    </Badge>
  );
}
