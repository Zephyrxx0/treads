'use client';

import * as React from 'react';
import { Compass, Footprints, Sparkles, SlidersHorizontal, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { MotionView } from '@/components/motion/motion-view';

export default function HomePage() {
  const [progressVal, setProgressVal] = React.useState(68);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Footprints className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">
                Treads
              </h1>
              <p className="font-serif text-xs text-muted-foreground">
                Field Walking & Specimen Journal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              Tangerin Dream
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero / Overview */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        <MotionView
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default">Foundation & Design System</Badge>
                <Badge variant="success">Next.js 16.4</Badge>
                <Badge variant="secondary">React 19.3</Badge>
              </div>
              <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Tangerin Dream Component Suite
              </h2>
              <p className="font-serif text-sm text-muted-foreground max-w-2xl">
                Zero-FOUC theme switching, shadcn Base UI primitives (@base-ui-components/react),
                motion accessibility with tab throttling, and warm terracotta tokens.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Sparkles className="h-4 w-4" />
                    Open Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Specimen Verification Dialog</DialogTitle>
                    <DialogDescription>
                      Base UI Dialog primitive styled with Tangerin Dream design tokens.
                      Smooth exit/enter animations and focus trapping.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 text-sm text-foreground">
                    <p className="font-serif">
                      Species candidates are cross-referenced with Wikipedia lead sections.
                      Consent and privacy gates are enforced before camera access.
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Dismiss</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="default">Confirm</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary">
                    <SlidersHorizontal className="h-4 w-4" />
                    Open Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Drawer Drawer Menu</SheetTitle>
                    <SheetDescription>
                      Base UI Sheet component for mobile menus and walk telemetry details.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-4 text-sm">
                    <div className="rounded-lg border border-border p-3 bg-muted/20">
                      <p className="font-sans font-semibold">Walk Mode: Free-form</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        GPS filter active: accuracy &lt; 35m, displacement &gt; 5m.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3 bg-muted/20">
                      <p className="font-sans font-semibold">Audio Engine</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ElevenLabs Scribe with browser speech recognition fallback.
                      </p>
                    </div>
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full">Close Drawer</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </MotionView>

        {/* Component Showcase Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Button Variants Card */}
          <Card>
            <CardHeader>
              <CardTitle>Button Variants & Sizes</CardTitle>
              <CardDescription>
                Base UI buttons with class-variance-authority and Tangerin Dream colors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="outline" aria-label="Compass icon">
                  <Compass className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges & Statuses Card */}
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>
                Semantic state indicators for taxonomy confidence and telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Primary (#ff4000)</Badge>
                <Badge variant="secondary">Secondary (#faaa8d)</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="success">Verified (Taxon)</Badge>
                <Badge variant="warning">Low Accuracy</Badge>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Confidence Indicators:</p>
                <div className="flex gap-2">
                  <Badge variant="success">Likely (94%)</Badge>
                  <Badge variant="warning">Possible (61%)</Badge>
                  <Badge variant="destructive">Unsure</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress & Live Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Base UI Progress</CardTitle>
              <CardDescription>
                Live progress bar with accessible aria attributes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Species Hunt Challenge</span>
                  <span>{progressVal}%</span>
                </div>
                <Progress value={progressVal} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgressVal((p) => Math.max(0, p - 15))}
                >
                  -15%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgressVal((p) => Math.min(100, p + 15))}
                >
                  +15%
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setProgressVal(100)}
                >
                  Complete (100%)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Color Tokens Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Tangerin Dream Palette</CardTitle>
              <CardDescription>
                Active CSS custom property tokens reflecting light/dark state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-background">
                  <div className="h-4 w-4 rounded-full border border-border bg-background" />
                  <span className="font-mono">--background</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-card">
                  <div className="h-4 w-4 rounded-full border border-border bg-card" />
                  <span className="font-mono">--card</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-primary text-primary-foreground">
                  <div className="h-4 w-4 rounded-full bg-primary-foreground" />
                  <span className="font-mono">--primary</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-secondary text-secondary-foreground">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  <span className="font-mono">--secondary</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-muted text-muted-foreground">
                  <div className="h-4 w-4 rounded-full bg-muted-foreground" />
                  <span className="font-mono">--muted</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-border text-foreground">
                  <div className="h-4 w-4 rounded-full bg-foreground" />
                  <span className="font-mono">--border</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground font-serif">
              Amaranth (Sans) &bull; Noto Serif (Serif) &bull; 0.5rem Radius
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
