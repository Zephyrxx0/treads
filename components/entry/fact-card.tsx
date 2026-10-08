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
} from 'lucide-react';

export interface FactData {
  summary: string;
  facts: Array<{ sentenceNumber: number; text: string }>;
  sourceUrl: string;
  sentences?: Array<{ index: number; text: string }>;
}

export interface FactCardProps {
  factsData?: FactData | null;
  speciesName?: string;
  className?: string;
}

export function FactCard({ factsData, speciesName, className }: FactCardProps) {
  if (!factsData) {
    return (
      <Card className="p-6 border-dashed border-border/80 bg-muted/20 text-center space-y-2">
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

  const { summary, facts, sourceUrl, sentences = [] } = factsData;

  const getSourceSentence = (sentenceNumber: number): string => {
    const found = sentences.find((s) => s.index === sentenceNumber);
    return found?.text || `Cited from sentence #${sentenceNumber} of the Wikipedia article.`;
  };

  return (
    <Card className={`border-border/80 bg-card/95 shadow-md backdrop-blur-xs space-y-4 ${className || ''}`}>
      <CardHeader className="p-5 pb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#F35C2B]/10 text-[#F35C2B]">
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
        <p className="text-sm text-foreground/90 leading-relaxed pt-1">
          {summary}
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-3">
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
                <span className="w-1.5 h-1.5 rounded-full bg-[#F35C2B] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span>{fact.text} </span>

                  {/* Interactive Citation Pill */}
                  <Popover>
                    <PopoverTrigger
                      className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-[#F35C2B]/15 text-[#F35C2B] hover:bg-[#F35C2B]/25 text-[10px] font-mono font-semibold ml-1 cursor-pointer transition-colors align-baseline"
                      aria-label={`Citation ${fact.sentenceNumber}: view source sentence`}
                    >
                      [{fact.sentenceNumber}]
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 space-y-2 bg-popover/95 backdrop-blur-md border-border shadow-xl">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F35C2B]">
                        <Quote className="w-3.5 h-3.5" />
                        <span>Verbatim Wikipedia Extract [Sentence #{fact.sentenceNumber}]</span>
                      </div>
                      <p className="text-xs text-foreground font-serif italic leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/40">
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
            <strong className="font-semibold">Safety Notice:</strong> This is an AI field estimate. Don&apos;t eat, touch, or ingest anything based on this app.
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-wrap items-center justify-between gap-2 border-t border-border/50">
        {/* Wikipedia External Link */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <span>Open in Wikipedia</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Voice Narration Scaffold (Phase 4 placeholder) */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            className="h-8 text-xs gap-1.5 rounded-lg opacity-60 cursor-not-allowed"
            title="Voice narration companion is planned for Phase 4"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Listen</span>
          </Button>
          <span className="text-[10px] text-muted-foreground font-mono">
            Phase 4
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

