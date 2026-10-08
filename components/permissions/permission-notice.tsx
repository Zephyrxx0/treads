'use client';

import * as React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PermissionNoticeProps {
  message: string;
  onRetry?: () => void;
  actionText?: string;
  className?: string;
}

export function PermissionNotice({
  message,
  onRetry,
  actionText = 'Retry',
  className,
}: PermissionNoticeProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius)] border border-amber-500/30 bg-amber-50/70 p-3.5 text-amber-950 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="shrink-0 text-xs h-7 px-2.5 gap-1.5 border-amber-600/30 text-amber-900 hover:bg-amber-100/50 dark:border-amber-400/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          <RotateCcw className="h-3 w-3" />
          {actionText}
        </Button>
      )}
    </div>
  );
}
