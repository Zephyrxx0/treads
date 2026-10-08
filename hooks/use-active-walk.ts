'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Walk } from '@/lib/db';
import { TrackPoint, calculateHaversineDistance } from '@/lib/geo';

// In-memory buffer to debounce frequent GPS updates to Dexie IndexedDB
const pendingPointsBuffer = new Map<string, TrackPoint[]>();
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Returns the currently active walk (where endedAt is null), or undefined if none.
 */
export async function getActiveWalk(): Promise<Walk | undefined> {
  const walks = await db.walks.filter((w) => w.endedAt === null).toArray();
  if (walks.length === 0) return undefined;
  // If multiple exist (rare recovery state), take the latest one
  return walks.sort((a, b) => b.startedAt - a.startedAt)[0];
}

/**
 * Starts a new walk session in Dexie.
 */
export async function startWalkSession(mode: 'free' | 'loop' = 'free'): Promise<Walk> {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `walk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newWalk: Walk = {
    id,
    startedAt: Date.now(),
    endedAt: null,
    mode,
    trackPoints: [],
    distance: 0,
  };

  await db.walks.add(newWalk);
  pendingPointsBuffer.set(id, []);
  return newWalk;
}

/**
 * Flushes any pending buffered track points for a walk directly into Dexie.
 */
export async function flushWalkBuffer(walkId: string): Promise<void> {
  const timer = debounceTimers.get(walkId);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(walkId);
  }

  const buffered = pendingPointsBuffer.get(walkId);
  if (!buffered || buffered.length === 0) return;

  const current = await db.walks.get(walkId);
  if (!current || current.endedAt !== null) {
    pendingPointsBuffer.delete(walkId);
    return;
  }

  let cumulativeDistance = current.distance || 0;
  let lastPoint = current.trackPoints.length > 0 ? current.trackPoints[current.trackPoints.length - 1] : null;

  for (const pt of buffered) {
    if (lastPoint) {
      cumulativeDistance += calculateHaversineDistance(lastPoint.lat, lastPoint.lng, pt.lat, pt.lng);
    }
    lastPoint = pt;
  }

  const updatedPoints = [...current.trackPoints, ...buffered];
  pendingPointsBuffer.set(walkId, []);

  await db.walks.update(walkId, {
    trackPoints: updatedPoints,
    distance: Math.round(cumulativeDistance),
  });
}

/**
 * Appends a verified track point to an active walk session, recalculating distance.
 * Buffers updates with a 1500ms debounce to prevent high-frequency IndexedDB write stutter.
 */
export async function appendTrackPointToSession(
  walkId: string,
  point: TrackPoint,
  options: { immediate?: boolean } = {}
): Promise<void> {
  const buffer = pendingPointsBuffer.get(walkId) || [];
  buffer.push(point);
  pendingPointsBuffer.set(walkId, buffer);

  if (options.immediate) {
    await flushWalkBuffer(walkId);
    return;
  }

  // Debounced write
  if (!debounceTimers.has(walkId)) {
    const timer = setTimeout(async () => {
      debounceTimers.delete(walkId);
      await flushWalkBuffer(walkId);
    }, 1500);
    debounceTimers.set(walkId, timer);
  }
}

/**
 * Finalizes an active walk session: flushes buffer, sets endedAt, and returns completed Walk.
 */
export async function endWalkSession(walkId: string): Promise<Walk | null> {
  await flushWalkBuffer(walkId);
  const endedAt = Date.now();
  await db.walks.update(walkId, { endedAt });
  const completed = await db.walks.get(walkId);
  return completed ?? null;
}

/**
 * Discards an active walk session permanently from Dexie (per D-15).
 */
export async function discardWalkSession(walkId: string): Promise<void> {
  const timer = debounceTimers.get(walkId);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(walkId);
  }
  pendingPointsBuffer.delete(walkId);
  await db.walks.delete(walkId);
}

export interface UseActiveWalkReturn {
  activeWalk: Walk | null | undefined;
  isActive: boolean;
  isResumed: boolean;
  dismissResumed: () => void;
  elapsedSeconds: number;
  distanceMeters: number;
  startWalk: (mode?: 'free' | 'loop') => Promise<Walk>;
  appendTrackPoint: (point: TrackPoint, options?: { immediate?: boolean }) => Promise<void>;
  endWalk: () => Promise<Walk | null>;
  discardWalk: () => Promise<void>;
}

export function useActiveWalk(): UseActiveWalkReturn {
  // Query active walk where endedAt is null using Dexie useLiveQuery
  const activeWalk = useLiveQuery(async () => {
    return getActiveWalk();
  }, []);

  const [isResumed, setIsResumed] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const initialCheckedRef = useRef<boolean>(false);
  const startedInThisMountRef = useRef<boolean>(false);

  // Detect auto-resumed walk session across tab reloads / background wakes (per D-04)
  useEffect(() => {
    if (initialCheckedRef.current || activeWalk === undefined) return;
    initialCheckedRef.current = true;

    if (activeWalk && !startedInThisMountRef.current) {
      setIsResumed(true);
    }
  }, [activeWalk]);

  const dismissResumed = useCallback(() => {
    setIsResumed(false);
  }, []);

  // Update elapsed seconds continuously based on startedAt timestamp
  useEffect(() => {
    if (!activeWalk || activeWalk.endedAt !== null) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      setElapsedSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeWalk?.startedAt, activeWalk?.endedAt]);

  const startWalk = useCallback(async (mode: 'free' | 'loop' = 'free'): Promise<Walk> => {
    startedInThisMountRef.current = true;
    setIsResumed(false);
    return await startWalkSession(mode);
  }, []);

  const appendTrackPoint = useCallback(
    async (point: TrackPoint, options: { immediate?: boolean } = {}): Promise<void> => {
      if (!activeWalk?.id) return;
      await appendTrackPointToSession(activeWalk.id, point, options);
    },
    [activeWalk?.id]
  );

  const endWalk = useCallback(async (): Promise<Walk | null> => {
    if (!activeWalk?.id) return null;
    return await endWalkSession(activeWalk.id);
  }, [activeWalk?.id]);

  const discardWalk = useCallback(async (): Promise<void> => {
    if (!activeWalk?.id) return;
    await discardWalkSession(activeWalk.id);
  }, [activeWalk?.id]);

  return {
    activeWalk,
    isActive: Boolean(activeWalk),
    isResumed,
    dismissResumed,
    elapsedSeconds,
    distanceMeters: activeWalk?.distance ?? 0,
    startWalk,
    appendTrackPoint,
    endWalk,
    discardWalk,
  };
}
