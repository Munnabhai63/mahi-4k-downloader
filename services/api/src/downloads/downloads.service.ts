import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  CreateDownloadRequest,
  DownloadItem,
  ProgressEventPayload,
} from '@turbograb/types';
import { EventsGateway } from '../events/events.gateway';
import { AnalyzeService } from '../analyze/analyze.service';
import { CookiesService } from '../cookies/cookies.service';

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);
  private downloads = new Map<string, DownloadItem>();
  private processes = new Map<string, ChildProcess>();
  private workerScriptPath: string;
  private pythonCommand: string;
  private tempStoragePath: string;
  private secretKey: string;

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly analyzeService: AnalyzeService,
    private readonly cookiesService: CookiesService,
  ) {
    this.workerScriptPath = path.resolve(process.cwd(), '../../services/worker/worker.py');
    if (!fs.existsSync(this.workerScriptPath)) {
      this.workerScriptPath = path.resolve(process.cwd(), '../worker/worker.py');
    }
    if (!fs.existsSync(this.workerScriptPath)) {
      this.workerScriptPath = path.resolve(process.cwd(), 'services/worker/worker.py');
    }

    this.pythonCommand = process.env.PYTHON_PATH || 'python';
    this.tempStoragePath =
      process.env.TEMP_STORAGE_PATH || path.resolve(process.cwd(), 'temp_downloads');
    this.secretKey = process.env.SIGNED_URL_SECRET || 'turbograb-secure-signing-secret-2026';

    if (!fs.existsSync(this.tempStoragePath)) {
      fs.mkdirSync(this.tempStoragePath, { recursive: true });
    }

    // Schedule 6h TTL temp file cleanup
    setInterval(() => this.cleanupExpiredFiles(), 60 * 60 * 1000);
  }

  private getMaxConcurrent(userId: string): number {
    // Premium plan gives 5 concurrent; free gives 1
    return userId.includes('admin') || userId.includes('premium') ? 5 : 1;
  }

  private getActiveCount(userId: string): number {
    let count = 0;
    for (const item of this.downloads.values()) {
      if (item.userId === userId && (item.status === 'DOWNLOADING' || item.status === 'PROCESSING')) {
        count++;
      }
    }
    return count;
  }

  private processNextInQueue(userId: string) {
    const maxActive = this.getMaxConcurrent(userId);
    const active = this.getActiveCount(userId);
    if (active >= maxActive) return;

    // Find next queued item
    const nextItem = Array.from(this.downloads.values()).find(
      (it) => it.userId === userId && it.status === 'QUEUED',
    );

    if (nextItem) {
      this.startWorkerJob(nextItem);
    }
  }

  async createDownload(dto: CreateDownloadRequest, userId: string = 'anon-guest'): Promise<DownloadItem> {
    await this.analyzeService.validateUrlSecurity(dto.url);

    const downloadId = crypto.randomUUID();
    const urlHash = crypto.createHash('sha256').update(dto.url.trim()).digest('hex');
    const platform = this.analyzeService.detectPlatform(dto.url);

    const item: DownloadItem = {
      id: downloadId,
      userId,
      url: dto.url.trim(),
      urlHash,
      platform,
      title: 'Preparing download...',
      thumbnailUrl: '',
      durationSec: 0,
      quality: dto.quality || '1080p',
      format: dto.format || 'mp4',
      status: 'QUEUED',
      progress: 0,
      speedBps: 0,
      etaSec: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      createdAt: new Date().toISOString(),
    };

    this.downloads.set(downloadId, item);

    // Concurrency check per §20 & §11
    const activeCount = this.getActiveCount(userId);
    const maxActive = this.getMaxConcurrent(userId);

    if (activeCount < maxActive) {
      this.startWorkerJob(item, dto.subtitleLang, dto.useCookies);
    } else {
      this.eventsGateway.emitProgress({
        type: 'status_change',
        downloadId: item.id,
        status: 'QUEUED',
        progress: 0,
        speedBps: 0,
        etaSec: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });
    }

    return item;
  }

  getAllDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values());
  }

  async createBatchDownloads(dtos: CreateDownloadRequest[], userId: string = 'anon-guest'): Promise<DownloadItem[]> {
    const created: DownloadItem[] = [];
    for (const dto of dtos) {
      try {
        const item = await this.createDownload(dto, userId);
        created.push(item);
      } catch (err: any) {
        this.logger.error(`Batch queue item failed: ${dto.url}`, err);
      }
    }
    return created;
  }

  private startWorkerJob(item: DownloadItem, subtitleLang?: string, useCookies?: boolean) {
    item.status = 'DOWNLOADING';
    item.progress = 1.0;

    let cookieFile: string | null = null;
    if (useCookies) {
      cookieFile = this.cookiesService.getDecryptedCookieFile(item.userId, item.platform);
    }

    this.eventsGateway.emitProgress({
      type: 'status_change',
      downloadId: item.id,
      status: 'DOWNLOADING',
      progress: 1.0,
      speedBps: 0,
      etaSec: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    });

    const spec = {
      url: item.url,
      downloadId: item.id,
      quality: item.quality,
      format: item.format,
      outputDir: this.tempStoragePath,
      subtitleLang,
      cookieFile,
    };

    const child = spawn(
      this.pythonCommand,
      [this.workerScriptPath, '--download', JSON.stringify(spec)],
      { windowsHide: true },
    );

    this.processes.set(item.id, child);

    let remainder = '';

    child.stdout.on('data', (chunk) => {
      remainder += chunk.toString();
      const lines = remainder.split('\n');
      remainder = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('__PROGRESS__:')) {
          try {
            const payload = JSON.parse(trimmed.substring('__PROGRESS__:'.length));
            item.status = payload.status || 'DOWNLOADING';
            item.progress = payload.progress;
            item.speedBps = payload.speedBps;
            item.etaSec = payload.etaSec;
            item.downloadedBytes = payload.downloadedBytes;
            item.totalBytes = payload.totalBytes;

            this.eventsGateway.emitProgress(payload);
          } catch (e) {
            this.logger.error('Failed to parse progress line', e);
          }
        } else if (trimmed.startsWith('__COMPLETE__:')) {
          try {
            const payload = JSON.parse(trimmed.substring('__COMPLETE__:'.length));
            item.status = 'COMPLETED';
            item.progress = 100;
            item.outputPath = payload.outputPath;
            item.totalBytes = payload.totalBytes;
            item.completedAt = new Date().toISOString();
            if (payload.title) item.title = payload.title;

            const filename = payload.filename || `${item.id}.${item.format}`;
            item.signedUrl = this.generateSignedUrl(item.id, filename);

            const completeEvent: ProgressEventPayload = {
              type: 'complete',
              downloadId: item.id,
              status: 'COMPLETED',
              progress: 100,
              speedBps: 0,
              etaSec: 0,
              downloadedBytes: payload.totalBytes,
              totalBytes: payload.totalBytes,
              signedUrl: item.signedUrl,
            };

            this.eventsGateway.emitProgress(completeEvent);
            this.processNextInQueue(item.userId);
          } catch (e) {
            this.logger.error('Failed to parse complete line', e);
          }
        } else if (trimmed.startsWith('__ERROR__:')) {
          try {
            const payload = JSON.parse(trimmed.substring('__ERROR__:'.length));
            item.status = 'FAILED';
            const rawErr = payload.errorMsg || 'Download failed in worker process';
            this.logger.error(`[Worker Download Error] ID: ${item.id}: ${rawErr}`);

            const lowerErr = rawErr.toLowerCase();
            const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be') || rawErr.includes('[youtube]');
            let userSafeMsg = 'Download failed in worker process. Please try again.';

            if (
              isYouTube && (
                lowerErr.includes('not a bot') ||
                lowerErr.includes('login_required') ||
                lowerErr.includes('--cookies') ||
                lowerErr.includes('bot')
              )
            ) {
              userSafeMsg = 'YouTube temporarily requires additional verification for this video. Please try again later.';
            } else if (lowerErr.includes('private video') || lowerErr.includes('this video is private') || lowerErr.includes('only works when logged-in')) {
              userSafeMsg = 'This video is private or requires account login to access.';
            } else if (lowerErr.includes('video unavailable') || lowerErr.includes('does not exist') || lowerErr.includes('not found')) {
              userSafeMsg = 'This video is unavailable or has been removed.';
            } else if (lowerErr.includes('geo') || lowerErr.includes('location') || lowerErr.includes('not available in your country')) {
              userSafeMsg = 'This video is geographically restricted in the server region.';
            } else if (lowerErr.includes('bot') || lowerErr.includes('verification')) {
              userSafeMsg = 'The provider temporarily requires additional verification for this video.';
            } else {
              userSafeMsg = 'Download failed. Please try a different quality or verify the URL.';
            }

            item.errorMsg = userSafeMsg;

            this.eventsGateway.emitProgress({
              type: 'failed',
              downloadId: item.id,
              status: 'FAILED',
              progress: item.progress,
              speedBps: 0,
              etaSec: 0,
              downloadedBytes: item.downloadedBytes,
              totalBytes: item.totalBytes,
              errorMsg: item.errorMsg,
            });
            this.processNextInQueue(item.userId);
          } catch (e) {
            this.logger.error('Failed to parse error line', e);
          }
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      const errStr = chunk.toString();
      this.logger.warn(`[Worker STDERR] ${errStr}`);
    });

    child.on('close', (code) => {
      this.processes.delete(item.id);
      if (cookieFile && fs.existsSync(cookieFile)) {
        try {
          fs.unlinkSync(cookieFile);
        } catch {}
      }

      if (code !== 0 && item.status !== 'COMPLETED' && item.status !== 'CANCELLED') {
        item.status = 'FAILED';
        item.errorMsg = item.errorMsg || `Worker process exited with code ${code}`;
        this.eventsGateway.emitProgress({
          type: 'failed',
          downloadId: item.id,
          status: 'FAILED',
          progress: item.progress,
          speedBps: 0,
          etaSec: 0,
          downloadedBytes: item.downloadedBytes,
          totalBytes: item.totalBytes,
          errorMsg: item.errorMsg,
        });
      }

      this.processNextInQueue(item.userId);
    });

    child.on('error', (err) => {
      this.processes.delete(item.id);
      item.status = 'FAILED';
      item.errorMsg = `Process execution error: ${err.message}`;
      this.eventsGateway.emitProgress({
        type: 'failed',
        downloadId: item.id,
        status: 'FAILED',
        progress: item.progress,
        speedBps: 0,
        etaSec: 0,
        downloadedBytes: item.downloadedBytes,
        totalBytes: item.totalBytes,
        errorMsg: item.errorMsg,
      });
    });
  }

  getDownloads(status?: string): DownloadItem[] {
    const list = Array.from(this.downloads.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (status) {
      return list.filter((d) => d.status.toLowerCase() === status.toLowerCase());
    }
    return list;
  }

  getDownload(id: string): DownloadItem {
    const item = this.downloads.get(id);
    if (!item) {
      throw new NotFoundException(`Download job ${id} not found`);
    }
    return item;
  }

  cancelDownload(id: string): DownloadItem {
    const item = this.getDownload(id);
    const proc = this.processes.get(id);
    if (proc) {
      proc.kill();
      this.processes.delete(id);
    }
    item.status = 'CANCELLED';
    this.eventsGateway.emitProgress({
      type: 'status_change',
      downloadId: item.id,
      status: 'CANCELLED',
      progress: item.progress,
      speedBps: 0,
      etaSec: 0,
      downloadedBytes: item.downloadedBytes,
      totalBytes: item.totalBytes,
    });
    this.processNextInQueue(item.userId);
    return item;
  }

  retryDownload(id: string): DownloadItem {
    const item = this.getDownload(id);
    this.cancelDownload(id);
    item.status = 'QUEUED';
    item.progress = 0;
    item.errorMsg = undefined;
    this.startWorkerJob(item);
    return item;
  }

  deleteDownload(id: string): boolean {
    this.cancelDownload(id);
    const item = this.downloads.get(id);
    if (item?.outputPath && fs.existsSync(item.outputPath)) {
      try {
        fs.unlinkSync(item.outputPath);
      } catch {}
    }
    return this.downloads.delete(id);
  }

  generateSignedUrl(downloadId: string, filename: string): string {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    const rawData = `${downloadId}:${expiresAt}:${filename}`;
    const sig = crypto.createHmac('sha256', this.secretKey).update(rawData).digest('hex');

    return `/api/v1/downloads/${downloadId}/stream?sig=${sig}&exp=${expiresAt}&fn=${encodeURIComponent(filename)}`;
  }

  verifySignature(downloadId: string, sig: string, expStr: string, filename: string): boolean {
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) {
      return false;
    }

    const rawData = `${downloadId}:${exp}:${filename}`;
    const expectedSig = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawData)
      .digest('hex');

    try {
      const sigBuf = Buffer.from(sig, 'hex');
      const expectedBuf = Buffer.from(expectedSig, 'hex');
      if (sigBuf.length !== expectedBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  getFilePathForStream(
    downloadId: string,
    sig: string,
    exp: string,
    filename: string,
  ): { filePath: string; filename: string } {
    if (!this.verifySignature(downloadId, sig, exp, filename)) {
      throw new UnauthorizedException('Download link is invalid or has expired (10-minute limit).');
    }

    const item = this.getDownload(downloadId);
    if (!item.outputPath || !fs.existsSync(item.outputPath)) {
      throw new NotFoundException('Download file not found or has already been purged.');
    }

    return { filePath: item.outputPath, filename };
  }

  getHistory(params: { search?: string; platform?: string; format?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));

    let list = Array.from(this.downloads.values())
      .filter((d) => d.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q) || d.url.toLowerCase().includes(q));
    }

    if (params.platform && params.platform.toLowerCase() !== 'all') {
      list = list.filter((d) => d.platform.toLowerCase() === params.platform?.toLowerCase());
    }

    if (params.format && params.format.toLowerCase() !== 'all') {
      list = list.filter((d) => d.format.toLowerCase() === params.format?.toLowerCase());
    }

    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  exportHistoryCsv(userId?: string): string {
    let list = Array.from(this.downloads.values()).filter((d) => d.status === 'COMPLETED');
    if (userId) {
      list = list.filter((d) => d.userId === userId);
    }

    const headers = ['ID', 'Platform', 'Title', 'Quality', 'Format', 'Size_Bytes', 'Completed_At', 'URL'];
    const rows = list.map((item) => [
      item.id,
      item.platform,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      item.quality,
      item.format,
      item.totalBytes || 0,
      item.completedAt || item.createdAt,
      `"${item.url}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  private cleanupExpiredFiles() {
    try {
      const now = Date.now();
      const ttlMs = 6 * 60 * 60 * 1000; // 6 hours (§3 requirement)
      if (!fs.existsSync(this.tempStoragePath)) return;

      const files = fs.readdirSync(this.tempStoragePath);
      for (const file of files) {
        const fullPath = path.join(this.tempStoragePath, file);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > ttlMs) {
          fs.unlinkSync(fullPath);
          this.logger.log(`Purged expired temp file: ${file}`);
        }
      }
    } catch (e) {
      this.logger.error('Error running temp storage TTL cleanup', e);
    }
  }
}
