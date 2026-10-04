/**
 * My 4K Downloader — Online (No-Install) Download API Client
 * Uses isolated Cobalt backend on VPS via https://200-97-164-97.sslip.io/
 */

const API_URL = process.env.NEXT_PUBLIC_M4K_API_URL || 'https://200-97-164-97.sslip.io/';

export interface CobaltPickerItem {
  type?: 'photo' | 'video' | 'gif';
  url: string;
  thumb?: string;
}

export interface CobaltSuccessResponse {
  status: 'redirect' | 'tunnel';
  url: string;
  filename?: string;
}

export interface CobaltPickerResponse {
  status: 'picker';
  picker: CobaltPickerItem[];
  audio?: string;
  audioFilename?: string;
}

export interface CobaltErrorResponse {
  status: 'error';
  error: {
    code: string;
    context?: Record<string, any>;
  };
}

export type CobaltResponse = CobaltSuccessResponse | CobaltPickerResponse | CobaltErrorResponse;

export async function resolveMedia(
  url: string,
  audioOnly: boolean = false
): Promise<CobaltResponse> {
  const normalizedApiUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
  const res = await fetch(normalizedApiUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      downloadMode: audioOnly ? 'audio' : 'auto',
      videoQuality: '1080',
      filenameStyle: 'pretty',
    }),
  });

  const data = await res.json();
  return data as CobaltResponse;
}

export function triggerBrowserDownload(url: string, filename?: string) {
  const a = document.createElement('a');
  a.href = url;
  if (filename) {
    a.download = filename;
  }
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
