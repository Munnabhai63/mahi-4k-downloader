/**
 * My 4K Downloader — Zero-Permission Web Download Delivery
 *
 * All web and PWA downloads use 100% native browser download delivery.
 * No File System Access API, no showDirectoryPicker(), no folder permissions.
 * The browser / operating system saves directly to the user's default Downloads location.
 */

export function sanitizeFilename(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'video_download.mp4';
  let cleaned = raw
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    .trim();
  if (!cleaned) cleaned = 'video_download.mp4';
  if (cleaned.length > 200) {
    const ext = cleaned.split('.').pop() || '';
    const base = cleaned.slice(0, 190);
    cleaned = ext ? `${base}.${ext}` : base;
  }
  return cleaned;
}

export function isFileSystemAccessSupported(): boolean {
  return false;
}

export async function getActiveDownloadDirectoryName(): Promise<string | null> {
  return null;
}

export async function promptChooseDownloadDirectory(): Promise<{
  success: boolean;
  folderName?: string;
  error?: string;
}> {
  return {
    success: false,
    error: 'Native browser download delivery is active. Files save directly to your Downloads folder with zero permissions.',
  };
}

export async function resetDownloadDirectory(): Promise<void> {
  // No-op in zero-permission mode
}

export async function saveFileToDevice(
  downloadUrl: string,
  rawFilename: string,
  _onProgress?: (percent: number) => void,
): Promise<{
  success: boolean;
  method: 'native';
  savedFilename: string;
  error?: string;
}> {
  const safeName = sanitizeFilename(rawFilename);

  try {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = safeName;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1500);

    return {
      success: true,
      method: 'native',
      savedFilename: safeName,
    };
  } catch (err: any) {
    try {
      window.location.assign(downloadUrl);
      return {
        success: true,
        method: 'native',
        savedFilename: safeName,
      };
    } catch (e: any) {
      return {
        success: false,
        method: 'native',
        savedFilename: safeName,
        error: err?.message || 'Failed to trigger download.',
      };
    }
  }
}
