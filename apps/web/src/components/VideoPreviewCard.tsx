'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  X,
  Volume2,
  FileVideo,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
  Check,
  Copy,
  Tag,
  Sparkles,
  Sliders,
  Film,
  Music,
} from 'lucide-react';
import { Button, Card } from '@turbograb/ui';
import {
  AnalyzeResult,
  VideoQualityLabel,
  VideoFormat,
} from '@turbograb/types';
import { getApiBaseUrl } from '@/lib/api';

interface VideoPreviewCardProps {
  data: AnalyzeResult;
  onDownload: (config: {
    quality: VideoQualityLabel;
    format: VideoFormat;
    subtitleLang?: string;
    useSmartMode: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const labelToHeight: Record<string, number> = {
  '360p': 360,
  '480p': 480,
  '720p': 720,
  '1080p': 1080,
  '2K': 1440,
  '4K': 2160,
  '8K': 4320,
};

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  data,
  onDownload,
  onCancel,
  isLoading = false,
}) => {
  // Sort available video qualities ascending (360p -> 480p -> 720p -> 1080p -> 2K -> 4K -> 8K)
  const availableVideoQualities = useMemo(() => {
    const vList = data.qualities.filter((q) => q.available && q.label !== 'Audio');
    return vList.sort((a, b) => {
      const hA = a.height || labelToHeight[a.label] || 0;
      const hB = b.height || labelToHeight[b.label] || 0;
      return hA - hB;
    });
  }, [data.qualities]);

  const highestVideoQuality = availableVideoQualities[availableVideoQualities.length - 1];
  const audioOption = data.qualities.find((q) => q.label === 'Audio' && q.available);

  // Default to highest available quality
  const defaultQuality = highestVideoQuality ? highestVideoQuality.label : '1080p';

  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState<VideoQualityLabel>(defaultQuality);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Preference persistence for Thumbnail & Metadata options
  const [includeThumbnail, setIncludeThumbnail] = useState<boolean>(false);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(false);
  const [showMetadataDrawer, setShowMetadataDrawer] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSavingThumbnail, setIsSavingThumbnail] = useState<boolean>(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState<boolean>(false);

  // Resilient image loading with fallbacks
  const [imgSrc, setImgSrc] = useState<string>(data.thumbnailHdUrl || data.thumbnailUrl || '');
  const [fallbackStep, setFallbackStep] = useState<number>(0);

  useEffect(() => {
    setImgSrc(data.thumbnailHdUrl || data.thumbnailUrl || '');
    setFallbackStep(0);
  }, [data.thumbnailHdUrl, data.thumbnailUrl, data.url]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedThumb = localStorage.getItem('m4k_pref_include_thumb');
      const savedMeta = localStorage.getItem('m4k_pref_include_meta');
      if (savedThumb !== null) setIncludeThumbnail(savedThumb === 'true');
      if (savedMeta !== null) setIncludeMetadata(savedMeta === 'true');
    }
  }, []);

  const handleToggleIncludeThumbnail = () => {
    const next = !includeThumbnail;
    setIncludeThumbnail(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('m4k_pref_include_thumb', String(next));
    }
  };

  const handleToggleIncludeMetadata = () => {
    const next = !includeMetadata;
    setIncludeMetadata(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('m4k_pref_include_meta', String(next));
    }
  };

  const handleImageError = () => {
    if (fallbackStep === 0 && data.thumbnailUrl && data.thumbnailUrl !== imgSrc) {
      setFallbackStep(1);
      setImgSrc(data.thumbnailUrl);
    } else if (fallbackStep <= 1 && data.url && data.platform === 'youtube') {
      setFallbackStep(2);
      const match = data.url.match(/(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        setImgSrc(`https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`);
        return;
      }
      setImgSrc(`${getApiBaseUrl()}/analyze/thumbnail-proxy?url=${encodeURIComponent(data.thumbnailUrl)}`);
    } else if (fallbackStep <= 2 && data.thumbnailUrl) {
      setFallbackStep(3);
      setImgSrc(`${getApiBaseUrl()}/analyze/thumbnail-proxy?url=${encodeURIComponent(data.thumbnailUrl)}`);
    } else {
      setFallbackStep(4);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes >= 1024 * 1024 * 1024) {
      return `~${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `~${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const getQualityDetails = (label: VideoQualityLabel) => {
    switch (label) {
      case '8K':
        return { title: '8K Ultra HD', desc: 'Highest Possible Definition', badge: '8K' };
      case '4K':
        return { title: '4K Ultra HD', desc: '2160p Cinematic Clarity', badge: '4K' };
      case '2K':
        return { title: '2K Quad HD', desc: '1440p High Resolution', badge: '2K' };
      case '1080p':
        return { title: '1080p Full HD', desc: 'Crisp & Fast (Recommended)', badge: '1080p' };
      case '720p':
        return { title: '720p Standard HD', desc: 'Quick Download Size', badge: '720p' };
      case '480p':
        return { title: '480p SD', desc: 'Standard Definition', badge: '480p' };
      case '360p':
        return { title: '360p Mobile Saver', desc: 'Compact Mobile File', badge: '360p' };
      case 'Audio':
        return { title: 'MP3 High Quality', desc: '320kbps Pure Studio Audio', badge: 'MP3' };
      default:
        return { title: label, desc: 'Original Stream', badge: label };
    }
  };

  const getSafeTitle = () => {
    return (data.title || 'video')
      .replace(/[^a-zA-Z0-9_\u0900-\u097F\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 50) || 'media';
  };

  const handleDownloadThumbnailDirect = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSavingThumbnail(true);
    try {
      const targetImg = data.thumbnailHdUrl || data.thumbnailUrl;
      const proxyUrl = `${getApiBaseUrl()}/analyze/thumbnail-proxy?url=${encodeURIComponent(targetImg)}&download=1`;
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.download = `${getSafeTitle()}-thumbnail.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to trigger thumbnail download:', err);
    } finally {
      setTimeout(() => setIsSavingThumbnail(false), 1000);
    }
  };

  const generateMetadataText = () => {
    const lines = [
      `============================================================`,
      `MY 4K DOWNLOADER - MEDIA INFO & METADATA`,
      `============================================================`,
      `TITLE: ${data.title}`,
      `CHANNEL / CREATOR: ${data.uploader || 'N/A'}`,
      `PLATFORM: ${data.platform ? data.platform.toUpperCase() : 'UNKNOWN'}`,
      `DURATION: ${formatDuration(data.durationSec) || 'N/A'}`,
      `VIEWS: ${data.viewCount ? data.viewCount.toLocaleString() : 'N/A'}`,
      `ORIGINAL URL: ${data.url}`,
      `EXTRACTED AT: ${new Date().toLocaleString()}`,
      `============================================================`,
      data.tags && data.tags.length > 0
        ? `\nTAGS & KEYWORDS (${data.tags.length}):\n${data.tags.join(', ')}\n`
        : '',
      data.description
        ? `\nDESCRIPTION:\n${data.description}\n`
        : '',
      `============================================================`,
      `Generated by My 4K Downloader • Free, Unlimited 4K Video Downloader`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  const handleDownloadMetadataDirect = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSavingMetadata(true);
    try {
      const content = generateMetadataText();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${getSafeTitle()}-metadata.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to save metadata file:', err);
    } finally {
      setTimeout(() => setIsSavingMetadata(false), 1000);
    }
  };

  const handleCopyTags = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!data.tags || data.tags.length === 0) return;
    navigator.clipboard.writeText(data.tags.join(', '));
    setCopiedField('tags');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyDescription = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!data.description) return;
    navigator.clipboard.writeText(data.description);
    setCopiedField('desc');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadClick = () => {
    if (includeThumbnail) {
      handleDownloadThumbnailDirect();
    }
    if (includeMetadata) {
      handleDownloadMetadataDirect();
    }
    onDownload({
      quality: selectedQuality,
      format: selectedFormat,
      subtitleLang: selectedSubtitle || undefined,
      useSmartMode: false,
    });
  };

  const currentOption = data.qualities.find((q) => q.label === selectedQuality);
  const tagCount = data.tags?.length || 0;

  // Active quality index in sorted video qualities list
  const activeQualityIndex = availableVideoQualities.findIndex((q) => q.label === selectedQuality);

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Card className="overflow-hidden border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.08)] p-0 bg-white rounded-2xl">
        {/* Top Header: Clean Video Info & Thumbnail ONLY (No top tags/clutter) */}
        <div className="p-4 sm:p-5 border-b border-[#F1F5F9] relative bg-gradient-to-b from-white to-[#F8FAF9]/50">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-4 pr-6">
            {/* Visual Thumbnail Frame */}
            <div className="relative w-full sm:w-36 h-28 sm:h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-[#E2E8F0] shadow-sm group">
              {fallbackStep < 4 && imgSrc ? (
                <img
                  src={imgSrc}
                  alt={data.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800 p-2 text-center">
                  <FileVideo className="w-6 h-6 mb-1 text-slate-500" />
                  <span className="text-[10px] text-slate-400 font-medium">Video Preview</span>
                </div>
              )}

              {data.durationSec > 0 && (
                <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs shadow-xs">
                  {formatDuration(data.durationSec)}
                </span>
              )}
            </div>

            {/* Video Details: Pure and Clean */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug line-clamp-2" title={data.title}>
                {data.title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                {data.uploader && (
                  <span className="truncate max-w-[200px] font-semibold text-[#475569]">
                    {data.uploader}
                  </span>
                )}
                {data.platform && (
                  <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                    {data.platform}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quality & Format Selection Section */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Format Switcher Tabs: MP4 Video vs MP3 Audio */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setMediaType('video');
                if (selectedQuality === 'Audio') {
                  const targetQ = highestVideoQuality ? highestVideoQuality.label : '1080p';
                  setSelectedQuality(targetQ);
                  setSelectedFormat('mp4');
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mediaType === 'video'
                  ? 'bg-white text-[#16A34A] shadow-xs scale-[1.01]'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video (MP4)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMediaType('audio');
                setSelectedQuality('Audio');
                setSelectedFormat('mp3');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mediaType === 'audio'
                  ? 'bg-white text-[#16A34A] shadow-xs scale-[1.01]'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio (MP3)</span>
            </button>
          </div>

          {/* Video Quality Slider View */}
          {mediaType === 'video' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Top Quality Highlight Card */}
              <div className="p-3.5 rounded-xl border border-[#16A34A]/40 bg-gradient-to-r from-[#F0FDF4] to-[#F8FAF9] shadow-xs flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-[#0F172A] font-poppins">
                      {getQualityDetails(selectedQuality).title}
                    </span>
                    {highestVideoQuality?.label === selectedQuality && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                        Highest Quality ({highestVideoQuality.label})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {getQualityDetails(selectedQuality).desc} • MP4 Container
                  </p>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs sm:text-sm font-bold text-[#16A34A] block">
                    {formatBytes(currentOption?.estimatedBytes)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    EST. SIZE
                  </span>
                </div>
              </div>

              {/* Interactive Resolution Slider Track ("सिलाइटर") */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-[#E2E8F0] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                  <span className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                    <Sliders className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Resolution Slider:</span>
                  </span>
                  <span className="text-[11px] text-[#16A34A] font-bold">
                    Slide or click to change quality
                  </span>
                </div>

                {/* Range Slider (only when multiple qualities exist) */}
                {availableVideoQualities.length > 1 && (
                  <div className="px-1 py-1">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, availableVideoQualities.length - 1)}
                      step={1}
                      value={activeQualityIndex >= 0 ? activeQualityIndex : availableVideoQualities.length - 1}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        const targetQ = availableVideoQualities[idx];
                        if (targetQ) setSelectedQuality(targetQ.label);
                      }}
                      className="w-full accent-[#16A34A] cursor-pointer h-2.5 bg-slate-200 rounded-lg appearance-none transition-all"
                    />
                  </div>
                )}

                {/* Stepper Resolution Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
                  {availableVideoQualities.map((q, idx) => {
                    const isStepActive = selectedQuality === q.label;
                    const isMax = idx === availableVideoQualities.length - 1;
                    return (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setSelectedQuality(q.label)}
                        className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                          isStepActive
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs font-bold scale-[1.02]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <div className="text-xs font-bold leading-none">{q.label}</div>
                        <div
                          className={`text-[9px] mt-1 font-semibold leading-none ${
                            isStepActive ? 'text-white/90' : 'text-slate-400'
                          }`}
                        >
                          {isMax ? '⭐ MAX' : formatBytes(q.estimatedBytes) || 'HD'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Audio Quality View */}
          {mediaType === 'audio' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Top Audio Card */}
              <div className="p-3.5 rounded-xl border border-[#16A34A]/40 bg-gradient-to-r from-[#F0FDF4] to-[#F8FAF9] shadow-xs flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                    <span className="text-sm sm:text-base font-black text-[#0F172A] font-poppins">
                      MP3 High Quality Audio
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                      320 kbps
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Studio sound extracted directly with universal MP3 playback
                  </p>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs sm:text-sm font-bold text-[#16A34A] block">
                    {formatBytes(audioOption?.estimatedBytes) || '~4 MB'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    AUDIO
                  </span>
                </div>
              </div>

              {/* Audio Format Selector Pills */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Choose Audio Format:</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { fmt: 'mp3' as VideoFormat, label: 'MP3', desc: 'Universal 320kbps' },
                    { fmt: 'm4a' as VideoFormat, label: 'M4A', desc: 'Apple AAC' },
                    { fmt: 'wav' as VideoFormat, label: 'WAV', desc: 'Lossless Audio' },
                  ].map((item) => (
                    <button
                      key={item.fmt}
                      type="button"
                      onClick={() => setSelectedFormat(item.fmt)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        selectedFormat === item.fmt
                          ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          selectedFormat === item.fmt ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Download CTA */}
          <div className="pt-1">
            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadClick}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-sm bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white shadow-md shadow-[#16A34A]/25 flex items-center justify-center gap-2 transition-transform cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Download Engine...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Download {mediaType === 'audio' ? `Audio (${selectedFormat.toUpperCase()})` : `${selectedQuality} ${selectedFormat.toUpperCase()}`}
                    {currentOption?.estimatedBytes
                      ? ` • ${formatBytes(currentOption.estimatedBytes)}`
                      : ''}
                  </span>
                </>
              )}
            </Button>

            {(includeThumbnail || includeMetadata) && (
              <div className="mt-2 text-center text-[11px] text-[#16A34A] font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>
                  Will also save:{' '}
                  {[
                    includeThumbnail && 'HD Thumbnail',
                    includeMetadata && 'Tags & Info (.txt)',
                  ]
                    .filter(Boolean)
                    .join(' + ')}
                </span>
              </div>
            )}
          </div>

          {/* Down Below: Tags, Description & Extras Section (Placed DOWN per user request) */}
          <div className="pt-2 border-t border-[#F1F5F9] space-y-2.5">
            {/* Automatic Extras (Saved Preferences) */}
            <div className="p-3 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Save Extras with Video</span>
                </span>
                <span className="text-[10px] text-[#94A3B8]">1-Click Save</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  onClick={handleToggleIncludeThumbnail}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    includeThumbnail
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#16A34A]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includeThumbnail ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {includeThumbnail && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">Also save HD Thumbnail</div>
                    <div className="text-[10px] font-normal text-[#64748B]">Auto-saves image file</div>
                  </div>
                </label>

                <label
                  onClick={handleToggleIncludeMetadata}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    includeMetadata
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#16A34A]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includeMetadata ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {includeMetadata && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">Also save Tags & Info (.txt)</div>
                    <div className="text-[10px] font-normal text-[#64748B]">Title, tags & description</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Direct Tags & Thumbnail Tools Drawer (Placed DOWN) */}
            <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
                className="w-full p-3 bg-slate-50/70 hover:bg-slate-100 text-left flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#16A34A]" />
                  <span>Download Thumbnail, Tags & Description Directly</span>
                  {tagCount > 0 && (
                    <span className="bg-[#DCFCE7] text-[#16A34A] text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {tagCount} tags available
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    showMetadataDrawer ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              </button>

              {showMetadataDrawer && (
                <div className="p-3.5 space-y-3.5 bg-white border-t border-[#E2E8F0] animate-in fade-in duration-150">
                  {/* Quick Direct Download Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadThumbnailDirect}
                      disabled={isSavingThumbnail}
                      className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{isSavingThumbnail ? 'Saving...' : 'Download HD Thumbnail (.jpg)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadMetadataDirect}
                      disabled={isSavingMetadata}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isSavingMetadata ? 'Saving...' : 'Download Info & Tags (.txt)'}</span>
                    </button>
                  </div>

                  {/* Tags Cloud Preview */}
                  {tagCount > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                          Tags & Keywords ({tagCount})
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTags}
                          className="text-[11px] text-[#16A34A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'tags' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied All Tags!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy All Tags</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-slate-50 rounded-lg border border-[#E2E8F0]">
                        {data.tags!.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white hover:bg-[#DCFCE7] text-slate-700 hover:text-[#16A34A] rounded-md text-[11px] font-medium border border-slate-200 transition-colors shadow-2xs"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description Preview */}
                  {data.description && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                          Video Description
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyDescription}
                          className="text-[11px] text-[#16A34A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'desc' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Description</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-[#E2E8F0] max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                        {data.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Advanced container & subtitle options */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Hide container & subtitle options</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Advanced options (MKV, Apple AAC, Subtitles)</span>
                  </>
                )}
              </button>

              {showAdvanced && (
                <div className="mt-2.5 p-3.5 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0] space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                      Container Format
                    </label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value as VideoFormat)}
                      className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#16A34A]"
                    >
                      {mediaType === 'audio' ? (
                        <>
                          <option value="mp3">MP3 (Universal 320kbps Audio)</option>
                          <option value="m4a">M4A (Apple AAC Audio)</option>
                          <option value="wav">WAV (Lossless Audio)</option>
                        </>
                      ) : (
                        <>
                          <option value="mp4">MP4 (Default Compatible Video)</option>
                          <option value="mkv">MKV (Matroska Video)</option>
                          <option value="mp3">Audio Only (MP3)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {data.subtitles && data.subtitles.length > 0 && (
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                        Subtitles / Closed Captions
                      </label>
                      <select
                        value={selectedSubtitle}
                        onChange={(e) => setSelectedSubtitle(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#16A34A]"
                      >
                        <option value="">None (Video Only)</option>
                        {data.subtitles.map((sub, idx) => (
                          <option key={idx} value={sub.code}>
                            {sub.language} {sub.isAutoGenerated ? '(Auto)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
