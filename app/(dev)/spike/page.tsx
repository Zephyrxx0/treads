'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SpikeMap } from '@/components/map/spike-map';
import { SpikeAiRunner } from '@/components/ai/spike-ai-runner';
import { SpikeSpeechRunner } from '@/components/speech/spike-speech-runner';
import { seedDatabase, clearDatabase } from '@/lib/db-seed';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database, Trash2, Sparkles, Compass, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function SpikePage() {
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  const handleSeedDb = async () => {
    setDbLoading(true);
    setDbStatus(null);
    try {
      const data = await seedDatabase();
      setDbStatus(`Database seeded: 1 walk, ${data.entries.length} entries, ${data.notes.length} notes.`);
    } catch (err: any) {
      setDbStatus(`Seed failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDbLoading(false);
    }
  };

  const handleClearDb = async () => {
    setDbLoading(true);
    setDbStatus(null);
    try {
      await clearDatabase();
      setDbStatus('Database cleared: All Dexie tables wiped.');
    } catch (err: any) {
      setDbStatus(`Clear failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-serif tracking-tight text-foreground">
                  Day 1 Verification Spikes
                </h1>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  Playground
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                MapLibre tile canvas, Google AI Studio runner, Speech fallback & Dexie controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/eval">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Go to /eval Benchmark
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6 w-full">
        {/* Top 2-Column Grid: Map and AI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          {/* Panel 1: MapLibre Canvas */}
          <div className="h-full min-h-[460px]">
            <SpikeMap />
          </div>

          {/* Panel 2: AI Candidate Runner */}
          <div className="h-full min-h-[460px]">
            <SpikeAiRunner />
          </div>
        </div>

        {/* Panel 3: Speech Fallback Runner */}
        <div className="w-full">
          <SpikeSpeechRunner />
        </div>

        {/* Database Dev Controls Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">IndexedDB (Dexie) Dev Controls</CardTitle>
              </div>
              {dbStatus && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{dbStatus}</span>
                </div>
              )}
            </div>
            <CardDescription className="text-xs">
              Quickly seed realistic walks, entries, and naturalist notes or reset local state.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 pt-0">
            <Button
              onClick={handleSeedDb}
              disabled={dbLoading}
              size="sm"
              className="gap-1.5 text-xs cursor-pointer"
            >
              {dbLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Seed Database (1 Walk, 3 Entries, 2 Notes)
            </Button>

            <Button
              onClick={handleClearDb}
              disabled={dbLoading}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Database
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
