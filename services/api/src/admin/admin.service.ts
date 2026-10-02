import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { DownloadsService } from '../downloads/downloads.service';
import { UserProfile, DownloadItem } from '@turbograb/types';

export interface AdminTelemetry {
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

export interface AdminAuditLog {
  id: string;
  actor: string;
  action: string;
  targetId?: string;
  details?: any;
  timestamp: string;
}

export interface AppContentConfig {
  siteTitle: string;
  heroHeadline: string;
  heroSubtitle: string;
  creatorName: string;
  announcementNotice: string;
}

export interface SystemSettings {
  freeDailyLimit: number;
  studentDailyLimit: number;
  premiumDailyLimit: number;
  maxFileSizeGb: number;
  maintenanceMode: boolean;
  announcementBanner: {
    enabled: boolean;
    message: string;
    level: 'info' | 'warning' | 'alert';
  };
  appContent: AppContentConfig;
}

@Injectable()
export class AdminService {
  private auditLogs: AdminAuditLog[] = [];

  private settings: SystemSettings = {
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
  };

  constructor(
    private readonly authService: AuthService,
    private readonly downloadsService: DownloadsService,
  ) {
    this.logAudit('SYSTEM', 'STARTUP', 'AdminService initialized');
  }

  logAudit(actor: string, action: string, details?: any, targetId?: string) {
    const entry: AdminAuditLog = {
      id: crypto.randomUUID(),
      actor,
      action,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  getAuditLogs(): AdminAuditLog[] {
    return this.auditLogs;
  }

  getOverview(): AdminTelemetry {
    const allUsers = this.authService.getAllUsers();
    const history = this.downloadsService.getHistory({ limit: 1000 });
    const allDownloads = this.downloadsService.getAllDownloads();

    const activeCount = allDownloads.filter(
      (d) => d.status === 'DOWNLOADING' || d.status === 'QUEUED' || d.status === 'PROCESSING',
    ).length;

    const failedCount = allDownloads.filter((d) => d.status === 'FAILED').length;
    const totalJobs = Math.max(1, allDownloads.length);
    const errorRate = Number(((failedCount / totalJobs) * 100).toFixed(2));

    const totalBandwidth = history.items.reduce((acc, curr) => acc + (curr.totalBytes || 0), 0);

    return {
      totalUsers: allUsers.length,
      activeSockets: Math.max(1, activeCount),
      downloadsToday: allDownloads.length,
      bandwidthTodayBytes: totalBandwidth,
      errorRatePct: errorRate,
      queueDepth: activeCount,
      workerClusterStatus: {
        totalWorkers: 4,
        healthyWorkers: 4,
        activeJobs: activeCount,
      },
    };
  }

  getUsers(): UserProfile[] {
    return this.authService.getAllUsers();
  }

  banUser(userId: string, isBanned: boolean, actor: string = 'admin'): UserProfile {
    const user = this.authService.banUser(userId, isBanned);
    this.logAudit(actor, isBanned ? 'BAN_USER' : 'UNBAN_USER', { isBanned }, userId);
    return user;
  }

  updateUserPlan(userId: string, planId: string, actor: string = 'admin'): UserProfile {
    const user = this.authService.updateUserPlan(userId, planId);
    this.logAudit(actor, 'UPDATE_USER_PLAN', { planId }, userId);
    return user;
  }

  getDownloadsFeed(): DownloadItem[] {
    return this.downloadsService.getAllDownloads();
  }

  cancelDownload(downloadId: string, actor: string = 'admin'): DownloadItem {
    const canceled = this.downloadsService.cancelDownload(downloadId);
    this.logAudit(actor, 'CANCEL_DOWNLOAD', null, downloadId);
    return canceled;
  }

  getSettings(): SystemSettings {
    return this.settings;
  }

  updateSettings(patch: Partial<SystemSettings>, actor: string = 'admin'): SystemSettings {
    this.settings = {
      ...this.settings,
      ...patch,
      announcementBanner: patch.announcementBanner
        ? { ...this.settings.announcementBanner, ...patch.announcementBanner }
        : this.settings.announcementBanner,
      appContent: patch.appContent
        ? { ...this.settings.appContent, ...patch.appContent }
        : this.settings.appContent,
    };
    this.logAudit(actor, 'UPDATE_SETTINGS', patch);
    return this.settings;
  }

  getPublicConfig() {
    return {
      siteTitle: this.settings.appContent.siteTitle,
      heroHeadline: this.settings.appContent.heroHeadline,
      heroSubtitle: this.settings.appContent.heroSubtitle,
      creatorName: this.settings.appContent.creatorName,
      announcementNotice: this.settings.appContent.announcementNotice,
      announcementBanner: this.settings.announcementBanner,
      studentDailyLimit: this.settings.studentDailyLimit,
      freeDailyLimit: this.settings.freeDailyLimit,
      maintenanceMode: this.settings.maintenanceMode,
    };
  }
}
