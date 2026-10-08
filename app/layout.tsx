import type { Metadata } from 'next';
import { Amaranth, Noto_Serif, Caveat } from 'next/font/google';
import './globals.css';
import { ConsentModal } from '@/components/consent/consent-modal';
import { ThemeSync } from '@/components/theme/theme-sync';
import { Agentation } from 'agentation';

const amaranth = Amaranth({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting',
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
    <html lang="en" suppressHydrationWarning className={`${amaranth.variable} ${notoSerif.variable} ${caveat.variable}`}>
      <head>
        <script
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
      </head>
      <body className="antialiased min-h-screen">
        <ThemeSync />
        <ConsentModal />
        {children}
        {process.env.NODE_ENV === 'development' && (
          <Agentation endpoint="http://localhost:4747" />
        )}
      </body>
    </html>
  );
}
