import type { Metadata } from 'next';
import Script from 'next/script';
import { Hanken_Grotesk, Fraunces, Caveat, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ConsentModal } from '@/components/consent/consent-modal';
import { AppNav } from '@/components/layout/app-nav';
import { ThemeSync } from '@/components/theme/theme-sync';
import { Agentation } from 'agentation';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://treads-nature.vercel.app'),
  title: {
    default: 'Treads 🌿 — Notice What Lives',
    template: '%s | Treads',
  },
  description:
    'A mindful, local-first naturalist companion and field journal. Turn outdoor walks into observational field notes with open-weight Gemma 4 AI, ElevenLabs voice notes, pedestrian loops, and Obsidian vault export.',
  keywords: [
    'naturalist',
    'field journal',
    'nature walk',
    'species identification',
    'Gemma 4',
    'ElevenLabs',
    'local-first',
    'Obsidian',
    'MapLibre',
    'biodiversity',
    'botany',
    'birdwatching',
    'Hacktoberfest',
    'Touch Grass',
  ],
  authors: [{ name: 'Treads Naturalist Team' }],
  creator: 'Treads',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Treads 🌿 — Notice What Lives',
    description:
      'Mindful walking companion, open-weight taxonomic specimen identifier, and local-first nature field journal.',
    siteName: 'Treads',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Treads 🌿 — Notice What Lives',
    description:
      'Mindful walking companion, open-weight taxonomic specimen identifier, and local-first nature field journal.',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${hanken.variable} ${fraunces.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body className="antialiased min-h-screen">
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('treads_theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && systemDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <div className="contents">
          <ThemeSync />
          <ConsentModal />
          {children}
          <AppNav />
        </div>
        {/* Dev-only. Syncs to an Agentation server only when one is configured
            (NEXT_PUBLIC_AGENTATION_ENDPOINT), otherwise it stays on localStorage
            and does not poll a port nothing is listening on. */}
        {process.env.NODE_ENV === 'development' && (
          <Agentation endpoint={process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT || undefined} />
        )}
      </body>
    </html>
  );
}
