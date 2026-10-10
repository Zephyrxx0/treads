'use client';

import * as React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui-components/react';
import { cn } from '@/lib/utils';

export const ContextMenu = BaseContextMenu.Root;
export const ContextMenuGroup = BaseContextMenu.Group;

export interface ContextMenuTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseContextMenu.Trigger>, 'render'> {
  asChild?: boolean;
}

export const ContextMenuTrigger = React.forwardRef<HTMLElement, ContextMenuTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <BaseContextMenu.Trigger
          ref={ref as React.Ref<HTMLDivElement>}
          render={children as React.ReactElement<Record<string, unknown>>}
          {...props}
        />
      );
    }
    return (
      <BaseContextMenu.Trigger ref={ref as React.Ref<HTMLDivElement>} {...props}>
        {children}
      </BaseContextMenu.Trigger>
    );
  }
);
ContextMenuTrigger.displayName = 'ContextMenuTrigger';

export interface ContextMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof BaseContextMenu.Popup> {
  sideOffset?: number;
}

export const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ className, sideOffset = 4, children, ...props }, ref) => (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner sideOffset={sideOffset} className="z-[9999]">
        <BaseContextMenu.Popup
          ref={ref}
          className={cn(
            'min-w-[11rem] origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-2xl outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className
          )}
          {...props}
        >
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  )
);
ContextMenuContent.displayName = 'ContextMenuContent';

export const ContextMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseContextMenu.Item>
>(({ className, ...props }, ref) => (
  <BaseContextMenu.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
));
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuSeparator = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="separator" className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
);
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

