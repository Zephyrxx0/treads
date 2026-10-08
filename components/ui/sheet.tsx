'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = BaseDialog.Root;
export const SheetPortal = BaseDialog.Portal;

export interface SheetTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseDialog.Trigger>, 'render'> {
  asChild?: boolean;
  render?: React.ReactElement<Record<string, unknown>> | ((props: any, state: any) => React.ReactElement);
}

export const SheetTrigger = React.forwardRef<HTMLElement, SheetTriggerProps>(
  ({ asChild, children, render, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <BaseDialog.Trigger
          ref={ref}
          render={children as React.ReactElement<Record<string, unknown>>}
          {...props}
        />
      );
    }
    return (
      <BaseDialog.Trigger ref={ref} render={render} {...props}>
        {children}
      </BaseDialog.Trigger>
    );
  }
);
SheetTrigger.displayName = 'SheetTrigger';

export interface SheetCloseProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseDialog.Close>, 'render'> {
  asChild?: boolean;
  render?: React.ReactElement<Record<string, unknown>> | ((props: any, state: any) => React.ReactElement);
}

export const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ asChild, children, render, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <BaseDialog.Close
          ref={ref}
          render={children as React.ReactElement<Record<string, unknown>>}
          {...props}
        />
      );
    }
    return (
      <BaseDialog.Close ref={ref} render={render} {...props}>
        {children}
      </BaseDialog.Close>
    );
  }
);
SheetClose.displayName = 'SheetClose';

export const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-card p-6 shadow-xl transition ease-in-out duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 text-card-foreground',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-border data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full',
        bottom:
          'inset-x-0 bottom-0 rounded-t-[1rem] border-t border-border data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-border data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l border-border data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof BaseDialog.Popup>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <BaseDialog.Popup
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <BaseDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </SheetPortal>
  )
);
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

export const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground font-sans', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';
