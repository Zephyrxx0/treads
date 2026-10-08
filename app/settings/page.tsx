'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  HardDrive,
  Download,
  Volume2,
  Vibrate,
  Moon,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { db, getUserSettings, UserSettings, DEFAULT_SETTINGS } from '@/lib/db';
import { generateObsidianVaultZip, downloadBlob } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const router = useRouter();

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Storage Stats State
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<{ usageMB: string; quotaMB: string } | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  // Danger Zone Modal State
  const [dangerDialogOpen, setDangerDialogOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  // Load settings and storage metrics on mount
  useEffect(() => {
    async function loadData() {
      try {
        const userSettings = await getUserSettings();
        setSettings(userSettings);

        if (typeof window !== 'undefined' && 'storage' in navigator) {
          if (navigator.storage.persisted) {
            const persisted = await navigator.storage.persisted();
            setIsPersisted(persisted);
          }

          if (navigator.storage.estimate) {
            const est = await navigator.storage.estimate();
            const usageMB = ((est.usage || 0) / (1024 * 1024)).toFixed(1);
            const quotaMB = ((est.quota || 0) / (1024 * 1024)).toFixed(0);
            setStorageEstimate({ usageMB, quotaMB });
          }
        }
      } catch (err) {
        console.error('Failed to load settings or storage metrics:', err);
      } finally {
        setLoadingSettings(false);
      }
    }

    loadData();
  }, []);

  const handleRequestPersistence = async () => {
    if (typeof window !== 'undefined' && navigator.storage?.persist) {
      try {
        const granted = await navigator.storage.persist();
        setIsPersisted(granted);
        if (granted) {
          await db.settings.put({
            ...settings,
            storagePersisted: true,
          });
          setSettings((prev) => ({ ...prev, storagePersisted: true }));
        }
      } catch (err) {
        console.error('Failed to request persistence:', err);
      }
    }
  };

  const handleToggleSound = async () => {
    const nextSound = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: nextSound };
    setSettings(updated);
    try {
      await db.settings.put(updated);
    } catch (err) {
      console.error('Failed to update sound setting:', err);
    }
  };

  const handleToggleHaptics = async () => {
    const nextHaptics = !settings.hapticsEnabled;
    const updated = { ...settings, hapticsEnabled: nextHaptics };
    setSettings(updated);
    try {
      await db.settings.put(updated);
    } catch (err) {
      console.error('Failed to update haptics setting:', err);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    setExportProgress(5);
    setExportStep('Initializing vault package...');
    setExportError(null);

    try {
      const zipBlob = await generateObsidianVaultZip((status) => {
        setExportProgress(status.percent);
        setExportStep(status.step);
      });

      const dateStr = new Date().toLocaleDateString('en-CA');
      const filename = `treads-vault-${dateStr}.zip`;
      downloadBlob(zipBlob, filename);
      setExportStep('Vault archive successfully downloaded!');
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err?.message || 'Failed to assemble Obsidian ZIP archive.');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 2500);
    }
  };

  const handleExecuteWipe = async () => {
    if (deleteInputText.trim() !== 'DELETE') return;
    setIsWiping(true);

    try {
      await db.transaction(
        'rw',
        db.walks,
        db.entries,
        db.notes,
        db.speechCache,
        db.settings,
        async () => {
          await db.walks.clear();
          await db.entries.clear();
          await db.notes.clear();
          await db.speechCache.clear();
          await db.settings.clear();
        }
      );

      setDangerDialogOpen(false);
      router.push('/');
    } catch (err) {
      console.error('Failed to clear database:', err);
      setIsWiping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-serif font-bold text-xl tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Storage & Backups Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#F35C2B]/10 text-[#F35C2B]">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Storage & Vault Export</CardTitle>
                <CardDescription className="text-xs font-serif">
                  Manage your offline local database and export to Obsidian
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Persistence Status */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Persistence Status</span>
                  {isPersisted ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]">
                      <ShieldCheck className="w-3 h-3" />
                      Persisted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 gap-1 text-[11px]">
                      <AlertTriangle className="w-3 h-3" />
                      Best Effort
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-serif text-muted-foreground">
                  {isPersisted
                    ? 'Browser storage is protected against automatic eviction.'
                    : 'Storage might be cleared by browser under disk pressure.'}
                </p>
              </div>

              {!isPersisted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPersistence}
                  className="text-xs font-semibold h-8"
                >
                  Protect Storage
                </Button>
              )}
            </div>

            {/* Storage Quota Estimate */}
            {storageEstimate && (
              <div className="text-xs font-serif text-muted-foreground flex items-center justify-between px-1">
                <span>Local database usage</span>
                <span className="font-mono font-medium text-foreground">
                  {storageEstimate.usageMB} MB / {storageEstimate.quotaMB} MB available
                </span>
              </div>
            )}

            {/* Export Action */}
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">Obsidian Naturalist Vault</span>
                  <p className="text-xs font-serif text-muted-foreground">
                    Download complete ZIP archive with Dataview markdown notes, full JPEGs, and audio clips.
                  </p>
                </div>

                <Button
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="rounded-xl bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white font-semibold gap-2 shadow-sm shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Packaging...' : 'Export Journal ZIP'}</span>
                </Button>
              </div>

              {/* Export Progress Bar */}
              {isExporting && (
                <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif text-muted-foreground">{exportStep}</span>
                    <span className="font-mono font-semibold text-[#F35C2B]">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}

              {exportError && (
                <p className="text-xs text-red-500 font-serif">
                  {exportError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sensory Preferences Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-muted text-foreground">
                <Sparkles className="w-5 h-5 text-[#F35C2B]" />
              </div>
              <div>
                <CardTitle className="text-lg">Field Experience</CardTitle>
                <CardDescription className="text-xs font-serif">
                  Sound, haptics, and visual aesthetics
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Audio Effects Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Audio Chimes (Cuelume)</div>
                  <p className="text-xs font-serif text-muted-foreground">
                    Play gentle synthesized chords on organism confirmation and milestone events
                  </p>
                </div>
              </div>

              <Button
                variant={settings.soundEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleSound}
                className={settings.soundEnabled ? 'bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white font-semibold text-xs' : 'text-xs'}
              >
                {settings.soundEnabled ? 'Enabled' : 'Muted'}
              </Button>
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Haptic Vibration</div>
                  <p className="text-xs font-serif text-muted-foreground">
                    Subtle physical vibration pulses on tap and hunt completion
                  </p>
                </div>
              </div>

              <Button
                variant={settings.hapticsEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleHaptics}
                className={settings.hapticsEnabled ? 'bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white font-semibold text-xs' : 'text-xs'}
              >
                {settings.hapticsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Color Mode</div>
                  <p className="text-xs font-serif text-muted-foreground">
                    Switch between Tangerin Dream light and dark appearances
                  </p>
                </div>
              </div>

              <ThemeToggle className="scale-110" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border border-red-500/40 bg-red-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-xs font-serif">
                  Irreversible actions for your local field data
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-xs font-serif text-muted-foreground leading-relaxed">
              Permanently purge all recorded walk routes, captured organism photos, confirmed species, and voice memos from this device.
            </p>

            <Button
              variant="destructive"
              onClick={() => {
                setDeleteInputText('');
                setDangerDialogOpen(true);
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-10 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Data</span>
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Two-Step Danger Zone Modal (SETT-01, Copywriting Contract) */}
      <Dialog open={dangerDialogOpen} onOpenChange={setDangerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete All Data</span>
            </DialogTitle>
            <DialogDescription className="font-serif text-sm text-muted-foreground leading-relaxed pt-2">
              Permanently delete all field walks, confirmed species entries, voice recordings, and cached speech? This cannot be undone. Type <strong className="text-foreground font-mono">DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <Input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteInputText}
              onChange={(e) => setDeleteInputText(e.target.value)}
              className="font-mono text-center tracking-wider"
              autoFocus
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              disabled={isWiping}
              onClick={() => setDangerDialogOpen(false)}
              className="w-full sm:w-auto text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteInputText.trim() !== 'DELETE' || isWiping}
              onClick={handleExecuteWipe}
              className="w-full sm:w-auto text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {isWiping ? 'Clearing database...' : 'Permanently Delete Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

