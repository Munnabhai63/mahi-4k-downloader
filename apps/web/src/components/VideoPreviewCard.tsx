'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Volume2,
  FileVideo,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
  FileText,
  Check,
  Copy,
  Tag,
  Sparkles,
} from 'lucide-react';
import { Button, Card } from '@turbograb/ui';
import {
  AnalyzeResult,
  VideoQualityLabel,
  VideoFormat,
  QualityOption,
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

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  data,
  onDownload,
  onCancel,
  isLoading = false,
}) => {
  // Default to 1080p if available, else first available video quality, else 720p
  const defaultQuality =
    data.qualities.find((q) => q.label === '1080p' && q.available)?.label ||
    data.qualities.find((q) => q.available && q.label !== 'Audio')?.label ||
    '1080p';

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

  // Robust resilient image loading with smart proxy and resolution fallbacks
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
        return { title: '4K Ultra HD', desc: '2160p Cinematic Quality', badge: '4K' };
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
        return { title: 'MP3 High Quality', desc: '320kbps Pure Audio', badge: 'MP3' };
      default:
        return { title: label, desc: 'Original Stream', badge: label };
    }
  };

  const handleSelect = (q: QualityOption) => {
    if (!q.available) return;
    setSelectedQuality(q.label);
    if (q.label === 'Audio') {
      setSelectedFormat('mp3');
    } else if (['mp3', 'm4a', 'ogg', 'wav'].includes(selectedFormat)) {
      setSelectedFormat('mp4');
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

  const displayQualities = data.qualities.filter((q) => q.available);
  const currentOption = data.qualities.find((q) => q.label === selectedQuality);
  const tagCount = data.tags?.length || 0;
  const hasDetails = tagCount > 0 || Boolean(data.description);

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Card className="overflow-hidden border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.08)] p-0 bg-white rounded-2xl">
        {/* Top Header: Video Info & Thumbnail */}
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

              {/* Direct Quick Thumbnail Download Overlay Icon */}
              <button
                type="button"
                onClick={handleDownloadThumbnailDirect}
                title="Download HD Thumbnail image directly"
                className="absolute top-1.5 left-1.5 p-1 bg-black/70 hover:bg-[#16A34A] text-white rounded-md opacity-90 hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs flex items-center gap-1 text-[10px] font-bold px-1.5"
              >
                <ImageIcon className="w-3 h-3" />
                <span className="hidden xs:inline">HD</span>
              </button>
            </div>

            {/* Video Details */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug line-clamp-2" title={data.title}>
                {data.title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                {data.uploader && (
                  <span className="truncate max-w-[170px] font-semibold text-[#475569]">
                    {data.uploader}
                  </span>
                )}
                {data.platform && (
                  <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                    {data.platform}
                  </span>
                )}
                {tagCount > 0 && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    {tagCount} tags
                  </span>
                )}
              </div>

              {/* Quick Actions Bar */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadThumbnailDirect}
                  disabled={isSavingThumbnail}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F0FDF4] border border-[#E2E8F0] hover:border-[#86EFAC] text-[#16A34A] rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Download High-Res Thumbnail Image"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isSavingThumbnail ? 'Saving...' : 'Save HD Thumbnail'}</span>
                </button>

                {hasDetails && (
                  <button
                    type="button"
                    onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-slate-300 text-slate-700 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                    title="View Tags, Title, and Description"
                  >
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tags & Description</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showMetadataDrawer ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Tags & Description Drawer */}
          {showMetadataDrawer && hasDetails && (
            <div className="mt-3.5 pt-3.5 border-t border-[#E2E8F0] bg-[#F8FAF9] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-2xl animate-in fade-in duration-150 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                  <FileText className="w-4 h-4 text-[#16A34A]" />
                  <span>Video Details & Keywords</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMetadataDirect}
                    disabled={isSavingMetadata}
                    className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    title="Download Title, Tags and Description as .txt"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isSavingMetadata ? 'Saving...' : 'Download .TXT'}</span>
                  </button>
                </div>
              </div>

              {/* Tags Section */}
              {tagCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Tags ({tagCount})
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
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-lg border border-[#E2E8F0]">
                    {data.tags!.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#F1F5F9] hover:bg-[#DCFCE7] text-slate-700 hover:text-[#16A34A] rounded-md text-[10px] font-medium transition-colors"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Section */}
              {data.description && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Description
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
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-[#E2E8F0] max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                    {data.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quality Options Section */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Choose Quality & Format
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              {displayQualities.length} stream options
            </span>
          </div>

          <div className="space-y-1.5">
            {displayQualities.map((q) => {
              const isSelected = selectedQuality === q.label;
              const isAudio = q.label === 'Audio';
              const size = formatBytes(q.estimatedBytes);
              const info = getQualityDetails(q.label);

              return (
                <div
                  key={q.label}
                  onClick={() => handleSelect(q)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-[#16A34A] bg-[#F0FDF4] shadow-xs'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#16A34A] bg-[#16A34A]'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isAudio ? (
                          <Volume2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                        ) : null}
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? 'text-[#16A34A]' : 'text-[#0F172A]'
                          }`}
                        >
                          {info.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] block truncate">
                        {info.desc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    {size && (
                      <span className="text-[#64748B] font-medium hidden xs:inline">{size}</span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isSelected
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}
                    >
                      {isAudio ? 'MP3' : 'MP4'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download Extras & Preferences Section */}
          <div className="mt-3 p-3 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Automatic Extras (Saved Preferences)</span>
              </span>
              <span className="text-[10px] text-[#94A3B8]">Remembered</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option 1: Also Download Thumbnail */}
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

              {/* Option 2: Also Save Tags & Description */}
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

          {/* More options accordion (Format & Subtitles) */}
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
                    {selectedQuality === 'Audio' ? (
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

          {/* Download Action CTA */}
          <div className="pt-2">
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
                    Download {selectedQuality === 'Audio' ? 'Audio (MP3)' : `${selectedQuality} ${selectedFormat.toUpperCase()}`}
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
        </div>
      </Card>
    </div>
  );
};
