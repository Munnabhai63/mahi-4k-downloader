import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as dns from 'dns/promises';
import * as path from 'path';
import type { Response } from 'express';
import { AnalyzeResult, SupportedPlatform } from '@turbograb/types';

const DRM_BLOCKED_DOMAINS = [
  'netflix.com',
  'primevideo.com',
  'disneyplus.com',
  'hotstar.com',
  'spotify.com',
  'apple.com/apple-tv-plus',
  'tv.apple.com',
  'music.apple.com',
  'hulu.com',
  'hbomax.com',
  'max.com',
  'paramountplus.com',
  'peacocktv.com',
  'deezer.com',
];

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

interface CachedAnalysis {
  result: AnalyzeResult;
  timestamp: number;
}

@Injectable()
export class AnalyzeService {
  private workerScriptPath: string;
  private pythonCommand: string;
  private metadataCache = new Map<string, CachedAnalysis>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL
  private readonly MAX_CACHE_ITEMS = 500;

  constructor() {
    this.workerScriptPath = path.resolve(process.cwd(), '../../services/worker/worker.py');
    // In case Cwd is services/api
    if (!require('fs').existsSync(this.workerScriptPath)) {
      this.workerScriptPath = path.resolve(process.cwd(), '../worker/worker.py');
    }
    if (!require('fs').existsSync(this.workerScriptPath)) {
      this.workerScriptPath = path.resolve(process.cwd(), 'services/worker/worker.py');
    }
    this.pythonCommand = process.env.PYTHON_PATH || 'python';
  }

  extractUrl(rawInput: string): string {
    if (!rawInput) return '';
    const match = rawInput.match(/https?:\/\/[^\s"'<>]+/i);
    return match ? match[0] : rawInput.trim();
  }

  async validateUrlSecurity(rawUrl: string): Promise<URL> {
    const cleanUrl = this.extractUrl(rawUrl);
    let parsed: URL;
    try {
      parsed = new URL(cleanUrl);
    } catch {
      throw new BadRequestException('Unsupported link.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Unsupported link.');
    }

    const hostname = parsed.hostname.toLowerCase();

    // DRM Platform Blocker (Strict §3 requirement)
    const isDrmBlocked = DRM_BLOCKED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain) || cleanUrl.toLowerCase().includes(domain),
    );

    if (isDrmBlocked) {
      throw new BadRequestException('Unsupported link.');
    }

    // SSRF Protection: Disallow localhost & loopback strings
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === 'metadata.google.internal' ||
      hostname === '169.254.169.254'
    ) {
      throw new BadRequestException('Security violation: Loopback, localhost, and metadata hosts are blocked.');
    }

    // DNS resolution SSRF check
    try {
      const lookup = await dns.lookup(hostname);
      const ip = lookup.address;
      for (const range of PRIVATE_IP_RANGES) {
        if (range.test(ip)) {
          throw new BadRequestException(`Security violation: Private IP resolution detected (${ip}). Request rejected.`);
        }
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      // If DNS resolution fails entirely, yt-dlp may also fail, but we let yt-dlp attempt or reject
    }

    return parsed;
  }

  detectPlatform(url: string): SupportedPlatform {
    const l = url.toLowerCase();
    if (l.includes('whatsapp.com') || l.includes('wa.me')) return 'whatsapp';
    if (l.includes('youtube.com') || l.includes('youtu.be')) return 'youtube';
    if (l.includes('instagram.com')) return 'instagram';
    if (l.includes('facebook.com') || l.includes('fb.watch')) return 'facebook';
    if (l.includes('twitter.com') || l.includes('x.com')) return 'twitter';
    if (l.includes('tiktok.com')) return 'tiktok';
    if (l.includes('vimeo.com')) return 'vimeo';
    if (l.includes('dailymotion.com')) return 'dailymotion';
    if (l.includes('twitch.tv')) return 'twitch';
    if (l.includes('reddit.com')) return 'reddit';
    if (l.includes('pinterest.com') || l.includes('pin.it')) return 'pinterest';
    if (l.includes('linkedin.com')) return 'linkedin';
    if (l.includes('snapchat.com')) return 'snapchat';
    if (l.includes('likee.video')) return 'likee';
    return 'generic';
  }

  async analyze(url: string): Promise<AnalyzeResult> {
    const cleanUrl = this.extractUrl(url);
    await this.validateUrlSecurity(cleanUrl);

    const normalizedUrl = cleanUrl.trim();
    const cached = this.metadataCache.get(normalizedUrl);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result;
    }

    return new Promise<AnalyzeResult>((resolve, reject) => {
      const child = spawn(this.pythonCommand, [this.workerScriptPath, '--analyze', normalizedUrl], {
        windowsHide: true,
      });

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new BadRequestException('URL analysis timed out. Please try again.'));
      }, 30000);

      child.on('close', (code) => {
        clearTimeout(timer);

        if (code !== 0) {
          const rawErr = stderrData || stdoutData || 'Failed to extract video information.';
          console.error(`[Worker Extraction Error] URL: ${cleanUrl}`, rawErr);

          const lowerErr = rawErr.toLowerCase();
          let userSafeMsg = 'This media is currently unavailable for direct web download.';

          if (lowerErr.includes('not a bot') || lowerErr.includes('sign in to confirm')) {
            userSafeMsg = 'This media is currently unavailable for direct web download.';
          } else if (lowerErr.includes('private video') || lowerErr.includes('this video is private') || lowerErr.includes('only works when logged-in')) {
            userSafeMsg = 'This video is private or restricted by its author.';
          } else if (lowerErr.includes('video unavailable') || lowerErr.includes('does not exist') || lowerErr.includes('not found') || lowerErr.includes('404')) {
            userSafeMsg = 'This video is unavailable or has been removed.';
          } else if (lowerErr.includes('geo') || lowerErr.includes('location') || lowerErr.includes('not available in your country') || lowerErr.includes('geographic restriction')) {
            userSafeMsg = 'This video is geographically restricted in the server region.';
          } else if (
            lowerErr.includes('unsupported url') ||
            lowerErr.includes('no suitable extractor') ||
            lowerErr.includes('is not a valid url')
          ) {
            userSafeMsg = 'Unsupported link.';
          } else if (lowerErr.includes('timeout') || lowerErr.includes('timed out') || lowerErr.includes('connection reset') || lowerErr.includes('network')) {
            userSafeMsg = 'Analysis timed out. Please check your connection and try again.';
          } else {
            userSafeMsg = 'This media is currently unavailable for direct web download.';
          }

          return reject(new BadRequestException(userSafeMsg));
        }

        const lines = stdoutData.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('__RESULT__:')) {
            try {
              const jsonStr = trimmed.substring('__RESULT__:'.length);
              const result: AnalyzeResult = JSON.parse(jsonStr);

              // Store in fast in-memory cache
              if (this.metadataCache.size >= this.MAX_CACHE_ITEMS) {
                const firstKey = this.metadataCache.keys().next().value;
                if (firstKey) this.metadataCache.delete(firstKey);
              }
              this.metadataCache.set(normalizedUrl, { result, timestamp: Date.now() });

              return resolve(result);
            } catch (err: any) {
              return reject(new InternalServerErrorException(`Malformed metadata returned by worker: ${err.message}`));
            }
          }
        }

        reject(new BadRequestException('Unsupported link.'));
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new InternalServerErrorException(`Could not launch Python worker: ${err.message}`));
      });
    });
  }

  async batchAnalyze(urls: string[]): Promise<{ results: AnalyzeResult[]; failed: { url: string; error: string }[] }> {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new BadRequestException('A non-empty "urls" array is required.');
    }

    if (urls.length > 50) {
      throw new BadRequestException('Batch limit exceeded. A maximum of 50 URLs can be processed at once.');
    }

    const validUrls: string[] = [];
    const failed: { url: string; error: string }[] = [];

    for (const rawUrl of urls) {
      try {
        await this.validateUrlSecurity(rawUrl);
        validUrls.push(rawUrl.trim());
      } catch (err: any) {
        failed.push({ url: rawUrl, error: err.message || 'Security validation failed' });
      }
    }

    if (validUrls.length === 0) {
      return { results: [], failed };
    }

    return new Promise((resolve, reject) => {
      const child = spawn(
        this.pythonCommand,
        [this.workerScriptPath, '--batch-analyze', JSON.stringify(validUrls)],
        { windowsHide: true },
      );

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new BadRequestException('Batch analysis timed out after 45 seconds.'));
      }, 45000);

      child.on('close', (code) => {
        clearTimeout(timer);

        if (code !== 0) {
          return resolve({
            results: [],
            failed: [
              ...failed,
              ...validUrls.map((u) => ({ url: u, error: stderrData || 'Batch worker process failed' })),
            ],
          });
        }

        const lines = stdoutData.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('__BATCH_RESULT__:')) {
            try {
              const parsed = JSON.parse(trimmed.substring('__BATCH_RESULT__:'.length));
              const sanitizedFailed = (parsed.failed || []).map((f: any) => {
                let err = f.error || 'Extraction failed';
                if (err.includes('Sign in to confirm you’re not a bot') || err.includes('LOGIN_REQUIRED') || err.includes('--cookies')) {
                  err = 'YouTube temporarily requires additional verification for this video.';
                }
                return { ...f, error: err };
              });
              return resolve({
                results: parsed.results || [],
                failed: [...failed, ...sanitizedFailed],
              });
            } catch (err: any) {
              return reject(new InternalServerErrorException(`Malformed batch worker output: ${err.message}`));
            }
          }
        }

        resolve({ results: [], failed });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new InternalServerErrorException(`Could not launch batch worker: ${err.message}`));
      });
    });
  }

  async proxyThumbnail(imageUrl: string, forceDownload: boolean, res: Response): Promise<void> {
    try {
      const cleanUrl = this.extractUrl(imageUrl);
      await this.validateUrlSecurity(cleanUrl);

      const upstream = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (!upstream.ok) {
        throw new BadRequestException(`Failed to fetch thumbnail from source (status ${upstream.status})`);
      }

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (forceDownload) {
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        res.setHeader('Content-Disposition', `attachment; filename="thumbnail.${ext}"`);
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }

      res.end(buffer);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Unable to load thumbnail: ${err.message}`);
    }
  }
}
