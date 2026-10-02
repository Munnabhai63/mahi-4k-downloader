'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileDown,
  Gauge,
  Clock,
  HardDrive,
} from 'lucide-react';
import { Card, Badge, ProgressBar, Button } from '@turbograb/ui';
import { DownloadItem, ProgressEventPayload } from '@turbograb/types';
import { io, Socket } from 'socket.io-client';

interface ActiveDownloadsProps {
  downloads: DownloadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onRefresh?: () => void;
}

export const ActiveDownloads: React.FC<ActiveDownloadsProps> = ({
  downloads: initialDownloads,
  onCancel,
  onRetry,
}) => {
  const [items, setItems] = useState<DownloadItem[]>(initialDownloads);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    setItems(initialDownloads);
  }, [initialDownloads]);

  // Connect to Socket.IO real-time progress gateway
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    let socket: Socket;

    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        // Subscribe to current items
        items.forEach((it) => {
          socket.emit('subscribe_download', { downloadId: it.id });
        });
      });

      socket.on('download_progress', (payload: ProgressEventPayload) => {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === payload.downloadId) {
              return {
                ...item,
                status: payload.status,
                progress: payload.progress,
                speedBps: payload.speedBps,
                etaSec: payload.etaSec,
                downloadedBytes: payload.downloadedBytes,
                totalBytes: payload.totalBytes,
                errorMsg: payload.errorMsg,
                signedUrl: payload.signedUrl || item.signedUrl,
              };
            }
            return item;
          }),
        );
      });
    } catch {
      // Offline or socket failure gracefully handled
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const formatSpeed = (bps: number) => {
    if (!bps || bps <= 0) return '0 KB/s';
    const mbps = bps / (1024 * 1024);
    if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`;
    return `${(bps / 1024).toFixed(0)} KB/s`;
  };

  const formatEta = (seconds: number) => {
    if (!seconds || seconds <= 0) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'active') return ['DOWNLOADING', 'PROCESSING', 'QUEUED', 'PENDING'].includes(item.status);
    if (activeTab === 'completed') return item.status === 'COMPLETED';
    return true;
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <section id="active-downloads" className="w-full max-w-4xl mx-auto my-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#0F172A] font-poppins">
            Download Tasks
          </h2>
          <Badge variant="mint" size="sm" className="font-bold">
            {items.length}
          </Badge>
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1 bg-[#F8FAF9] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-white text-[#16A34A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'active' ? 'bg-white text-[#16A34A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'completed' ? 'bg-white text-[#16A34A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => {
          const isCompleted = item.status === 'COMPLETED';
          const isFailed = item.status === 'FAILED';
          const isCancelled = item.status === 'CANCELLED';
          const isDownloading = item.status === 'DOWNLOADING' || item.status === 'PROCESSING' || item.status === 'QUEUED';

          return (
            <Card
              key={item.id}
              className={`p-5 bg-white border transition-all ${
                isCompleted
                  ? 'border-[#16A34A]/30 shadow-[0_4px_20px_rgba(22,163,74,0.08)]'
                  : isFailed
                  ? 'border-[#EF4444]/30'
                  : 'border-[#E2E8F0]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                    ) : (
                      <Download className="w-5 h-5 text-[#16A34A] animate-bounce" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#0F172A] truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="mint" size="sm" className="uppercase font-bold text-[10px]">
                        {item.platform}
                      </Badge>
                      <Badge variant="neutral" size="sm" className="font-bold text-[10px]">
                        {item.quality}
                      </Badge>
                      <Badge variant="neutral" size="sm" className="uppercase font-bold text-[10px]">
                        {item.format}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status indicator & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isCompleted && item.signedUrl && (
                    <a
                      href={item.signedUrl.startsWith('http') ? item.signedUrl : `http://localhost:4000${item.signedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all transform hover:-translate-y-0.5"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Save Video ({formatBytes(item.totalBytes)})</span>
                    </a>
                  )}

                  {isDownloading && onCancel && (
                    <button
                      type="button"
                      onClick={() => onCancel(item.id)}
                      className="p-2 text-[#64748B] hover:text-[#EF4444] rounded-lg hover:bg-red-50 transition-colors"
                      title="Cancel download"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}

                  {(isFailed || isCancelled) && onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(item.id)}
                      className="text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {isDownloading && (
                <div className="space-y-2 pt-1">
                  <ProgressBar
                    progress={item.progress}
                    size="md"
                  />

                  {/* Real-time Telemetry strip */}
                  <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-[#16A34A]">{item.progress.toFixed(1)}%</span>
                      <span>completed</span>
                    </span>

                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>{formatSpeed(item.speedBps)}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>ETA: {formatEta(item.etaSec)}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>
                          {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message display */}
              {isFailed && item.errorMsg && (
                <div className="mt-2 text-xs text-[#EF4444] bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{item.errorMsg}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
};
