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
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] font-poppins">
              Download with My 4K Downloader Desktop
            </h3>
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
        {route.displayName} restricts cloud datacenter servers. Our free Desktop App runs directly on your computer using your normal internet connection to deliver verified 4K UHD, 1080p, and MP3 audio directly to your device.
      </p>

      {/* Target URL Badge */}
      <div className="text-[11px] text-[#64748B] truncate font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#E2E8F0] mb-3">
        {url}
      </div>

      {/* Two primary action buttons */}
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
          href="/Mahi_4K_Downloader_Portable.zip"
          download="My_4K_Downloader_Portable.zip"
          className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs text-center cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#16A34A]" />
          <span>Get Portable App (ZIP)</span>
        </a>
      </div>

      {/* Footer options: Installer and web fallback */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#DCFCE7]/70 text-[11px] text-[#64748B] gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Standalone: Bundled yt-dlp & FFmpeg 9.0</span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/My_4K_Downloader_Setup.exe"
            download="My_4K_Downloader_Setup.exe"
            className="text-[#16A34A] hover:underline font-semibold"
            title="Download full Windows Installer"
          >
            Windows Setup (.exe)
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
                {isWebLoading ? 'Analyzing on Web...' : 'Try Web Download anyway'}
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
