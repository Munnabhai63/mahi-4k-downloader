'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Layers, 
  Music, 
  Sliders, 
  Globe, 
  Sparkles,
  ChevronDown,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { Card } from '@turbograb/ui';
import { PasteBar } from '@/components/PasteBar';
import { PlatformRow } from '@/components/PlatformRow';
import { VideoPreviewCard } from '@/components/VideoPreviewCard';
import { ActiveDownloads } from '@/components/ActiveDownloads';
import { 
  AnalyzeResult, 
  DownloadItem, 
  VideoQualityLabel, 
  VideoFormat 
} from '@turbograb/types';
import { getApiBaseUrl } from '@/lib/api';
import { sanitizeUserError } from '@/lib/errorSanitizer';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [batchResults, setBatchResults] = useState<AnalyzeResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<DownloadItem[]>([]);
  const [isStartingDownload, setIsStartingDownload] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('student');

  const [dynamicConfig, setDynamicConfig] = useState<{
    siteTitle: string;
    heroHeadline: string;
    heroSubtitle: string;
    creatorName: string;
    announcementNotice: string;
    announcementBanner: { enabled: boolean; message: string; level: string };
    studentDailyLimit: number;
    freeDailyLimit: number;
  }>({
    siteTitle: 'My 4K Downloader',
    heroHeadline: 'My 4K Downloader',
    heroSubtitle: 'Free 4K Video Downloader. Fast, ad-free downloads in 4K & MP3. Paste any link below to begin.',
    creatorName: 'My 4K Downloader',
    announcementNotice: 'Official My 4K Downloader',
    announcementBanner: { enabled: false, message: '', level: 'info' },
    studentDailyLimit: 50,
    freeDailyLimit: 15,
  });

  const getApiUrl = () => {
    return getApiBaseUrl();
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('turbograb_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.planId) setUserRole(parsed.planId);
        } catch {}
      }
    }

    fetch(`${getApiUrl()}/admin/public-config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cfg) {
          setDynamicConfig((prev) => ({
            ...prev,
            ...cfg,
            // Keep default hero clean unless specifically customized
            heroHeadline: cfg.heroHeadline && cfg.heroHeadline !== 'Download Any Video. Fast & Free.' ? cfg.heroHeadline : 'Download Any Video in 4K & MP3',
            heroSubtitle: cfg.heroSubtitle && !cfg.heroSubtitle.includes('HD & MP3 with Mahi') ? cfg.heroSubtitle : 'Fast, ad-free downloads by Munna Bhai. Paste any link below to begin.',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = async (url: string, useSmartMode: boolean = false) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalyzeResult(null);
    setBatchResults([]);

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Capped backoff: 800ms, 1600ms
          await new Promise((resolve) => setTimeout(resolve, Math.min(800 * Math.pow(2, attempt - 1), 2000)));
        }

        const res = await fetch(`${getApiUrl()}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();

        if (!res.ok) {
          // If 400 Bad Request (e.g. Unsupported link, private, not available), don't retry
          if (res.status === 400) {
            throw new Error(data.message || 'Unsupported link.');
          }
          throw new Error(data.message || 'Server temporarily busy.');
        }

        if (useSmartMode) {
          let prefQuality: VideoQualityLabel = '1080p';
          let prefFormat: VideoFormat = 'mp4';
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('turbograb_settings');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.defaultQuality) prefQuality = parsed.defaultQuality;
                if (parsed.defaultFormat) prefFormat = parsed.defaultFormat;
              } catch {}
            }
          }
          await triggerDownloadJob(data, prefQuality, prefFormat);
        } else {
          setAnalyzeResult(data);
        }
        setIsAnalyzing(false);
        return; // Success!
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        // Break out of retry if client error or explicit unsupported/blocked message
        if (
          msg.includes('Unsupported') ||
          msg.includes('private') ||
          msg.includes('unavailable') ||
          msg.includes('direct download right now') ||
          msg.includes('restricted')
        ) {
          break;
        }
      }
    }

    if (lastError) {
      setErrorMessage(
        sanitizeUserError(lastError.message || 'Unable to analyze video URL. Please check the link and try again.'),
      );
    }
    setIsAnalyzing(false);
  };

  const handleBatchAnalyze = async (urls: string[]) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalyzeResult(null);
    setBatchResults([]);

    try {
      const res = await fetch(`${getApiUrl()}/analyze/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to analyze batch URLs.');
      }

      if (data.results && data.results.length > 0) {
        setBatchResults(data.results);
      } else if (data.errors && data.errors.length > 0) {
        throw new Error(`Failed to analyze URLs: ${data.errors[0].error}`);
      }
    } catch (err: any) {
      setErrorMessage(sanitizeUserError(err.message || 'Failed to analyze batch URLs.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerDownloadJob = async (
    result: AnalyzeResult,
    quality: VideoQualityLabel = '1080p',
    format: VideoFormat = 'mp4',
    subtitleLang?: string,
  ) => {
    const res = await fetch(`${getApiUrl()}/downloads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.url,
        quality,
        format,
        subtitleLang,
      }),
    });

    const newJob: DownloadItem = await res.json();

    if (!res.ok) {
      throw new Error((newJob as any).message || 'Failed to queue download.');
    }

    if (!newJob.title || newJob.title === 'Preparing download...') {
      newJob.title = result.title;
      newJob.thumbnailUrl = result.thumbnailUrl;
      newJob.durationSec = result.durationSec;
    }

    setActiveDownloads((prev) => [newJob, ...prev]);
    setAnalyzeResult(null);
  };

  const handleBatchDownloadAll = async () => {
    if (batchResults.length === 0) return;
    setIsStartingDownload(true);

    try {
      const items = batchResults.map((it) => ({
        url: it.url,
        quality: '1080p' as VideoQualityLabel,
        format: 'mp4' as VideoFormat,
      }));

      const res = await fetch(`${getApiUrl()}/downloads/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to queue batch download.');
      }

      if (data.queued && Array.isArray(data.queued)) {
        setActiveDownloads((prev) => [...data.queued, ...prev]);
        setBatchResults([]);
      }
    } catch (err: any) {
      setErrorMessage(sanitizeUserError(err.message || 'Failed to queue batch downloads.'));
    } finally {
      setIsStartingDownload(false);
    }
  };

  const handleStartDownload = async (config: {
    quality: VideoQualityLabel;
    format: VideoFormat;
    subtitleLang?: string;
    useSmartMode: boolean;
  }) => {
    if (!analyzeResult) return;

    setIsStartingDownload(true);

    try {
      await triggerDownloadJob(
        analyzeResult,
        config.quality,
        config.format,
        config.subtitleLang,
      );
    } catch (err: any) {
      setErrorMessage(sanitizeUserError(err.message || 'Failed to start download.'));
    } finally {
      setIsStartingDownload(false);
    }
  };

  const handleCancelDownload = async (id: string) => {
    try {
      await fetch(`${getApiUrl()}/downloads/${id}/cancel`, { method: 'POST' });
      setActiveDownloads((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'CANCELLED' } : it)),
      );
    } catch {}
  };

  const handleRetryDownload = async (id: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/downloads/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setActiveDownloads((prev) =>
          prev.map((it) => (it.id === id ? updated : it)),
        );
      }
    } catch {}
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-[#16A34A]" />,
      title: 'Ultra HD & 8K',
      desc: 'Lossless 4K & 8K video up to 60fps with pristine high-fidelity audio.',
    },
    {
      icon: <Globe className="w-5 h-5 text-[#16A34A]" />,
      title: '1,000+ Platforms',
      desc: 'YouTube, Instagram Reels, TikTok (no watermark), X, and Facebook.',
    },
    {
      icon: <Music className="w-5 h-5 text-[#16A34A]" />,
      title: '320kbps MP3 Audio',
      desc: 'One-click lossless audio extraction to high-bitrate MP3 or M4A.',
    },
    {
      icon: <Layers className="w-5 h-5 text-[#16A34A]" />,
      title: 'Batch & Playlists',
      desc: 'Paste multiple links or entire channels for simultaneous multi-thread grabbing.',
    },
    {
      icon: <Sliders className="w-5 h-5 text-[#16A34A]" />,
      title: '1-Click Smart Mode',
      desc: 'Save your preferred format and download folder for instant grabbing.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#16A34A]" />,
      title: '100% Ad-Free & Clean',
      desc: 'Zero popups, adware, or malware. Runs completely direct in your browser.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Paste Link',
      desc: 'Copy any video, reel, or audio URL into the search bar.',
    },
    {
      step: '02',
      title: 'Select Quality',
      desc: 'Choose 4K, 1080p, or extract 320kbps MP3 sound.',
    },
    {
      step: '03',
      title: 'Instant Save',
      desc: 'Multi-threaded ultra-fast download directly to your device.',
    },
  ];

  const faqs = [
    {
      q: 'What is My 4K Downloader?',
      a: 'My 4K Downloader is a fast, 100% free online video and audio downloader. It allows you to download videos in 4K UHD, 1080p, and high-bitrate 320kbps MP3 audio from YouTube, Instagram, TikTok, Facebook, Twitter/X, and 1,000+ websites directly in your browser.',
    },
    {
      q: 'Is My 4K Downloader free to use?',
      a: 'Yes, My 4K Downloader is completely free with no subscriptions, paid tiers, or hidden fees. Everyday users receive 50 high-speed daily downloads with zero intrusive advertisements.',
    },
    {
      q: 'How do I download 4K videos using My 4K Downloader?',
      a: 'Simply copy the video link from YouTube, Instagram, or any supported platform, paste it into the search bar, select your desired resolution (such as 4K or 1080p) or MP3 format, and click download.',
    },
    {
      q: 'Can I download TikTok videos without watermarks?',
      a: 'Yes! TikTok videos are automatically extracted in clean, crystal-clear HD resolution without any watermark logo.',
    },
    {
      q: 'Which video and audio formats are supported?',
      a: 'My 4K Downloader supports video resolutions from 360p up to 8K Ultra HD in MP4, MKV, and WebM containers, as well as MP3 (up to 320kbps), M4A, and WAV audio formats.',
    },
    {
      q: 'Are my downloads and privacy protected?',
      a: 'Yes. We do not track users or permanently store your downloaded files. All media streams are processed over secure HTTPS connections and automatically deleted within 6 hours.',
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Super Admin Global Announcement Banner (only if real message exists and not test placeholder) */}
      {dynamicConfig.announcementBanner?.enabled && 
       dynamicConfig.announcementBanner?.message && 
       dynamicConfig.announcementBanner.message !== 'Maintenance test banner' && (
        <div className="w-full bg-[#F0FDF4] border-b border-[#DCFCE7] py-2 px-4 text-center text-xs font-semibold text-[#16A34A] flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dynamicConfig.announcementBanner.message}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="w-full pt-10 pb-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        {/* Student Tier & Quota Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-xs font-semibold text-[#16A34A] mb-4 shadow-xs">
          <span>{userRole === 'admin' ? '⚡ Super Admin' : '🎓 Student Access'}</span>
          <span className="text-[#CBD5E1]">•</span>
          <span>{userRole === 'admin' ? 'Unlimited Downloads' : `${dynamicConfig.studentDailyLimit} Daily Downloads`}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F172A] mb-2 leading-tight font-poppins">
          My <span className="bg-gradient-to-r from-[#16A34A] to-[#10B981] bg-clip-text text-transparent">4K Downloader</span>
        </h1>
        <p className="text-base sm:text-lg text-[#16A34A] font-bold max-w-xl mx-auto mb-2 font-poppins">
          Free 4K Video Downloader
        </p>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mb-8 font-medium">
          Fast, ad-free downloads in 4K UHD, 1080p, and MP3 audio from YouTube, Instagram, TikTok, and 1,000+ sites.
        </p>

        {/* Paste Bar */}
        <PasteBar
          onAnalyze={handleAnalyze}
          onBatchAnalyze={handleBatchAnalyze}
          isLoading={isAnalyzing}
        />

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="w-full max-w-xl mx-auto mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span className="font-medium text-left">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 p-0.5 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Single-Column Loading Skeleton */}
        {isAnalyzing && (
          <div className="w-full max-w-xl mx-auto my-6 p-4 sm:p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs animate-pulse space-y-4">
            <div className="flex items-center gap-2.5 text-[#16A34A]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold">
                Analyzing video link & checking available formats...
              </span>
            </div>
            <div className="flex gap-3">
              <div className="w-24 h-16 bg-slate-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
          </div>
        )}

        {/* Batch Results Card */}
        {batchResults.length > 0 && (
          <div className="w-full max-w-3xl mx-auto my-6 p-5 bg-white rounded-2xl border-2 border-[#16A34A]/30 shadow-lg text-left animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Batch Ready ({batchResults.length} Videos)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Click below to queue all simultaneously.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setBatchResults([])}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleBatchDownloadAll}
                  disabled={isStartingDownload}
                  className="px-4 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-bold hover:bg-[#15803D] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Download All</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#F1F5F9] max-h-64 overflow-y-auto mt-2">
              {batchResults.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-14 h-9 object-cover rounded-lg shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {item.platform} • {item.qualities.find((q) => q.available)?.label || '1080p'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerDownloadJob(item, '1080p', 'mp4')}
                    className="shrink-0 px-3 py-1 text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] rounded-lg transition-colors"
                  >
                    Queue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Preview Card */}
        {analyzeResult && (
          <VideoPreviewCard
            data={analyzeResult}
            onDownload={handleStartDownload}
            onCancel={() => setAnalyzeResult(null)}
            isLoading={isStartingDownload}
          />
        )}

        {/* Active & Completed Downloads Telemetry List */}
        <ActiveDownloads
          downloads={activeDownloads}
          onCancel={handleCancelDownload}
          onRetry={handleRetryDownload}
        />

        {/* Realistic 3D Glowing Brand Icons */}
        <PlatformRow onSelectPlatform={(_name, sampleUrl) => handleAnalyze(sampleUrl, false)} />
      </section>

      {/* Sleek Minimalist Metrics Bar */}
      <section className="w-full max-w-4xl mx-auto px-4 my-6">
        <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#E2E8F0] shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="border-r border-[#F1F5F9] last:border-0 sm:last:border-0">
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-poppins">8K & 4K</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Ultra HD</div>
          </div>
          <div className="sm:border-r border-[#F1F5F9]">
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-poppins">1,000+</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Platforms</div>
          </div>
          <div className="border-r border-[#F1F5F9]">
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-poppins">85 MB/s</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Turbo Speed</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-poppins">100%</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Ad-Free & Clean</div>
          </div>
        </div>
      </section>

      {/* Decluttered Features Grid */}
      <section id="features" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-lg mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-poppins mb-2">
            Why Choose My 4K Downloader
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Engineered for high-speed grabbing, maximum clarity, and total privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card key={i} variant="interactive" className="p-5 rounded-2xl hover:border-[#16A34A]/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-1 font-poppins">{f.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section id="how-it-works" className="w-full bg-[#F0FDF4]/60 border-y border-[#DCFCE7]/70 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-poppins mb-1.5">
              3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              No software needed. Everything downloads straight to your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-[#DCFCE7] shadow-xs relative">
                <span className="text-2xl font-black text-[#16A34A]/25 font-poppins mb-1 block">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mb-1 font-poppins">{s.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational & Semantic SEO Overview Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-[#F8FAF9] border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-poppins mb-3">
              About My 4K Downloader – Free 4K Video Downloader
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              <strong>My 4K Downloader</strong> is a web-based, zero-installation video downloader designed to deliver ultra-high-definition video and pristine audio without intrusive ads, artificial rate limits, or bloated desktop software. Paste a link from any major video platform and save your favorite content in stunning 4K UHD, 1080p Full HD, or 320kbps MP3 audio directly to your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Supported Video Resolutions
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Download in <strong>8K Ultra HD, 4K UHD (2160p), 2K QHD (1440p), 1080p Full HD, 720p HD</strong>, and standard resolutions across MP4, MKV, and WebM containers.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Studio-Quality Audio Extraction
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Extract high-bitrate <strong>MP3 audio at 320kbps, 256kbps, 192kbps</strong>, as well as lossless M4A, AAC, and WAV audio streams with full metadata.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Privacy & Zero-Tracking Guarantee
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Your privacy is paramount. We do not require accounts for standard downloading, never log your download history, and auto-delete temporary stream files every 6 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean FAQ Section */}
      <section id="faq" className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-md mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-poppins mb-1.5">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">Everything you need to know about My 4K Downloader.</p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-[#0F172A] hover:text-[#16A34A] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#64748B] transition-transform duration-200 shrink-0 ml-2 ${
                      isOpen ? 'transform rotate-180 text-[#16A34A]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#64748B] leading-relaxed border-t border-[#F1F5F9]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
