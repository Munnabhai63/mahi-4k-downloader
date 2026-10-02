'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  ArrowLeft,
  Search,
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  HardDrive,
  FileDown,
} from 'lucide-react';
import { Button, Card, Badge } from '@turbograb/ui';
import { DownloadItem } from '@turbograb/types';

export default function HistoryPage() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (search) params.append('search', search);
      if (platform !== 'ALL') params.append('platform', platform);

      const res = await fetch(`${getApiUrl()}/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, platform]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleExportCsv = () => {
    window.open(`${getApiUrl()}/history/export`, '_blank');
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#0F172A] font-poppins">
              Download History
            </h1>
            <Badge variant="mint" size="sm" className="font-bold">
              {totalCount} Total
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Browse, search, and export your video conversion logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" />
            <span>Export CSV</span>
          </Button>

          <Link href="/">
            <Button variant="primary" size="md" className="flex items-center gap-1.5 text-xs">
              <Download className="w-4 h-4" />
              <span>New Download</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 mb-6 bg-white border-[#E2E8F0] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history by video title or URL..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
            >
              <option value="ALL">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">X / Twitter</option>
              <option value="tiktok">TikTok</option>
              <option value="vimeo">Vimeo</option>
            </select>

            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Items List */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-[#64748B]">
          Loading download history...
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center bg-white border-[#E2E8F0]">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center mx-auto text-[#16A34A] mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">
            No completed downloads found
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-4">
            Completed video and audio conversions will automatically appear here with exportable history.
          </p>
          <Link href="/">
            <Button variant="primary" size="sm">
              Start a Download
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 bg-white border border-[#E2E8F0] hover:border-[#16A34A]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#0F172A] truncate">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="mint" size="sm" className="uppercase font-bold text-[10px]">
                      {item.platform}
                    </Badge>
                    <Badge variant="neutral" size="sm" className="font-bold text-[10px]">
                      {item.quality}
                    </Badge>
                    <Badge variant="neutral" size="sm" className="uppercase font-bold text-[10px]">
                      {item.format}
                    </Badge>
                    <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatBytes(item.totalBytes)}
                    </span>
                    <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.completedAt || item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-auto shrink-0">
                {item.signedUrl ? (
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
                ) : (
                  <span className="text-xs text-[#94A3B8]">Expired</span>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-[#64748B] px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
