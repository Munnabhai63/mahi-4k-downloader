import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as dns from 'dns/promises';
import * as path from 'path';
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

@Injectable()
export class AnalyzeService {
  private workerScriptPath: string;
  private pythonCommand: string;

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

  async validateUrlSecurity(rawUrl: string): Promise<URL> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      throw new BadRequestException('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Unsupported protocol. Only http:// and https:// URLs are permitted.');
    }

    const hostname = parsed.hostname.toLowerCase();

    // DRM Platform Blocker (Strict §3 requirement)
    const isDrmBlocked = DRM_BLOCKED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain) || rawUrl.toLowerCase().includes(domain),
    );

    if (isDrmBlocked) {
      throw new BadRequestException(
        'This platform is not supported. TurboGrab strictly adheres to copyright and DRM protection standards.',
      );
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
    await this.validateUrlSecurity(url);

    return new Promise<AnalyzeResult>((resolve, reject) => {
      const child = spawn(this.pythonCommand, [this.workerScriptPath, '--analyze', url], {
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
        reject(new BadRequestException('URL analysis timed out after 15 seconds. Please try again.'));
      }, 15000);

      child.on('close', (code) => {
        clearTimeout(timer);

        if (code !== 0) {
          const errMsg = stderrData || stdoutData || 'Failed to extract video information.';
          return reject(new BadRequestException(`Extraction failed: ${errMsg.trim()}`));
        }

        const lines = stdoutData.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('__RESULT__:')) {
            try {
              const jsonStr = trimmed.substring('__RESULT__:'.length);
              const result: AnalyzeResult = JSON.parse(jsonStr);
              return resolve(result);
            } catch (err: any) {
              return reject(new InternalServerErrorException(`Malformed metadata returned by worker: ${err.message}`));
            }
          }
        }

        reject(new BadRequestException('No supported video stream or metadata found at the provided URL.'));
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
              return resolve({
                results: parsed.results || [],
                failed: [...failed, ...(parsed.failed || [])],
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
}
