'use client';

import React from 'react';
import { formatDistance, formatDuration } from '@/lib/geo';
import { GpsSignalStatus } from '@/hooks/use-geolocation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Navigation2, X } from 'lucide-react';
import type { HuntProgress } from '@/lib/hunt';
import { DailyHuntHudPill } from '@/components/hunt/daily-hunt-hud-pill';

export interface WalkHudProps {
  durationSeconds: number;
  distanceMeters: number;
  gpsStatus: GpsSignalStatus;
  accuracy?: number;
  onRequestLocation?: () => void;
  isResumed?: boolean;
  onDismissResumed?: () => void;
  specimenCount?: number;
  onSpecimenCountClick?: () => void;
  isOffRoute?: boolean;
  onClearRoute?: () => void;
  huntProgress?: HuntProgress | null;
}

export function WalkHud({
  durationSeconds,
  distanceMeters,
  gpsStatus,
  accuracy,
  onRequestLocation,
  isResumed = false,
  onDismissResumed,
  specimenCount = 0,
  onSpecimenCountClick,
  isOffRoute = false,
  onClearRoute,
  huntProgress,
}: WalkHudProps) {
  return (
    <div className="absolute top-4 inset-x-0 z-30 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {/* Top Notification Row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Daily Species Hunt Compact Pill (per D-04, HUNT-01) */}
        {huntProgress && <DailyHuntHudPill progress={huntProgress} />}
        {/* Off-Route HUD Chip (per D-15, ROUT-01, UI-SPEC) */}
        {isOffRoute && (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-amber-500/40 shadow-md text-xs font-medium text-foreground animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Off suggested loop</span>
            {onClearRoute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearRoute}
                className="h-5 px-1.5 py-0 text-[11px] text-[#F35C2B] hover:text-[#F35C2B]/80 hover:bg-transparent font-medium cursor-pointer"
              >
                Clear Route
              </Button>
            )}
          </div>
        )}

        {/* Auto-resumed Toast Pill (per D-04) */}
        {isResumed && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-[#F35C2B]/40 shadow-md text-xs font-medium text-foreground animate-in fade-in slide-in-from-top-2 duration-300">
            <Navigation2 className="w-3.5 h-3.5 text-[#F35C2B] fill-current" />
            <span>Active walk resumed</span>
            {onDismissResumed && (
              <button
                type="button"
                onClick={onDismissResumed}
                aria-label="Dismiss notice"
                className="ml-1 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Specimen Counter Pill (per D-14) */}
        {specimenCount > 0 && (
          <button
            type="button"
            onClick={onSpecimenCountClick}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-emerald-500/30 shadow-md text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <span>🌱</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {specimenCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {specimenCount === 1 ? 'find' : 'finds'}
            </span>
          </button>
        )}
      </div>

      {/* Permission Denied Top Alert Banner (per D-08) */}
      {gpsStatus === 'denied' && (
        <div className="pointer-events-auto w-full max-w-md flex items-center justify-between gap-3 p-3 rounded-xl bg-destructive/15 backdrop-blur-md border border-destructive/30 text-destructive text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium leading-tight">
              Location signal unavailable. Enable GPS permissions in your browser to record your walk.
            </span>
          </div>
          {onRequestLocation && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onRequestLocation}
              className="h-7 px-2.5 text-xs font-semibold shrink-0 cursor-pointer"
            >
              Re-enable Location
            </Button>
          )}
        </div>
      )}

      {/* Floating Glassmorphism Main HUD Bar (per D-01, D-02) */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg min-w-[280px] max-w-sm">
        {/* Timer */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Time
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">
            {formatDuration(durationSeconds)}
          </span>
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] h-6 bg-border/70" />

        {/* Distance */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Distance
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">
            {formatDistance(distanceMeters)}
          </span>
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] h-6 bg-border/70" />

        {/* GPS Signal Status Chip (per D-02, D-05) */}
        <div className="flex items-center">
          {gpsStatus === 'live' && (
            <Badge
              variant="outline"
              className="gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-mono font-medium py-0.5 px-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
          )}

          {gpsStatus === 'searching' && (
            <Badge
              variant="outline"
              className="gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-mono font-medium py-0.5 px-2"
            >
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              Searching
            </Badge>
          )}

          {gpsStatus === 'weak' && (
            <Badge
              variant="outline"
              className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 text-[11px] font-mono font-medium py-0.5 px-2"
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Weak GPS {accuracy ? `±${Math.round(accuracy)}m` : ''}
            </Badge>
          )}

          {gpsStatus === 'denied' && (
            <Badge
              variant="destructive"
              className="text-[11px] font-mono font-medium py-0.5 px-2"
            >
              Denied
            </Badge>
          )}

          {gpsStatus === 'error' && (
            <Badge
              variant="destructive"
              className="text-[11px] font-mono font-medium py-0.5 px-2"
            >
              Error
            </Badge>
          )}

          {gpsStatus === 'idle' && (
            <Badge
              variant="outline"
              className="text-[11px] font-mono text-muted-foreground py-0.5 px-2"
            >
              Idle
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

