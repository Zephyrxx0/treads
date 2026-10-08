'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Compass, Play } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { ConsentModal } from '@/components/consent/consent-modal';
import { useConsent } from '@/hooks/use-consent';
import { useGeolocation, CurrentPosition } from '@/hooks/use-geolocation';
import { useActiveWalk } from '@/hooks/use-active-walk';
import { WalkHud } from '@/components/walk/walk-hud';
import { WalkControls } from '@/components/walk/walk-controls';
import { WalkSummarySheet } from '@/components/walk/walk-summary-sheet';
import { WalkDiscardDialog } from '@/components/walk/walk-discard-dialog';
import type { WalkMapRef } from '@/components/map/walk-map';
import { TrackPoint } from '@/lib/geo';

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
  } = useActiveWalk();

  // Completed walk session metrics for Summary Drawer review
  const [completedSummary, setCompletedSummary] = useState<{
    duration: number;
    distance: number;
    trackPoints: TrackPoint[];
  } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false);

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

  // Start Walk action (per D-03, WALK-01)
  const handleStartWalk = useCallback(async () => {
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
      walkMapRef.current?.recenter();
    } catch (err) {
      console.error('Failed to start walk session:', err);
    }
  }, [startWalk, currentPosition, appendTrackPoint]);

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

      {/* Interactive MapLibre GL Canvas (per D-01, MAP-01) */}
      <WalkMap
        ref={walkMapRef}
        userPosition={currentPosition}
        trackPoints={displayTrackPoints}
        isWalkActive={isActive}
        className="w-full h-full"
      />

      {/* Active Walk Top HUD Pills (per D-01, D-02) */}
      {isActive && (
        <WalkHud
          durationSeconds={elapsedSeconds}
          distanceMeters={distanceMeters}
          gpsStatus={gpsStatus}
          accuracy={currentPosition?.accuracy}
          onRequestLocation={requestCurrentPosition}
          isResumed={isResumed}
          onDismissResumed={dismissResumed}
        />
      )}

      {/* Active Walk Bottom Action Dock (per D-01, D-13) */}
      {isActive && (
        <WalkControls
          onEndWalk={handleEndWalkAttempt}
          onCameraClick={() => {
            // Scaffold placeholder for Phase 3 Camera
          }}
        />
      )}

      {/* Pre-walk Landing Card (per D-03) */}
      {!isActive && !completedSummary && (
        <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm p-5 rounded-3xl bg-background/90 backdrop-blur-md border border-border/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="font-mono text-xs border-[#F35C2B]/30 text-[#F35C2B] bg-[#F35C2B]/10"
              >
                Free Walk
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>
                  {gpsStatus === 'live'
                    ? 'GPS Ready'
                    : gpsStatus === 'searching'
                    ? 'Searching GPS...'
                    : 'GPS Waiting'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Ready to Explore
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tap Start Walk to track your path, record coordinates, and discover local wildlife.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleStartWalk}
              className="w-full h-12 text-sm font-semibold bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Start Walk
            </Button>
          </div>
        </div>
      )}

      {/* Post-walk Summary Bottom Sheet (per D-14, D-16) */}
      {completedSummary && (
        <WalkSummarySheet
          open={isSummaryOpen}
          onOpenChange={(open) => {
            setIsSummaryOpen(open);
            if (!open) handleSummaryDone();
          }}
          durationSeconds={completedSummary.duration}
          distanceMeters={completedSummary.distance}
          speciesCount={0}
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
    </div>
  );
}
