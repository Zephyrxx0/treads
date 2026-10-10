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
  title: 'Treads - Field Walking & Specimen Journal',
  description: 'Mindful walking companion, taxonomic specimen identifier, and nature field journal.',
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
