'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LiveCameraProps {
  open: boolean;
  onClose: () => void;
  /** Called with a JPEG frame when the shutter is pressed */
  onCapture: (file: File) => void;
  /** Called when the user prefers to pick a file instead (or the camera is unavailable) */
  onChooseFile: () => void;
  /**
   * `fullscreen` portals a black overlay over the whole page. `inline` fills
   * its (relatively positioned) parent, e.g. the map panel on the walk screen,
   * and floats a small camera controls dock over the viewfinder.
   */
  variant?: 'fullscreen' | 'inline';
}

/**
 * A live viewfinder for devices where `<input capture>` does nothing (desktops
 * and laptops). Phones keep the native camera app; see WalkControls.
 * The stream is stopped as soon as the overlay closes.
 */
export function LiveCamera({
  open,
  onClose,
  onCapture,
  onChooseFile,
  variant = 'fullscreen',
}: LiveCameraProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);
    setError(null);

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play().catch(() => undefined);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : '';
        setError(
          name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in the address bar, or choose a photo instead.'
            : name === 'NotFoundError'
              ? 'No camera was found on this device. You can choose a photo instead.'
              : 'The camera could not be started. You can choose a photo instead.',
        );
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `specimen-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  };

  if (!open || typeof document === 'undefined') return null;

  const viewfinder = (
    <div className="relative min-h-0 flex-1">
      <video
        ref={videoRef}
        playsInline
        muted
        onLoadedData={() => setReady(true)}
        className={
          variant === 'inline'
            ? 'absolute inset-0 h-full w-full object-cover'
            : 'absolute inset-0 h-full w-full object-contain'
        }
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-white/80">{error}</p>
        </div>
      )}
      {!ready && !error && (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[0.22em] text-white/60">
          Starting camera
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-black/70"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const shutter = (
    <button
      type="button"
      onClick={shoot}
      disabled={!ready}
      aria-label="Take photo"
      className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full border-4 border-white/90 bg-white/10 transition-transform active:scale-95 disabled:opacity-40"
    >
      <Camera className="h-6 w-6" />
    </button>
  );

  if (variant === 'inline') {
    // Camera controls dock: floats at the bottom of the viewfinder.
    return (
      <div
        role="region"
        aria-label="Camera viewfinder"
        className="absolute inset-0 z-40 flex flex-col bg-black text-white"
      >
        {viewfinder}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-black/55 p-2 pr-3 backdrop-blur-md">
            <Button
              type="button"
              variant="ghost"
              onClick={onChooseFile}
              className="h-11 gap-2 rounded-full px-4 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ImageUp className="h-4 w-4" />
              Choose a photo
            </Button>
            {shutter}
          </div>
        </div>
      </div>
    );
  }

  // Portalled: an ancestor with backdrop-filter would otherwise become the
  // containing block for `fixed` and shrink this to the size of the dock.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
      className="fixed inset-0 z-[70] flex flex-col bg-black text-white"
    >
      {viewfinder}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="ghost"
          onClick={onChooseFile}
          className="h-11 justify-self-start gap-2 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ImageUp className="h-4 w-4" />
          Choose a photo
        </Button>
        {shutter}
      </div>
    </div>,
    document.body,
  );
}
