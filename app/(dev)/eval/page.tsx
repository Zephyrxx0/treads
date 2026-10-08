'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FixtureCard } from '@/components/eval/fixture-card';
import { EvalMetrics } from '@/components/eval/eval-metrics';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { seedDatabase, clearDatabase } from '@/lib/db-seed';
import {
  Play,
  ArrowLeft,
  Sparkles,
  Database,
  Trash2,
  CheckCircle2,
  Loader2,
  Filter,
  Check,
} from 'lucide-react';
import type { EvalFixture, FixtureResult, EvalSummaryMetrics } from '@/app/api/eval/run/route';

export default function EvalPage() {
  const [fixtures, setFixtures] = useState<EvalFixture[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, FixtureResult>>({});
  const [metrics, setMetrics] = useState<EvalSummaryMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    async function loadFixtures() {
      try {
        const res = await fetch('/eval-fixtures/fixtures.json');
        if (res.ok) {
          const data: EvalFixture[] = await res.json();
          setFixtures(data);
        }
      } catch (err) {
        console.error('Failed to load fixtures manifest:', err);
      }
    }

    loadFixtures();
  }, []);

  const runBatchEvaluation = async () => {
    setIsRunning(true);
    setProgressPercent(15);
    setResultsMap({});
    setMetrics(null);

    try {
      // Small visual progress pulse
      const progressTimer = setInterval(() => {
        setProgressPercent((prev) => (prev < 85 ? prev + 15 : prev));
      }, 300);

      const res = await fetch('/api/eval/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      clearInterval(progressTimer);

      if (res.ok) {
        const data = await res.json();
        setProgressPercent(100);

        if (data.results) {
          const map: Record<string, FixtureResult> = {};
          for (const item of data.results as FixtureResult[]) {
            map[item.id] = item;
          }
          setResultsMap(map);
        }

        if (data.metrics) {
          setMetrics(data.metrics);
        }
      } else {
        console.error('Eval run returned error:', await res.text());
        setProgressPercent(0);
      }
    } catch (err) {
      console.error('Batch evaluation failed:', err);
      setProgressPercent(0);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSeedDb = async () => {
    setDbLoading(true);
    setDbStatus(null);
    try {
      const data = await seedDatabase();
      setDbStatus(`Seeded 1 walk, ${data.entries.length} entries, ${data.notes.length} notes.`);
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
      setDbStatus('Dexie tables cleared.');
    } catch (err: any) {
      setDbStatus(`Clear failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDbLoading(false);
    }
  };

  const filteredFixtures = useMemo(() => {
    if (activeCategory === 'all') return fixtures;
    return fixtures.filter((f) => f.category === activeCategory);
  }, [fixtures, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Fixtures', count: fixtures.length },
    { id: 'plant', label: 'Plants', count: fixtures.filter((f) => f.category === 'plant').length },
    { id: 'bird', label: 'Birds', count: fixtures.filter((f) => f.category === 'bird').length },
    { id: 'insect', label: 'Insects', count: fixtures.filter((f) => f.category === 'insect').length },
    { id: 'non-organism', label: 'Non-organisms', count: fixtures.filter((f) => f.category === 'non-organism').length },
    { id: 'person', label: 'People', count: fixtures.filter((f) => f.category === 'person').length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
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
                  Evaluation Benchmark Dashboard
                </h1>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  EVAL-01
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                30-Fixture taxonomic identification accuracy (≥70%) & honest refusal rate (≥90%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/spike">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Back to /spike
              </Button>
            </Link>

            <Button
              onClick={runBatchEvaluation}
              disabled={isRunning || fixtures.length === 0}
              size="sm"
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running Batch ({progressPercent}%)...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Batch Evaluation
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar Header */}
      {isRunning && (
        <div className="w-full bg-muted">
          <Progress value={progressPercent} className="h-1.5 rounded-none" />
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6 w-full">
        {/* Metric Cards Top Section */}
        <EvalMetrics metrics={metrics} isRunning={isRunning} />

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground mr-1" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer border ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border/80 hover:bg-muted'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground font-mono">
            Showing {filteredFixtures.length} of {fixtures.length} fixtures
          </span>
        </div>

        {/* 30 Fixtures Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              result={resultsMap[fixture.id]}
            />
          ))}
        </div>

        {/* Dexie Dev Controls */}
        <Card className="border-border/80 shadow-xs mt-4">
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
              State management for testing offline journal, walk sessions, and specimen caching.
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
              Seed Dexie DB
            </Button>

            <Button
              onClick={handleClearDb}
              disabled={dbLoading}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Dexie DB
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
