'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Target, Clock, ShieldCheck, Activity } from 'lucide-react';
import type { EvalSummaryMetrics } from '@/app/api/eval/run/route';

interface EvalMetricsProps {
  metrics: EvalSummaryMetrics | null;
  isRunning: boolean;
}

export function EvalMetrics({ metrics, isRunning }: EvalMetricsProps) {
  const isAccuracyPassing = (metrics?.accuracy ?? 0) >= 70;
  const isRefusalPassing = (metrics?.refusalRate ?? 0) >= 90;
  const isOverallPassing = metrics?.overallStatus === 'PASS';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Accuracy Card */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Target className="w-4 h-4 text-primary" /> Top-3 Accuracy
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              Target: ≥70%
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {metrics ? `${metrics.accuracy}%` : '--'}
            </span>
            {metrics && (
              <Badge
                className={`text-[10px] px-1.5 py-0.5 ${
                  isAccuracyPassing
                    ? 'bg-emerald-600 text-white'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {isAccuracyPassing ? 'Target Met' : 'Below Target'}
              </Badge>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {metrics
              ? `${metrics.organismPassed} of ${metrics.organismCount} organisms identified`
              : 'Evaluates top-3 taxonomic candidates'}
          </p>
        </CardContent>
      </Card>

      {/* Refusal Rate Card */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" /> Honest Refusal Rate
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              Target: ≥90%
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {metrics ? `${metrics.refusalRate}%` : '--'}
            </span>
            {metrics && (
              <Badge
                className={`text-[10px] px-1.5 py-0.5 ${
                  isRefusalPassing
                    ? 'bg-emerald-600 text-white'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {isRefusalPassing ? 'Target Met' : 'Below Target'}
              </Badge>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {metrics
              ? `${metrics.refusalPassed} of ${metrics.refusalCount} non-living/people refused`
              : 'Verifies honesty on objects & humans'}
          </p>
        </CardContent>
      </Card>

      {/* Latency Card */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Average Latency
            </span>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              Response Time
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {metrics ? `${metrics.avgLatencyMs}ms` : '--'}
            </span>
            <span className="text-xs text-muted-foreground">per item</span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {metrics ? `Across ${metrics.totalCount} fixtures executed` : 'Response roundtrip benchmark'}
          </p>
        </CardContent>
      </Card>

      {/* Overall Verdict Card */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" /> Benchmark Verdict
            </span>
            <Badge variant="outline" className="text-[10px]">
              EVAL-01
            </Badge>
          </div>

          <div className="flex items-center gap-2 my-auto">
            {!metrics ? (
              <span className="text-sm font-medium text-muted-foreground italic">
                Awaiting batch execution...
              </span>
            ) : isOverallPassing ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                <span className="text-2xl font-black text-emerald-600 tracking-wider">
                  PASS
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-7 h-7 text-destructive" />
                <span className="text-lg font-bold text-destructive tracking-wide">
                  NEEDS CALIBRATION
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {isOverallPassing
              ? 'Accuracy ≥70% & Refusal ≥90% satisfied'
              : 'Requires ≥70% accuracy & ≥90% refusal rate'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
