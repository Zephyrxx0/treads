import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/walk', '/collection', '/journal', '/privacy', '/settings', '/llms.txt'],
        disallow: ['/api/', '/eval', '/spike'],
      },
    ],
  };
}

