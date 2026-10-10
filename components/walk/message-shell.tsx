'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageAction {
  id: string;
  /** Icon-only button, so this is the accessible name and tooltip */
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
}

export interface MessageShellProps {
  /** When the message was created; revealed under the bubble on a single tap */
  at: number;
  /** Circles that pop out from the bubble's left edge on right click / long press */
  actions: MessageAction[];
  /** Extra classes for the bubble (the rounded container) */
  bubbleClassName?: string;
  label?: string;
  children: React.ReactNode;
}

const LONG_PRESS_MS = 450;
const LONG_PRESS_SLOP_PX = 10;

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Wraps one log message (photo, voice note, ...).
 * - single click / tap: shows the time under the bubble
 * - right click, or press and hold on touch (or Enter when focused): pops the
 *   action circles out from the bubble's left edge; click away or press Escape to dismiss
 */
export function MessageShell({ at, actions, bubbleClassName, label, children }: MessageShellProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [showTime, setShowTime] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsClosing, setActionsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Plays the circles' exit animation, then unmounts them.
  const closeActions = useCallback(() => {
    setActionsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActionsOpen(false);
      setActionsClosing(false);
    }, 150);
  }, []);

  const openActions = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActionsClosing(false);
    setActionsOpen(true);
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  // Press-and-hold for touch. (Android also fires `contextmenu` on a long press and iOS
  // doesn't, so both paths only ever *open*, which keeps them from cancelling each other.)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdOriginRef = useRef<{ x: number; y: number } | null>(null);
  const didLongPressRef = useRef(false);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdOriginRef.current = null;
  }, []);

  useEffect(() => clearHold, [clearHold]);

  useEffect(() => {
    if (!actionsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeActions();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeActions();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [actionsOpen, closeActions]);

  return (
    <div
      ref={rootRef}
      // Leaves room on the left for the circles to pop into.
      className="flex w-full max-w-[calc(100%-6rem)] flex-col items-end gap-1 self-end"
    >
      <div
        role="group"
        aria-label={label}
        tabIndex={0}
        onClick={() => {
          // The click that ends a long press must not also toggle the time.
          if (didLongPressRef.current) {
            didLongPressRef.current = false;
            return;
          }
          setShowTime((v) => !v);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          openActions();
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          didLongPressRef.current = false;
          holdOriginRef.current = { x: e.clientX, y: e.clientY };
          holdTimerRef.current = setTimeout(() => {
            didLongPressRef.current = true;
            openActions();
            if ('vibrate' in navigator) navigator.vibrate?.(15);
          }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          const origin = holdOriginRef.current;
          if (!origin) return;
          if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > LONG_PRESS_SLOP_PX) {
            clearHold();
          }
        }}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (actionsOpen) closeActions();
            else openActions();
          }
        }}
        className={cn(
          'relative flex w-full cursor-pointer touch-manipulation select-none flex-col [-webkit-touch-callout:none] gap-2 rounded-2xl rounded-br-md border border-border/60 bg-primary/10 p-2.5 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
          bubbleClassName,
        )}
      >
        {children}

        {actionsOpen && (
          <div
            className="absolute right-full top-1/2 mr-2 flex -translate-y-1/2 flex-row-reverse items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  title={action.label}
                  data-closing={actionsClosing}
                  style={{
                    animationDelay: actionsClosing
                      ? `${(actions.length - 1 - i) * 45}ms`
                      : `${i * 55}ms`,
                  }}
                  onClick={() => {
                    closeActions();
                    action.onSelect();
                  }}
                  className={cn(
                    'msg-action flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-md transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:scale-110 hover:shadow-lg active:scale-90',
                    action.destructive
                      ? 'border-destructive/30 bg-background text-destructive hover:bg-destructive/10'
                      : 'border-border bg-background text-primary hover:bg-muted',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showTime && (
        <span className="px-1 font-mono text-[10px] text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
          {formatClock(at)}
        </span>
      )}
    </div>
  );
}
