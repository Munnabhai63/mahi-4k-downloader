'use client';

import React, { useState } from 'react';
import {
  Download,
  X,
  Volume2,
  FileVideo,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { Button, Card } from '@turbograb/ui';
import {
  AnalyzeResult,
  VideoQualityLabel,
  VideoFormat,
  QualityOption,
} from '@turbograb/types';

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

  const getQualityDisplayName = (label: VideoQualityLabel) => {
    switch (label) {
      case '8K':
        return '8K Ultra HD (Highest Quality)';
      case '4K':
        return '4K Ultra HD (2160p)';
      case '2K':
        return '2K Quad HD (1440p)';
      case '1080p':
        return '1080p Full HD (Recommended)';
      case '720p':
        return '720p HD (Fast Download)';
      case '480p':
        return '480p Standard Quality';
      case '360p':
        return '360p Data Saver';
      case 'Audio':
        return 'MP3 Audio (320kbps High Quality)';
      default:
        return label;
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

  const handleDownloadClick = () => {
    onDownload({
      quality: selectedQuality,
      format: selectedFormat,
      subtitleLang: selectedSubtitle || undefined,
      useSmartMode: false,
    });
  };

  // Keep only relevant distinct qualities to prevent clutter (max 5 items)
  const displayQualities = data.qualities.filter((q) => q.available);
  const currentOption = data.qualities.find((q) => q.label === selectedQuality);

  return (
    <div className="w-full max-w-xl mx-auto my-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Card className="overflow-hidden border border-[#E2E8F0] shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-0 bg-white rounded-2xl">
        {/* Top Header: Video Info */}
        <div className="p-4 sm:p-5 border-b border-[#F1F5F9] relative">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            <div className="relative w-24 h-16 sm:w-28 sm:h-18 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-[#E2E8F0]">
              {data.thumbnailUrl ? (
                <img
                  src={data.thumbnailUrl}
                  alt={data.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <FileVideo className="w-6 h-6" />
                </div>
              )}
              {data.durationSec > 0 && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold px-1 rounded">
                  {formatDuration(data.durationSec)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug line-clamp-2">
                {data.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B]">
                {data.uploader && (
                  <span className="truncate max-w-[150px] font-medium text-[#475569]">
                    {data.uploader}
                  </span>
                )}
                {data.platform && (
                  <span className="bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded text-[11px] font-semibold uppercase">
                    {data.platform}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proper Single-Column Quality List */}
        <div className="p-4 sm:p-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            Select Quality
          </div>

          <div className="space-y-1.5">
            {displayQualities.map((q) => {
              const isSelected = selectedQuality === q.label;
              const isAudio = q.label === 'Audio';
              const size = formatBytes(q.estimatedBytes);

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

                    <div className="flex items-center gap-2 truncate">
                      {isAudio ? (
                        <Volume2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      ) : null}
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected ? 'text-[#16A34A]' : 'text-[#0F172A]'
                        }`}
                      >
                        {getQualityDisplayName(q.label)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    {size && (
                      <span className="text-[#64748B] font-medium">{size}</span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
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

          {/* Optional Collapsible More Options (Format / Subtitles) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 font-medium transition-colors"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide format options</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>More options (Format & Subtitles)</span>
                </>
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0] space-y-3 animate-in fade-in">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                    File Format
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as VideoFormat)}
                    className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#16A34A]"
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
                      Subtitles
                    </label>
                    <select
                      value={selectedSubtitle}
                      onChange={(e) => setSelectedSubtitle(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="">No Subtitles</option>
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

          {/* Prominent Single Column Action Button */}
          <div className="pt-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadClick}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#16A34A] hover:bg-[#15803D] text-white shadow-[0_4px_16px_rgba(22,163,74,0.25)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting Download...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Download {selectedQuality === 'Audio' ? 'Audio' : selectedQuality} (
                    {selectedFormat.toUpperCase()}
                    {currentOption?.estimatedBytes
                      ? ` • ${formatBytes(currentOption.estimatedBytes)}`
                      : ''}
                    )
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
