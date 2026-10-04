'use client';

import React, { useState } from 'react';
import { Clipboard, Sparkles, Loader2, ArrowRight, Layers } from 'lucide-react';
import { Button } from '@turbograb/ui';
import { isYouTubeUrl } from '@/lib/routing';

interface PasteBarProps {
  onAnalyze?: (url: string, useSmartMode?: boolean) => void;
  onBatchAnalyze?: (urls: string[]) => void;
  isLoading?: boolean;
  onClearError?: () => void;
}

export function extractUrlFromText(text: string): string {
  if (!text) return '';
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : text.trim();
}

export const PasteBar: React.FC<PasteBarProps> = ({
  onAnalyze,
  onBatchAnalyze,
  isLoading = false,
  onClearError,
}) => {
  const [url, setUrl] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePaste = async () => {
    if (onClearError) onClearError();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const trimmed = text.trim();
        const cleanSingle = extractUrlFromText(trimmed);
        const lines = trimmed.split('\n').map((l) => extractUrlFromText(l.trim())).filter((l) => l.startsWith('http'));
        if (lines.length > 1) {
          setIsBatchMode(true);
          setBatchText(lines.join('\n'));
        } else {
          const targetUrl = cleanSingle || trimmed;
          if (isBatchMode) {
            setBatchText((prev) => (prev ? `${prev}\n${targetUrl}` : targetUrl));
          } else {
            setUrl(targetUrl);
            if (isYouTubeUrl(targetUrl) && onAnalyze) {
              onAnalyze(targetUrl, false);
            }
          }
        }
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 1500);
      }
    } catch {
      // Clipboard permission denied or manual entry
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onClearError) onClearError();
    const val = e.target.value;
    if (val.includes('\n')) {
      setIsBatchMode(true);
      setBatchText(val);
      setUrl('');
      return;
    }
    setUrl(val);
    const clean = extractUrlFromText(val.trim());
    if (clean && isYouTubeUrl(clean) && onAnalyze) {
      onAnalyze(clean, false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBatchMode) {
      const urls = batchText
        .split('\n')
        .map((u) => extractUrlFromText(u.trim()))
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

      if (urls.length > 0 && onBatchAnalyze) {
        onBatchAnalyze(urls);
      }
    } else {
      const clean = extractUrlFromText(url);
      if (clean && onAnalyze) {
        onAnalyze(clean, false);
      }
    }
  };

  const batchCount = batchText
    .split('\n')
    .map((u) => extractUrlFromText(u.trim()))
    .filter((u) => u.startsWith('http://') || u.startsWith('https://')).length;

  return (
    <div id="paste-bar" className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <form
        onSubmit={handleSubmit}
        className="double-bezel-outer transition-all duration-200"
      >
        <div className="double-bezel-inner p-2 sm:p-2.5">
          {!isBatchMode ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center flex-1 min-w-0 px-2 py-1">
                <Sparkles className="w-5 h-5 text-[#16A34A] shrink-0 mr-2.5" />
                <input
                  type="text"
                  inputMode="url"
                  value={url}
                  onChange={handleInputChange}
                  placeholder="Paste any supported public media link..."
                  className="w-full bg-transparent py-2 text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-medium truncate"
                  required
                  aria-label="Paste any supported public media link"
                />

                {/* Micro Paste Pill */}
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] active:scale-95 border border-[#86EFAC]/40 rounded-full transition-all shrink-0 ml-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">
                    {copiedNotification ? 'Pasted!' : 'Paste'}
                  </span>
                </button>
              </div>

              {/* Main CTA button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !url.trim()}
                className="w-full sm:w-auto rounded-xl sm:rounded-full px-7 py-3.5 font-bold text-sm shrink-0 flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white shadow-md shadow-[#16A34A]/25 transition-transform cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Download</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col p-1.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9] mb-2 px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#16A34A]" />
                  <span className="text-xs font-bold text-[#0F172A]">
                    Batch Mode ({batchCount} {batchCount === 1 ? 'URL' : 'URLs'} detected)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchMode(false);
                      setBatchText('');
                    }}
                    className="text-xs text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    Single Mode
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.instagram.com/reel/...\nhttps://tiktok.com/@user/video/..."}
                className="w-full bg-[#F8FAF9] p-3 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] font-mono resize-none"
              />

              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] mt-2.5">
                <span className="text-[11px] text-[#64748B]">
                  Paste multiple links separated by line breaks
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || batchCount === 0}
                  className="rounded-xl px-5 py-2 font-bold text-xs bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Analyze {batchCount} Links</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Sub-bar mode toggler & Quick Tip */}
      <div className="flex items-center justify-between px-3 mt-2 text-[11px] text-[#64748B]">
        <button
          type="button"
          onClick={() => setIsBatchMode(!isBatchMode)}
          className="hover:text-[#16A34A] transition-colors font-medium flex items-center gap-1"
        >
          <Layers className="w-3 h-3 text-[#16A34A]" />
          <span>{isBatchMode ? 'Switch to single link' : 'Need multiple downloads? Try Batch Mode'}</span>
        </button>

        <span className="hidden sm:inline-block text-[#94A3B8]">
          Supports 4K, 1080p, 60fps & 320kbps MP3
        </span>
      </div>
    </div>
  );
};
