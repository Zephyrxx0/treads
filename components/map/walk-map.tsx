'use client';

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { calculateTrailBounds } from '@/lib/geo';
import { Entry, Note } from '@/lib/db';
import { Navigation, Plus, Minus, Compass } from 'lucide-react';

export interface WalkMapProps {
  userPosition: {
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number;
  } | null;
  trackPoints: Array<{ lat: number; lng: number }>;
  specimenEntries?: Entry[];
  suggestedRouteLine?: [number, number][] | null;
  audioNotes?: Note[];
  isWalkActive?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
  onSpecimenClick?: (entry: Entry) => void;
  onAudioNoteClick?: (note: Note) => void;
  // A.3 Custom stops and endpoints
  customStart?: [number, number] | null;
  customFinish?: [number, number] | null;
  customStops?: [number, number][];
  onMapClick?: (coords: [number, number]) => void;
  isPlacingStop?: boolean;
  onRemoveStop?: (index: number) => void;
}

export interface WalkMapRef {
  recenter: () => void;
  fitTrailBounds: (customPadding?: { top: number; bottom: number; left: number; right: number }) => void;
  fitRouteBounds: (customPadding?: { top: number; bottom: number; left: number; right: number }) => void;
  getMapInstance: () => MapLibreMap | null;
  resize: () => void;
}

export const WalkMap = forwardRef<WalkMapRef, WalkMapProps>(function WalkMap(
  {
    userPosition,
    trackPoints,
    specimenEntries = [],
    suggestedRouteLine = null,
    audioNotes = [],
    isWalkActive = false,
    className = '',
    onFollowChange,
    onSpecimenClick,
    onAudioNoteClick,
    customStart = null,
    customFinish = null,
    customStops = [],
    onMapClick,
    isPlacingStop = false,
    onRemoveStop,
  },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const specimenMarkersRef = useRef<MapLibreMarker[]>([]);
  const audioMarkersRef = useRef<MapLibreMarker[]>([]);
  const waypointMarkersRef = useRef<MapLibreMarker[]>([]);
  const trailEndpointMarkersRef = useRef<MapLibreMarker[]>([]);
  const markerElRef = useRef<HTMLDivElement | null>(null);
  const headingConeElRef = useRef<HTMLDivElement | null>(null);
  const suggestedRouteLineRef = useRef(suggestedRouteLine);
  suggestedRouteLineRef.current = suggestedRouteLine;
  const trackPointsRef = useRef(trackPoints);
  trackPointsRef.current = trackPoints;

  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [compassBearing, setCompassBearing] = useState<number>(0);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

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

  // Fit camera bounds to the complete trail or specimen/audio coordinates
  const handleFitTrailBounds = useCallback(
    (customPadding = { top: 72, bottom: 56, left: 48, right: 48 }) => {
      if (!mapRef.current) return;
      const pts = trackPointsRef.current || trackPoints;

      if (pts && pts.length > 0) {
        if (pts.length === 1 || pts.every((p) => p.lat === pts[0].lat && p.lng === pts[0].lng)) {
          updateFollowing(false);
          mapRef.current.flyTo({
            center: [pts[0].lng, pts[0].lat],
            zoom: 16,
            duration: 1000,
          });
          return;
        }
        const bounds = calculateTrailBounds(pts);
        if (bounds) {
          updateFollowing(false);
          mapRef.current.fitBounds(bounds, {
            padding: customPadding,
            maxZoom: 17,
            duration: 1200,
          });
        }
        return;
      }

      // Fallback if trackPoints is empty: collect points from specimens and notes
      const fallbackPts: Array<{ lat: number; lng: number }> = [];
      specimenEntries.forEach((e) => {
        if (e.lat && e.lng) fallbackPts.push({ lat: e.lat, lng: e.lng });
      });
      audioNotes.forEach((n) => {
        if (n.lat != null && n.lng != null) fallbackPts.push({ lat: n.lat, lng: n.lng });
      });
      if (suggestedRouteLine && suggestedRouteLine.length > 0) {
        suggestedRouteLine.forEach(([lng, lat]) => fallbackPts.push({ lat, lng }));
      }

      if (fallbackPts.length > 0) {
        if (fallbackPts.length === 1 || fallbackPts.every((p) => p.lat === fallbackPts[0].lat && p.lng === fallbackPts[0].lng)) {
          updateFollowing(false);
          mapRef.current.flyTo({
            center: [fallbackPts[0].lng, fallbackPts[0].lat],
            zoom: 16,
            duration: 1000,
          });
          return;
        }
        const bounds = calculateTrailBounds(fallbackPts);
        if (bounds) {
          updateFollowing(false);
          mapRef.current.fitBounds(bounds, {
            padding: customPadding,
            maxZoom: 17,
            duration: 1200,
          });
        }
      }
    },
    [trackPoints, specimenEntries, audioNotes, suggestedRouteLine, updateFollowing]
  );

  // Fit camera bounds to suggested pedestrian loop route
  const handleFitRouteBounds = useCallback(
    (customPadding = { top: 72, bottom: 56, left: 48, right: 48 }) => {
      if (!mapRef.current || !suggestedRouteLine || suggestedRouteLine.length === 0) return;
      const points = suggestedRouteLine.map((c) => ({ lat: c[1], lng: c[0] }));
      const bounds = calculateTrailBounds(points);
      if (bounds) {
        updateFollowing(false);
        mapRef.current.fitBounds(bounds, {
          padding: customPadding,
          maxZoom: 17,
          duration: 1200,
        });
      }
    },
    [suggestedRouteLine, updateFollowing]
  );

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      recenter: handleRecenter,
      fitTrailBounds: handleFitTrailBounds,
      fitRouteBounds: handleFitRouteBounds,
      getMapInstance: () => mapRef.current,
      resize: () => mapRef.current?.resize(),
    }),
    [handleRecenter, handleFitTrailBounds, handleFitRouteBounds]
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
      try {
        const maplibreglModule = await import('maplibre-gl');
        const maplibregl = (maplibreglModule as any).default || maplibreglModule;

        // Try setting worker URL if available, but wrap defensively
        if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
          try {
            // Check if worker file exists, or fallback gracefully
            maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
          } catch (workerErr) {
            console.warn('MapLibre worker setup notice:', workerErr);
          }
        }

        const determineInitialCenter = (): [number, number] => {
          if (userPosition) return [userPosition.lng, userPosition.lat];
          if (trackPoints.length > 0) return [trackPoints[0].lng, trackPoints[0].lat];
          const spec = specimenEntries.find((s) => s.lat && s.lng);
          if (spec) return [spec.lng, spec.lat];
          const note = audioNotes.find((n) => n.lat != null && n.lng != null);
          if (note && note.lng != null && note.lat != null) return [note.lng, note.lat];
          if (suggestedRouteLine && suggestedRouteLine.length > 0) return [suggestedRouteLine[0][0], suggestedRouteLine[0][1]];
          return [-73.968, 40.785];
        };

        const initialCenter: [number, number] = determineInitialCenter();

        const isDark =
          typeof document !== 'undefined' &&
          document.documentElement.classList.contains('dark');
        const initialStyle = isDark
          ? '/styles/dark-liberty.json'
          : '/styles/light-liberty.json';

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: initialStyle,
          center: initialCenter,
          zoom: 16,
          attributionControl: false,
          failIfMajorPerformanceCaveat: false,
        });

        // Resolve missing sprite icons gracefully to prevent console error spam
        map.on('styleimagemissing', (e: any) => {
          const id = e.id;
          if (!map.hasImage(id)) {
            map.addImage(id, {
              width: 1,
              height: 1,
              data: new Uint8Array([0, 0, 0, 0]),
            });
          }
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

        const onMapReady = () => {
          if (!isMounted) return;

          try {
            const isDarkNow =
              typeof document !== 'undefined' &&
              document.documentElement.classList.contains('dark');
            const routeLineColor = isDarkNow ? '#34d399' : '#2f6b47';
            const trailLineColor = isDarkNow ? '#22c55e' : '#2f6b47';

            // 0. Initialize or update GeoJSON source for suggested loop route line (per ROUT-01, D-14)
            const currentRouteLine = suggestedRouteLineRef.current || [];
            if (!map.getSource('suggested-route')) {
              map.addSource('suggested-route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: currentRouteLine,
                  },
                },
              });
            } else {
              const src = map.getSource('suggested-route') as any;
              if (src?.setData) {
                src.setData({
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: currentRouteLine,
                  },
                });
              }
            }

            // Add dashed suggested line layer (per D-14)
            if (!map.getLayer('walk-route-line')) {
              map.addLayer({
                id: 'walk-route-line',
                type: 'line',
                source: 'suggested-route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': routeLineColor,
                  'line-width': 4,
                  'line-opacity': 0.75,
                  'line-dasharray': [2, 2],
                },
              });
            } else {
              map.setPaintProperty('walk-route-line', 'line-color', routeLineColor);
            }

            // 1. Initialize or update GeoJSON source for trail polyline
            const currentTrack = (trackPointsRef.current || []).map((pt) => [pt.lng, pt.lat]);
            if (!map.getSource('walk-trail')) {
              map.addSource('walk-trail', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: currentTrack,
                  },
                },
              });
            } else {
              const src = map.getSource('walk-trail') as any;
              if (src?.setData) {
                src.setData({
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: currentTrack,
                  },
                });
              }
            }

            // 2. Add line layer styled with moss/emerald (per D-11, GPS-02)
            if (!map.getLayer('walk-trail-layer')) {
              map.addLayer({
                id: 'walk-trail-layer',
                type: 'line',
                source: 'walk-trail',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': trailLineColor,
                  'line-width': 4,
                  'line-opacity': 0.95,
                },
              });
            } else {
              map.setPaintProperty('walk-trail-layer', 'line-color', trailLineColor);
            }

            // 3. Create custom HTML marker for user location (per D-10)
            if (!userMarkerRef.current) {
              const markerEl = document.createElement('div');
              markerEl.className = 'treads-user-marker relative flex items-center justify-center w-8 h-8 pointer-events-none';

              // Continuous radar pulse ring
              const pulseRing = document.createElement('div');
              pulseRing.className = 'absolute inset-0 rounded-full bg-primary/30 animate-ping';
              markerEl.appendChild(pulseRing);

              // Core halo
              const halo = document.createElement('div');
              halo.className = 'absolute w-6 h-6 rounded-full bg-primary/40';
              markerEl.appendChild(halo);

              // Solid terracotta dot
              const dot = document.createElement('div');
              dot.className = 'relative w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md';
              markerEl.appendChild(dot);

              // Heading directional arrow / cone
              const headingCone = document.createElement('div');
              headingCone.className = 'absolute -top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-primary transition-transform duration-200';
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
            }
          } catch (e) {
            console.warn('Error setting up map layers:', e);
          }

          mapRef.current = map;
          setMapLoaded(true);
          if (!isWalkActive) {
            setTimeout(() => {
              handleFitTrailBounds();
            }, 150);
          }
        };

        map.on('load', onMapReady);
        map.on('style.load', onMapReady);

        // Fallback: If style or tile load is slow or worker stalls, ensure map controls are usable
        setTimeout(() => {
          if (isMounted && map && !mapRef.current) {
            mapRef.current = map;
            setMapLoaded(true);
            if (!isWalkActive) {
              handleFitTrailBounds();
            }
          }
        }, 3000);
      } catch (err) {
        console.error('Failed to initialize map:', err);
        if (isMounted) {
          setMapLoaded(true);
        }
      }
    }

    initMap();

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapRef.current?.resize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (specimenMarkersRef.current) {
        specimenMarkersRef.current.forEach((m) => m.remove());
        specimenMarkersRef.current = [];
      }
      if (audioMarkersRef.current) {
        audioMarkersRef.current.forEach((m) => m.remove());
        audioMarkersRef.current = [];
      }
      if (waypointMarkersRef.current) {
        waypointMarkersRef.current.forEach((m) => m.remove());
        waypointMarkersRef.current = [];
      }
      if (trailEndpointMarkersRef.current) {
        trailEndpointMarkersRef.current.forEach((m) => m.remove());
        trailEndpointMarkersRef.current = [];
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Listen for theme changes across document and synchronize map style (A.4)
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const nextTheme = isDark ? 'dark' : 'light';
      setMapTheme((prev) => (prev !== nextTheme ? nextTheme : prev));
    };

    window.addEventListener('themechange', handleThemeChange);

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  // Update MapLibre style on theme toggle (A.4)
  useEffect(() => {
    if (!mapRef.current) return;
    const targetStyle =
      mapTheme === 'dark'
        ? '/styles/dark-liberty.json'
        : '/styles/light-liberty.json';

    mapRef.current.setStyle(targetStyle);
  }, [mapTheme]);

  // Sync custom waypoint pins (Start, Stops, Finish) on map (A.3)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // Clear previous waypoint markers
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];

    import('maplibre-gl').then((mod) => {
      const maplibregl = (mod as any).default || mod;
      if (!mapRef.current) return;

      // 1. Custom Start marker (if provided)
      if (customStart) {
        const startEl = document.createElement('div');
        startEl.className = 'treads-waypoint-start treads-pin-interactive w-7 h-7 cursor-pointer';
        startEl.title = 'Custom Start Location';
        const startInner = document.createElement('div');
        startInner.className =
          'treads-pin-inner rounded-full bg-emerald-600 text-white font-mono text-xs font-bold shadow-lg border-2 border-white';
        startInner.textContent = 'S';
        startEl.appendChild(startInner);
        const startMarker = new maplibregl.Marker({ element: startEl, anchor: 'center' })
          .setLngLat(customStart)
          .addTo(map);
        waypointMarkersRef.current.push(startMarker);
      }

      // 2. Custom Stops markers (1, 2, 3...)
      if (customStops && customStops.length > 0) {
        customStops.forEach((stop, idx) => {
          const stopEl = document.createElement('div');
          stopEl.className = 'treads-waypoint-stop treads-pin-interactive w-7 h-7 cursor-pointer';
          stopEl.title = `Stop ${idx + 1} (tap to remove)`;
          const stopInner = document.createElement('div');
          stopInner.className =
            'treads-pin-inner rounded-full bg-amber-500 text-white font-mono text-xs font-bold shadow-lg border-2 border-white';
          stopInner.textContent = String(idx + 1);
          stopEl.appendChild(stopInner);
          stopEl.onclick = (e) => {
            e.stopPropagation();
            onRemoveStop?.(idx);
          };
          const stopMarker = new maplibregl.Marker({ element: stopEl, anchor: 'center' })
            .setLngLat(stop)
            .addTo(map);
          waypointMarkersRef.current.push(stopMarker);
        });
      }

      // 3. Custom Finish marker (if provided and different from start)
      if (
        customFinish &&
        (!customStart || customFinish[0] !== customStart[0] || customFinish[1] !== customStart[1])
      ) {
        const finishEl = document.createElement('div');
        finishEl.className = 'treads-waypoint-finish treads-pin-interactive w-7 h-7 cursor-pointer';
        finishEl.title = 'Custom Finish Location';
        const finishInner = document.createElement('div');
        finishInner.className =
          'treads-pin-inner rounded-full bg-rose-600 text-white font-mono text-xs font-bold shadow-lg border-2 border-white';
        finishInner.textContent = 'F';
        finishEl.appendChild(finishInner);
        const finishMarker = new maplibregl.Marker({ element: finishEl, anchor: 'center' })
          .setLngLat(customFinish)
          .addTo(map);
        waypointMarkersRef.current.push(finishMarker);
      }
    });
  }, [customStart, customFinish, customStops, mapLoaded, onRemoveStop]);

  // Sync trail endpoint markers (Start and Finish pins when walk is in replay mode)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || isWalkActive) return;
    const map = mapRef.current;

    trailEndpointMarkersRef.current.forEach((m) => m.remove());
    trailEndpointMarkersRef.current = [];

    const pts = trackPoints || [];
    if (pts.length === 0) return;

    import('maplibre-gl').then((mod) => {
      const maplibregl = (mod as any).default || mod;
      if (!mapRef.current) return;

      if (pts.length === 1 || pts.every((p) => p.lat === pts[0].lat && p.lng === pts[0].lng)) {
        // Stationary or single-point walk: show start/location pin
        const pt = pts[0];
        const el = document.createElement('div');
        el.className = 'treads-waypoint-start treads-pin-interactive w-8 h-8 cursor-pointer';
        el.title = 'Walk Location (Stationary)';
        const inner = document.createElement('div');
        inner.className =
          'treads-pin-inner flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold shadow-lg border-2 border-white';
        inner.textContent = 'S';
        el.appendChild(inner);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([pt.lng, pt.lat])
          .addTo(map);
        trailEndpointMarkersRef.current.push(marker);
      } else {
        // Start marker
        const startPt = pts[0];
        const startEl = document.createElement('div');
        startEl.className = 'treads-waypoint-start treads-pin-interactive w-8 h-8 cursor-pointer';
        startEl.title = 'Walk Start';
        const startInner = document.createElement('div');
        startInner.className =
          'treads-pin-inner flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold shadow-lg border-2 border-white';
        startInner.textContent = 'S';
        startEl.appendChild(startInner);
        const startMarker = new maplibregl.Marker({ element: startEl, anchor: 'center' })
          .setLngLat([startPt.lng, startPt.lat])
          .addTo(map);
        trailEndpointMarkersRef.current.push(startMarker);

        // Finish marker
        const endPt = pts[pts.length - 1];
        const endEl = document.createElement('div');
        endEl.className = 'treads-waypoint-finish treads-pin-interactive w-8 h-8 cursor-pointer';
        endEl.title = 'Walk End';
        const endInner = document.createElement('div');
        endInner.className =
          'treads-pin-inner flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white font-mono text-xs font-bold shadow-lg border-2 border-white';
        endInner.textContent = 'F';
        endEl.appendChild(endInner);
        const endMarker = new maplibregl.Marker({ element: endEl, anchor: 'center' })
          .setLngLat([endPt.lng, endPt.lat])
          .addTo(map);
        trailEndpointMarkersRef.current.push(endMarker);
      }
    });
  }, [trackPoints, isWalkActive, mapLoaded]);

  // Handle interactive map click for placing stops (A.3)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (onMapClick) {
      map.getCanvas().style.cursor = 'crosshair';
      const handleClick = (e: any) => {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      };
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
        if (map.getCanvas()) map.getCanvas().style.cursor = '';
      };
    }
  }, [onMapClick]);

  // Sync user marker position & heading
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userPosition) return;

    if (!userMarkerRef.current) {
      // If marker wasn't created in onMapReady, create and attach now
      import('maplibre-gl').then((mod) => {
        const maplibregl = (mod as any).default || mod;
        if (!mapRef.current) return;

        const markerEl = document.createElement('div');
        markerEl.className = 'treads-user-marker relative flex items-center justify-center w-8 h-8 pointer-events-none';

        const pulseRing = document.createElement('div');
        pulseRing.className = 'absolute inset-0 rounded-full bg-primary/30 animate-ping';
        markerEl.appendChild(pulseRing);

        const halo = document.createElement('div');
        halo.className = 'absolute w-6 h-6 rounded-full bg-primary/40';
        markerEl.appendChild(halo);

        const dot = document.createElement('div');
        dot.className = 'relative w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md';
        markerEl.appendChild(dot);

        const headingCone = document.createElement('div');
        headingCone.className = 'absolute -top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-primary transition-transform duration-200';
        headingCone.style.display = 'none';
        markerEl.appendChild(headingCone);

        markerElRef.current = markerEl;
        headingConeElRef.current = headingCone;

        const marker = new maplibregl.Marker({
          element: markerEl,
          anchor: 'center',
        });
        marker.setLngLat([userPosition.lng, userPosition.lat]).addTo(mapRef.current);
        userMarkerRef.current = marker;
      });
      return;
    }

    userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]).addTo(mapRef.current);

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

  // Sync specimen thumbnail pins on the trail (per D-13)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Clear previous specimen markers
    specimenMarkersRef.current.forEach((m) => m.remove());
    specimenMarkersRef.current = [];

    if (!specimenEntries || specimenEntries.length === 0) return;

    import('maplibre-gl').then((mod) => {
      const maplibregl = (mod as any).default || mod;
      if (!mapRef.current) return;

      // Markers at (nearly) the same spot would stack and only the top one is clickable.
      // Spread any coincident specimens around a small spiral so each stays reachable.
      const seenAt = new Map<string, number>();
      const SPREAD_M = 7; // metres between coincident pins

      specimenEntries.forEach((entry) => {
        if (!entry.lat || !entry.lng) return;

        const bucket = `${entry.lat.toFixed(5)},${entry.lng.toFixed(5)}`;
        const indexAtBucket = seenAt.get(bucket) ?? 0;
        seenAt.set(bucket, indexAtBucket + 1);

        let lng = entry.lng;
        let lat = entry.lat;
        if (indexAtBucket > 0) {
          // golden-angle spiral keeps successive pins visually distinct
          const angle = indexAtBucket * 2.399963229728653;
          const radius = SPREAD_M * Math.sqrt(indexAtBucket);
          const dLat = (radius * Math.sin(angle)) / 111320;
          const dLng =
            (radius * Math.cos(angle)) / (111320 * Math.cos((entry.lat * Math.PI) / 180));
          lat += dLat;
          lng += dLng;
        }

        // Outer element is positioned by MapLibre; keep it transform-free.
        const el = document.createElement('div');
        el.className = 'treads-specimen-pin treads-pin-interactive w-9 h-9 cursor-pointer';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', entry.confirmed?.commonName || 'Specimen');

        // Inner wrapper carries the visuals and all hover/press motion.
        const inner = document.createElement('div');
        const kind = entry.confirmed?.kind || 'plant';
        const ring =
          kind === 'tree' || kind === 'plant' || kind === 'flower'
            ? 'border-emerald-500'
            : kind === 'bird'
              ? 'border-sky-500'
              : kind === 'insect'
                ? 'border-primary'
                : kind === 'fungus'
                  ? 'border-amber-500'
                  : 'border-purple-500';
        inner.className = `treads-pin-inner rounded-full bg-card border-2 ${ring} shadow-lg overflow-hidden`;
        el.appendChild(inner);

        const source = entry.thumbnail || entry.photo;
        let thumbSrc = '';
        if (source instanceof Blob) {
          thumbSrc = URL.createObjectURL(source);
        } else if (typeof source === 'string') {
          thumbSrc = source;
        }

        if (thumbSrc) {
          const img = document.createElement('img');
          img.src = thumbSrc;
          img.alt = entry.confirmed?.commonName || 'Specimen';
          img.className = 'w-full h-full object-cover select-none pointer-events-none';
          inner.appendChild(img);
        } else {
          const icon = document.createElement('span');
          icon.className = 'text-xs select-none pointer-events-none';
          icon.textContent =
            kind === 'bird' ? '🐦' : kind === 'insect' ? '🦋' : kind === 'fungus' ? '🍄' : '🌱';
          inner.appendChild(icon);
        }

        const activate = (e: Event) => {
          e.stopPropagation();
          onSpecimenClick?.(entry);
        };
        el.addEventListener('click', activate);
        el.addEventListener('keydown', (e) => {
          const ke = e as KeyboardEvent;
          if (ke.key === 'Enter' || ke.key === ' ') {
            ke.preventDefault();
            activate(e);
          }
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        specimenMarkersRef.current.push(marker);
      });
    });
  }, [specimenEntries, mapLoaded, onSpecimenClick]);

  // Sync suggested pedestrian loop route line (per ROUT-01, D-14)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const source = mapRef.current.getSource('suggested-route') as GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: suggestedRouteLine || [],
        },
      });
    }

    if (suggestedRouteLine && suggestedRouteLine.length > 1 && !isWalkActive) {
      const points = suggestedRouteLine.map((c) => ({ lat: c[1], lng: c[0] }));
      const bounds = calculateTrailBounds(points);
      if (bounds) {
        updateFollowing(false);
        mapRef.current.fitBounds(bounds, {
          padding: { top: 72, bottom: 56, left: 48, right: 48 },
          maxZoom: 16,
          duration: 1000,
        });
      }
    }
  }, [suggestedRouteLine, mapLoaded, isWalkActive, updateFollowing]);

  // Sync audio note pins on the trail (per D-03)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Clear previous audio markers
    audioMarkersRef.current.forEach((m) => m.remove());
    audioMarkersRef.current = [];

    if (!audioNotes || audioNotes.length === 0) return;

    import('maplibre-gl').then((mod) => {
      const maplibregl = (mod as any).default || mod;
      if (!mapRef.current) return;

      audioNotes.forEach((note) => {
        if (note.lat == null || note.lng == null) return;

        const pinEl = document.createElement('div');
        pinEl.className = 'treads-audio-pin treads-pin-interactive w-8 h-8 cursor-pointer';
        pinEl.setAttribute('role', 'button');
        pinEl.setAttribute('tabindex', '0');
        pinEl.setAttribute('aria-label', 'Voice note pin');

        const audioInner = document.createElement('div');
        audioInner.className =
          'treads-pin-inner rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-white';
        audioInner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
        pinEl.appendChild(audioInner);

        const activateAudio = (e: Event) => {
          e.stopPropagation();
          onAudioNoteClick?.(note);
        };
        pinEl.addEventListener('click', activateAudio);
        pinEl.addEventListener('keydown', (e) => {
          const ke = e as KeyboardEvent;
          if (ke.key === 'Enter' || ke.key === ' ') {
            ke.preventDefault();
            activateAudio(e);
          }
        });

        const marker = new maplibregl.Marker({ element: pinEl, anchor: 'center' })
          .setLngLat([note.lng, note.lat])
          .addTo(mapRef.current);

        audioMarkersRef.current.push(marker);
      });
    });
  }, [audioNotes, mapLoaded, onAudioNoteClick]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-background ${className}`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating thumb-accessible control stack on right margin (per D-12) */}
      <div className="absolute right-2.5 top-16 z-20 flex flex-col items-center gap-1.5 select-none sm:right-4 sm:top-20 sm:gap-2">
        {/* Recenter Button (shows active tint if following) */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map to current location"
          className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md border shadow-md transition-all active:scale-95 cursor-pointer ${
            isFollowing
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background/85 text-foreground border-border/80 hover:bg-background'
          }`}
        >
          <Navigation className={`w-4 h-4 sm:w-5 sm:h-5 ${isFollowing ? 'fill-current' : ''}`} />
        </button>

        {/* Zoom In (+) */}
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-foreground shadow-md transition-all hover:bg-background active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Zoom Out (-) */}
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-foreground shadow-md transition-all hover:bg-background active:scale-95 cursor-pointer"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* North Compass Reset */}
        <button
          type="button"
          onClick={handleResetNorth}
          aria-label="Reset orientation north"
          className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-foreground shadow-md transition-all hover:bg-background active:scale-95 cursor-pointer"
          style={{ transform: `rotate(${-compassBearing}deg)` }}
        >
          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </button>
      </div>

      {/* Interactive Stop Placement Banner (A.3) */}
      {isPlacingStop && (
        <div className="absolute top-16 sm:top-20 inset-x-0 z-20 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-3">
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 text-white shadow-xl border border-amber-600/30 text-xs font-semibold backdrop-blur-md">
            <span>Tap anywhere on the map to place a stop</span>
          </div>
        </div>
      )}

      {/* Micro-legend chip for trail path (per D-11) */}
      {isWalkActive && trackPoints.length > 0 && (
        <div className="absolute left-3 bottom-14 sm:bottom-16 lg:bottom-20 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border/60 shadow-xs text-[11px] text-muted-foreground">
            <span className="w-2.5 h-1 rounded-full bg-primary" />
            <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-tight">Approximate path</span>
          </div>
        </div>
      )}
    </div>
  );
});

