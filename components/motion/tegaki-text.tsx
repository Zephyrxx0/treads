'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface TegakiTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'span';
  delay?: number;
  showFlourish?: boolean;
}

export function TegakiText({
  text,
  className,
  as: Component = 'span',
  delay = 0.1,
  showFlourish = true,
}: TegakiTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
    hasAnimatedRef.current = true;
  }, []);

  // Instant static render for SSR or reduced motion preference
  if (!mounted || shouldReduceMotion) {
    return (
      <Component className={cn('font-handwriting inline-block select-text', className)}>
        {text}
      </Component>
    );
  }

  return (
    <Component className={cn('relative inline-flex flex-col items-start font-handwriting select-text', className)}>
      {/* Animated cursive text ink wipe */}
      <motion.span
        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.8 }}
        animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
        transition={{
          duration: 1.2,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="inline-block tracking-wide"
      >
        {text}
      </motion.span>

      {/* Organic ink flourish underline */}
      {showFlourish && (
        <svg
          aria-hidden="true"
          className="w-full h-2 -mt-0.5 overflow-visible pointer-events-none"
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M 1 4 Q 35 7, 70 3 T 99 5"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{
              duration: 1.1,
              delay: delay + 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </svg>
      )}
    </Component>
  );
}
