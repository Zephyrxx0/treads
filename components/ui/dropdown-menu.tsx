'use client';

import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui-components/react';
import { cn } from '@/lib/utils';

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuGroup = BaseMenu.Group;

export interface DropdownMenuTriggerProps extends Omit<
  React.ComponentPropsWithoutRef<typeof BaseMenu.Trigger>,
  'render'
> {
  /** Render the child element as the trigger instead of a wrapping button. */
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <BaseMenu.Trigger
          ref={ref as React.Ref<HTMLButtonElement>}
          render={children as React.ReactElement<Record<string, unknown>>}
          {...props}
        />
      );
    }
    return (
      <BaseMenu.Trigger ref={ref as React.Ref<HTMLButtonElement>} {...props}>
        {children}
      </BaseMenu.Trigger>
    );
  },
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<
  typeof BaseMenu.Popup
> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, side = 'bottom', align = 'start', sideOffset = 6, children, ...props }, ref) => (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset} className="z-[80]">
        <BaseMenu.Popup
          ref={ref}
          className={cn(
            'min-w-[10rem] origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  ),
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseMenu.Item>
>(({ className, ...props }, ref) => (
  <BaseMenu.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="separator" className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
