'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';

interface Candidate {
  scientificName: string;
  commonName: string;
  kind: string;
  confidence: 'Likely' | 'Possible' | 'Unsure';
  wikipediaTitle: string;
}

interface AiSpikeResult {
  success: boolean;
  mock?: boolean;
  warning?: string;
  modelUsed?: string;
  latencyMs?: number;
  isLivingOrganism?: boolean;
  refusalReason?: string;
  candidates?: Candidate[];
  error?: string;
}

const SAMPLE_PROMPTS = [
  {
    label: 'White Oak Leaf (Photo)',
    prompt: 'A broad lobed leaf with rounded lobes from an eastern North American deciduous tree.',
    sampleType: 'plant',
  },
  {
    label: 'House Sparrow (Photo)',
    prompt: 'Small brown and grey passerine bird perched on a wooden garden fence.',
    sampleType: 'bird',
  },
  {
    label: 'Ceramic Coffee Mug (Non-organism)',
    prompt: 'A blue ceramic mug with hot tea sitting on an office desk.',
    sampleType: 'non-organism',
  },
];

export function SpikeAiRunner() {
  const [promptText, setPromptText] = useState(SAMPLE_PROMPTS[0].prompt);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSpikeResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setImageFileName(null);
  };

  const runIdentification = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/spike/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          image: uploadedImage || undefined,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        error: err?.message || 'Failed to execute AI candidate spike',
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadgeColor = (confidence: 'Likely' | 'Possible' | 'Unsure') => {
    switch (confidence) {
      case 'Likely':
        return 'bg-emerald-600 text-white';
      case 'Possible':
        return 'bg-amber-500 text-white';
      case 'Unsure':
        return 'bg-slate-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="flex flex-col h-full border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold">Google AI Studio Candidate Runner</CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Auto-detects API key with mock fallback & Gemini Flash vision routing
          </CardDescription>
        </div>

        {result && (
          <div>
            {result.mock ? (
              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10">
                Mock Fixture Mode
              </Badge>
            ) : (
              <Badge variant="default" className="bg-emerald-600 text-white">
                Live AI Studio
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 p-4 pt-0">
        {/* Sample selection chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Presets:</span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPromptText(p.prompt)}
              className="text-xs px-2.5 py-1 rounded-md bg-muted/80 hover:bg-muted text-foreground transition-colors cursor-pointer border border-border/40"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe the organism or enter observation details..."
            rows={3}
            className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring resize-none font-sans"
          />

          {/* Image Upload Row */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input bg-background hover:bg-muted/50 cursor-pointer transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              <span>{imageFileName ? 'Change Photo' : 'Attach Photo (Triggers Vision)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {uploadedImage && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {imageFileName}
                </span>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs text-destructive hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            <Button
              onClick={runIdentification}
              disabled={loading}
              size="sm"
              className="ml-auto h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Candidates...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run Identification Spike
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Output area */}
        {result && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
            {/* Meta status bar */}
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Model:</span>
                <code className="text-[11px] bg-background px-1.5 py-0.5 rounded border border-border/50">
                  {result.modelUsed ?? 'default'}
                </code>
              </div>

              {result.latencyMs !== undefined && (
                <span className="font-mono text-[11px]">
                  Latency: {result.latencyMs}ms
                </span>
              )}
            </div>

            {/* Warning or Refusal Alert */}
            {result.warning && (
              <div className="flex items-center gap-2 p-2 text-xs rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{result.warning}</span>
              </div>
            )}

            {result.isLivingOrganism === false && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Identification Refused (Honest Safety Guard)</p>
                  <p className="text-muted-foreground mt-0.5">
                    {result.refusalReason || "Can't tell, try a closer shot or subject is not a wild organism."}
                  </p>
                </div>
              </div>
            )}

            {/* Candidate cards */}
            {result.candidates && result.candidates.length > 0 && (
              <div className="space-y-2 mt-1">
                <span className="text-xs font-medium text-foreground">
                  Extracted Candidates ({result.candidates.length}):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-card border border-border/80 flex flex-col justify-between shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-sans italic font-medium text-sm text-foreground">
                            {cand.scientificName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cand.commonName} • <span className="capitalize">{cand.kind}</span>
                          </p>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${getConfidenceBadgeColor(cand.confidence)}`}>
                          {cand.confidence}
                        </Badge>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[160px]">
                          Wiki: {cand.wikipediaTitle}
                        </span>
                        <a
                          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(cand.wikipediaTitle)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-0.5 text-primary hover:underline"
                        >
                          <span>Article</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.error && (
              <div className="p-3 text-xs text-destructive rounded bg-destructive/10 border border-destructive/20">
                {result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
