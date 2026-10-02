'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  FileDown,
  RefreshCw,
  Trash2,
  Layers,
} from 'lucide-react';
import { Badge, Card, Button } from '@turbograb/ui';
import { DownloadItem } from '@turbograb/types';

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED'>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  };

  const fetchDownloads = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/downloads`);
      if (res.ok) {
        const data = await res.json();
        setDownloads(data);
      }
    } catch {
      // Offline fallback: empty or local mock
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${getApiUrl()}/downloads/${id}`, { method: 'DELETE' });
      setDownloads((prev) => prev.filter((it) => it.id !== id));
    } catch {}
  };

  const handleRetry = async (id: string) => {
    try {
      await fetch(`${getApiUrl()}/downloads/${id}/retry`, { method: 'POST' });
      fetchDownloads();
    } catch {}
  };

  const filtered = downloads.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase());

    const isCompleted = item.status === 'COMPLETED';
    const isFailed = item.status === 'FAILED';
    const isActive = ['DOWNLOADING', 'PROCESSING', 'QUEUED', 'PENDING'].includes(item.status);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && isCompleted) ||
      (statusFilter === 'FAILED' && isFailed) ||
      (statusFilter === 'ACTIVE' && isActive);

    const matchesPlatform =
      platformFilter === 'ALL' || item.platform.toLowerCase() === platformFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-[#0F172A] font-poppins">
            Download Manager
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Track active video conversion streams, access 10-minute signed links, and manage converted files.
          </p>
        </div>

        <Link href="/">
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>New Download</span>
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 mb-6 bg-white border-[#E2E8F0] shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by video title or original URL..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
            />
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-1 bg-[#F8FAF9] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold shrink-0">
            {(['ALL', 'ACTIVE', 'COMPLETED', 'FAILED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-white text-[#16A34A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#F8FAF9] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:border-[#16A34A] shrink-0"
          >
            <option value="ALL">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">X / Twitter</option>
            <option value="tiktok">TikTok</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </div>
      </Card>

      {/* Downloads List */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-[#64748B]">
          Loading download activity...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-white border-[#E2E8F0]">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center mx-auto text-[#16A34A] mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">
            No downloads match your criteria
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-4">
            Paste any video link on the homepage to start downloading in crisp 4K or high-bitrate MP3.
          </p>
          <Link href="/">
            <Button variant="primary" size="sm">
              Paste a Video URL
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            const isFailed = item.status === 'FAILED';
            const isActive = ['DOWNLOADING', 'PROCESSING', 'QUEUED', 'PENDING'].includes(item.status);

            return (
              <Card
                key={item.id}
                className={`p-4 bg-white border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-[#16A34A]/25'
                    : isFailed
                    ? 'border-[#EF4444]/25'
                    : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                    ) : (
                      <Download className="w-5 h-5 text-[#16A34A] animate-pulse" />
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
                      <span className="text-[11px] text-[#64748B]">
                        {formatBytes(item.totalBytes)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isCompleted && item.signedUrl && (
                    <a
                      href={item.signedUrl.startsWith('http') ? item.signedUrl : `http://localhost:4000${item.signedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg shadow-xs transition-transform hover:-translate-y-0.5"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}

                  {isFailed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(item.id)}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  )}

                  {isActive && (
                    <Badge variant="warning" size="sm" className="font-bold">
                      {item.progress.toFixed(0)}%
                    </Badge>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] rounded-md transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
