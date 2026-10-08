'use client';

import * as React from 'react';

export interface MotionPreferences {
  prefersReducedMotion: boolean;
  isVisible: boolean;
  shouldReduceMotion: boolean;
}

export function useReducedMotion(): MotionPreferences {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    prefersReducedMotion,
    isVisible,
    shouldReduceMotion: prefersReducedMotion || !isVisible,
  };
}
