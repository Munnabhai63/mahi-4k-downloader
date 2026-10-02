import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Mahi 4K Downloader — By Munna Bhai (Turbo Edition)',
  description:
    'Mahi 4K Downloader by Munna Bhai. Ultra-fast universal video and audio downloader for YouTube, Instagram, TikTok, Facebook and 1,000+ sites.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#16A34A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16A34A" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#0F172A] selection:bg-[#DCFCE7] selection:text-[#15803D]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
