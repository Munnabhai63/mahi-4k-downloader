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
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'vimeo' | 'reddit' | 'dailymotion' | 'archive' | 'direct' | 'generic';
  engine: EngineRoute;
  displayName: string;
  recommendedResolution: string;
  guideMessage: string;
  deepLink: string;
  downloadAppUrl: string;
}

export const DESKTOP_APP_DOWNLOAD_URL = 'https://github.com/Munnabhai63/mahi-4k-downloader/releases/download/v1.0.0-beta/My_4K_Downloader_1.0.0_x64_Setup.exe';
export const LOCAL_INSTALLER_PATH = '/My_4K_Downloader_1.0.0_x64_Setup.exe';

export function normalizeInputUrl(rawInput: string): { url: string; isValidUrl: boolean } {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { url: '', isValidUrl: false };
  }

  // Reject text without recognizable domain or containing obvious non-URL spaces
  if (trimmed.includes(' ') && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { url: trimmed, isValidUrl: false };
  }

  let candidate = trimmed;
  // If no scheme present, prepend https://
  if (!/^https?:\/\//i.test(candidate)) {
    // Check if it looks like a domain name with at least one dot (e.g. instagram.com/reel/...)
    if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return { url: trimmed, isValidUrl: false };
    }
  }

  try {
    const parsed = new URL(candidate);
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.')) {
      return { url: candidate, isValidUrl: true };
    }
    return { url: candidate, isValidUrl: false };
  } catch {
    return { url: candidate, isValidUrl: false };
  }
}

export function isYouTubeUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  const lower = rawUrl.toLowerCase().trim();
  return (
    lower.includes('youtube.com/watch') ||
    lower.includes('youtu.be/') ||
    lower.includes('youtube.com/shorts/') ||
    lower.includes('youtube.com/embed/') ||
    lower.includes('m.youtube.com/') ||
    lower.includes('music.youtube.com/') ||
    lower.includes('youtube.com/v/') ||
    lower.includes('youtube.com/live/') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be')
  );
}

export function isUnsupportedWebProvider(_rawUrl: string): boolean {
  // All non-YouTube providers are processed online via the VPS Cobalt backend
  return false;
}

export function detectPlatformRoute(rawUrl: string): PlatformRouteInfo {
  const url = (rawUrl || '').trim();
  const lower = url.toLowerCase();
  const deepLink = `m4k://download?url=${encodeURIComponent(url)}`;

  // 1. YouTube (Routed directly to Local Desktop Engine)
  if (isYouTubeUrl(url)) {
    return {
      platform: 'youtube',
      engine: 'DESKTOP_PREFERRED',
      displayName: 'YouTube',
      recommendedResolution: 'Up to 4K UHD & 320kbps MP3',
      guideMessage: 'Download YouTube video with My 4K Downloader Desktop.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 2. Instagram (Online Web Download)
  if (lower.includes('instagram.com')) {
    return {
      platform: 'instagram',
      engine: 'WEB_RELIABLE',
      displayName: 'Instagram',
      recommendedResolution: 'Original HD Reel & Audio',
      guideMessage: 'Instagram media processed directly via Online Engine.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 3. TikTok (Online Web Download)
  if (lower.includes('tiktok.com')) {
    return {
      platform: 'tiktok',
      engine: 'WEB_RELIABLE',
      displayName: 'TikTok',
      recommendedResolution: 'Original HD & MP3',
      guideMessage: 'TikTok media processed directly via Online Engine.',
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

  // 6. Dailymotion (Verified Web-Reliable)
  if (lower.includes('dailymotion.com') || lower.includes('dai.ly')) {
    return {
      platform: 'dailymotion',
      engine: 'WEB_RELIABLE',
      displayName: 'Dailymotion',
      recommendedResolution: 'Up to 1080p HD',
      guideMessage: 'Dailymotion public video processed directly via Web Engine.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 7. Vimeo (Web Reliable with Desktop Fallback)
  if (lower.includes('vimeo.com')) {
    return {
      platform: 'vimeo',
      engine: 'WEB_RELIABLE',
      displayName: 'Vimeo',
      recommendedResolution: 'Up to 1080p / 4K',
      guideMessage: 'Vimeo video stream processed directly via Web Engine.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 8. Reddit (Verified Web-Reliable)
  if (lower.includes('reddit.com') || lower.includes('v.redd.it')) {
    return {
      platform: 'reddit',
      engine: 'WEB_RELIABLE',
      displayName: 'Reddit',
      recommendedResolution: 'HD Video with Audio',
      guideMessage: 'Reddit video processed and audio-merged via Web Engine.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 9. Archive.org (Verified Web-Reliable)
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

  // 10. Direct media links (.mp4, .webm, .mkv, .m3u8, .mov, etc.)
  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.includes('.m3u8') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.mp3') ||
    lower.endsWith('.m4a') ||
    lower.endsWith('.wav') ||
    lower.includes('.mp4?') ||
    lower.includes('.m3u8?')
  ) {
    return {
      platform: 'direct',
      engine: 'WEB_RELIABLE',
      displayName: 'Direct Stream',
      recommendedResolution: 'Source Container Stream',
      guideMessage: 'Direct media file verified for instant browser streaming.',
      deepLink,
      downloadAppUrl: DESKTOP_APP_DOWNLOAD_URL,
    };
  }

  // 11. Generic Web fallback
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
