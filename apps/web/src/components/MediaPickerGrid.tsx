'use client';

import React from 'react';
import { Download, Image as ImageIcon, Video, X } from 'lucide-react';
import { Card, Button } from '@turbograb/ui';
import { CobaltPickerItem, triggerBrowserDownload } from '@/lib/m4k-api';

interface MediaPickerGridProps {
  items: CobaltPickerItem[];
  audioUrl?: string;
  audioFilename?: string;
  onClose: () => void;
}

export const MediaPickerGrid: React.FC<MediaPickerGridProps> = ({
  items,
  audioUrl,
  audioFilename,
  onClose,
}) => {
  return (
    <Card className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <span>Multiple Media Items Available</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A]">
              {items.length} Items
            </span>
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Select any item below to download directly in full resolution.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {items.map((item, idx) => {
          const isVideo = item.type === 'video';
          const previewSrc = item.thumb || item.url;

          return (
            <div
              key={idx}
              className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-[#16A34A]/40"
            >
              <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt={`Media item ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    {isVideo ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                    <span className="text-xs">Preview unavailable</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5">
                  {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  <span>{isVideo ? 'Video' : 'Photo'} #{idx + 1}</span>
                </div>
              </div>

              <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-600 truncate">
                  Item {idx + 1} of {items.length}
                </span>
                <Button
                  size="sm"
                  onClick={() => triggerBrowserDownload(item.url)}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {audioUrl && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
          <span className="text-xs font-semibold text-slate-700">Audio Track Available</span>
          <Button
            size="sm"
            onClick={() => triggerBrowserDownload(audioUrl, audioFilename)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audio</span>
          </Button>
        </div>
      )}
    </Card>
  );
};
