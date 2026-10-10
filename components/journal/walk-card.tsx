'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { db, type Walk, type Entry, type Note } from '@/lib/db';
import {
  CoverArt,
  NATURAL_COVERS,
  getNaturalCover,
  getNaturalCoverById,
} from '@/components/hairline/natural-covers';
import {
  MoreVertical,
  ImageIcon,
  Share2,
  Trash2,
  Upload,
  Check,
  Copy,
  Download,
} from 'lucide-react';

export interface WalkCardProps {
  walk: Walk;
  entries: Entry[];
  notes?: Note[];
  className?: string;
  onDeleted?: () => void;
}

export function WalkCard({ walk, entries, notes = [], className, onDeleted }: WalkCardProps) {
  // First image in the walk from entries, if any
  const firstImageEntry = entries.find((e) => e.thumbnail || e.photo);
  const [entryImageUrl, setEntryImageUrl] = React.useState<string | null>(null);
  const [customCoverUrl, setCustomCoverUrl] = React.useState<string | null>(null);

  // Modals State
  const [isCoverModalOpen, setIsCoverModalOpen] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [shareCopied, setShareCopied] = React.useState(false);

  // File input ref for custom cover upload
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Resolve entry image URL
  React.useEffect(() => {
    if (!firstImageEntry) {
      setEntryImageUrl(null);
      return;
    }
    const src = firstImageEntry.thumbnail || firstImageEntry.photo;
    let url: string | null = null;
    if (src instanceof Blob) {
      url = URL.createObjectURL(src);
      setEntryImageUrl(url);
    } else if (typeof src === 'string') {
      setEntryImageUrl(src);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [firstImageEntry]);

  // Resolve custom cover image if set on walk
  React.useEffect(() => {
    if (!walk.coverImage) {
      setCustomCoverUrl(null);
      return;
    }
    let url: string | null = null;
    if (walk.coverImage instanceof Blob) {
      url = URL.createObjectURL(walk.coverImage);
      setCustomCoverUrl(url);
    } else if (typeof walk.coverImage === 'string') {
      setCustomCoverUrl(walk.coverImage);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [walk.coverImage]);

  // Selected or assigned natural cover
  const naturalCover = React.useMemo(() => {
    if (walk.coverId) {
      const found = getNaturalCoverById(walk.coverId);
      if (found) return found;
    }
    return getNaturalCover(walk.id);
  }, [walk.coverId, walk.id]);

  // Effective visual cover:
  // 1. Explicit custom cover upload (walk.coverImage)
  // 2. Explicit selected hairline cover (walk.coverId)
  // 3. First entry photo if available
  // 4. Fallback hairline cover
  const effectiveImageUrl = customCoverUrl || (walk.coverId ? null : entryImageUrl);

  const startTimeStr = new Date(walk.startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const label = walk.title || `Walk at ${startTimeStr}`;

  // Safe opener for dialogs with event decoupling
  const openCoverModal = () => {
    setTimeout(() => setIsCoverModalOpen(true), 15);
  };

  const openShareModal = () => {
    setTimeout(() => setIsShareModalOpen(true), 15);
  };

  const openDeleteModal = () => {
    setTimeout(() => setIsDeleteModalOpen(true), 15);
  };

  // Upload handler for custom cover
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await db.walks.update(walk.id, {
        coverImage: file,
        coverId: null,
      });
      setIsCoverModalOpen(false);
    } catch (err) {
      console.error('Failed to save custom cover image:', err);
    }
  };

  // Select Hairline Cover
  const handleSelectHairlineCover = async (coverId: string) => {
    try {
      await db.walks.update(walk.id, {
        coverId,
        coverImage: null,
      });
      setIsCoverModalOpen(false);
    } catch (err) {
      console.error('Failed to update cover ID:', err);
    }
  };

  // Share functionality: Markdown copy, JSON export, and Native Share
  const expeditionSummaryText = React.useMemo(() => {
    const dateStr = new Date(walk.startedAt).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const distanceKm = ((walk.distance || 0) / 1000).toFixed(2);
    const confirmedCount = entries.filter((e) => e.confirmed).length;
    return `🌲 **${label}**\n📅 ${dateStr} • ${startTimeStr}\n📍 Distance: ${distanceKm} km • GPS Points: ${walk.trackPoints?.length || 0}\n🔎 Field Finds: ${entries.length} (${confirmedCount} confirmed)\n🎙️ Voice Notes: ${notes.length}\n\nRecorded on Treads Field Companion`;
  }, [walk, entries, notes, label, startTimeStr]);

  const handleCopySummary = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(expeditionSummaryText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleExportJson = () => {
    const data = {
      walk,
      entriesCount: entries.length,
      notesCount: notes.length,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treads-walk-${walk.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/journal/${walk.id}` : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: label,
          text: expeditionSummaryText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  // Delete Walk
  const handleDeleteWalk = async () => {
    setIsDeleting(true);
    try {
      await db.transaction('rw', [db.walks, db.entries, db.notes], async () => {
        await db.walks.delete(walk.id);
        await db.entries.where('walkId').equals(walk.id).delete();
        await db.notes.where('walkId').equals(walk.id).delete();
      });
      setIsDeleteModalOpen(false);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete walk:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="group relative select-none block">
          <Link
            href={`/journal/${walk.id}`}
            title={label}
            aria-label={label}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <div
              className={cn(
                'group/card flex flex-col w-full max-w-[...] rounded-xl border-[0.5px] border-border/40 bg-card p-1 shadow-2xs transition-all duration-300 hover:border-primary/60 group-hover:-translate-y-1',
                className
              )}
            >
              {/* Cover area: vertical rectangle cutout (image inside white border or hairline cover) */}
              <div className="relative aspect-[4/5] w-full flex items-center justify-center overflow-hidden rounded-lg">
                {effectiveImageUrl ? (
                  // Image cutout inside clean white borders
                  <div className="h-full w-full overflow-hidden rounded-lg bg-white dark:bg-white/10 p-1.5 border-[0.5px] border-black/10 dark:border-white/15 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectiveImageUrl}
                      alt={label}
                      className="h-full w-full object-cover rounded-md transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                    />
                  </div>
                ) : (
                  // Hairline Natural element cover
                  <div className="h-full w-full flex items-center justify-center p-2 rounded-lg bg-muted/20 border-[0.5px] border-border/20">
                    <CoverArt cover={naturalCover} className="h-full w-full text-foreground/85 group-hover:text-primary transition-all duration-500 group-hover:scale-105" />
                  </div>
                )}
              </div>

              {/* At the bottom, center, render the title of the walk */}
              <div className="w-full pt-2 pb-0.5 px-0.5 text-center flex flex-col items-center justify-center min-w-0">
                <h3 className="font-serif text-xs font-medium text-foreground tracking-tight leading-snug line-clamp-2 group-hover:text-primary transition-colors text-center w-full">
                  {walk.title || label}
                </h3>
                <span className="font-mono text-[9px] text-muted-foreground/70 tracking-wider uppercase mt-1 block text-center">
                  {startTimeStr}
                </span>
              </div>
            </div>
          </Link>

          {/* Floating 3-dot dropdown button for mobile/touch or quick click */}
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-background/85 backdrop-blur-sm border border-border/40 shadow-xs text-foreground hover:bg-background cursor-pointer"
                  aria-label="Walk actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={openCoverModal}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Change cover</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openShareModal}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4 text-emerald-500" />
                  <span>Share expedition</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openDeleteModal}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete walk</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>

        {/* Right-click Context Menu */}
        <ContextMenuContent>
          <ContextMenuItem
            onClick={openCoverModal}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4 text-primary" />
            <span>Change cover</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={openShareModal}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4 text-emerald-500" />
            <span>Share expedition</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={openDeleteModal}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete walk</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Hidden File Input for Custom Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. Change Cover Modal (Upload + 25 Hairline Covers) */}
      <Dialog open={isCoverModalOpen} onOpenChange={setIsCoverModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-normal">Choose Walk Cover</DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Select a natural element illustration or upload your own field photograph.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4">
            {/* 1st Option: Upload Custom Image */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center justify-center aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary bg-muted/20 hover:bg-primary/5 p-4 text-center transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <span className="mt-3 text-xs font-medium text-foreground">Upload Image</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WebP</span>
            </button>

            {/* The rest: 25 Hairline Covers from NATURAL_COVERS */}
            {NATURAL_COVERS.map((cover) => {
              const isSelected =
                walk.coverId === cover.id ||
                (!walk.coverId && !walk.coverImage && naturalCover.id === cover.id);

              return (
                <button
                  key={cover.id}
                  type="button"
                  onClick={() => handleSelectHairlineCover(cover.id)}
                  className={cn(
                    'group relative flex flex-col items-center justify-between aspect-[3/4] rounded-xl border p-2.5 text-center transition-all cursor-pointer bg-card hover:border-primary/50 hover:shadow-xs',
                    isSelected ? 'border-primary ring-2 ring-primary/25' : 'border-border/40'
                  )}
                >
                  <div className="w-full flex-1 flex items-center justify-center p-1">
                    <CoverArt cover={cover} className="w-full h-full text-foreground/80 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="w-full pt-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground group-hover:text-foreground truncate text-left">
                      {cover.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Share Modal (Offline-first Web Share & Markdown / JSON copy) */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-normal">Share Expedition</DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Because Treads runs local-first without an external database, you can copy this expedition card or export the data directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl border border-border bg-muted/30 font-sans text-xs space-y-1.5 whitespace-pre-line text-foreground/90 leading-relaxed">
              {expeditionSummaryText}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={handleCopySummary}
                className="gap-2 text-xs h-10 cursor-pointer"
              >
                {shareCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                <span>{shareCopied ? 'Copied' : 'Copy Text'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportJson}
                className="gap-2 text-xs h-10 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </Button>
            </div>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="secondary"
                onClick={handleNativeShare}
                className="w-full gap-2 text-xs h-10 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Device Share Menu</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-foreground">
              Delete Walk Session
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to delete this expedition? All route telemetry, finds, and audio notes recorded during this walk will be removed from your device.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteWalk}
              className="text-xs cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Walk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
