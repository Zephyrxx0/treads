'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrackPoint,
  shouldRecordTrackPoint,
} from '@/lib/geo';

export type GpsSignalStatus = 'idle' | 'searching' | 'live' | 'weak' | 'denied' | 'error';

export interface CurrentPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseGeolocationOptions {
  enabled?: boolean;
  onNewTrackPoint?: (point: TrackPoint) => void;
}

export interface GeolocationState {
  currentPosition: CurrentPosition | null;
  status: GpsSignalStatus;
  error: string | null;
  isWatching: boolean;
  lastAcceptedPoint: TrackPoint | null;
  requestCurrentPosition: () => Promise<CurrentPosition | null>;
}

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState {
  const { enabled = false, onNewTrackPoint } = options;

  const [currentPosition, setCurrentPosition] = useState<CurrentPosition | null>(null);
  const [status, setStatus] = useState<GpsSignalStatus>(enabled ? 'searching' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [lastAcceptedPoint, setLastAcceptedPoint] = useState<TrackPoint | null>(null);

  const lastAcceptedRef = useRef<TrackPoint | null>(null);
  const onNewTrackPointRef = useRef(onNewTrackPoint);
  onNewTrackPointRef.current = onNewTrackPoint;

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const coords = pos.coords;
    const now = pos.timestamp || Date.now();

    const newPos: CurrentPosition = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading ?? null,
      speed: coords.speed ?? null,
      timestamp: now,
    };

    setCurrentPosition(newPos);
    setError(null);

    // Accuracy threshold per D-05 and GPS-01
    if (coords.accuracy > 35) {
      setStatus('weak');
    } else {
      setStatus('live');
    }

    const candidate: TrackPoint = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: now,
    };

    const evalResult = shouldRecordTrackPoint(candidate, lastAcceptedRef.current);
    if (evalResult.record) {
      lastAcceptedRef.current = candidate;
      setLastAcceptedPoint(candidate);
      if (onNewTrackPointRef.current) {
        onNewTrackPointRef.current(candidate);
      }
    }
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Unable to acquire location.';
    if (err.code === err.PERMISSION_DENIED) {
      setStatus('denied');
      msg = 'Location permission denied. Please enable location permissions in browser settings.';
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setStatus('error');
      msg = 'Location unavailable. Checking for GPS signal...';
    } else if (err.code === err.TIMEOUT) {
      setStatus('weak');
      msg = 'Location signal timed out. Retrying...';
    } else {
      setStatus('error');
      msg = err.message || 'Location tracking error.';
    }
    setError(msg);
  }, []);

  const requestCurrentPosition = useCallback(async (): Promise<CurrentPosition | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported by device/browser');
      setStatus('error');
      return null;
    }

    setStatus('searching');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePosition(pos);
          const coords = pos.coords;
          resolve({
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            heading: coords.heading ?? null,
            speed: coords.speed ?? null,
            timestamp: pos.timestamp || Date.now(),
          });
        },
        (err) => {
          handleError(err);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [handlePosition, handleError]);

  useEffect(() => {
    if (!enabled) {
      setIsWatching(false);
      setStatus('idle');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStatus('error');
      setIsWatching(false);
      return;
    }

    setStatus('searching');
    setIsWatching(true);

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Visibility change handler for background throttling recovery (per D-07)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setIsWatching(false);
    };
  }, [enabled, handlePosition, handleError]);

  return {
    currentPosition,
    status,
    error,
    isWatching,
    lastAcceptedPoint,
    requestCurrentPosition,
  };
}
