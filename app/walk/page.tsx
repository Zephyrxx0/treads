'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Leaf, GripVertical } from 'lucide-react';
import { getDailyHunt, evaluateHuntProgress } from '@/lib/hunt';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useConsent } from '@/hooks/use-consent';
import { useGeolocation, CurrentPosition } from '@/hooks/use-geolocation';
import { useActiveWalk } from '@/hooks/use-active-walk';
import { useMediaQuery } from '@/hooks/use-media-query';
import { WalkHud } from '@/components/walk/walk-hud';
import { LiveCamera } from '@/components/walk/live-camera';
import { ActivityLog } from '@/components/walk/activity-log';
import { EntryDetailPane } from '@/components/walk/entry-detail-pane';
import { DailyHuntCard } from '@/components/hunt/daily-hunt-card';
import { WalkControls, WalkControlsHandle } from '@/components/walk/walk-controls';
import { CaptureFlowCard } from '@/components/walk/capture-flow-card';
import { WalkSummarySheet } from '@/components/walk/walk-summary-sheet';
import { WalkDiscardDialog } from '@/components/walk/walk-discard-dialog';
import { WalkEndDialog } from '@/components/walk/walk-end-dialog';
import { VoiceRecorderSheet } from '@/components/voice/voice-recorder-sheet';
import { RoutePreviewSheet } from '@/components/route/route-preview-sheet';
import type { WalkMapRef } from '@/components/map/walk-map';
import { TrackPoint, calculateHaversineDistance } from '@/lib/geo';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { processCapturedImage } from '@/lib/camera';
import { db, Candidate } from '@/lib/db';

// Dynamically import WalkMap to prevent SSR "window is not defined" errors
const WalkMap = dynamic(() => import('@/components/map/walk-map').then((mod) => mod.WalkMap), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm font-mono">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Initializing Liberty map...</span>
      </div>
    </div>
  ),
});

export default function WalkPage() {
  const router = useRouter();
  const { hasConsented } = useConsent();
  const walkMapRef = useRef<WalkMapRef | null>(null);

  const {
    activeWalk,
    isActive,
    isResumed,
    dismissResumed,
    elapsedSeconds,
    distanceMeters,
    startWalk,
    appendTrackPoint,
    endWalk,
    discardWalk,
    clearRouteLine,
  } = useActiveWalk();

  // Live specimen entries for the current active walk session
  const walkId = activeWalk?.id;
  const walkSpecimens =
    useLiveQuery(async () => {
      if (!walkId) return [];
      return db.entries.where('walkId').equals(walkId).toArray();
    }, [walkId]) || [];
  const identifiedSpecimensCount = walkSpecimens.filter(
    (e) => e.status !== 'unidentified' && e.status !== 'scene',
  ).length;

  // Live voice notes for the active walk session (per D-03)
  const walkNotes =
    useLiveQuery(async () => {
      if (!walkId) return [];
      return db.notes.where('walkId').equals(walkId).toArray();
    }, [walkId]) || [];

  // Live Daily Species Hunt progress for today (per HUNT-01, D-04)
  const allConfirmedEntries =
    useLiveQuery(() => db.entries.where('status').equals('confirmed').toArray()) || [];
  const dailyHunt = useMemo(() => getDailyHunt(), []);
  const huntProgress = useMemo(
    () => evaluateHuntProgress(dailyHunt, allConfirmedEntries),
    [dailyHunt, allConfirmedEntries],
  );

  // Pre-walk suggested pedestrian loop preview coordinates
  const [previewRouteLine, setPreviewRouteLine] = useState<[number, number][] | null>(null);

  // Completed walk session metrics for Summary Drawer review
  const [completedSummary, setCompletedSummary] = useState<{
    walkId?: string;
    duration: number;
    distance: number;
    trackPoints: TrackPoint[];
  } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false);
  const [discardReason, setDiscardReason] = useState<'time' | 'distance'>('time');
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState<boolean>(false);
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState<boolean>(false);

  // Custom Waypoints state (A.3)
  const [customStart, setCustomStart] = useState<[number, number] | null>(null);
  const [customFinish, setCustomFinish] = useState<[number, number] | null>(null);
  const [customStops, setCustomStops] = useState<[number, number][]>([]);
  const [mapClickMode, setMapClickMode] = useState<'stop' | 'start' | 'finish' | null>(null);

  const handleMapClick = useCallback(
    (coords: [number, number]) => {
      if (mapClickMode === 'stop') {
        setCustomStops((prev) => [...prev, coords]);
      } else if (mapClickMode === 'start') {
        setCustomStart(coords);
        setMapClickMode(null);
      } else if (mapClickMode === 'finish') {
        setCustomFinish(coords);
        setMapClickMode(null);
      }
    },
    [mapClickMode],
  );

  const handleRemoveStop = useCallback((index: number) => {
    setCustomStops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // New track point callback from useGeolocation
  const handleNewTrackPoint = useCallback(
    (point: TrackPoint) => {
      if (isActive) {
        appendTrackPoint(point);
      }
    },
    [isActive, appendTrackPoint],
  );

  const {
    currentPosition,
    status: gpsStatus,
    requestCurrentPosition,
  } = useGeolocation({
    enabled: true, // Keep geolocation active so pre-walk shows user's location
    onNewTrackPoint: handleNewTrackPoint,
  });

  // Camera capture & identification state (Phase 3)
  const walkControlsRef = useRef<WalkControlsHandle | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  // The map panel only has room for the viewfinder in the side-by-side (lg) layout;
  // on phones it takes over the whole screen instead.
  const isDesktopLayout = useMediaQuery('(min-width: 1024px)', true);
  // Find currently open in the side pane (slides over the activity log)

  // Horizontal panel resizer state for landscape / wide screens
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [asideWidth, setAsideWidth] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('treads:walk-aside-width');
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= 300 && parsed <= 1200) {
        return parsed;
      }
    }
    return null;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return; // Only primary button
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      setIsResizing(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Width of aside is distance from mouse to the right edge of container
        const newWidth = Math.round(rect.right - moveEvent.clientX);
        // Constrain aside width so both map and aside stay functional:
        // aside: min 320px, max (containerWidth - 320px)
        const minAside = 320;
        const maxAside = Math.max(minAside, rect.width - 340);
        const clamped = Math.min(Math.max(newWidth, minAside), maxAside);
        setAsideWidth(clamped);
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch {
          // pointer might already be released
        }
        setIsResizing(false);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        // Persist preference
        setAsideWidth((curr) => {
          if (curr !== null) {
            localStorage.setItem('treads:walk-aside-width', String(curr));
          }
          return curr;
        });

        // Trigger map resize so canvas matches new dimensions cleanly
        setTimeout(() => {
          walkMapRef.current?.resize();
        }, 50);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [],
  );

  const handleResetAsideWidth = useCallback(() => {
    setAsideWidth(null);
    localStorage.removeItem('treads:walk-aside-width');
    setTimeout(() => {
      walkMapRef.current?.resize();
    }, 50);
  }, []);

  const handleResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setAsideWidth((prev) => {
          const next = Math.min((prev ?? 450) + 30, 900);
          localStorage.setItem('treads:walk-aside-width', String(next));
          setTimeout(() => walkMapRef.current?.resize(), 50);
          return next;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setAsideWidth((prev) => {
          const next = Math.max((prev ?? 450) - 30, 320);
          localStorage.setItem('treads:walk-aside-width', String(next));
          setTimeout(() => walkMapRef.current?.resize(), 50);
          return next;
        });
      } else if (e.key === 'Enter' || e.key === 'Escape') {
        handleResetAsideWidth();
      }
    },
    [handleResetAsideWidth],
  );
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const closeEntryPane = useCallback(() => setOpenEntryId(null), []);

  // Quick text note typed into the dock
  const handleSubmitTextNote = useCallback(
    async (text: string) => {
      try {
        await db.notes.add({
          id: crypto.randomUUID(),
          walkId,
          kind: 'text',
          transcript: text,
          lat: currentPosition?.lat,
          lng: currentPosition?.lng,
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error('Failed to save text note:', err);
      }
    },
    [walkId, currentPosition],
  );
  // The capture card: photo -> identify -> confirm. Nothing is saved until the walker confirms
  // (or keeps the photo as an unidentified note), so a discard leaves no trace.
  const [isCaptureOpen, setIsCaptureOpen] = useState<boolean>(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    photoBlob: Blob;
    thumbnailBlob: Blob;
  } | null>(null);
  // Set when the card is identifying a find that is already in the log
  const [capturingEntryId, setCapturingEntryId] = useState<string | null>(null);

  // Photo capture trigger & EXIF-stripping handler
  const handlePhotoSelected = useCallback(async (file: File) => {
    setIsLiveCameraOpen(false);
    setCapturingEntryId(null);
    setCapturedPhoto(null);
    setIsProcessingPhoto(true);
    setIsCaptureOpen(true);
    try {
      const { photoBlob, thumbnailBlob } = await processCapturedImage(file);
      setCapturedPhoto({ photoBlob, thumbnailBlob });
    } catch (err) {
      console.error('Failed to process captured image:', err);
      setIsCaptureOpen(false);
    } finally {
      setIsProcessingPhoto(false);
    }
  }, []);

  // Identify a find that was left unidentified: same card, straight to identifying
  const handleIdentifyExisting = useCallback(async (entryId: string) => {
    const entry = await db.entries.get(entryId);
    if (!entry) return;
    try {
      const toBlob = async (src: Blob | string) =>
        typeof src === 'string' ? (await fetch(src)).blob() : src;
      const photoBlob = await toBlob(entry.photo);
      const thumbnailBlob = entry.thumbnail ? await toBlob(entry.thumbnail) : photoBlob;
      setCapturedPhoto({ photoBlob, thumbnailBlob });
      setCapturingEntryId(entryId);
      setIsCaptureOpen(true);
    } catch (err) {
      console.error('Failed to load the find for identification:', err);
    }
  }, []);

  const handleDiscardCapture = useCallback(() => setIsCaptureOpen(false), []);

  // Confirmed in the card: the find joins the log, and the log gathers its facts
  const handleConfirmCapture = useCallback(
    async (candidate: Candidate, all: Candidate[]) => {
      try {
        if (capturingEntryId) {
          await db.entries.update(capturingEntryId, {
            candidates: all,
            confirmed: candidate,
            status: 'confirmed',
            verified: candidate.verified ?? false,
          });
        } else if (activeWalk && capturedPhoto) {
          const now = Date.now();
          await db.entries.add({
            id: crypto.randomUUID(),
            walkId: activeWalk.id,
            createdAt: now,
            timestamp: now,
            photo: capturedPhoto.photoBlob,
            thumbnail: capturedPhoto.thumbnailBlob,
            lat: currentPosition?.lat ?? 0,
            lng: currentPosition?.lng ?? 0,
            accuracy: currentPosition?.accuracy ?? 0,
            status: 'confirmed',
            candidates: all,
            confirmed: candidate,
            verified: candidate.verified ?? false,
          });
        }
      } catch (err) {
        console.error('Failed to save the confirmed find:', err);
      }
      setIsCaptureOpen(false);
    },
    [capturingEntryId, activeWalk, capturedPhoto, currentPosition],
  );

  // A plain photo for the log (a view, a moment): no identifier involved
  const handleSaveScene = useCallback(
    async (caption: string) => {
      try {
        if (activeWalk && capturedPhoto && !capturingEntryId) {
          const now = Date.now();
          const trimmed = caption.trim();
          await db.entries.add({
            id: crypto.randomUUID(),
            walkId: activeWalk.id,
            createdAt: now,
            timestamp: now,
            photo: capturedPhoto.photoBlob,
            thumbnail: capturedPhoto.thumbnailBlob,
            lat: currentPosition?.lat ?? 0,
            lng: currentPosition?.lng ?? 0,
            accuracy: currentPosition?.accuracy ?? 0,
            status: 'scene',
            candidates: [],
            verified: false,
            ...(trimmed ? { caption: trimmed } : {}),
          });
        }
      } catch (err) {
        console.error('Failed to save the photo to the log:', err);
      }
      setIsCaptureOpen(false);
    },
    [capturingEntryId, activeWalk, capturedPhoto, currentPosition],
  );

  // Not identifiable: keep the photo in the log as an unidentified find
  const handleKeepUnidentified = useCallback(async () => {
    try {
      if (capturingEntryId) {
        // A scene photo that was run through the identifier stays a scene photo
        await db.entries
          .where('id')
          .equals(capturingEntryId)
          .filter((e) => e.status !== 'scene')
          .modify({ status: 'unidentified' });
      } else if (activeWalk && capturedPhoto) {
        const now = Date.now();
        await db.entries.add({
          id: crypto.randomUUID(),
          walkId: activeWalk.id,
          createdAt: now,
          timestamp: now,
          photo: capturedPhoto.photoBlob,
          thumbnail: capturedPhoto.thumbnailBlob,
          lat: currentPosition?.lat ?? 0,
          lng: currentPosition?.lng ?? 0,
          accuracy: currentPosition?.accuracy ?? 0,
          status: 'unidentified',
          candidates: [],
          verified: false,
        });
      }
    } catch (err) {
      console.error('Failed to keep the photo as unidentified:', err);
    }
    setIsCaptureOpen(false);
  }, [capturingEntryId, activeWalk, capturedPhoto, currentPosition]);

  // Auto-resume camera fly-to latest fix (per D-04)
  const hasHandledResumeFlyRef = useRef<boolean>(false);
  useEffect(() => {
    if (isResumed && !hasHandledResumeFlyRef.current && walkMapRef.current) {
      hasHandledResumeFlyRef.current = true;
      // Slight delay to ensure map canvas is loaded
      const timer = setTimeout(() => {
        walkMapRef.current?.recenter();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isResumed]);

  // Off-route guidance calculation (per D-15, ROUT-01)
  const isOffRoute = React.useMemo(() => {
    if (
      !isActive ||
      !activeWalk?.routeLine ||
      activeWalk.routeLine.length === 0 ||
      !currentPosition
    ) {
      return false;
    }
    let minDistance = Infinity;
    for (const pt of activeWalk.routeLine) {
      const d = calculateHaversineDistance(currentPosition.lat, currentPosition.lng, pt[1], pt[0]);
      if (d < minDistance) minDistance = d;
    }
    return minDistance > 60; // > 60m divergence triggers quiet HUD badge
  }, [isActive, activeWalk?.routeLine, currentPosition]);

  // Start Free Walk action (per D-03, WALK-01)
  const handleStartFreeWalk = useCallback(async () => {
    try {
      await startWalk('free');
      if (currentPosition) {
        // Record starting coordinate
        const startPt: TrackPoint = {
          lat: currentPosition.lat,
          lng: currentPosition.lng,
          accuracy: currentPosition.accuracy,
          timestamp: currentPosition.timestamp,
        };
        await appendTrackPoint(startPt, { immediate: true });
      }
      setPreviewRouteLine(null);
      walkMapRef.current?.recenter();
    } catch (err) {
      console.error('Failed to start free walk session:', err);
    }
  }, [startWalk, currentPosition, appendTrackPoint]);

  // Start Loop Walk action with suggested route line (per D-13, ROUT-01)
  const handleStartLoopWalk = useCallback(
    async (routeLine: [number, number][]) => {
      try {
        await startWalk('loop', routeLine);
        if (currentPosition) {
          // Record starting coordinate
          const startPt: TrackPoint = {
            lat: currentPosition.lat,
            lng: currentPosition.lng,
            accuracy: currentPosition.accuracy,
            timestamp: currentPosition.timestamp,
          };
          await appendTrackPoint(startPt, { immediate: true });
        }
        setPreviewRouteLine(null);
        walkMapRef.current?.recenter();
      } catch (err) {
        console.error('Failed to start loop walk session:', err);
      }
    },
    [startWalk, currentPosition, appendTrackPoint],
  );

  // Finalize walk session and show summary (per D-14, WALK-03)
  const finalizeWalk = useCallback(async () => {
    const finalDuration = elapsedSeconds;
    const finalDistance = distanceMeters;
    const finalPoints = activeWalk?.trackPoints ? [...activeWalk.trackPoints] : [];
    const currentWalkId = activeWalk?.id || walkId;

    setCompletedSummary({
      walkId: currentWalkId,
      duration: finalDuration,
      distance: finalDistance,
      trackPoints: finalPoints,
    });

    // Trigger naturalist dispatch & ecological connections generation via Gemma
    if (currentWalkId) {
      (async () => {
        try {
          const currentEntries = await db.entries.where('walkId').equals(currentWalkId).toArray();
          const currentNotes = await db.notes.where('walkId').equals(currentWalkId).toArray();

          const confirmedNames = currentEntries
            .map((s) => s.confirmed?.commonName || s.confirmed?.scientificName)
            .filter(Boolean) as string[];
          const noteTexts = currentNotes.map((n) => n.transcript).filter(Boolean);

          const res = await fetch('/api/walk/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              species: confirmedNames,
              notes: noteTexts,
              duration: finalDuration,
              distance: finalDistance,
            }),
          });
          const data = await res.json();
          if (data.dispatch) {
            await db.walks.update(currentWalkId, {
              dispatch: data.dispatch,
              connections: data.connections || [],
            });
          }
        } catch (err) {
          console.error('Failed to generate walk dispatch:', err);
        }
      })();
    }

    await endWalk();

    // Fit camera to full trail bounding box
    setTimeout(() => {
      walkMapRef.current?.fitTrailBounds();
    }, 200);

    setIsSummaryOpen(true);
  }, [elapsedSeconds, distanceMeters, activeWalk?.trackPoints, activeWalk?.id, walkId, endWalk]);

  // Hold-to-confirm or tap End Walk trigger (per D-13)
  const handleEndWalkAttempt = useCallback(
    (options?: { fromHold?: boolean }) => {
      // Short walk (per D-15): under a minute, or under 25 m with nothing logged.
      // A walk with finds or notes is worth keeping even if the walker stood still.
      const tooShortInTime = elapsedSeconds < 60;
      const tooShortInDistance = distanceMeters < 25;
      const hasContent = walkSpecimens.length > 0 || walkNotes.length > 0;
      if (tooShortInTime || (tooShortInDistance && !hasContent)) {
        setDiscardReason(tooShortInTime ? 'time' : 'distance');
        setIsDiscardDialogOpen(true);
        return;
      }

      if (options?.fromHold) {
        finalizeWalk();
      } else {
        setIsEndConfirmOpen(true);
      }
    },
    [elapsedSeconds, distanceMeters, walkSpecimens.length, walkNotes.length, finalizeWalk],
  );

  // Discard walk confirm (per D-15)
  const handleConfirmDiscard = useCallback(async () => {
    setIsDiscardDialogOpen(false);
    await discardWalk();
    setCompletedSummary(null);
  }, [discardWalk]);

  // Discard dialog "Save Anyway" option
  const handleSaveAnyway = useCallback(async () => {
    setIsDiscardDialogOpen(false);
    await finalizeWalk();
  }, [finalizeWalk]);

  // Done button on summary sheet resets /walk to pre-walk ready state (per D-16)
  const handleSummaryDone = useCallback(() => {
    setIsSummaryOpen(false);
    setCompletedSummary(null);
    walkMapRef.current?.recenter();
  }, []);

  // Determine active track points to render on map
  const displayTrackPoints = isActive
    ? activeWalk?.trackPoints || []
    : completedSummary
      ? completedSummary.trackPoints
      : [];

  const showRoutePanel = !isActive && !completedSummary;

  // Don't carry an open find into the next walk
  useEffect(() => {
    if (showRoutePanel) setOpenEntryId(null);
  }, [showRoutePanel]);

  return (
    <div
      ref={containerRef}
      className={cn(
        // Held upright (phones, tablets): the map stacks above the panel. Before the walk the page
        // itself scrolls and the setup cards keep their full height; during a walk the screen is
        // fixed so the log scrolls above its dock. Held sideways (landscape): map beside the panel.
        'flex w-full flex-col gap-3 bg-background p-3 landscape:h-dvh landscape:flex-row landscape:overflow-hidden lg:gap-4 lg:p-4',
        showRoutePanel ? 'min-h-dvh' : 'h-dvh overflow-hidden',
      )}
    >
      {/* Map panel: top when upright, left of the panel when landscape */}
      <section
        aria-label="Map"
        className={cn(
          'relative h-[46dvh] min-h-[260px] shrink-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-background shadow-sm landscape:h-full landscape:min-w-0',
          asideWidth === null
            ? 'landscape:aspect-square landscape:w-auto landscape:shrink-0 landscape:flex-none'
            : 'landscape:flex-1 landscape:w-auto',
        )}
      >
        {/* Top Left Home Back Link */}
        <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20">
          <Link
            href="/"
            aria-label="Return to Home"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-md border border-border/70 shadow-md hover:bg-background cursor-pointer',
            )}
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
        </div>

        {/* Top Right Theme Toggle */}
        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20">
          <ThemeToggle className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-md border border-border/70 shadow-md hover:bg-background cursor-pointer" />
        </div>

        {/* Interactive MapLibre GL Canvas (per D-01, MAP-01, D-13, ROUT-01, D-03) */}
        <WalkMap
          ref={walkMapRef}
          userPosition={currentPosition}
          trackPoints={displayTrackPoints}
          specimenEntries={walkSpecimens}
          suggestedRouteLine={isActive ? activeWalk?.routeLine || null : previewRouteLine}
          audioNotes={walkNotes}
          onSpecimenClick={(entry) => router.push(`/entry/${entry.id}`)}
          isWalkActive={isActive}
          className="w-full h-full"
          customStart={customStart}
          customFinish={customFinish}
          customStops={customStops}
          onMapClick={mapClickMode ? handleMapClick : undefined}
          isPlacingStop={!!mapClickMode}
          onRemoveStop={handleRemoveStop}
        />

        {/* Active Walk Top HUD Pills (per D-01, D-02, D-14, D-15) */}
        {isActive && (
          <WalkHud
            durationSeconds={elapsedSeconds}
            distanceMeters={distanceMeters}
            gpsStatus={gpsStatus}
            accuracy={currentPosition?.accuracy}
            onRequestLocation={requestCurrentPosition}
            isResumed={isResumed}
            onDismissResumed={dismissResumed}
            specimenCount={identifiedSpecimensCount}
            isOffRoute={isOffRoute}
            onClearRoute={clearRouteLine}
            huntProgress={huntProgress}
          />
        )}

        {/* Inline viewfinder takes over the map panel while the camera is open (desktop) */}
        <LiveCamera
          variant={isDesktopLayout ? 'inline' : 'fullscreen'}
          open={isLiveCameraOpen}
          onClose={() => setIsLiveCameraOpen(false)}
          onCapture={handlePhotoSelected}
          onChooseFile={() => {
            setIsLiveCameraOpen(false);
            walkControlsRef.current?.chooseFile();
          }}
        />
      </section>

      {/* Draggable panel resizer handle in landscape / desktop mode */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel horizontally"
        tabIndex={0}
        onPointerDown={handleResizeStart}
        onDoubleClick={handleResetAsideWidth}
        onKeyDown={handleResizeKeyDown}
        title="Drag horizontally to resize panel. Double-click to reset."
        className={cn(
          'group relative hidden landscape:flex select-none touch-none cursor-col-resize items-center justify-center shrink-0 w-3 -mx-1 z-30 transition-colors',
          isResizing && 'cursor-col-resize',
        )}
      >
        <div
          className={cn(
            'h-20 w-1 rounded-full bg-border/80 group-hover:bg-primary/70 transition-all duration-200 group-hover:h-28 group-hover:w-1.5',
            isResizing && 'bg-primary h-36 w-1.5 shadow-sm shadow-primary/40',
          )}
        />
        <div
          className={cn(
            'absolute flex h-7 w-4.5 items-center justify-center rounded-full bg-background border border-border/80 shadow-md text-muted-foreground group-hover:text-primary group-hover:border-primary/50 transition-all duration-150',
            isResizing && 'border-primary text-primary scale-110 shadow-lg',
          )}
        >
          <GripVertical className="h-3 w-3" />
        </div>
      </div>

      {/* Side panel: route setup before the walk, activity log + dock during it */}
      <aside
        aria-label={showRoutePanel ? 'Walk setup' : 'Walk activity'}
        style={asideWidth ? { width: `${asideWidth}px` } : undefined}
        className={cn(
          'flex flex-col min-h-0 landscape:h-full landscape:min-w-0',
          asideWidth
            ? 'landscape:flex-none landscape:shrink-0'
            : 'landscape:flex-1 landscape:w-auto',
        )}
      >
        {showRoutePanel ? (
          <RoutePreviewSheet
            layout="panel"
            currentPosition={currentPosition}
            gpsStatus={gpsStatus}
            onStartFreeWalk={handleStartFreeWalk}
            onStartLoopWalk={handleStartLoopWalk}
            onRoutePreviewChange={setPreviewRouteLine}
            customStart={customStart}
            customFinish={customFinish}
            customStops={customStops}
            onSetCustomStart={setCustomStart}
            onSetCustomFinish={setCustomFinish}
            onAddCustomStop={(stop) => setCustomStops((prev) => [...prev, stop])}
            onRemoveCustomStop={handleRemoveStop}
            onClearCustomWaypoints={() => {
              setCustomStart(null);
              setCustomFinish(null);
              setCustomStops([]);
              setMapClickMode(null);
            }}
            mapClickMode={mapClickMode}
            onSetMapClickMode={setMapClickMode}
            extras={
              <>
                <DailyHuntCard progress={huntProgress} />
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/journal"
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-11 gap-2 rounded-2xl')}
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    Journal
                  </Link>
                  <Link
                    href="/collection"
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-11 gap-2 rounded-2xl')}
                  >
                    <Leaf className="h-4 w-4 text-primary" />
                    Collection
                  </Link>
                </div>
              </>
            }
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/80 shadow-sm backdrop-blur-md">
            {/* The log and the find-detail pane share one slot; the detail slides over the log */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <ActivityLog
                className="h-full"
                specimens={walkSpecimens}
                notes={walkNotes}
                startedAt={activeWalk?.startedAt}
                onOpenEntry={setOpenEntryId}
              />
              <EntryDetailPane
                entryId={openEntryId}
                onClose={closeEntryPane}
                onIdentify={handleIdentifyExisting}
              />
            </div>
            {/* Action dock: camera, mic, stop walk */}
            {isActive && (
              <div className="shrink-0 border-t border-border/60 bg-background/60 p-3">
                <WalkControls
                  ref={walkControlsRef}
                  onEndWalk={handleEndWalkAttempt}
                  onPhotoSelected={handlePhotoSelected}
                  onMicClick={() => setIsVoiceSheetOpen(true)}
                  onSubmitTextNote={handleSubmitTextNote}
                  onLiveCameraRequest={() => setIsLiveCameraOpen(true)}
                />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Post-walk Summary Bottom Sheet (per D-14, D-16, D-03) */}
      {completedSummary && (
        <WalkSummarySheet
          open={isSummaryOpen}
          onOpenChange={(open) => {
            setIsSummaryOpen(open);
            if (!open) handleSummaryDone();
          }}
          walkId={completedSummary.walkId}
          durationSeconds={completedSummary.duration}
          distanceMeters={completedSummary.distance}
          speciesCount={identifiedSpecimensCount}
          specimens={walkSpecimens}
          notes={walkNotes}
          onDone={handleSummaryDone}
        />
      )}

      {/* Short Walk Discard Confirmation Dialog (per D-15) */}
      <WalkDiscardDialog
        open={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
        reason={discardReason}
        onConfirmDiscard={handleConfirmDiscard}
        onSaveAnyway={handleSaveAnyway}
      />

      {/* 2-Tap End Walk Confirmation Dialog for longer walks (per D-13) */}
      <WalkEndDialog
        open={isEndConfirmOpen}
        onOpenChange={setIsEndConfirmOpen}
        onConfirmEnd={() => {
          setIsEndConfirmOpen(false);
          finalizeWalk();
        }}
        onContinue={() => setIsEndConfirmOpen(false)}
      />

      {/* Capture card: photo -> identify -> confirm, in one centred pop-up */}
      <CaptureFlowCard
        open={isCaptureOpen}
        photoBlob={capturedPhoto?.photoBlob ?? null}
        isProcessing={isProcessingPhoto}
        autoIdentify={capturingEntryId !== null}
        location={{ lat: currentPosition?.lat, lng: currentPosition?.lng }}
        onDiscard={handleDiscardCapture}
        onConfirm={handleConfirmCapture}
        onKeepUnidentified={handleKeepUnidentified}
        onSaveScene={handleSaveScene}
      />

      {/* Field Voice Note Recorder Bottom Sheet (Phase 4, per VOIC-01, D-01, D-03) */}
      <VoiceRecorderSheet
        open={isVoiceSheetOpen}
        onOpenChange={setIsVoiceSheetOpen}
        walkId={walkId}
        lat={currentPosition?.lat}
        lng={currentPosition?.lng}
      />
    </div>
  );
}
