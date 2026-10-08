'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Compass, Footprints, Loader2, Play, Route, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface RoutePreviewSheetProps {
  currentPosition: { lat: number; lng: number } | null;
  gpsStatus: string;
  onStartFreeWalk: () => void;
  onStartLoopWalk: (routeLine: [number, number][]) => void;
  onRoutePreviewChange?: (routeLine: [number, number][] | null) => void;
}

export function RoutePreviewSheet({
  currentPosition,
  gpsStatus,
  onStartFreeWalk,
  onStartLoopWalk,
  onRoutePreviewChange,
}: RoutePreviewSheetProps) {
  const [walkMode, setWalkMode] = useState<'free' | 'loop'>('free');
  const [selectedDistance, setSelectedDistance] = useState<number>(2000);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [isFallbackRoute, setIsFallbackRoute] = useState<boolean>(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // Fetch loop route from /api/route
  const fetchLoopRoute = useCallback(
    async (distanceMeters: number) => {
      if (!currentPosition) return;
      setIsLoadingRoute(true);
      setFallbackMessage(null);

      try {
        const res = await fetch('/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lng: currentPosition.lng,
            lat: currentPosition.lat,
            distanceMeters,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.coordinates) && data.coordinates.length > 0) {
            setRouteCoordinates(data.coordinates);
            setIsFallbackRoute(Boolean(data.fallback));
            if (data.fallback) {
              setFallbackMessage(
                data.message ||
                  'OpenRouteService key not configured or offline. Showing a synthetic local loop for preview. You can start a free-form walk anytime.'
              );
            }
            onRoutePreviewChange?.(data.coordinates);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch pedestrian loop:', err);
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [currentPosition, onRoutePreviewChange]
  );

  // Fetch or clear route preview when mode or distance changes
  useEffect(() => {
    if (walkMode === 'loop' && currentPosition) {
      fetchLoopRoute(selectedDistance);
    } else {
      setRouteCoordinates(null);
      setIsFallbackRoute(false);
      setFallbackMessage(null);
      onRoutePreviewChange?.(null);
    }
  }, [walkMode, selectedDistance, currentPosition, fetchLoopRoute, onRoutePreviewChange]);

  const handleModeChange = (mode: 'free' | 'loop') => {
    setWalkMode(mode);
  };

  const handleDistanceSelect = (dist: number) => {
    setSelectedDistance(dist);
  };

  return (
    <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm p-5 rounded-3xl bg-background/90 backdrop-blur-md border border-border/80 shadow-2xl space-y-4">
        {/* Mode Segmented Picker (Free Walk vs Loop Route per D-13, ROUT-01) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border border-border/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('free')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              walkMode === 'free'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-[#F35C2B]" />
            <span>Free Walk</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('loop')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              walkMode === 'loop'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-[#F35C2B]" />
            <span>Loop Route</span>
          </button>
        </div>

        {/* GPS Status & Header */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="font-mono text-xs border-[#F35C2B]/30 text-[#F35C2B] bg-[#F35C2B]/10"
          >
            {walkMode === 'free' ? 'Free Walk' : 'Pedestrian Loop'}
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

        {/* Content based on Mode */}
        {walkMode === 'free' ? (
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
              Ready to Explore
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track your path freely, record observation coordinates, and discover local wildlife at your own pace.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans flex items-center justify-between">
                <span>Suggested Loop</span>
                {isLoadingRoute && (
                  <span className="flex items-center text-xs font-normal text-muted-foreground font-mono">
                    <Loader2 className="w-3 h-3 animate-spin mr-1 text-[#F35C2B]" />
                    Calculating...
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose a round-trip pedestrian distance starting and ending right where you stand.
              </p>
            </div>

            {/* Distance Pills (1km, 2km, 3km per D-13) */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { dist: 1000, label: '1 km', time: '~15 min' },
                { dist: 2000, label: '2 km', time: '~30 min' },
                { dist: 3000, label: '3 km', time: '~45 min' },
              ].map(({ dist, label, time }) => {
                const isSelected = selectedDistance === dist;
                return (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => handleDistanceSelect(dist)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#F35C2B] bg-[#F35C2B]/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span className={isSelected ? 'text-[#F35C2B] font-bold' : ''}>{label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{time}</span>
                  </button>
                );
              })}
            </div>

            {/* ORS Offline / Synthetic Fallback Notice (per D-16, ROUT-02) */}
            {isFallbackRoute && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-0.5 leading-tight">
                  <p className="font-semibold">Pedestrian routing unavailable</p>
                  <p className="text-[11px] text-muted-foreground">
                    OpenRouteService key not configured or offline. Showing a synthetic local loop for preview.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary CTA Button */}
        {walkMode === 'free' ? (
          <Button
            type="button"
            onClick={onStartFreeWalk}
            className="w-full h-12 text-sm font-semibold bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 mr-2 fill-current" />
            Start Free Walk
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              disabled={isLoadingRoute || !routeCoordinates}
              onClick={() => {
                if (routeCoordinates) {
                  onStartLoopWalk(routeCoordinates);
                }
              }}
              className="w-full h-12 text-sm font-semibold bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoadingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating pedestrian loop...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Start Loop Walk
                </>
              )}
            </Button>

            {isFallbackRoute && (
              <Button
                type="button"
                variant="ghost"
                onClick={onStartFreeWalk}
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Or start a Free Walk instead
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
