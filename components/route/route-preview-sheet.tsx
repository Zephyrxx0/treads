'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  Footprints,
  Loader2,
  Play,
  Route,
  RotateCw,
  AlertCircle,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface RoutePreviewSheetProps {
  currentPosition: { lat: number; lng: number } | null;
  gpsStatus: string;
  onStartFreeWalk: () => void;
  onStartLoopWalk: (routeLine: [number, number][]) => void;
  onRoutePreviewChange?: (routeLine: [number, number][] | null) => void;
  // A.3: Custom stops and endpoints
  customStart?: [number, number] | null;
  customFinish?: [number, number] | null;
  customStops?: [number, number][];
  onSetCustomStart?: (coords: [number, number] | null) => void;
  onSetCustomFinish?: (coords: [number, number] | null) => void;
  onAddCustomStop?: (coords: [number, number]) => void;
  onRemoveCustomStop?: (index: number) => void;
  onClearCustomWaypoints?: () => void;
  mapClickMode?: 'stop' | 'start' | 'finish' | null;
  onSetMapClickMode?: (mode: 'stop' | 'start' | 'finish' | null) => void;
  /** `floating` is the original bottom card over the map; `panel` flows in a layout column. */
  layout?: 'floating' | 'panel';
  /** Panel layout only: shown in the "rest of the options" box while in free-walk mode. */
  extras?: React.ReactNode;
}

interface GeneratedRoute {
  coordinates: [number, number][];
  distanceMeters: number;
  fallback?: boolean;
  message?: string;
  seed?: number;
}

export function RoutePreviewSheet({
  currentPosition,
  gpsStatus,
  onStartFreeWalk,
  onStartLoopWalk,
  onRoutePreviewChange,
  customStart = null,
  customFinish = null,
  customStops = [],
  onSetCustomStart,
  onSetCustomFinish,
  onAddCustomStop,
  onRemoveCustomStop,
  onClearCustomWaypoints,
  mapClickMode = null,
  onSetMapClickMode,
  layout = 'floating',
  extras,
}: RoutePreviewSheetProps) {
  const [walkMode, setWalkMode] = useState<'free' | 'loop'>('free');
  const [selectedDistance, setSelectedDistance] = useState<number>(2000);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [isFallbackRoute, setIsFallbackRoute] = useState<boolean>(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // A.2: Route history and cycling
  const [routeHistory, setRouteHistory] = useState<GeneratedRoute[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // A.3: Custom waypoints panel collapse state
  const [isWaypointsOpen, setIsWaypointsOpen] = useState<boolean>(false);

  // Fetch loop route from /api/route (A.1: points=3 for least turns, A.2: controlled calls)
  const fetchLoopRoute = useCallback(
    async (options?: { forceNewSeed?: boolean; customDist?: number }) => {
      if (!currentPosition) return;
      setIsLoadingRoute(true);
      setFallbackMessage(null);

      const dist = options?.customDist ?? selectedDistance;
      const seed = options?.forceNewSeed
        ? Math.floor(Math.random() * 100000)
        : Math.floor(Math.random() * 10000);

      try {
        const res = await fetch('/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lng: currentPosition.lng,
            lat: currentPosition.lat,
            distanceMeters: dist,
            seed,
            points: 3, // A.1: 3 vertices for least turns (triangle polygon)
            stops: customStops,
            start: customStart,
            finish: customFinish,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.coordinates) && data.coordinates.length > 0) {
            const newRoute: GeneratedRoute = {
              coordinates: data.coordinates as [number, number][],
              distanceMeters: Number(data.distanceMeters) || dist,
              fallback: Boolean(data.fallback),
              message: data.message,
              seed,
            };

            setRouteHistory((prev) => {
              const updated = [...prev, newRoute];
              setHistoryIndex(updated.length - 1);
              return updated;
            });

            setRouteCoordinates(newRoute.coordinates);
            setIsFallbackRoute(Boolean(newRoute.fallback));
            if (newRoute.fallback) {
              setFallbackMessage(
                newRoute.message ||
                  'OpenRouteService key not configured or offline. Showing a synthetic local loop for preview.',
              );
            }
            onRoutePreviewChange?.(newRoute.coordinates);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch pedestrian loop:', err);
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [
      currentPosition,
      selectedDistance,
      customStops,
      customStart,
      customFinish,
      onRoutePreviewChange,
    ],
  );

  // A.2: Prevent re-fetching on every GPS tick
  const prevModeRef = useRef<'free' | 'loop'>(walkMode);
  const prevDistanceRef = useRef<number>(selectedDistance);
  const prevStopsLenRef = useRef<number>(customStops.length);
  const hasLoadedInitialRouteRef = useRef<boolean>(false);

  useEffect(() => {
    if (walkMode === 'loop' && currentPosition) {
      const modeChanged = prevModeRef.current !== 'loop';
      const distanceChanged = prevDistanceRef.current !== selectedDistance;
      const stopsChanged = prevStopsLenRef.current !== customStops.length;

      prevModeRef.current = walkMode;
      prevDistanceRef.current = selectedDistance;
      prevStopsLenRef.current = customStops.length;

      if (modeChanged || distanceChanged || stopsChanged || !hasLoadedInitialRouteRef.current) {
        hasLoadedInitialRouteRef.current = true;
        fetchLoopRoute();
      }
    } else {
      prevModeRef.current = walkMode;
      if (walkMode === 'free') {
        setRouteCoordinates(null);
        setIsFallbackRoute(false);
        setFallbackMessage(null);
        setRouteHistory([]);
        setHistoryIndex(0);
        hasLoadedInitialRouteRef.current = false;
        onRoutePreviewChange?.(null);
        onSetMapClickMode?.(null);
      }
    }
  }, [
    walkMode,
    selectedDistance,
    customStops.length,
    currentPosition,
    fetchLoopRoute,
    onRoutePreviewChange,
    onSetMapClickMode,
  ]);

  // A.2: Previous / Cycle between all generated routes in memory
  const handleCyclePrevious = () => {
    if (routeHistory.length <= 1) return;
    const prevIdx = (historyIndex - 1 + routeHistory.length) % routeHistory.length;
    setHistoryIndex(prevIdx);
    const target = routeHistory[prevIdx];
    setRouteCoordinates(target.coordinates);
    setIsFallbackRoute(Boolean(target.fallback));
    onRoutePreviewChange?.(target.coordinates);
  };

  const handleCycleNext = () => {
    if (routeHistory.length <= 1) return;
    const nextIdx = (historyIndex + 1) % routeHistory.length;
    setHistoryIndex(nextIdx);
    const target = routeHistory[nextIdx];
    setRouteCoordinates(target.coordinates);
    setIsFallbackRoute(Boolean(target.fallback));
    onRoutePreviewChange?.(target.coordinates);
  };

  // A.2: Generate a fresh alternative route (with a new seed & least turns)
  const handleRefreshNewRoute = () => {
    fetchLoopRoute({ forceNewSeed: true });
  };

  const handleModeChange = (mode: 'free' | 'loop') => {
    setWalkMode(mode);
  };

  const handleDistanceSelect = (dist: number) => {
    setSelectedDistance(dist);
    fetchLoopRoute({ customDist: dist });
  };

  const currentActiveDistance =
    routeCoordinates && routeHistory[historyIndex]
      ? Math.round(routeHistory[historyIndex].distanceMeters)
      : selectedDistance;

  const modePicker = (
    <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border border-border/50 text-xs font-semibold">
      <button
        type="button"
        onClick={() => handleModeChange('free')}
        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
          walkMode === 'free'
            ? 'bg-background text-foreground shadow-xs font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Footprints className="w-3.5 h-3.5 text-primary" />
        <span>Free Walk</span>
      </button>
      <button
        type="button"
        onClick={() => handleModeChange('loop')}
        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
          walkMode === 'loop'
            ? 'bg-background text-foreground shadow-xs font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Route className="w-3.5 h-3.5 text-primary" />
        <span>Loop Route</span>
      </button>
    </div>
  );

  const statusRow = (
    <div className="flex items-center justify-between">
      <Badge
        variant="outline"
        className="font-mono text-xs border-primary/30 text-primary bg-primary/10"
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
  );

  const freeIntro = (
    <div className="space-y-1">
      <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
        Ready to Explore
      </h2>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Track your path freely, record observation coordinates, and discover local wildlife at your
        own pace.
      </p>
    </div>
  );

  const loopHeading = (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Suggested Loop
        </h2>
        {isLoadingRoute && (
          <span className="flex items-center text-xs font-normal text-muted-foreground font-mono">
            <Loader2 className="w-3 h-3 animate-spin mr-1 text-primary" />
            Routing...
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Clean, low-turn pedestrian loop starting and ending where you stand.
      </p>
    </div>
  );

  const loopOptions = (
    <>
      {/* Distance Pills (1km, 2km, 3km) */}
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
                  ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <span className={isSelected ? 'text-primary font-bold' : ''}>{label}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{time}</span>
            </button>
          );
        })}
      </div>

      {/* A.2: Route History Navigator & Refresh Button (No Auto-updates) */}
      <div className="flex items-center justify-between gap-1.5 p-2 rounded-2xl bg-muted/40 border border-border/60">
        <div className="flex items-center gap-1">
          {/* Previous Route button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={routeHistory.length <= 1 || isLoadingRoute}
            onClick={handleCyclePrevious}
            className="h-8 px-2.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-30"
            title="Cycle to previous generated route"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">
              {routeHistory.length > 0 ? `${historyIndex + 1}/${routeHistory.length}` : '1/1'}
            </span>
          </Button>

          {/* Next Route button */}
          {routeHistory.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoadingRoute}
              onClick={handleCycleNext}
              className="h-8 px-2 rounded-xl text-xs flex items-center cursor-pointer"
              title="Cycle to next generated route"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Route distance summary */}
        <div className="text-[11px] font-mono font-medium text-muted-foreground">
          {(currentActiveDistance / 1000).toFixed(1)} km
        </div>

        {/* Refresh (New Alternative Route with least turns) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoadingRoute}
          onClick={handleRefreshNewRoute}
          className="h-8 px-2.5 rounded-xl text-xs flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
          title="Generate new alternative loop (least turns)"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoadingRoute ? 'animate-spin' : ''}`} />
          <span className="font-semibold text-[11px]">New Route</span>
        </Button>
      </div>

      {/* A.3: Custom Stops & Waypoints Collapsible Section */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsWaypointsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Custom Stops & Waypoints</span>
            {customStops.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
                {customStops.length}
              </Badge>
            )}
          </div>
          {isWaypointsOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {isWaypointsOpen && (
          <div className="p-3 pt-0 space-y-2.5 border-t border-border/40 text-xs">
            {/* Tap Map Button */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant={mapClickMode === 'stop' ? 'default' : 'outline'}
                onClick={() => onSetMapClickMode?.(mapClickMode === 'stop' ? null : 'stop')}
                className={`h-8 flex-1 text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  mapClickMode === 'stop' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
                }`}
              >
                {mapClickMode === 'stop' ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Tap Mode</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tap Map to Add Stop</span>
                  </>
                )}
              </Button>

              {customStops.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onClearCustomWaypoints}
                  className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                  title="Clear all stops"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Active Stops List */}
            {customStops.length > 0 ? (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {customStops.map((stop, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-background border border-border/60 text-[11px]"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground">
                        {stop[1].toFixed(4)}, {stop[0].toFixed(4)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCustomStop?.(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5 cursor-pointer"
                      title="Remove stop"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-tight">
                Default route starts and loops to your current position. Tap &quot;Tap Map to Add
                Stop&quot; to customize waypoints along your path.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ORS Offline / Synthetic Fallback Notice */}
      {isFallbackRoute && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-0.5 leading-tight">
            <p className="font-semibold">Pedestrian routing notice</p>
            <p className="text-[11px] text-muted-foreground">
              {fallbackMessage ||
                'OpenRouteService key offline. Showing a synthetic local loop for preview.'}
            </p>
          </div>
        </div>
      )}
    </>
  );

  const cta = (
    <>
      {walkMode === 'free' ? (
        <Button
          type="button"
          onClick={onStartFreeWalk}
          className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
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
            className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoadingRoute ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Routing with least turns...
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
    </>
  );

  if (layout === 'panel') {
    // Side panel (desktop) / stacked section under the map (mobile):
    // a compact "config box" on top, "the rest of the options" below.
    return (
      // Upright: plain stacked cards, the page scrolls. Landscape: the column fills the height; on
      // tall screens the lower card scrolls on its own, on short ones (phones) the whole column does.
      <div className="flex flex-col gap-3 landscape:h-full landscape:min-h-0 landscape:overflow-y-auto landscape:tall:overflow-visible">
        <div className="shrink-0 space-y-3.5 rounded-3xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md">
          {modePicker}
          {statusRow}
          {walkMode === 'free' ? freeIntro : loopHeading}
          {cta}
        </div>
        {walkMode === 'loop' ? (
          <div className="space-y-3 rounded-3xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md landscape:tall:min-h-0 landscape:tall:flex-1 landscape:tall:overflow-y-auto">
            {loopOptions}
          </div>
        ) : (
          extras && (
            <div className="space-y-3 rounded-3xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md landscape:tall:min-h-0 landscape:tall:flex-1 landscape:tall:overflow-y-auto">
              {extras}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm p-5 rounded-3xl bg-background/90 backdrop-blur-md border border-border/80 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto">
        {modePicker}
        {statusRow}
        {walkMode === 'free' ? (
          freeIntro
        ) : (
          <div className="space-y-3">
            {loopHeading}
            {loopOptions}
          </div>
        )}
        {cta}
      </div>
    </div>
  );
}
