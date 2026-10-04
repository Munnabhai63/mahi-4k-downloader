'use client';

import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  Layers,
  Music,
  Globe,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@turbograb/ui';
import { PasteBar } from '@/components/PasteBar';
import { PlatformRow } from '@/components/PlatformRow';
import { VideoPreviewCard } from '@/components/VideoPreviewCard';
import { ActiveDownloads } from '@/components/ActiveDownloads';
import { DesktopHandoffCard } from '@/components/DesktopHandoffCard';
import { MediaPickerGrid } from '@/components/MediaPickerGrid';
import {
  AnalyzeResult,
  DownloadItem,
  VideoQualityLabel,
  VideoFormat,
} from '@turbograb/types';
import { executeApiRequest } from '@/lib/api';
import { sanitizeUserError } from '@/lib/errorSanitizer';
import { isYouTubeUrl, detectPlatformRoute } from '@/lib/routing';
import { resolveMedia, triggerBrowserDownload, CobaltPickerResponse } from '@/lib/m4k-api';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [batchResults, setBatchResults] = useState<AnalyzeResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [youtubeHandoffUrl, setYoutubeHandoffUrl] = useState<string | null>(null);
  const [cobaltPicker, setCobaltPicker] = useState<CobaltPickerResponse | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<{ filename: string; url: string } | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<DownloadItem[]>([]);
  const [isStartingDownload, setIsStartingDownload] = useState<boolean>(false);

  const [dynamicConfig] = useState<{
    announcementBanner: { enabled: boolean; message: string; level: string };
  }>({
    announcementBanner: { enabled: false, message: '', level: 'info' },
  });

  const handleAnalyze = async (url: string) => {
    const trimmedUrl = (url || '').trim();
    if (!trimmedUrl) return;

    setErrorMessage(null);
    setAnalyzeResult(null);
    setBatchResults([]);
    setCobaltPicker(null);
    setDownloadSuccess(null);
    // Immediately evict any stale failed or cancelled jobs from the view
    setActiveDownloads((prev) => prev.filter((it) => it.status !== 'FAILED' && it.status !== 'CANCELLED'));

    // 1. YouTube handoff to local engine (UNCHANGED)
    if (isYouTubeUrl(trimmedUrl)) {
      setYoutubeHandoffUrl(trimmedUrl);
      setIsAnalyzing(false);
      return;
    }

    setYoutubeHandoffUrl(null);

    // 2. Online flow via m4k-api (Cobalt backend on VPS)
    setIsAnalyzing(true);

    try {
      const data = await resolveMedia(trimmedUrl, false);

      if (data.status === 'redirect' || data.status === 'tunnel') {
        triggerBrowserDownload(data.url, data.filename);
        setDownloadSuccess({
          filename: data.filename || 'media',
          url: data.url,
        });
      } else if (data.status === 'picker') {
        setCobaltPicker(data);
      } else if (data.status === 'error') {
        const errCode = data.error?.code || 'error.api.unknown';
        setErrorMessage(`Download error: ${errCode}`);
      } else {
        throw new Error('Unexpected response from download service.');
      }
    } catch (err: any) {
      setErrorMessage(
        sanitizeUserError(err.message || 'This media is currently unavailable for direct download.')
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchAnalyze = async (urls: string[]) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalyzeResult(null);
    setBatchResults([]);

    try {
      const res = await executeApiRequest('/analyze/batch', {
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
        throw new Error(sanitizeUserError(data.errors[0].error));
      }
    } catch (err: any) {
      setErrorMessage(sanitizeUserError(err.message || 'This media is currently unavailable for direct download.'));
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
    const selectedQualityOption = result.qualities?.find((q) => q.label === quality);
    const res = await executeApiRequest('/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.url,
        quality,
        format,
        subtitleLang,
        formatId: selectedQualityOption?.formatId,
        directUrl: selectedQualityOption?.directUrl || (result as any).directDownloadUrl,
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

      const res = await executeApiRequest('/downloads/batch', {
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
      setErrorMessage(sanitizeUserError(err.message || 'This media is currently unavailable for direct download.'));
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
      await executeApiRequest(`/downloads/${id}/cancel`, { method: 'POST' });
      setActiveDownloads((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'CANCELLED' } : it)),
      );
    } catch {}
  };

  const handleRetryDownload = async (id: string) => {
    try {
      const res = await executeApiRequest(`/downloads/${id}/retry`, { method: 'POST' });
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
      title: 'Fast Web Downloads',
      desc: 'Paste any public media link and download instantly — no signup, no software, no waiting.',
    },
    {
      icon: <Globe className="w-5 h-5 text-[#16A34A]" />,
      title: 'Wide Platform Support',
      desc: 'Facebook, Dailymotion, Archive.org, Direct MP4/WebM/HLS, and more via a single input.',
    },
    {
      icon: <Music className="w-5 h-5 text-[#16A34A]" />,
      title: 'High Quality Audio',
      desc: 'Extract audio in MP3 and M4A where supported by the source platform.',
    },
    {
      icon: <Layers className="w-5 h-5 text-[#16A34A]" />,
      title: 'Real Format Detection',
      desc: 'Only genuine available formats are shown. No fake 4K options for streams that do not support them.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#16A34A]" />,
      title: '100% Ad-Free & Clean',
      desc: 'Zero popups, adware, or tracking. Clean, transparent, and private media downloads.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#16A34A]" />,
      title: 'Zero Installation',
      desc: 'Runs fully in your browser. No extension, no desktop app, no configuration required.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Paste Link',
      desc: 'Copy any public video or audio URL and paste it into the input above.',
    },
    {
      step: '02',
      title: 'Select Quality',
      desc: 'Choose from available real formats — video quality or audio-only.',
    },
    {
      step: '03',
      title: 'Instant Save',
      desc: 'Your file downloads directly to your device via your browser.',
    },
  ];

  const faqs = [
    {
      q: 'What is My 4K Downloader?',
      a: 'My 4K Downloader is a free, web-based video downloader. Paste any supported public media link to download video or audio directly to your device — no software installation required.',
    },
    {
      q: 'Is My 4K Downloader free to use?',
      a: 'Yes, completely free with no subscriptions, paid tiers, or registration required.',
    },
    {
      q: 'Which platforms are supported on the website?',
      a: 'The website supports Facebook public videos, Dailymotion, Archive.org, and direct MP4/WebM/HLS streams directly in your browser. YouTube videos are downloaded via the companion My 4K Downloader Desktop engine for true 4K UHD and 320kbps MP3 audio.',
    },
    {
      q: 'How do I download YouTube videos?',
      a: 'Paste your YouTube link on the homepage. My 4K Downloader Desktop opens automatically to process and download your video in crisp 4K or 320kbps MP3 directly to your computer using your local internet.',
    },
    {
      q: 'Can I download Instagram or TikTok videos?',
      a: 'Instagram and TikTok use anti-bot systems that block access from shared servers. These platforms are not reliably supported via the web tool.',
    },
    {
      q: 'Which video formats are supported?',
      a: 'My 4K Downloader supports MP4 and WebM video, HLS streams, and MP3/M4A audio. Available quality options depend on what the source platform actually provides — only real formats are shown.',
    },
    {
      q: 'Are my downloads private?',
      a: 'Yes. We do not require accounts, do not log your download history, and do not retain your media on our servers.',
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Announcement Banner */}
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
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F172A] mb-2 leading-tight font-poppins">
          My <span className="bg-gradient-to-r from-[#16A34A] to-[#10B981] bg-clip-text text-transparent">4K Downloader</span>
        </h1>
        <p className="text-base sm:text-lg text-[#16A34A] font-bold max-w-xl mx-auto mb-2 font-poppins">
          Free Video Downloader
        </p>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mb-8 font-medium">
          Paste any supported public media link. Platform detected automatically. Download saves directly to your device.
        </p>

        {/* Paste Bar */}
        <PasteBar
          onAnalyze={handleAnalyze}
          onBatchAnalyze={handleBatchAnalyze}
          isLoading={isAnalyzing}
          onClearError={() => setErrorMessage(null)}
        />

        {/* YouTube Desktop Handoff Card */}
        {youtubeHandoffUrl && (
          <DesktopHandoffCard
            route={detectPlatformRoute(youtubeHandoffUrl)}
            url={youtubeHandoffUrl}
            onDismiss={() => setYoutubeHandoffUrl(null)}
            autoLaunch={true}
          />
        )}

        {/* Online Download Success Feedback */}
        {downloadSuccess && (
          <div className="w-full max-w-xl mx-auto my-4 p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span className="font-semibold truncate">
                Download started: {downloadSuccess.filename}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={downloadSuccess.url}
                target="_blank"
                rel="noopener noreferrer"
                download={downloadSuccess.filename}
                className="font-bold text-[#16A34A] hover:text-[#15803D] hover:underline"
              >
                Click if download didn&apos;t start
              </a>
              <button
                type="button"
                onClick={() => setDownloadSuccess(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Cobalt Carousel / Picker Items Grid */}
        {cobaltPicker && (
          <div className="w-full max-w-4xl mx-auto my-4 text-left">
            <MediaPickerGrid
              items={cobaltPicker.picker}
              audioUrl={cobaltPicker.audio}
              audioFilename={cobaltPicker.audioFilename}
              onClose={() => setCobaltPicker(null)}
            />
          </div>
        )}

        {/* Neutral inline error — small, no drama */}
        {errorMessage && (
          <div className="w-full max-w-xl mx-auto mt-3 px-4 py-2.5 flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="font-medium text-left">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isAnalyzing && (
          <div className="w-full max-w-xl mx-auto my-6 p-4 sm:p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs animate-pulse space-y-4">
            <div className="flex items-center gap-2.5 text-[#16A34A]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold">Checking video...</span>
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

        {/* Batch Results */}
        {batchResults.length > 0 && (
          <div className="w-full max-w-3xl mx-auto my-6 p-5 bg-white rounded-2xl border-2 border-[#16A34A]/30 shadow-lg text-left animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Batch Ready ({batchResults.length} Videos)
                </h3>
                <p className="text-xs text-[#64748B]">Click below to queue all simultaneously.</p>
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
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">{item.title}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {item.platform} • {item.qualities.find((q) => q.available)?.label || 'Original'}
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

        {/* Active & Completed Downloads */}
        <ActiveDownloads
          downloads={activeDownloads}
          onCancel={handleCancelDownload}
          onRetry={handleRetryDownload}
          onDismiss={(id) => setActiveDownloads((prev) => prev.filter((it) => it.id !== id))}
        />

        {/* Platform Row */}
        <PlatformRow onSelectPlatform={(_name, sampleUrl) => handleAnalyze(sampleUrl)} />
      </section>

      {/* Metrics Bar */}
      <section className="w-full max-w-4xl mx-auto px-4 my-6">
        <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#E2E8F0] shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="border-r border-[#F1F5F9] last:border-0 sm:last:border-0">
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-poppins">4K</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Ultra HD</div>
          </div>
          <div className="sm:border-r border-[#F1F5F9]">
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-poppins">320 kbps</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">High Quality MP3</div>
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

      {/* Features Grid */}
      <section id="features" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-lg mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-poppins mb-2">
            Why Choose My 4K Downloader
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Fast, honest, and completely private media downloads directly in your browser.
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

      {/* SEO Educational Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-[#F8FAF9] border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-poppins mb-3">
              About My 4K Downloader – Free Video Downloader
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              <strong>My 4K Downloader</strong> is a web-based, zero-installation video downloader.
              Paste any supported public media link and save your content in high-definition video or
              high-quality audio directly to your device — no accounts, no popups, no software required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Web-Supported Sources
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Facebook public videos, Dailymotion, Archive.org, direct MP4/WebM files, and HLS/M3U8 streams work reliably via the web tool.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Audio Extraction
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Extract audio in MP3 and M4A formats where the source platform provides an audio-only stream. Only genuine formats are shown.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Privacy & No Tracking
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                No accounts required. We do not log your download history or retain media files on our servers. Your downloads are yours alone.
              </p>
            </div>
          </div>

          {/* Platform note */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-[#64748B] leading-relaxed">
              <span className="font-bold text-[#16A34A]">Platform availability:</span> Facebook, Dailymotion, Archive.org, and direct media files download directly in your browser. YouTube videos download via the My 4K Downloader Desktop engine for true 4K UHD and 320kbps MP3 audio.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
