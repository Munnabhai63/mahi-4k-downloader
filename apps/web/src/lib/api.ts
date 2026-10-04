/**
 * Production API Configuration & Routing Helper
 * Centralizes all backend communication, socket resolution, and download streaming URLs.
 */

export const PRODUCTION_DEFAULT_BACKEND = 'https://api4k.mahiskills.in';

/**
 * Returns the fully qualified API base URL (e.g. https://.../api/v1 or http://localhost:4000/api/v1)
 */
export function getApiBaseUrl(): string {
  // If an explicit environment variable is set, prioritize it
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // In the browser, check hostname
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4000/api/v1';
    }
    // Production Cloudflare Pages, custom domain, or preview
    return `${PRODUCTION_DEFAULT_BACKEND}/api/v1`;
  }

  return `${PRODUCTION_DEFAULT_BACKEND}/api/v1`;
}

/**
 * Executes an API request against the configured backend
 */
export async function executeApiRequest(endpoint: string, options: RequestInit): Promise<Response> {
  const primaryBase = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const primaryUrl = `${primaryBase}${cleanEndpoint}`;

  return await fetch(primaryUrl, options);
}

/**
 * Returns Socket.IO connection parameters (origin and path)
 */
export function getSocketConfig(): { origin: string; path: string } {
  const socketEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  let rawUrl = socketEnv && socketEnv.trim() !== '' ? socketEnv : '';

  if (!rawUrl) {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        rawUrl = 'http://localhost:4000';
      } else {
        rawUrl = PRODUCTION_DEFAULT_BACKEND;
      }
    } else {
      rawUrl = PRODUCTION_DEFAULT_BACKEND;
    }
  }

  let origin = rawUrl;
  let path = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

  try {
    const parsed = new URL(rawUrl);
    origin = parsed.origin;
    if (parsed.pathname && parsed.pathname !== '/') {
      path = `${parsed.pathname.replace(/\/$/, '')}/socket.io`;
    }
  } catch {
    // Fallback if parsing fails
  }

  return { origin, path };
}

/**
 * Resolves relative or absolute download stream URLs to absolute HTTPS links
 */
export function resolveDownloadUrl(signedUrl: string | undefined | null): string {
  if (!signedUrl) return '#';
  if (signedUrl.startsWith('http://') || signedUrl.startsWith('https://')) {
    return signedUrl;
  }

  const cleanPath = signedUrl.startsWith('/') ? signedUrl : `/${signedUrl}`;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://localhost:4000${cleanPath}`;
    }
  }

  return `${PRODUCTION_DEFAULT_BACKEND}${cleanPath}`;
}
