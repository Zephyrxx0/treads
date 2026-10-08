'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export interface MotionViewProps extends HTMLMotionProps<'div'> {
  /**
   * If true, animations pause when the tab is hidden.
   * Defaults to true.
   */
  pauseWhenHidden?: boolean;
}

export const MotionView = React.forwardRef<HTMLDivElement, MotionViewProps>(
  (
    {
      initial,
      animate,
      exit,
      transition,
      pauseWhenHidden = true,
      children,
      ...props
    },
    ref
  ) => {
    const { prefersReducedMotion, isVisible } = useReducedMotion();

    const resolvedInitial = prefersReducedMotion ? { opacity: 0 } : initial;

    const resolvedAnimate = React.useMemo(() => {
      if (pauseWhenHidden && !isVisible) {
        return prefersReducedMotion ? { opacity: 1 } : (initial ?? { opacity: 1 });
      }
      if (prefersReducedMotion) {
        return { opacity: 1 };
      }
      return animate;
    }, [pauseWhenHidden, isVisible, prefersReducedMotion, initial, animate]);

    const resolvedExit = prefersReducedMotion ? { opacity: 0 } : exit;

    const resolvedTransition = prefersReducedMotion
      ? { duration: 0.15 }
      : transition;

    return (
      <motion.div
        ref={ref}
        initial={resolvedInitial}
        animate={resolvedAnimate}
        exit={resolvedExit}
        transition={resolvedTransition}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionView.displayName = 'MotionView';
