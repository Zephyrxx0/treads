'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = BaseDialog.Root;
export const DialogPortal = BaseDialog.Portal;

export interface DialogTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseDialog.Trigger>, 'render'> {
  asChild?: boolean;
  render?: React.ReactElement<Record<string, unknown>> | ((props: any, state: any) => React.ReactElement);
}

export const DialogTrigger = React.forwardRef<HTMLElement, DialogTriggerProps>(
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
DialogTrigger.displayName = 'DialogTrigger';

export interface DialogCloseProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseDialog.Close>, 'render'> {
  asChild?: boolean;
  render?: React.ReactElement<Record<string, unknown>> | ((props: any, state: any) => React.ReactElement);
}

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
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
DialogClose.displayName = 'DialogClose';

export const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> {
  hideCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, hideCloseButton = false, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <BaseDialog.Popup
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-[70] grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 text-card-foreground shadow-xl duration-200 rounded-[var(--radius)] transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <BaseDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </DialogPortal>
  )
);
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({
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
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight font-sans text-foreground',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
