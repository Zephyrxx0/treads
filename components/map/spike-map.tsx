'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, RotateCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface SpikeMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function SpikeMap({
  initialCenter = [-73.968, 40.785],
  initialZoom = 13,
}: SpikeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [loadLatencyMs, setLoadLatencyMs] = useState<number | null>(null);
  const [serverPingMs, setServerPingMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tileErrorCount, setTileErrorCount] = useState<number>(0);

  const pingServer = useCallback(async () => {
    try {
      const res = await fetch('/api/spike/map');
      if (res.ok) {
        const data = await res.json();
        setServerPingMs(data.latencyMs ?? null);
      }
    } catch {
      // Non-blocking telemetry
    }
  }, []);

  const loadMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    setMapStatus('loading');
    setErrorMessage(null);
    setTileErrorCount(0);
    setLoadLatencyMs(null);

    const startTime = performance.now();

    try {
      const maplibreglModule = await import('maplibre-gl');
      const maplibregl = (maplibreglModule as any).default || maplibreglModule;

      if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
        maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
      }

      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const initialStyle = isDark ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/liberty';

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: {
          compact: true,
        },
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        const elapsed = Math.round(performance.now() - startTime);
        setLoadLatencyMs(elapsed);
        setMapStatus('loaded');
      });

      map.on('error', (e: any) => {
        console.warn('[MapLibre Warning/Error]', e);
        if (e.error?.message?.includes('404') || e.error?.message?.includes('tile')) {
          setTileErrorCount((prev) => prev + 1);
        } else if (!mapRef.current?.loaded()) {
          setMapStatus('error');
          setErrorMessage(e.error?.message || 'Failed to load map style');
        }
      });

      mapRef.current = map;
    } catch (err: any) {
      console.error('[SpikeMap Init Error]', err);
      setMapStatus('error');
      setErrorMessage(err?.message || 'Could not instantiate MapLibre');
    }
  }, [initialCenter, initialZoom]);

  useEffect(() => {
    pingServer();
    loadMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loadMap, pingServer]);

  return (
    <Card className="flex flex-col h-full border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <CardTitle className="text-base font-semibold">OpenFreeMap Style Loading</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              pingServer();
              loadMap();
            }}
            disabled={mapStatus === 'loading'}
            className="h-8 gap-1 text-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${mapStatus === 'loading' ? 'animate-spin' : ''}`} />
            Reload Map
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-3 p-4 pt-0">
        {/* Telemetry Bar */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-muted/60 text-xs">
          {mapStatus === 'loading' && (
            <Badge variant="outline" className="gap-1 bg-background text-muted-foreground border-amber-500/40">
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              Loading Liberty Style...
            </Badge>
          )}

          {mapStatus === 'loaded' && (
            <Badge variant="default" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              OpenFreeMap Connected ({loadLatencyMs}ms)
            </Badge>
          )}

          {mapStatus === 'error' && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Style Load Error
            </Badge>
          )}

          {serverPingMs !== null && (
            <Badge variant="secondary" className="font-mono text-[11px]">
              Server Ping: {serverPingMs}ms
            </Badge>
          )}

          {tileErrorCount > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Tile warnings: {tileErrorCount}
            </Badge>
          )}

          <span className="ml-auto text-[11px] text-muted-foreground">
            Liberty Vector Style
          </span>
        </div>

        {/* Error Callout if any */}
        {errorMessage && (
          <div className="p-3 text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20">
            {errorMessage}
          </div>
        )}

        {/* Map Canvas */}
        <div className="relative w-full flex-1 min-h-[360px] rounded-lg overflow-hidden border border-border/60 bg-muted/20">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}
