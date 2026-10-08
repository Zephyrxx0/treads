'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Compass, Play } from 'lucide-react';
import { getDailyHunt, evaluateHuntProgress } from '@/lib/hunt';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { ConsentModal } from '@/components/consent/consent-modal';
import { useConsent } from '@/hooks/use-consent';
import { useGeolocation, CurrentPosition } from '@/hooks/use-geolocation';
import { useActiveWalk } from '@/hooks/use-active-walk';
import { WalkHud } from '@/components/walk/walk-hud';
import { WalkControls, WalkControlsHandle } from '@/components/walk/walk-controls';
import { CameraCaptureSheet } from '@/components/walk/camera-capture-sheet';
import { CandidatePickerSheet } from '@/components/walk/candidate-picker-sheet';
import { IdentificationRefusalCard } from '@/components/walk/identification-refusal-card';
import { WalkSummarySheet } from '@/components/walk/walk-summary-sheet';
import { WalkDiscardDialog } from '@/components/walk/walk-discard-dialog';
import { VoiceRecorderSheet } from '@/components/voice/voice-recorder-sheet';
import { RoutePreviewSheet } from '@/components/route/route-preview-sheet';
import type { WalkMapRef } from '@/components/map/walk-map';
import { TrackPoint, calculateHaversineDistance } from '@/lib/geo';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { processCapturedImage, blobToBase64 } from '@/lib/camera';
import { db, Entry, Candidate, Note } from '@/lib/db';

// Dynamically import WalkMap to prevent SSR "window is not defined" errors
const WalkMap = dynamic(() => import('@/components/map/walk-map').then((mod) => mod.WalkMap), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm font-mono">
        <span className="w-5 h-5 border-2 border-[#F35C2B] border-t-transparent rounded-full animate-spin" />
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
  const walkSpecimens = useLiveQuery(
    async () => {
      if (!walkId) return [];
      return db.entries.where('walkId').equals(walkId).toArray();
    },
    [walkId]
  ) || [];
  const identifiedSpecimensCount = walkSpecimens.filter((e) => e.status !== 'unidentified').length;

  // Live voice notes for the active walk session (per D-03)
  const walkNotes = useLiveQuery(
    async () => {
      if (!walkId) return [];
      return db.notes.where('walkId').equals(walkId).toArray();
    },
    [walkId]
  ) || [];

  // Live Daily Species Hunt progress for today (per HUNT-01, D-04)
  const allConfirmedEntries = useLiveQuery(
    () => db.entries.where('status').equals('confirmed').toArray()
  ) || [];
  const dailyHunt = useMemo(() => getDailyHunt(), []);
  const huntProgress = useMemo(
    () => evaluateHuntProgress(dailyHunt, allConfirmedEntries),
    [dailyHunt, allConfirmedEntries]
  );

  // Pre-walk suggested pedestrian loop preview coordinates
  const [previewRouteLine, setPreviewRouteLine] = useState<[number, number][] | null>(null);

  // Completed walk session metrics for Summary Drawer review
  const [completedSummary, setCompletedSummary] = useState<{
    duration: number;
    distance: number;
    trackPoints: TrackPoint[];
  } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false);
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState<boolean>(false);

  // New track point callback from useGeolocation
  const handleNewTrackPoint = useCallback(
    (point: TrackPoint) => {
      if (isActive) {
        appendTrackPoint(point);
      }
    },
    [isActive, appendTrackPoint]
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
  const [isCaptureSheetOpen, setIsCaptureSheetOpen] = useState<boolean>(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    photoBlob: Blob;
    thumbnailBlob: Blob;
  } | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isCandidateSheetOpen, setIsCandidateSheetOpen] = useState<boolean>(false);
  const [isRefusalCardOpen, setIsRefusalCardOpen] = useState<boolean>(false);
  const [refusalReason, setRefusalReason] = useState<string>('');

  // Photo capture trigger & EXIF-stripping handler
  const handlePhotoSelected = useCallback(async (file: File) => {
    setIsProcessingPhoto(true);
    setIsCaptureSheetOpen(true);
    try {
      const { photoBlob, thumbnailBlob } = await processCapturedImage(file);
      setCapturedPhoto({ photoBlob, thumbnailBlob });
    } catch (err) {
      console.error('Failed to process captured image:', err);
      setIsCaptureSheetOpen(false);
    } finally {
      setIsProcessingPhoto(false);
    }
  }, []);

  // Retake photo action from capture sheet
  const handleRetakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setIsCaptureSheetOpen(false);
    setTimeout(() => {
      walkControlsRef.current?.triggerCapture();
    }, 150);
  }, []);

  // Use Photo, Save Draft to Dexie, and trigger /api/identify
  const handleIdentifyPhoto = useCallback(
    async (photoBlob: Blob, thumbnailBlob: Blob) => {
      if (!activeWalk) return;
      const entryId = crypto.randomUUID();
      setActiveEntryId(entryId);

      try {
        // 1. Optimistic draft save to Dexie
        const newEntry: Entry = {
          id: entryId,
          walkId: activeWalk.id,
          createdAt: Date.now(),
          timestamp: Date.now(),
          photo: photoBlob,
          thumbnail: thumbnailBlob,
          lat: currentPosition?.lat ?? 0,
          lng: currentPosition?.lng ?? 0,
          accuracy: currentPosition?.accuracy ?? 0,
          status: 'saved',
          candidates: [],
          verified: false,
        };
        await db.entries.add(newEntry);
        setIsCaptureSheetOpen(false);

        // 2. Multimodal AI identification call
        setIsIdentifying(true);
        const base64 = await blobToBase64(photoBlob);
        const res = await fetch('/api/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            month: new Date().getMonth() + 1,
            lat: currentPosition?.lat,
            lng: currentPosition?.lng,
          }),
        });

        if (!res.ok) {
          throw new Error(`Identify API responded with HTTP ${res.status}`);
        }

        const data = await res.json();

        // 3. Handle Refusal vs Candidate Selection
        if (!data.isLivingOrganism) {
          await db.entries.update(entryId, { status: 'unidentified' });
          setRefusalReason(data.refusalReason || '');
          setIsRefusalCardOpen(true);
        } else {
          const returnedCandidates: Candidate[] = (data.candidates || []).map((c: any) => ({
            scientificName: c.scientificName,
            commonName: c.commonName,
            kind: c.kind,
            confidence: c.confidence,
            wikipediaTitle: c.wikipediaTitle,
            verified: Boolean(c.verified),
          }));

          await db.entries.update(entryId, {
            candidates: returnedCandidates,
          });
          setCandidates(returnedCandidates);
          setIsCandidateSheetOpen(true);
        }
      } catch (err) {
        console.error('Failed to identify organism:', err);
        // Note: Draft remains saved in Dexie with status 'saved'
      } finally {
        setIsIdentifying(false);
      }
    },
    [activeWalk, currentPosition]
  );

  // Candidate confirmed by user tap
  const handleConfirmCandidate = useCallback(
    async (candidate: Candidate) => {
      if (!activeEntryId) return;
      try {
        await db.entries.update(activeEntryId, {
          confirmed: candidate,
          status: 'identified',
          verified: candidate.verified ?? false,
        });
        setIsCandidateSheetOpen(false);
      } catch (err) {
        console.error('Failed to confirm candidate in Dexie:', err);
      }
    },
    [activeEntryId]
  );

  // Fallback: User saves observation as Unidentified Note
  const handleSaveUnidentified = useCallback(async () => {
    if (!activeEntryId) return;
    try {
      await db.entries.update(activeEntryId, {
        status: 'unidentified',
      });
      setIsCandidateSheetOpen(false);
      setIsRefusalCardOpen(false);
    } catch (err) {
      console.error('Failed to update entry as unidentified:', err);
    }
  }, [activeEntryId]);

  // Retake photo action from candidate drawer or refusal modal
  const handleRetakeFromCandidateOrRefusal = useCallback(() => {
    setCapturedPhoto(null);
    setCandidates([]);
    setIsCandidateSheetOpen(false);
    setIsRefusalCardOpen(false);
    setTimeout(() => {
      walkControlsRef.current?.triggerCapture();
    }, 150);
  }, []);

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
    if (!isActive || !activeWalk?.routeLine || activeWalk.routeLine.length === 0 || !currentPosition) {
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
    [startWalk, currentPosition, appendTrackPoint]
  );

  // Finalize walk session and show summary (per D-14, WALK-03)
  const finalizeWalk = useCallback(async () => {
    const finalDuration = elapsedSeconds;
    const finalDistance = distanceMeters;
    const finalPoints = activeWalk?.trackPoints ? [...activeWalk.trackPoints] : [];

    setCompletedSummary({
      duration: finalDuration,
      distance: finalDistance,
      trackPoints: finalPoints,
    });

    await endWalk();

    // Fit camera to full trail bounding box
    setTimeout(() => {
      walkMapRef.current?.fitTrailBounds();
    }, 200);

    setIsSummaryOpen(true);
  }, [elapsedSeconds, distanceMeters, activeWalk?.trackPoints, endWalk]);

  // Hold-to-confirm End Walk trigger (per D-13)
  const handleEndWalkAttempt = useCallback(() => {
    // Check short walk condition: < 1 minute (60s) or < 25 meters (per D-15)
    if (elapsedSeconds < 60 || distanceMeters < 25) {
      setIsDiscardDialogOpen(true);
    } else {
      finalizeWalk();
    }
  }, [elapsedSeconds, distanceMeters, finalizeWalk]);

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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Privacy Consent Dialog Gate */}
      <ConsentModal />

      {/* Top Left Home Back Link */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          aria-label="Return to Home"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'icon' }),
            'w-10 h-10 rounded-full bg-background/80 backdrop-blur-md border border-border/70 shadow-md hover:bg-background cursor-pointer'
          )}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
      </div>

      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <div className="rounded-full bg-background/80 backdrop-blur-md border border-border/70 shadow-md p-0.5">
          <ThemeToggle />
        </div>
      </div>

      {/* Interactive MapLibre GL Canvas (per D-01, MAP-01, D-13, ROUT-01, D-03) */}
      <WalkMap
        ref={walkMapRef}
        userPosition={currentPosition}
        trackPoints={displayTrackPoints}
        specimenEntries={walkSpecimens}
        suggestedRouteLine={isActive ? (activeWalk?.routeLine || null) : previewRouteLine}
        audioNotes={walkNotes}
        onSpecimenClick={(entry) => router.push(`/entry/${entry.id}`)}
        isWalkActive={isActive}
        className="w-full h-full"
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

      {/* Active Walk Bottom Action Dock (per D-01, D-13) */}
      {isActive && (
        <WalkControls
          ref={walkControlsRef}
          onEndWalk={handleEndWalkAttempt}
          onPhotoSelected={handlePhotoSelected}
          onMicClick={() => setIsVoiceSheetOpen(true)}
        />
      )}

      {/* Pre-walk Loop Discovery & Start Sheet (per D-13, ROUT-01, ROUT-02) */}
      {!isActive && !completedSummary && (
        <RoutePreviewSheet
          currentPosition={currentPosition}
          gpsStatus={gpsStatus}
          onStartFreeWalk={handleStartFreeWalk}
          onStartLoopWalk={handleStartLoopWalk}
          onRoutePreviewChange={setPreviewRouteLine}
        />
      )}

      {/* Post-walk Summary Bottom Sheet (per D-14, D-16, D-03) */}
      {completedSummary && (
        <WalkSummarySheet
          open={isSummaryOpen}
          onOpenChange={(open) => {
            setIsSummaryOpen(open);
            if (!open) handleSummaryDone();
          }}
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
        onConfirmDiscard={handleConfirmDiscard}
        onSaveAnyway={handleSaveAnyway}
      />

      {/* Specimen Photo Capture Preview Sheet (Phase 3) */}
      <CameraCaptureSheet
        open={isCaptureSheetOpen}
        onOpenChange={setIsCaptureSheetOpen}
        photoBlob={capturedPhoto?.photoBlob ?? null}
        thumbnailBlob={capturedPhoto?.thumbnailBlob ?? null}
        isProcessing={isProcessingPhoto || isIdentifying}
        onRetake={handleRetakePhoto}
        onIdentify={handleIdentifyPhoto}
      />

      {/* Candidate Species Picker Drawer (Phase 3) */}
      <CandidatePickerSheet
        open={isCandidateSheetOpen}
        onOpenChange={setIsCandidateSheetOpen}
        candidates={candidates}
        onConfirmCandidate={handleConfirmCandidate}
        onSaveUnidentified={handleSaveUnidentified}
        onRetake={handleRetakeFromCandidateOrRefusal}
      />

      {/* Educational Refusal Card for Inanimate Objects & Humans (Phase 3) */}
      <IdentificationRefusalCard
        open={isRefusalCardOpen}
        onOpenChange={setIsRefusalCardOpen}
        refusalReason={refusalReason}
        onRetake={handleRetakeFromCandidateOrRefusal}
        onSaveUnidentified={handleSaveUnidentified}
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
