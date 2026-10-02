import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';

describe('AnalyzeService - Security & Platform Detection', () => {
  let service: AnalyzeService;

  beforeEach(() => {
    service = new AnalyzeService();
  });

  describe('SSRF Protection', () => {
    it('should reject non-http/https protocols', async () => {
      await expect(service.validateUrlSecurity('ftp://example.com/video.mp4')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateUrlSecurity('file:///etc/passwd')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject loopback and localhost domains', async () => {
      await expect(service.validateUrlSecurity('http://localhost:3000/video')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateUrlSecurity('http://127.0.0.1:8080/test')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject cloud metadata endpoints', async () => {
      await expect(
        service.validateUrlSecurity('http://169.254.169.254/latest/meta-data/'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateUrlSecurity('http://metadata.google.internal/computeMetadata/v1/'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DRM Platform Blocker (§3 binding requirement)', () => {
    it('should block Netflix URLs with explicit DRM message', async () => {
      await expect(service.validateUrlSecurity('https://www.netflix.com/watch/12345')).rejects.toThrow(
        'This platform is not supported. TurboGrab strictly adheres to copyright and DRM protection standards.',
      );
    });

    it('should block Spotify URLs', async () => {
      await expect(service.validateUrlSecurity('https://open.spotify.com/track/12345')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should block Disney+ and Amazon Prime URLs', async () => {
      await expect(service.validateUrlSecurity('https://www.disneyplus.com/video/123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateUrlSecurity('https://www.primevideo.com/detail/123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Platform Detection', () => {
    it('should detect YouTube URLs', () => {
      expect(service.detectPlatform('https://www.youtube.com/watch?v=aqz-KE-bpKQ')).toBe('youtube');
      expect(service.detectPlatform('https://youtu.be/aqz-KE-bpKQ')).toBe('youtube');
    });

    it('should detect Instagram URLs', () => {
      expect(service.detectPlatform('https://www.instagram.com/reel/C3abc123/')).toBe('instagram');
    });

    it('should detect TikTok URLs', () => {
      expect(service.detectPlatform('https://www.tiktok.com/@user/video/1234567890')).toBe('tiktok');
    });

    it('should detect X/Twitter URLs', () => {
      expect(service.detectPlatform('https://x.com/user/status/123456')).toBe('twitter');
      expect(service.detectPlatform('https://twitter.com/user/status/123456')).toBe('twitter');
    });

    it('should fallback to generic for arbitrary video hosts', () => {
      expect(service.detectPlatform('https://cdn.example.org/sample.mp4')).toBe('generic');
    });
  });
});
