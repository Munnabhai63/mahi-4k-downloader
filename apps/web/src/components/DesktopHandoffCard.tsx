'use client';

import React from 'react';
import { Sparkles, Download, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { Card, Button } from '@turbograb/ui';
import { PlatformRouteInfo } from '@/lib/routing';

interface DesktopHandoffCardProps {
  route: PlatformRouteInfo;
  url: string;
  onTryWebAnyway?: () => void;
  onDismiss?: () => void;
  isWebLoading?: boolean;
}

export const DesktopHandoffCard: React.FC<DesktopHandoffCardProps> = ({
  route,
  url,
  onTryWebAnyway,
  onDismiss,
  isWebLoading,
}) => {
  const handleOpenDesktop = () => {
    if (typeof window !== 'undefined') {
      window.location.href = route.deepLink;
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto my-5 p-5 sm:p-6 bg-gradient-to-b from-[#F0FDF4] to-white border-2 border-[#16A34A]/30 rounded-3xl shadow-md animate-in fade-in text-left">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] font-poppins">
                My 4K Downloader Desktop
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                Beta
              </span>
            </div>
            <p className="text-xs font-semibold text-[#16A34A]">
              Recommended for {route.displayName} ({route.recommendedResolution})
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-3">
        {route.displayName} restricts cloud datacenter servers. The Windows Desktop Beta app runs directly on your computer to deliver verified 4K UHD, 1080p, and High Quality 320kbps MP3 audio directly to your device.
      </p>

      {/* Target URL Badge */}
      <div className="text-[11px] text-[#64748B] truncate font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#E2E8F0] mb-3">
        {url}
      </div>

      {/* Verified vs Limited notice */}
      <div className="p-3 bg-white/90 rounded-xl border border-[#E2E8F0] mb-3 text-[11px] space-y-1.5">
        <div className="flex items-start gap-1.5 text-slate-700">
          <span className="font-bold text-[#16A34A]">✓ Verified:</span>
          <span>YouTube (4K/1080p/MP3), Direct MP4/WebM/HLS, Facebook (best-effort)</span>
        </div>
        <div className="flex items-start gap-1.5 text-slate-500">
          <span className="font-bold text-amber-600">⚠ Limited / Unverified:</span>
          <span>Instagram, TikTok, X (Twitter) unauthenticated scraping; Private/DRM content is not supported.</span>
        </div>
      </div>

      {/* Primary action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-3">
        <Button
          variant="primary"
          onClick={handleOpenDesktop}
          className="flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-sm rounded-xl cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Launch Desktop App</span>
        </Button>

        <a
          href="https://github.com/Munnabhai63/mahi-4k-downloader/releases/download/v1.0.0-beta/My_4K_Downloader_1.0.0_x64_Setup.exe"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs text-center cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#16A34A]" />
          <span>Windows Setup (.exe, 75MB)</span>
        </a>
      </div>

      {/* Footer options: Portable ZIP, Checksums, and web fallback */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#DCFCE7]/70 text-[11px] text-[#64748B] gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Bundled yt-dlp & FFmpeg 9.0 (No Python/Node needed)</span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com/Munnabhai63/mahi-4k-downloader/releases/download/v1.0.0-beta/My_4K_Downloader_v1.0.0_Portable_x64.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#16A34A] hover:underline font-semibold"
            title="Download Portable ZIP (102MB)"
          >
            Portable ZIP (102MB)
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="https://github.com/Munnabhai63/mahi-4k-downloader/releases/download/v1.0.0-beta/SHA256SUMS.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:underline"
            title="View SHA-256 Checksums"
          >
            SHA256
          </a>
          {onTryWebAnyway && (
            <>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={onTryWebAnyway}
                disabled={isWebLoading}
                className="text-[#64748B] hover:text-[#16A34A] underline font-medium cursor-pointer transition-colors"
              >
                {isWebLoading ? 'Analyzing on Web...' : 'Try Web Download'}
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
