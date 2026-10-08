'use client';

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { calculateTrailBounds } from '@/lib/geo';
import { Navigation, Plus, Minus, Compass } from 'lucide-react';

export interface WalkMapProps {
  userPosition: {
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number;
  } | null;
  trackPoints: Array<{ lat: number; lng: number }>;
  isWalkActive?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export interface WalkMapRef {
  recenter: () => void;
  fitTrailBounds: (customPadding?: { top: number; bottom: number; left: number; right: number }) => void;
  getMapInstance: () => MapLibreMap | null;
}

export const WalkMap = forwardRef<WalkMapRef, WalkMapProps>(function WalkMap(
  {
    userPosition,
    trackPoints,
    isWalkActive = false,
    className = '',
    onFollowChange,
  },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const markerElRef = useRef<HTMLDivElement | null>(null);
  const headingConeElRef = useRef<HTMLDivElement | null>(null);

  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [compassBearing, setCompassBearing] = useState<number>(0);

  // Update follow state and notify parent
  const updateFollowing = useCallback(
    (following: boolean) => {
      setIsFollowing(following);
      onFollowChange?.(following);
    },
    [onFollowChange]
  );

  // Recenter camera to user position
  const handleRecenter = useCallback(() => {
    if (!mapRef.current || !userPosition) return;
    updateFollowing(true);
    mapRef.current.flyTo({
      center: [userPosition.lng, userPosition.lat],
      zoom: Math.max(mapRef.current.getZoom(), 16),
      essential: true,
      duration: 1000,
    });
  }, [userPosition, updateFollowing]);

  // Fit camera bounds to the complete trail
  const handleFitTrailBounds = useCallback(
    (customPadding = { top: 96, bottom: 240, left: 48, right: 48 }) => {
      if (!mapRef.current || trackPoints.length === 0) return;
      const bounds = calculateTrailBounds(trackPoints);
      if (bounds) {
        updateFollowing(false);
        mapRef.current.fitBounds(bounds, {
          padding: customPadding,
          maxZoom: 17,
          duration: 1200,
        });
      }
    },
    [trackPoints, updateFollowing]
  );

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      recenter: handleRecenter,
      fitTrailBounds: handleFitTrailBounds,
      getMapInstance: () => mapRef.current,
    }),
    [handleRecenter, handleFitTrailBounds]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 });
  }, []);

  // Reset rotation to North
  const handleResetNorth = useCallback(() => {
    mapRef.current?.resetNorthPitch({ duration: 500 });
    setCompassBearing(0);
  }, []);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const maplibreglModule = await import('maplibre-gl');
      const maplibregl = (maplibreglModule as any).default || maplibreglModule;

      if (!isMounted || !mapContainerRef.current) return;

      const initialCenter: [number, number] = userPosition
        ? [userPosition.lng, userPosition.lat]
        : [-73.968, 40.785]; // Default fallback

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: initialCenter,
        zoom: 16,
        attributionControl: false,
      });

      // User break-to-pan detection (per D-09)
      const onUserInteraction = () => {
        updateFollowing(false);
      };

      map.on('dragstart', onUserInteraction);
      map.on('rotatestart', onUserInteraction);
      map.on('pitchstart', onUserInteraction);
      map.on('rotate', () => {
        setCompassBearing(Math.round(map.getBearing()));
      });

      map.on('load', () => {
        if (!isMounted) return;

        // 1. Initialize GeoJSON source for trail polyline
        map.addSource('walk-trail', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: trackPoints.map((pt) => [pt.lng, pt.lat]),
            },
          },
        });

        // 2. Add line layer styled with Tangerin Dream terracotta (per D-11, GPS-02)
        map.addLayer({
          id: 'walk-trail-layer',
          type: 'line',
          source: 'walk-trail',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#F35C2B', // Terracotta primary
            'line-width': 4,
            'line-opacity': 0.95,
          },
        });

        // 3. Create custom HTML marker for user location (per D-10)
        const markerEl = document.createElement('div');
        markerEl.className = 'treads-user-marker relative flex items-center justify-center w-8 h-8 pointer-events-none';

        // Continuous radar pulse ring
        const pulseRing = document.createElement('div');
        pulseRing.className = 'absolute inset-0 rounded-full bg-[#F35C2B]/30 animate-ping';
        markerEl.appendChild(pulseRing);

        // Core halo
        const halo = document.createElement('div');
        halo.className = 'absolute w-6 h-6 rounded-full bg-[#F35C2B]/40';
        markerEl.appendChild(halo);

        // Solid terracotta dot
        const dot = document.createElement('div');
        dot.className = 'relative w-3.5 h-3.5 rounded-full bg-[#F35C2B] border-2 border-white shadow-md';
        markerEl.appendChild(dot);

        // Heading directional arrow / cone
        const headingCone = document.createElement('div');
        headingCone.className = 'absolute -top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-[#F35C2B] transition-transform duration-200';
        headingCone.style.display = 'none';
        markerEl.appendChild(headingCone);

        markerElRef.current = markerEl;
        headingConeElRef.current = headingCone;

        const marker = new maplibregl.Marker({
          element: markerEl,
          anchor: 'center',
        });

        if (userPosition) {
          marker.setLngLat([userPosition.lng, userPosition.lat]).addTo(map);
        }

        userMarkerRef.current = marker;
        mapRef.current = map;
        setMapLoaded(true);
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync user marker position & heading
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userPosition) return;

    if (!userMarkerRef.current) {
      // If not yet added, create or attach
      return;
    }

    userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);

    // Update heading cone rotation if available
    if (headingConeElRef.current) {
      if (userPosition.heading != null && !isNaN(userPosition.heading)) {
        headingConeElRef.current.style.display = 'block';
        headingConeElRef.current.style.transform = `rotate(${userPosition.heading}deg)`;
      } else {
        headingConeElRef.current.style.display = 'none';
      }
    }

    // Auto-follow camera if enabled (per D-09)
    if (isFollowing) {
      mapRef.current.easeTo({
        center: [userPosition.lng, userPosition.lat],
        duration: 800,
      });
    }
  }, [userPosition, isFollowing, mapLoaded]);

  // Sync trail polyline GeoJSON data
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const source = mapRef.current.getSource('walk-trail') as GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: trackPoints.map((pt) => [pt.lng, pt.lat]),
        },
      });
    }
  }, [trackPoints, mapLoaded]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-background ${className}`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating thumb-accessible control stack on right margin (per D-12) */}
      <div className="absolute right-4 top-24 z-20 flex flex-col items-center gap-2 select-none">
        {/* Recenter Button (shows active tint if following) */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map to current location"
          className={`flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md border shadow-md transition-all active:scale-95 ${
            isFollowing
              ? 'bg-[#F35C2B] text-white border-[#F35C2B]'
              : 'bg-background/85 text-foreground border-border/80 hover:bg-background'
          }`}
        >
          <Navigation className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
        </button>

        {/* Zoom In (+) */}
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-foreground shadow-md transition-all hover:bg-background active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Zoom Out (-) */}
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-foreground shadow-md transition-all hover:bg-background active:scale-95"
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* North Compass Reset */}
        <button
          type="button"
          onClick={handleResetNorth}
          aria-label="Reset orientation north"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-foreground shadow-md transition-all hover:bg-background active:scale-95"
          style={{ transform: `rotate(${-compassBearing}deg)` }}
        >
          <Compass className="w-5 h-5 text-[#F35C2B]" />
        </button>
      </div>

      {/* Micro-legend chip for trail path (per D-11) */}
      {isWalkActive && trackPoints.length > 0 && (
        <div className="absolute left-4 bottom-28 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/60 shadow-xs text-xs text-muted-foreground">
            <span className="w-3.5 h-1 rounded-full bg-[#F35C2B]" />
            <span className="font-mono text-[11px] font-medium tracking-tight">Approximate path</span>
          </div>
        </div>
      )}
    </div>
  );
});
