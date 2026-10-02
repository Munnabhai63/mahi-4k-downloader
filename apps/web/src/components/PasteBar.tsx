'use client';

import React, { useState } from 'react';
import { Clipboard, ArrowRight, Sparkles, Loader2, Download } from 'lucide-react';
import { Button } from '@turbograb/ui';

interface PasteBarProps {
  onAnalyze?: (url: string, useSmartMode?: boolean) => void;
  onBatchAnalyze?: (urls: string[]) => void;
  isLoading?: boolean;
}

export const PasteBar: React.FC<PasteBarProps> = ({ onAnalyze, onBatchAnalyze, isLoading = false }) => {
  const [url, setUrl] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const trimmed = text.trim();
        // Auto-detect if user pastes multiple URLs
        const lines = trimmed.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('http'));
        if (lines.length > 1) {
          setIsBatchMode(true);
          setBatchText(trimmed);
        } else {
          if (isBatchMode) {
            setBatchText((prev) => (prev ? `${prev}\n${trimmed}` : trimmed));
          } else {
            setUrl(trimmed);
          }
        }
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // If user pastes multiple lines into the input
    if (val.includes('\n')) {
      setIsBatchMode(true);
      setBatchText(val);
      setUrl('');
      return;
    }
    setUrl(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBatchMode) {
      const urls = batchText
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

      if (urls.length > 0 && onBatchAnalyze) {
        onBatchAnalyze(urls);
      }
    } else {
      if (url.trim() && onAnalyze) {
        onAnalyze(url.trim(), false);
      }
    }
  };

  const batchCount = batchText
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => u.startsWith('http://') || u.startsWith('https://')).length;

  return (
    <div id="paste-bar" className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white p-2 rounded-2xl sm:rounded-full border-2 border-[#16A34A]/30 shadow-[0_8px_30px_rgba(22,163,74,0.12)] transition-all duration-200 focus-within:border-[#16A34A] focus-within:ring-4 focus-within:ring-[#DCFCE7]"
      >
        {!isBatchMode ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center flex-1 min-w-0 pl-3">
              <Sparkles className="w-5 h-5 text-[#16A34A] shrink-0 mr-2" />
              <input
                type="url"
                value={url}
                onChange={handleInputChange}
                placeholder="Paste YouTube, Instagram, TikTok or audio link..."
                className="w-full bg-transparent py-2.5 text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-medium truncate"
                required
              />
              <button
                type="button"
                onClick={handlePaste}
                title="Paste from clipboard"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] rounded-full transition-colors shrink-0 ml-1"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Paste</span>
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !url}
              className="rounded-xl sm:rounded-full px-7 py-3 font-bold text-sm shrink-0 flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md shadow-[#16A34A]/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col p-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] mb-2 px-1">
              <span className="text-xs font-semibold text-[#64748B]">
                Batch Mode: Paste one URL per line
              </span>
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
                  Switch to Single Link
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.instagram.com/reel/...\nhttps://tiktok.com/@user/video/..."}
              className="w-full bg-transparent p-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-mono resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] mt-2">
              <span className="text-xs font-semibold text-[#16A34A]">
                {batchCount} link{batchCount === 1 ? '' : 's'} ready
              </span>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || batchCount === 0}
                className="rounded-full px-6 py-2 font-semibold text-sm flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Download All ({batchCount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
