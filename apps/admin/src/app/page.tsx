'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  DownloadCloud,
  Activity,
  HardDrive,
  AlertTriangle,
  Cpu,
  Settings,
  FileText,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  Save,
  Globe,
} from 'lucide-react';
import { Card, Badge, Button } from '@turbograb/ui';

interface AdminTelemetry {
  totalUsers: number;
  activeSockets: number;
  downloadsToday: number;
  bandwidthTodayBytes: number;
  errorRatePct: number;
  queueDepth: number;
  workerClusterStatus: {
    totalWorkers: number;
    healthyWorkers: number;
    activeJobs: number;
  };
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  planId: string;
  isBanned: boolean;
  createdAt: string;
}

interface DownloadItem {
  id: string;
  url: string;
  title: string;
  platform: string;
  quality: string;
  format: string;
  status: string;
  progress: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cms' | 'users' | 'downloads' | 'legal' | 'settings' | 'audit'
  >('overview');

  const [telemetry, setTelemetry] = useState<AdminTelemetry>({
    totalUsers: 3,
    activeSockets: 1,
    downloadsToday: 0,
    bandwidthTodayBytes: 0,
    errorRatePct: 0,
    queueDepth: 0,
    workerClusterStatus: { totalWorkers: 4, healthyWorkers: 4, activeJobs: 0 },
  });

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [dmcaReports, setDmcaReports] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    freeDailyLimit: 15,
    studentDailyLimit: 50,
    premiumDailyLimit: 1000,
    maxFileSizeGb: 20,
    maintenanceMode: false,
    announcementBanner: {
      enabled: false,
      message: 'System running at maximum 4K & 8K speeds!',
      level: 'info',
    },
    appContent: {
      siteTitle: 'Mahi 4K Downloader',
      heroHeadline: 'Download Any Video. Fast & Free.',
      heroSubtitle: 'Paste any video link to download in HD & MP3 with Mahi 4K Downloader by Munna Bhai.',
      creatorName: 'Munna Bhai',
      announcementNotice: 'Welcome to official Mahi 4K Downloader by Munna Bhai!',
    },
  });

  // Super Admin Live CMS State
  const [cmsForm, setCmsForm] = useState({
    siteTitle: 'Mahi 4K Downloader',
    heroHeadline: 'Download Any Video. Fast & Free.',
    heroSubtitle: 'Paste any video link to download in HD & MP3 with Mahi 4K Downloader by Munna Bhai.',
    creatorName: 'Munna Bhai',
    announcementNotice: 'Welcome to official Mahi 4K Downloader by Munna Bhai!',
    studentDailyLimit: 50,
    freeDailyLimit: 15,
    announcementBannerEnabled: false,
    announcementBannerMessage: 'System running at maximum 4K & 8K speeds!',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingCms, setIsSavingCms] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, uRes, dRes, sRes, aRes, dmcaRes] = await Promise.all([
        fetch(`${getApiUrl()}/admin/overview`),
        fetch(`${getApiUrl()}/admin/users`),
        fetch(`${getApiUrl()}/admin/downloads`),
        fetch(`${getApiUrl()}/admin/settings`),
        fetch(`${getApiUrl()}/admin/audit-logs`),
        fetch(`${getApiUrl()}/dmca/reports`),
      ]);

      if (ovRes.ok) setTelemetry(await ovRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (dRes.ok) setDownloads(await dRes.json());
      if (sRes.ok) {
        const s = await sRes.json();
        setSettings(s);
        setCmsForm((prev) => ({
          ...prev,
          siteTitle: s.appContent?.siteTitle || prev.siteTitle,
          heroHeadline: s.appContent?.heroHeadline || prev.heroHeadline,
          heroSubtitle: s.appContent?.heroSubtitle || prev.heroSubtitle,
          creatorName: s.appContent?.creatorName || prev.creatorName,
          announcementNotice: s.appContent?.announcementNotice || prev.announcementNotice,
          studentDailyLimit: s.studentDailyLimit || prev.studentDailyLimit,
          freeDailyLimit: s.freeDailyLimit || prev.freeDailyLimit,
          announcementBannerEnabled: s.announcementBanner?.enabled ?? prev.announcementBannerEnabled,
          announcementBannerMessage: s.announcementBanner?.message || prev.announcementBannerMessage,
        }));
      }
      if (aRes.ok) setAuditLogs(await aRes.json());
      if (dmcaRes.ok) setDmcaReports(await dmcaRes.json());
    } catch (e) {
      console.error('Failed to load admin telemetry', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    try {
      const res = await fetch(`${getApiUrl()}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !currentBanned }),
      });
      if (res.ok) {
        setStatusMessage(`User ${currentBanned ? 'unbanned' : 'banned'} successfully.`);
        loadData();
      }
    } catch {
      setStatusMessage('Failed to update user ban state.');
    }
  };

  const handleChangePlan = async (userId: string, newPlan: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/admin/users/${userId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: newPlan }),
      });
      if (res.ok) {
        setStatusMessage(`User plan updated to ${newPlan.toUpperCase()}.`);
        loadData();
      }
    } catch {
      setStatusMessage('Failed to change plan.');
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const next = !settings.maintenanceMode;
      const res = await fetch(`${getApiUrl()}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: next }),
      });
      if (res.ok) {
        setSettings({ ...settings, maintenanceMode: next });
        setStatusMessage(`Maintenance mode ${next ? 'enabled' : 'disabled'}.`);
      }
    } catch {
      setStatusMessage('Failed to toggle maintenance mode.');
    }
  };

  const handleToggleBanner = async () => {
    try {
      const next = !settings.announcementBanner.enabled;
      const res = await fetch(`${getApiUrl()}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementBanner: { ...settings.announcementBanner, enabled: next },
        }),
      });
      if (res.ok) {
        setSettings({
          ...settings,
          announcementBanner: { ...settings.announcementBanner, enabled: next },
        });
        setStatusMessage(`Announcement banner ${next ? 'visible' : 'hidden'}.`);
      }
    } catch {
      setStatusMessage('Failed to toggle banner.');
    }
  };

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCms(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`${getApiUrl()}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDailyLimit: Number(cmsForm.studentDailyLimit),
          freeDailyLimit: Number(cmsForm.freeDailyLimit),
          announcementBanner: {
            enabled: cmsForm.announcementBannerEnabled,
            message: cmsForm.announcementBannerMessage,
            level: 'info',
          },
          appContent: {
            siteTitle: cmsForm.siteTitle,
            heroHeadline: cmsForm.heroHeadline,
            heroSubtitle: cmsForm.heroSubtitle,
            creatorName: cmsForm.creatorName,
            announcementNotice: cmsForm.announcementNotice,
          },
        }),
      });

      if (res.ok) {
        setStatusMessage('✅ Super Admin update successful! Live website content updated immediately for all users & students.');
        loadData();
      } else {
        setStatusMessage('Failed to save Super Admin settings.');
      }
    } catch {
      setStatusMessage('Network error saving settings.');
    } finally {
      setIsSavingCms(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const statCards = [
    {
      title: 'Total Accounts',
      value: String(telemetry.totalUsers),
      change: 'Registered users & students',
      icon: <Users className="w-5 h-5 text-[#16A34A]" />,
    },
    {
      title: 'Active Sockets',
      value: String(telemetry.activeSockets),
      change: 'Real-time connections',
      icon: <Activity className="w-5 h-5 text-[#16A34A]" />,
    },
    {
      title: 'Total Downloads',
      value: String(telemetry.downloadsToday),
      change: 'Processed video jobs',
      icon: <DownloadCloud className="w-5 h-5 text-[#16A34A]" />,
    },
    {
      title: 'Bandwidth Served',
      value: formatBytes(telemetry.bandwidthTodayBytes),
      change: 'High-speed cloud stream',
      icon: <HardDrive className="w-5 h-5 text-[#16A34A]" />,
    },
    {
      title: 'Failure Rate',
      value: `${telemetry.errorRatePct}%`,
      change: 'SLA healthy (<2%)',
      icon: <AlertTriangle className="w-5 h-5 text-[#16A34A]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      {/* Super Admin Topbar */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white font-black text-xs shadow-sm">
            M4K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0F172A]">Mahi 4K Downloader — Super Admin</h1>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-[#64748B]">System Orchestration • Munna Bhai Administration</p>
          </div>
        </div>

        {/* Live System Health Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F0FDF4] border border-[#DCFCE7] rounded-full text-xs font-semibold text-[#16A34A]">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Worker Engine: {telemetry.workerClusterStatus.healthyWorkers}/4 Healthy</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-xs font-medium text-[#475569]">
            <Cpu className="w-3.5 h-3.5" />
            <span>Queue: {telemetry.queueDepth} jobs</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            title="Refresh"
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAF9] text-[#64748B]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Super Admin Tabs Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </button>

          {/* Super Admin Live CMS Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('cms')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cms'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-bold">Live App CMS & Content (सुपर एडमिन)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Students & Users ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'downloads'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Downloads Stream ({downloads.length})</span>
          </button>

          {/* Legal & DMCA Takedown Queue Tab (Admin Only) */}
          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'legal'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Legal & DMCA Queue ({dmcaReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-[#16A34A]/30 shadow-xs flex items-center justify-between text-xs font-semibold text-[#16A34A] animate-in fade-in">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: TELEMETRY OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* 5 KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {statCards.map((c) => (
                <Card key={c.title} variant="default" className="p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
                    <span>{c.title}</span>
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#0F172A] tracking-tight">{c.value}</div>
                    <div className="text-[11px] text-[#16A34A] mt-1 font-semibold">{c.change}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick Super Admin Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-poppins">Munna Bhai Super Admin Suite</span>
                  <Badge variant="mint" size="sm">Active Control</Badge>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  You have 100% control over every word, headline, student quota, and legal filter on the entire platform. Any update made in Live CMS instantly pushes to all active users without downtime.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setActiveTab('cms')}
                className="whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-xs bg-[#16A34A] hover:bg-[#15803D]"
              >
                Open Live App CMS ⚡
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: SUPER ADMIN LIVE CMS (पूरी वेबसाइट का एक-एक शब्द हैंडल करें) */}
        {activeTab === 'cms' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A]">Super Admin Live Content Management (CMS)</h2>
                <Badge variant="mint" size="sm">Real-time Live Sync</Badge>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                यहाँ से आप वेबसाइट की मुख्य हेडलाइन, सबटाइटल, ब्रांड नाम और स्टूडेंट्स का दैनिक कोटा बदल सकते हैं। सेव करने पर यह तुरंत वेबसाइट पर लाइव अपडेट हो जाएगा।
              </p>
            </div>

            <form onSubmit={handleSaveCms} className="space-y-6">
              <Card variant="default" className="p-6 space-y-5">
                <div className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#16A34A]" />
                  <span>Website Branding & Hero Text</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Main Brand / Application Name
                    </label>
                    <input
                      type="text"
                      value={cmsForm.siteTitle}
                      onChange={(e) => setCmsForm({ ...cmsForm, siteTitle: e.target.value })}
                      className="w-full text-xs font-medium px-3 py-2 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#16A34A] bg-[#F8FAF9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Creator / Owner Name
                    </label>
                    <input
                      type="text"
                      value={cmsForm.creatorName}
                      onChange={(e) => setCmsForm({ ...cmsForm, creatorName: e.target.value })}
                      className="w-full text-xs font-medium px-3 py-2 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#16A34A] bg-[#F8FAF9]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Main Hero Headline (शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={cmsForm.heroHeadline}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroHeadline: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#16A34A] bg-[#F8FAF9]"
                    required
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    उदाहरण: Download Any Video. Fast & Free.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Hero Subtitle (उप-शीर्षक)
                  </label>
                  <textarea
                    rows={2}
                    value={cmsForm.heroSubtitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#16A34A] bg-[#F8FAF9] resize-none"
                    required
                  />
                </div>
              </Card>

              {/* Student & Free Tier Quotas */}
              <Card variant="default" className="p-6 space-y-5">
                <div className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#16A34A]" />
                  <span>Student & User Daily Download Caps</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
                    <label className="block text-xs font-bold text-[#16A34A] mb-1.5">
                      🎓 Student Tier Daily Downloads
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={cmsForm.studentDailyLimit}
                      onChange={(e) => setCmsForm({ ...cmsForm, studentDailyLimit: Number(e.target.value) })}
                      className="w-full text-sm font-bold px-3 py-2 border border-[#DCFCE7] rounded-xl bg-white focus:outline-none focus:border-[#16A34A]"
                    />
                    <p className="text-[11px] text-[#16A34A] mt-1">
                      Students get generous 4K downloads daily.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E2E8F0]">
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Free User Daily Downloads
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={cmsForm.freeDailyLimit}
                      onChange={(e) => setCmsForm({ ...cmsForm, freeDailyLimit: Number(e.target.value) })}
                      className="w-full text-sm font-bold px-3 py-2 border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-[#16A34A]"
                    />
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Standard free tier cap for anonymous users.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Announcement Banner */}
              <Card variant="default" className="p-6 space-y-4">
                <div className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Global Top Announcement Bar</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={cmsForm.announcementBannerEnabled}
                      onChange={(e) => setCmsForm({ ...cmsForm, announcementBannerEnabled: e.target.checked })}
                      className="rounded border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A] w-4 h-4"
                    />
                    <span>Show Announcement</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Announcement Message (संदेश)
                  </label>
                  <input
                    type="text"
                    value={cmsForm.announcementBannerMessage}
                    onChange={(e) => setCmsForm({ ...cmsForm, announcementBannerMessage: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#16A34A] bg-[#F8FAF9]"
                  />
                </div>
              </Card>

              {/* Submit Button */}
              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingCms}
                  className="px-8 py-3 rounded-xl font-bold text-sm bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingCms ? 'Publishing Live...' : '💾 Save & Publish Live to All Users (सुपर एडमिन अपडेट)'}</span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: STUDENTS & USERS MANAGER */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Students & Registered Accounts</h2>
                <p className="text-xs text-[#64748B]">Manage user plans, student tiers, and account permissions</p>
              </div>
              <Badge variant="mint" size="md">{users.length} Registered Accounts</Badge>
            </div>

            <Card variant="default" className="p-0 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAF9] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">System Role</th>
                    <th className="py-3.5 px-4">Plan Tier</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F172A]">{u.name}</div>
                        <div className="text-[#64748B] text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={u.role === 'ADMIN' ? 'mint' : 'neutral'} size="sm">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-full ${
                            u.planId === 'student'
                              ? 'bg-blue-50 text-blue-700'
                              : u.planId === 'premium'
                              ? 'bg-amber-50 text-amber-700 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.planId === 'student' ? '🎓 Student' : u.planId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <Badge variant="error" size="sm">Banned</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <select
                          value={u.planId}
                          onChange={(e) => handleChangePlan(u.id, e.target.value)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#16A34A]"
                        >
                          <option value="free">Free Tier</option>
                          <option value="student">Student Tier 🎓</option>
                          <option value="premium">Premium ⚡</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleToggleBan(u.id, u.isBanned)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            u.isBanned
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-red-700 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {u.isBanned ? 'Reinstate' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB 4: LIVE DOWNLOADS FEED */}
        {activeTab === 'downloads' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Global Downloads Stream</h2>
                <p className="text-xs text-[#64748B]">Real-time system jobs inspector</p>
              </div>
              <Badge variant="neutral" size="md">{downloads.length} Jobs in Memory</Badge>
            </div>

            {downloads.length === 0 ? (
              <Card variant="default" className="p-8 text-center text-xs text-[#64748B]">
                No download jobs currently in flight or memory.
              </Card>
            ) : (
              <Card variant="default" className="p-0 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Title & URL</th>
                      <th className="py-3.5 px-4">Platform</th>
                      <th className="py-3.5 px-4">Quality / Format</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {downloads.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-[#0F172A] truncate">{d.title}</div>
                          <div className="text-[11px] text-[#64748B] truncate">{d.url}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{d.platform}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#16A34A]">{d.quality}</span> {d.format.toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              d.status === 'COMPLETED'
                                ? 'success'
                                : d.status === 'DOWNLOADING'
                                ? 'mint'
                                : d.status === 'FAILED'
                                ? 'error'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {d.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                          {d.progress}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* TAB 5: LEGAL & DMCA TAKEDOWN QUEUE (ADMIN ONLY) */}
        {activeTab === 'legal' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#0F172A]">Copyright & DMCA Takedown Queue (Admin Only)</h2>
                  <Badge variant="mint" size="sm">Isolated From Users</Badge>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  सभी कॉपीराइट और DMCA रिपोर्ट्स केवल यहाँ एडमिन के पास सुरक्षित रहेंगी। आम यूजर या स्टूडेंट्स को कोई कानूनी चेतावनी नहीं दिखाई जाएगी।
                </p>
              </div>
              <Badge variant="neutral" size="md">{dmcaReports.length} Takedown Reports</Badge>
            </div>

            {dmcaReports.length === 0 ? (
              <Card variant="default" className="p-8 text-center text-xs text-[#64748B] space-y-2">
                <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto" />
                <div className="font-bold text-[#0F172A]">No Pending Copyright Infringements</div>
                <p>No URLs currently blocked or pending manual legal review.</p>
              </Card>
            ) : (
              <Card variant="default" className="p-0 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Target URL</th>
                      <th className="py-3.5 px-4">Reporter</th>
                      <th className="py-3.5 px-4">Reason & Proof</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {dmcaReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-red-600">
                          {r.targetUrl}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0F172A]">{r.reporterEmail}</div>
                          <div className="text-[10px] text-[#64748B]">Sign: {r.signature}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="truncate font-medium text-[#0F172A]">{r.reason}</div>
                          <div className="text-[10px] text-[#64748B] truncate">{r.infringementProof}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="error" size="sm">URL BLOCKED</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* TAB 6: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">System Settings & Global Controls</h2>
              <p className="text-xs text-[#64748B]">Configure runtime limits and maintenance mode</p>
            </div>

            <Card variant="default" className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">Emergency Maintenance Mode</div>
                  <div className="text-xs text-[#64748B]">Temporarily pause new incoming download tasks</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    settings.maintenanceMode
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {settings.maintenanceMode ? 'ACTIVE (Blocking Jobs)' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">Global Announcement Banner</div>
                  <div className="text-xs text-[#64748B]">Show a prominent alert at the top of the web app</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBanner}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    settings.announcementBanner?.enabled
                      ? 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {settings.announcementBanner?.enabled ? 'VISIBLE' : 'Hidden'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Immutable Administrative Audit Log</h2>
                <p className="text-xs text-[#64748B]">Security trail for compliance and operations</p>
              </div>
              <Badge variant="neutral" size="md">{auditLogs.length} Records</Badge>
            </div>

            <Card variant="default" className="p-0 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAF9] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target ID</th>
                    <th className="py-3.5 px-4">Details</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{log.actor}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#16A34A]">{log.action}</td>
                      <td className="py-3.5 px-4 font-mono text-[#64748B]">{log.targetId || '--'}</td>
                      <td className="py-3.5 px-4 text-[#475569] max-w-xs truncate font-mono text-[11px]">
                        {log.details ? JSON.stringify(log.details) : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
