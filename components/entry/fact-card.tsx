'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  ExternalLink,
  Volume2,
  AlertTriangle,
  BookOpen,
  Quote,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { FactAudioPlayer } from '@/components/speech/fact-audio-player';

export interface FactData {
  summary: string;
  facts: Array<{ sentenceNumber: number; text: string }>;
  lookClosely?: string;
  sourceUrl: string;
  sentences?: Array<{ index: number; text: string }>;
}

export interface FactCardProps {
  factsData?: FactData | null;
  speciesName?: string;
  className?: string;
  isUnidentified?: boolean;
  isLoading?: boolean;
}

export function FactCard({
  factsData,
  speciesName,
  className,
  isUnidentified = false,
  isLoading = false,
}: FactCardProps) {
  if (isUnidentified) {
    return (
      <Card
        className={`p-6 border-dashed border-border/80 bg-muted/20 text-center space-y-3 ${className || ''}`}
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Unidentified Specimen</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Confirm a species identification to generate verified natural history notes and
            Wikipedia citations.
          </p>
        </div>
      </Card>
    );
  }

  if (!factsData) {
    if (isLoading) {
      return (
        <Card
          className={`p-6 border-dashed border-border/80 bg-muted/20 text-center space-y-2 ${className || ''}`}
        >
          <Sparkles className="w-6 h-6 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-sm font-medium text-foreground">
            Fact card is generating for {speciesName || 'this specimen'}...
          </p>
          <p className="text-xs text-muted-foreground">
            Connecting to Wikipedia to extract verified biology notes and citations.
          </p>
        </Card>
      );
    }

    return (
      <Card
        className={`p-6 border-dashed border-border/80 bg-muted/20 text-center space-y-2 ${className || ''}`}
      >
        <BookOpen className="w-6 h-6 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Field notes unavailable for {speciesName || 'this specimen'}
        </p>
        <p className="text-xs text-muted-foreground">
          Could not retrieve verified Wikipedia natural history data for this taxon.
        </p>
      </Card>
    );
  }

  const { summary, facts, sourceUrl, sentences = [] } = factsData;

  const getSourceSentence = (sentenceNumber: number): string => {
    const found = sentences.find((s) => s.index === sentenceNumber);
    return found?.text || `Cited from sentence #${sentenceNumber} of the Wikipedia article.`;
  };

  return (
    <Card
      className={`border-border/80 bg-card/95 shadow-md backdrop-blur-xs space-y-4 ${className || ''}`}
    >
      <CardHeader className="p-5 pb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              Natural History & Facts
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="text-[11px] font-mono border-border/60 text-muted-foreground"
          >
            CC BY-SA 4.0
          </Badge>
        </div>

        {/* Lead Summary */}
        <p className="text-sm text-foreground/90 leading-relaxed pt-1">{summary}</p>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-3">
        {/* Look Closely Sensory Field Prompt */}
        {factsData.lookClosely && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground">
            <div className="p-1 rounded-md bg-primary/20 text-primary shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Look Closely
              </span>
              <p className="text-xs leading-relaxed font-medium text-foreground/90">
                {factsData.lookClosely}
              </p>
            </div>
          </div>
        )}

        {/* Grounded Cited Facts List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key Field Notes
          </h4>
          <ul className="space-y-2 text-xs text-foreground/80 leading-normal">
            {facts.map((fact, i) => (
              <li
                key={`fact-${fact.sentenceNumber}-${i}`}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/40"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span>{fact.text} </span>

                  {/* Interactive Citation Pill */}
                  <Popover>
                    <PopoverTrigger
                      className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-primary/15 text-primary hover:bg-primary/25 text-[10px] font-mono font-semibold ml-1 cursor-pointer transition-colors align-baseline"
                      aria-label={`Citation ${fact.sentenceNumber}: view source sentence`}
                    >
                      [{fact.sentenceNumber}]
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 space-y-2 bg-popover/95 backdrop-blur-md border-border shadow-xl">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Quote className="w-3.5 h-3.5" />
                        <span>Verbatim Wikipedia Extract [Sentence #{fact.sentenceNumber}]</span>
                      </div>
                      <p className="text-xs text-foreground font-sans italic leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/40">
                        &ldquo;{getSourceSentence(fact.sentenceNumber)}&rdquo;
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Extracted directly from the English Wikipedia lead section.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Mandatory Safety Disclaimer (FACT-05, D-10) */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            <strong className="font-semibold">Safety Notice:</strong> This is an AI field estimate.
            Don&apos;t eat, touch, or ingest anything based on this app.
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-4 mt-1 flex flex-col items-stretch gap-3 border-t border-border/50 sm:flex-row sm:items-center sm:justify-between">
        {/* Wikipedia External Link */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <span>Open in Wikipedia</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Voice Narration Audio Player (Phase 4, per SPK-01, D-09, D-10) */}
        <FactAudioPlayer
          text={[
            speciesName ? `${speciesName}.` : '',
            summary,
            ...facts.map((f, i) => `Fact ${i + 1}: ${f.text}`),
          ]
            .filter(Boolean)
            .join(' ')}
          className="w-full justify-start sm:w-auto"
        />
      </CardFooter>
    </Card>
  );
}
