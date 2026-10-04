/**
 * My 4K Downloader — Authoritative Platform Routing Engine
 *
 * HYBRID ROUTING SPECIFICATION:
 * - WEB_RELIABLE: Platforms verified to process reliably from cloud datacenter (Facebook, Archive.org, Direct MP4/WebM/HLS).
 * - DESKTOP_PREFERRED: Platforms that frequently trigger datacenter bot/verification blocks (YouTube, Instagram, TikTok, X).
 *   These are preferred on the local Tauri Desktop Engine for true 4K UHD, High Quality 320kbps MP3, and residential network speeds.
 */

export type EngineRoute = 'WEB_RELIABLE' | 'DESKTOP_PREFERRED';

export interface PlatformRouteInfo {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'archive' | 'direct' | 'generic';
  engine: EngineRoute;
  displayName: string;
  recommendedResolution: string;
  guideMessage: string;
  deepLink: string;
  downloadAppUrl: string;
}

export const DESKTOP_APP_DOWNLOAD_URL = '/Mahi_4K_Downloader_Portable.zip';

export function detectPlatformRoute(rawUrl: string): PlatformRouteInfo {
  const url = (rawUrl || '').trim();
  const lower = url.toLowerCase();
  const deepLink = `m4k://download?url=${encodeURIComponent(url)}`;

  // 1. YouTube (Desktop Preferred for 4K/8K & Residential IP extraction)
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      platform: 'youtube',
      engine: 'DESKTOP_PREFERRED',
      displayName: 'YouTube',
      recommendedResolution: 'Up to 4K UHD & 320kbps MP3',
      guideMessage: 'YouTube restricts datacenter servers. Opening your Desktop App for direct, unthrottled 4K download.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 2. Instagram (Desktop Preferred for Reels & Stories)
  if (lower.includes('instagram.com')) {
    return {
      platform: 'instagram',
      engine: 'DESKTOP_PREFERRED',
      displayName: 'Instagram',
      recommendedResolution: 'Original HD Reel & Audio',
      guideMessage: 'Instagram requires residential access. Opening your Desktop App for high-speed local extraction.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 3. TikTok (Desktop Preferred for clean HD video)
  if (lower.includes('tiktok.com')) {
    return {
      platform: 'tiktok',
      engine: 'DESKTOP_PREFERRED',
      displayName: 'TikTok',
      recommendedResolution: 'Original HD & MP3',
      guideMessage: 'TikTok is optimized via Desktop Engine for direct high-speed video and audio download.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 4. X / Twitter (Desktop Preferred)
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return {
      platform: 'twitter',
      engine: 'DESKTOP_PREFERRED',
      displayName: 'X (Twitter)',
      recommendedResolution: 'Highest Bitrate MP4',
      guideMessage: 'X video streams are routed to Desktop Engine for maximum resolution.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 5. Facebook (Verified Web-Reliable)
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
    return {
      platform: 'facebook',
      engine: 'WEB_RELIABLE',
      displayName: 'Facebook',
      recommendedResolution: 'HD 1080p / 720p',
      guideMessage: 'Facebook public video verified for direct instant Web downloading.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 6. Archive.org (Verified Web-Reliable)
  if (lower.includes('archive.org')) {
    return {
      platform: 'archive',
      engine: 'WEB_RELIABLE',
      displayName: 'Archive.org',
      recommendedResolution: 'Original Open Archive Stream',
      guideMessage: 'Public archive media processed directly via Web Engine.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 7. Direct media links
  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.includes('.m3u8') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.mp3')
  ) {
    return {
      platform: 'direct',
      engine: 'WEB_RELIABLE',
      displayName: 'Direct Stream',
      recommendedResolution: 'Source Container',
      guideMessage: 'Direct media file verified for instant browser streaming.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 8. Generic Web fallback
  return {
    platform: 'generic',
    engine: 'WEB_RELIABLE',
    displayName: 'Web Media',
    recommendedResolution: 'Best Available',
    guideMessage: 'Open web video stream processed via Web Engine.',
    deepLink,
    downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
  };
}
