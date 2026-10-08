'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RotateCcw, ShieldCheck, Loader2 } from 'lucide-react';

export interface CameraCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoBlob: Blob | null;
  thumbnailBlob: Blob | null;
  isProcessing?: boolean;
  onRetake: () => void;
  onIdentify: (photoBlob: Blob, thumbnailBlob: Blob) => void;
}

export function CameraCaptureSheet({
  open,
  onOpenChange,
  photoBlob,
  thumbnailBlob,
  isProcessing = false,
  onRetake,
  onIdentify,
}: CameraCaptureSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate object URL for preview and safely revoke on cleanup
  useEffect(() => {
    if (!photoBlob) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(photoBlob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoBlob]);

  const formattedSize = useMemo(() => {
    if (!photoBlob) return '~140 KB';
    const kb = Math.round(photoBlob.size / 1024);
    return `~${kb} KB`;
  }, [photoBlob]);

  const handleIdentify = () => {
    if (photoBlob && thumbnailBlob) {
      onIdentify(photoBlob, thumbnailBlob);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col gap-4 rounded-t-2xl border-t border-border bg-card p-6 shadow-2xl"
      >
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
              Captured Specimen
            </SheetTitle>
            {isProcessing ? (
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs text-amber-600 border-amber-500/40 bg-amber-500/10">
                <Loader2 className="w-3 h-3 animate-spin" />
                Stripping EXIF & optimizing...
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Optimized ({formattedSize}) • No GPS tags
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Client-side Canvas rasterization discarded all EXIF hardware data. Ready for Wikipedia AI identification.
          </SheetDescription>
        </SheetHeader>

        {/* Photo Viewport */}
        <div className="relative flex items-center justify-center w-full min-h-[220px] max-h-[46vh] rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-border/70">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Specimen preview"
              className="w-full h-full object-contain max-h-[46vh] select-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Decoding image pixels on Canvas...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRetake}
            disabled={isProcessing}
            className="flex-1 min-h-[48px] h-12 gap-2 text-foreground font-medium rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            Retake Photo
          </Button>

          <Button
            type="button"
            onClick={handleIdentify}
            disabled={isProcessing || !photoBlob || !thumbnailBlob}
            className="flex-1 min-h-[48px] h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md cursor-pointer transition-transform active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Identify Organism
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

