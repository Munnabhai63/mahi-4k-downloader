'use client';

import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '@turbograb/ui';
import { PlatformRouteInfo, DESKTOP_APP_DOWNLOAD_URL } from '@/lib/routing';

interface DesktopHandoffCardProps {
  route: PlatformRouteInfo;
  url: string;
  onDismiss?: () => void;
  autoLaunch?: boolean;
}

export const DesktopHandoffCard: React.FC<DesktopHandoffCardProps> = ({
  route,
  url,
  onDismiss,
  autoLaunch = true,
}) => {
  const [hasTriggered, setHasTriggered] = useState(false);

  const triggerHandoff = () => {
    if (typeof window === 'undefined') return;
    try {
      const a = document.createElement('a');
      a.href = route.deepLink;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 500);
      setHasTriggered(true);
    } catch {
      window.location.href = route.deepLink;
      setHasTriggered(true);
    }
  };

  useEffect(() => {
    if (autoLaunch && !hasTriggered) {
      triggerHandoff();
    }
  }, [autoLaunch, route.deepLink]);

  return (
    <Card className="w-full max-w-xl mx-auto my-5 p-5 sm:p-6 bg-white border-2 border-[#16A34A]/30 rounded-3xl shadow-lg animate-in fade-in text-left">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] font-poppins">
              Download YouTube video
            </h3>
            <p className="text-xs font-semibold text-[#16A34A]">
              Launching My 4K Downloader Desktop
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

      {/* Target URL Preview */}
      <div className="text-[11px] text-[#64748B] truncate font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 mb-3">
        {url}
      </div>

      {/* Browser prompt hint */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] mb-4 text-xs text-[#15803D]">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
        <span>
          If prompted by your browser, select <strong>Open My 4K Downloader</strong>.
        </span>
      </div>

      {/* Main Action Button */}
      <div className="mb-4">
        <Button
          variant="primary"
          onClick={triggerHandoff}
          className="w-full py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 shadow-sm rounded-xl cursor-pointer bg-[#16A34A] hover:bg-[#15803D] text-white"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Download YouTube video</span>
        </Button>
      </div>

      {/* ONE Small Action for Uninstalled Users */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
        <span>App not installed?</span>
        <a
          href={DESKTOP_APP_DOWNLOAD_URL}
          download="My_4K_Downloader_1.0.1_x64_Setup.exe"
          className="font-bold text-[#16A34A] hover:text-[#15803D] hover:underline flex items-center gap-1 transition-colors"
          title="Download Windows Installer"
        >
          <span>Get My 4K Downloader for Windows</span>
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </Card>
  );
};
