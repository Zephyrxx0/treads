'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Square, Camera, Mic, Send } from 'lucide-react';

export interface WalkControlsProps {
  onEndWalk: (options?: { fromHold?: boolean }) => void;
  onCameraClick?: () => void;
  onPhotoSelected?: (file: File) => void;
  onMicClick?: () => void;
  /** Submit a quick text note typed into the dock */
  onSubmitTextNote?: (text: string) => void | Promise<void>;
  /**
   * Called instead of opening a file picker whenever the browser can stream a
   * camera (phones included). The page then shows an in-app viewfinder.
   */
  onLiveCameraRequest?: () => void;
  disabled?: boolean;
}

export interface WalkControlsHandle {
  triggerCapture: () => void;
  chooseFile: () => void;
}

const HOLD_DURATION_MS = 1000;

export const WalkControls = React.forwardRef<WalkControlsHandle, WalkControlsProps>(
  function WalkControls(
    {
      onEndWalk,
      onCameraClick,
      onPhotoSelected,
      onMicClick,
      onSubmitTextNote,
      onLiveCameraRequest,
      disabled = false,
    },
    ref,
  ) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const [noteText, setNoteText] = useState<string>('');

    const submitNote = useCallback(() => {
      const text = noteText.trim();
      if (!text) return;
      void onSubmitTextNote?.(text);
      setNoteText('');
    }, [noteText, onSubmitTextNote]);

    // Prefer an in-app viewfinder everywhere: handing off to the phone's camera app
    // pulls the walker out of the page (and the browser may reload it on return).
    // `<input capture>` is only the fallback for when getUserMedia is unavailable,
    // e.g. an insecure (plain http) origin.
    const openCamera = useCallback(() => {
      const canStream = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
      if (canStream && onLiveCameraRequest) {
        onLiveCameraRequest();
      } else {
        fileInputRef.current?.click();
      }
    }, [onLiveCameraRequest]);

    React.useImperativeHandle(ref, () => ({
      triggerCapture: openCamera,
      chooseFile: () => galleryInputRef.current?.click(),
    }));

    const handleCameraClick = () => {
      if (onPhotoSelected) {
        openCamera();
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

    const startHold = useCallback(() => {
      if (disabled) return;

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
          onEndWalk({ fromHold: true });
          return;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    }, [disabled, onEndWalk, cancelHold]);

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture errors
      }
      startHold();
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
      cancelHold();
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
      cancelHold();
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (disabled) return;
      // If the 1s hold already finished and triggered the action, ignore subsequent click
      if (hasTriggeredRef.current) {
        hasTriggeredRef.current = false;
        return;
      }
      cancelHold();
      onEndWalk({ fromHold: false });
    };

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
      <div className="select-none">
        <div className="flex items-center gap-3 rounded-3xl border border-border/60 bg-muted/50 p-2">
          {/* Three circular actions, grouped on the left */}
          <div className="flex shrink-0 items-center gap-2">
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
            {/* Photo library picker (no `capture`, so phones offer the gallery) */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              onChange={handleFileChange}
            />

            {/* Camera Capture Trigger */}
            <button
              type="button"
              onClick={handleCameraClick}
              aria-label="Capture specimen"
              title="Capture specimen"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background text-foreground shadow-sm transition-transform hover:bg-muted active:scale-95 cursor-pointer"
            >
              <Camera className="h-5 w-5 text-primary" />
            </button>

            {/* Voice Note Trigger */}
            <button
              type="button"
              onClick={onMicClick}
              aria-label="Record voice note"
              title="Record voice note"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background text-foreground shadow-sm transition-transform hover:bg-muted active:scale-95 cursor-pointer"
            >
              <Mic className="h-5 w-5 text-primary" />
            </button>

            {/* Hold or Tap "End Walk" Action (per D-13) */}
            <div className="relative flex items-center justify-center group">
              {/* Tooltip / Status hint pill */}
              {isHolding ? (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background/95 backdrop-blur-md border border-destructive/40 shadow-lg text-[11px] font-semibold text-destructive whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                  Ending walk...
                </div>
              ) : (
                <div className="hidden sm:group-hover:flex absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md border border-border shadow-md text-[11px] font-medium text-muted-foreground whitespace-nowrap pointer-events-none">
                  Hold to finish, or click to confirm
                </div>
              )}

              {/* Circular SVG Progress Ring */}
              <svg
                className="absolute inset-0 w-14 h-14 pointer-events-none -rotate-90"
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
                aria-label="End walk session (hold 1s or tap to confirm)"
                disabled={disabled}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onClick={handleClick}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150 cursor-pointer shadow-md select-none touch-none active:scale-95 ${
                  isHolding
                    ? 'bg-destructive text-destructive-foreground scale-95 shadow-destructive/20 ring-2 ring-destructive/40'
                    : 'bg-destructive/90 hover:bg-destructive text-white'
                }`}
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {/* Quick text note, to the right of the actions */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitNote();
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring"
          >
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              disabled={disabled}
              placeholder="Type here"
              aria-label="Quick text note"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={disabled || !noteText.trim()}
              aria-label="Save note"
              title="Save note"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  },
);
WalkControls.displayName = 'WalkControls';
