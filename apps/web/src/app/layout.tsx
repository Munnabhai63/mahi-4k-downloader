import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const siteUrl = 'https://mahi-4k-downloader.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'My 4K Downloader – Free 4K Video Downloader',
    template: '%s | My 4K Downloader',
  },
  description:
    'Download 4K, 1080p videos and MP3 audio for free with My 4K Downloader. Fast, ad-free universal video downloader supporting YouTube, Instagram, TikTok, Facebook, and 1,000+ sites.',
  applicationName: 'My 4K Downloader',
  authors: [{ name: 'My 4K Downloader' }],
  creator: 'My 4K Downloader',
  publisher: 'My 4K Downloader',
  keywords: [
    'My 4K Downloader',
    '4K Downloader',
    '4K Video Downloader',
    'Free 4K Video Downloader',
    'Video Downloader',
    'Download 4K Videos',
    'Free Video Downloader',
    'Online Video Downloader',
    'MP3 Downloader',
    'YouTube 4K Downloader',
    'Instagram Reels Downloader',
    'TikTok Video Downloader Without Watermark',
  ],
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'My 4K Downloader',
    title: 'My 4K Downloader – Free 4K Video Downloader',
    description:
      'Download 4K, 1080p videos and MP3 audio for free with My 4K Downloader. Fast, ad-free universal video downloader supporting YouTube, Instagram, TikTok, Facebook, and 1,000+ sites.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'My 4K Downloader – Free 4K Video Downloader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My 4K Downloader – Free 4K Video Downloader',
    description:
      'Download 4K, 1080p videos and MP3 audio for free with My 4K Downloader. Fast, ad-free universal video downloader supporting YouTube, Instagram, TikTok, Facebook, and 1,000+ sites.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'EceHA3fkX__gFhBGdB3Qdplj1s5XfMcqYTupTXqOpEg',
  },
};

export const viewport: Viewport = {
  themeColor: '#16A34A',
  width: 'device-width',
  initialScale: 1,
};

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'My 4K Downloader',
  url: siteUrl,
  description:
    'Free online 4K video and MP3 audio downloader for YouTube, Instagram, TikTok, Facebook, and 1,000+ websites.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?url={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const jsonLdWebApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'My 4K Downloader',
  url: siteUrl,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All (Web Browser, Windows, Android, iOS, macOS, Linux)',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Free, ad-free universal video downloader supporting 4K, 8K, 1080p, and MP3 downloads from YouTube, Instagram, TikTok, Facebook, and 1,000+ platforms.',
  featureList: [
    '4K and 8K Ultra HD video downloads',
    'High-bitrate 320kbps MP3 audio extraction',
    'Ad-free and popup-free clean experience',
    'Batch downloading and playlist support',
    'TikTok video downloads without watermark',
    'Multi-threaded high-speed fetching',
  ],
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
        <meta
          name="google-site-verification"
          content="EceHA3fkX__gFhBGdB3Qdplj1s5XfMcqYTupTXqOpEg"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#0F172A] selection:bg-[#DCFCE7] selection:text-[#15803D]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (var i = 0; i < names.length; i++) { caches.delete(names[i]); }
                    });
                  }
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
