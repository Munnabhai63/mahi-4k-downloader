import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Badge, Card } from '@turbograb/ui';

export const metadata = {
  title: 'Terms of Service | My 4K Downloader',
  description: 'Terms of Service and legal usage conditions for My 4K Downloader universal video and audio downloader.',
  alternates: {
    canonical: 'https://mahi-4k-downloader.pages.dev/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Downloader</span>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="mint" size="md" className="font-bold">
            Legal Document
          </Badge>
          <span className="text-xs text-[#64748B]">Last updated: September 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-poppins tracking-tight">
          Terms of Service
        </h1>
      </div>

      <Card className="p-6 sm:p-8 bg-white border-[#E2E8F0] space-y-8 text-sm leading-relaxed text-[#475569]">
        {/* Important Alert Box */}
        <div className="bg-[#F0FDF4] border-2 border-[#DCFCE7] rounded-xl p-5 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">
              Core Principle & Permitted Usage
            </h3>
            <p className="text-xs text-[#16A34A] font-medium leading-normal">
              TurboGrab is designed solely for downloading personal media, Creative Commons content, or public videos where you possess explicit legal authorization or ownership. You are strictly responsible for adhering to the respective platform Terms of Service.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the TurboGrab web application, browser extensions, desktop clients, or associated API services (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, you must immediately discontinue using TurboGrab.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            2. Strict DRM Prohibition & Platform Restrictions
          </h2>
          <p>
            TurboGrab strictly rejects and permanently blocks any interaction with DRM (Digital Rights Management) encrypted platforms. You may not attempt to use TurboGrab to access, download, or decrypt streams from services including, but not limited to, Netflix, Amazon Prime Video, Disney+, Hotstar, Spotify, Apple TV+, or Hulu.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Circumventing DRM controls is a violation of international copyright treaties and is strictly barred.</span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            3. Ephemeral Storage & Temporary Processing
          </h2>
          <p>
            My 4K Downloader does not host, curate, index, or store video content permanently on its servers. All converted media files are held strictly in an isolated temporary processing directory (maximum time-to-live is 15 minutes) and are immediately destroyed upon delivery to your device or upon link expiration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            4. User Responsibilities & Prohibited Activities
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            <li>You may not use TurboGrab to infringe any patent, trademark, trade secret, copyright, or other proprietary rights of any third party.</li>
            <li>You may not automate excessive or abusive queries (denial-of-service, brute force) against the TurboGrab API beyond established rate limits.</li>
            <li>You may not redistribute, commercialize, or re-license downloaded files without proper authorization from rights holders.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            5. Intellectual Property & Downloader Architecture
          </h2>
          <p>
            My 4K Downloader operates exclusively as a client-side conversion and download engine. The service does not host, index, archive, or permanently store any user or third-party media. All temporary files required during active transcoding are automatically deleted upon delivery to your device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            6. Limitation of Liability
          </h2>
          <p>
            TurboGrab is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Under no circumstances shall TurboGrab or its operators be liable for indirect, incidental, or consequential damages resulting from user conduct or platform unavailability.
          </p>
        </section>
      </Card>
    </div>
  );
}
