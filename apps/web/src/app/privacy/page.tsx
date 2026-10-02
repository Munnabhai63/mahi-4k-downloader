import React from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, Shield, Trash2, Key } from 'lucide-react';
import { Badge, Card } from '@turbograb/ui';

export const metadata = {
  title: 'Privacy Policy | My 4K Downloader',
  description: 'Privacy Policy, zero-logging data protection, and encryption practices for My 4K Downloader.',
  alternates: {
    canonical: 'https://mahi-4k-downloader.pages.dev/privacy',
  },
};

export default function PrivacyPage() {
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
            Data Protection
          </Badge>
          <span className="text-xs text-[#64748B]">Effective date: September 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-poppins tracking-tight">
          Privacy Policy
        </h1>
      </div>

      <Card className="p-6 sm:p-8 bg-white border-[#E2E8F0] space-y-8 text-sm leading-relaxed text-[#475569]">
        <div className="bg-[#F0FDF4] border-2 border-[#DCFCE7] rounded-xl p-5 flex items-start gap-4">
          <Lock className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">
              Privacy by Design: Ephemeral Storage & Zero Retention
            </h3>
            <p className="text-xs text-[#16A34A] font-medium leading-normal">
              TurboGrab operates on a strict zero-retention philosophy. We do not inspect, index, or store the contents of videos you convert. Files exist in temporary storage only long enough for you to download them, after which they are permanently expunged.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            1. Information We Collect
          </h2>
          <p>
            When utilizing the TurboGrab service, we collect minimal technical data strictly necessary to fulfill your download request:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            <li><strong>Video URLs:</strong> Temporarily processed to extract stream metadata (resolution, audio tracks, duration).</li>
            <li><strong>Technical Logs:</strong> Transient IP addresses and timestamps for security rate-limiting (token bucket mechanism) to prevent abuse.</li>
            <li><strong>Aggregate Metrics:</strong> Anonymized counts of downloads, speeds, and platform shares for performance optimization.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
              2. Cookies Vault & AES-256-GCM Encryption
            </h2>
          </div>
          <p>
            For private content (such as your own Instagram Stories), TurboGrab offers an optional Cookies Vault. All cookie strings provided by the user are immediately encrypted at rest using industry-standard <strong>AES-256-GCM encryption</strong>.
          </p>
          <p className="text-xs text-[#64748B]">
            Cookies are never logged, never transmitted in plain text, and are strictly utilized to authenticate download worker requests on your explicit command. You can purge your stored credentials at any moment from your settings.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
              3. Automated 6-Hour File Purge Cycle
            </h2>
          </div>
          <p>
            Converted MP4, MKV, and MP3 files reside in an isolated, secure temporary directory. Signed download URLs expire in exactly <strong>10 minutes</strong>. An automated internal cleaner process scans temporary storage every hour and permanently deletes all files older than <strong>6 hours</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
              4. User Rights & GDPR Compliance
            </h2>
          </div>
          <p>
            In compliance with global data privacy regulations (including GDPR and CCPA), users retain full ownership and control over their account data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            <li>Right to access personal download history logs.</li>
            <li>Right to rectify or delete credentials stored in the Cookies Vault.</li>
            <li>Right to complete data erasure (Danger Zone button in User Settings instantly purges all user records).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
            5. Contact Privacy Officer
          </h2>
          <p>
            If you have questions regarding our encryption practices or wish to submit a data erasure request, contact our privacy officer at{' '}
            <span className="text-[#16A34A] font-semibold">privacy@turbograb.app</span>.
          </p>
        </section>
      </Card>
    </div>
  );
}
