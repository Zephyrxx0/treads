'use client';

import * as React from 'react';
import Link from 'next/link';
import { Camera, Mic, Compass, Database, ShieldCheck, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConsent } from '@/hooks/use-consent';

const PRIVACY_PILLARS = [
  {
    icon: Camera,
    title: 'AI Vision Identification',
    description:
      'Photos sent to Google AI Studio for taxonomic matching; never retained by third-party servers.',
  },
  {
    icon: Mic,
    title: 'Voice Transcription',
    description:
      'Audio sent to ElevenLabs for transcription; never stored for AI model training.',
  },
  {
    icon: Compass,
    title: 'Pedestrian Routing',
    description:
      'Coarse coordinates sent to OpenRouteService for loop suggestions; exact tracks stay on device.',
  },
  {
    icon: Database,
    title: '100% On-Device Journal',
    description:
      "Field journal, species records, high-res photos, and notes remain strictly in your browser's IndexedDB.",
  },
];

export function ConsentModal() {
  const { mounted, isLoading, hasConsented, acceptConsent } = useConsent();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(true);

  // Avoid SSR hydration flash: only show once mounted and loaded
  if (!mounted || isLoading) {
    return null;
  }

  // Already accepted consent
  if (hasConsented) {
    return null;
  }

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await acceptConsent();
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to accept consent:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        hideCloseButton={true}
        className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 border-border/80 shadow-2xl bg-card"
      >
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/10">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy & Data Consent
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-serif tracking-tight text-foreground">
            Welcome to Treads
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Before you set foot on the trail, here is exactly how your data is handled. Treads is designed with privacy and local ownership as foundational principles.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-3">
          {PRIVACY_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 rounded-[var(--radius)] border border-border/60 bg-muted/30 p-3.5 transition-colors"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground font-sans">
                    {pillar.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[var(--radius)] bg-secondary/20 border border-secondary/30 p-3 text-xs text-muted-foreground">
          <p>
            Accepting requests durable browser storage (<code className="font-mono text-[11px] text-foreground">navigator.storage.persist()</code>) to protect your offline field records from automatic browser cache eviction.
          </p>
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/50">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground text-center sm:text-left py-1"
          >
            Read Privacy Details
          </Link>
          <Button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground font-medium shadow-md hover:opacity-95"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'I Understand & Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
