'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, Camera, Mic, Compass, Database, HardDrive, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Privacy" title="Data architecture" width="narrow">
      <div className="space-y-10">
        <div className="space-y-3">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            The phone is a lens, not a feed.
          </h2>
          <p className="font-sans text-base text-muted-foreground leading-relaxed">
            Treads is built for mindful presence outdoors. We treat private field notes, voice recordings, and spatial trails with absolute local sovereignty. Here is our unambiguous data contract.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-lg text-foreground">100% On-Device Journal</h3>
                <p className="font-mono text-xs text-muted-foreground">Dexie & IndexedDB Architecture</p>
              </div>
            </div>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Your walking sessions, GPS track breadcrumbs, species logs, audio recordings, and field notes are stored strictly in your browser’s IndexedDB database. There are no tracking pixels, no user telemetry backends, and no remote databases storing your strolls.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-lg text-foreground">Client-Side EXIF & Location Stripping</h3>
                <p className="font-mono text-xs text-muted-foreground">HTML5 Canvas Re-rasterization</p>
              </div>
            </div>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              When you capture a specimen, your photo is re-rendered to an in-memory Canvas element and scaled to a maximum dimension of 1024 pixels. All GPS coordinates, camera model serials, and EXIF metadata embedded by your phone hardware are permanently scrubbed before the image is evaluated.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-lg text-foreground">Ephemerality in AI Inference</h3>
                <p className="font-mono text-xs text-muted-foreground">Google AI Studio & ElevenLabs</p>
              </div>
            </div>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Photos sent to Google AI Studio are evaluated exclusively for taxonomic matching and are not retained for model training. Voice notes sent to ElevenLabs Scribe are transcribed in real-time and immediately discarded by server pipelines.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-lg text-foreground">Coarse Routing & Tile Privacy</h3>
                <p className="font-mono text-xs text-muted-foreground">OpenFreeMap & OpenRouteService</p>
              </div>
            </div>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Map tiles are rendered from OpenFreeMap and OpenStreetMap open data. When requesting a pedestrian loop route, only a single starting coordinate rounded to one decimal place is dispatched. Your continuous GPS breadcrumbs stay on your device.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Link href="/">
            <Button variant="outline" size="sm">
              Return Home
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="default" size="sm">
              Manage Storage & Vault Export
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

