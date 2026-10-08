import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:opacity-90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:opacity-90',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:opacity-90',
        outline:
          'border-border text-foreground',
        success:
          'border-transparent bg-emerald-600 text-white dark:bg-emerald-700',
        warning:
          'border-transparent bg-amber-500 text-white dark:bg-amber-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
