'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Square, Camera, Mic } from 'lucide-react';

export interface WalkControlsProps {
  onEndWalk: () => void;
  onCameraClick?: () => void;
  onPhotoSelected?: (file: File) => void;
  onMicClick?: () => void;
  disabled?: boolean;
}

export interface WalkControlsHandle {
  triggerCapture: () => void;
}

const HOLD_DURATION_MS = 1500;

export const WalkControls = React.forwardRef<WalkControlsHandle, WalkControlsProps>(
  function WalkControls(
    { onEndWalk, onCameraClick, onPhotoSelected, onMicClick, disabled = false },
    ref
  ) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => ({
      triggerCapture: () => {
        fileInputRef.current?.click();
      },
    }));

    const handleCameraClick = () => {
      if (onPhotoSelected) {
        fileInputRef.current?.click();
      } else if (onCameraClick) {
        onCameraClick();
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onPhotoSelected?.(file);
        e.target.value = '';
      }
    };
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const cancelHold = useCallback(() => {
    setIsHolding(false);
    startTimeRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(
    (e: React.SyntheticEvent) => {
      if (disabled) return;
      // Prevent context menus on mobile long-press
      if (e.type === 'touchstart') {
        // e.preventDefault is handled if needed
      }

      setIsHolding(true);
      hasTriggeredRef.current = false;
      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        if (!startTimeRef.current) return;
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
        setHoldProgress(progress);

        if (progress >= 100 && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          cancelHold();
          // Haptic feedback if supported
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate?.(50);
            } catch {
              // Ignore haptic errors
            }
          }
          onEndWalk();
          return;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [disabled, onEndWalk, cancelHold]
  );

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate SVG stroke offset for circular progress (circle r=26, circumference = 2 * PI * 26 ≈ 163.36)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div className="absolute bottom-8 inset-x-0 z-30 flex items-center justify-center gap-6 px-4 pointer-events-none select-none">
      <div className="pointer-events-auto flex items-center gap-5 p-2 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-xl">
        {/* Hidden Camera Input with environment capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          tabIndex={-1}
          onChange={handleFileChange}
        />

        {/* Camera Capture Trigger */}
        <button
          type="button"
          onClick={handleCameraClick}
          aria-label="Capture specimen"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/80 hover:bg-muted text-foreground border border-border/60 transition-transform active:scale-95 shadow-sm cursor-pointer"
        >
          <Camera className="w-6 h-6 text-[#F35C2B]" />
        </button>

        {/* Voice Note Trigger */}
        <button
          type="button"
          onClick={onMicClick}
          aria-label="Record voice note"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/80 hover:bg-muted text-foreground border border-border/60 transition-transform active:scale-95 shadow-sm cursor-pointer"
        >
          <Mic className="w-6 h-6 text-[#F35C2B]" />
        </button>

        {/* Hold-to-Confirm "End Walk" Action (per D-13) */}
        <div className="relative flex items-center justify-center">
          {/* Circular SVG Progress Ring */}
          <svg
            className="absolute inset-0 w-16 h-16 pointer-events-none -rotate-90"
            viewBox="0 0 64 64"
          >
            {/* Background track */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="text-border/40"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="text-[#DC2626] transition-all"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Core Button (min 48px touch target: w-14 h-14 = 56px) */}
          <button
            type="button"
            aria-label="Hold button to finalize and save your walk session"
            disabled={disabled}
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-150 cursor-pointer shadow-md active:scale-95 ${
              isHolding
                ? 'bg-destructive text-destructive-foreground scale-95 shadow-destructive/20'
                : 'bg-destructive/90 hover:bg-destructive text-white'
            }`}
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
});
WalkControls.displayName = 'WalkControls';

