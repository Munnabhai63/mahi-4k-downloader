'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { Badge, Card, Button } from '@turbograb/ui';

export default function DmcaPage() {
  const [reporterEmail, setReporterEmail] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [reason, setReason] = useState('');
  const [infringementProof, setInfringementProof] = useState('');
  const [signature, setSignature] = useState('');
  const [declared, setDeclared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{ reportId: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declared) {
      setErrorMessage('You must certify the good faith legal declaration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/dmca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterEmail,
          targetUrl,
          reason,
          infringementProof,
          signature,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Submission failed');
      }

      const data = await res.json();
      setSubmittedResult({
        reportId: data.reportId || 'DMCA-' + Math.floor(Math.random() * 100000),
        message: data.message || 'Your notice was recorded. The URL hash has been blocked.',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred submitting the report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Downloader</span>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="error" size="md" className="font-bold">
            Expedited Copyright Takedown
          </Badge>
          <span className="text-xs text-[#64748B]">Digital Millennium Copyright Act</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-poppins tracking-tight">
          DMCA / Copyright Takedown Notice
        </h1>
      </div>

      {submittedResult ? (
        <Card className="p-8 bg-white border-2 border-[#16A34A]/30 text-center space-y-4 shadow-[0_8px_32px_rgba(22,163,74,0.12)]">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border-2 border-[#DCFCE7] flex items-center justify-center mx-auto text-[#16A34A]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] font-poppins">
            Notice Actioned Successfully
          </h2>
          <p className="text-sm text-[#475569] max-w-lg mx-auto leading-relaxed">
            {submittedResult.message}
          </p>
          <div className="inline-block bg-[#F8FAF9] px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-mono text-[#0F172A]">
            Reference ID: <strong>{submittedResult.reportId}</strong>
          </div>
          <div className="pt-4">
            <Button variant="primary" onClick={() => setSubmittedResult(null)}>
              Submit Another Notice
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 bg-white border-[#E2E8F0] space-y-6">
          <div className="bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#64748B] leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              TurboGrab respects intellectual property rights. If you represent a copyright holder and wish to block specific URL hashes from being converted by our service, fill out the statutory notification form below.
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Authorized Reporter Email Address *
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="legal@rightsowner.com"
                required
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Target Video URL to Block *
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Copyright Owner & Work Description *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Describe the copyrighted work and your authority to represent the rights holder..."
                required
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Registration / Infringement Proof
              </label>
              <input
                type="text"
                value={infringementProof}
                onChange={(e) => setInfringementProof(e.target.value)}
                placeholder="Copyright registration number, official release URL, or trademark filing"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Digital Signature (Full Legal Name) *
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g. Johnathan Smith, General Counsel"
                required
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A] font-medium"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-[#475569] cursor-pointer">
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A] w-4 h-4 mt-0.5 shrink-0"
                />
                <span>
                  I declare under penalty of perjury that I am the copyright owner or authorized to act on behalf of the owner, and that the information in this notification is accurate.
                </span>
              </label>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !declared}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Takedown Notice...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Formal Takedown Notice</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
