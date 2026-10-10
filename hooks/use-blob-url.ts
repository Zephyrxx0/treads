'use client';

import { useEffect, useState } from 'react';

/** Object URL for a Blob (or passthrough for string URLs), revoked on cleanup. */
export function useBlobUrl(source: Blob | string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }
    if (typeof source === 'string') {
      setUrl(source);
      return;
    }
    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [source]);
  return url;
}
