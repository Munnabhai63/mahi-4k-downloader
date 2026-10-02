/**
 * My 4K Downloader — Device Download Folder Manager
 *
 * Implements the best technically supported filesystem / download folder behavior:
 * - Chromium / Edge (Desktop & Android): File System Access API (showDirectoryPicker)
 *   with IndexedDB handle persistence, duplicate detection ("video (1).mp4"), and direct streaming.
 * - Safari / Firefox / iOS / Legacy: Graceful fallback to browser-native Downloads.
 */

const DB_NAME = 'm4k_downloader_db';
const DB_VERSION = 1;
const STORE_NAME = 'settings_store';
const DIR_HANDLE_KEY = 'm4k_custom_download_dir';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DIR_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setStoredHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      if (handle) {
        store.put(handle, DIR_HANDLE_KEY);
      } else {
        store.delete(DIR_HANDLE_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Checks if the browser supports the File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Clean sanitization of filenames across Windows, macOS, Linux, and Android
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

/**
 * Checks if a filename already exists in the directory handle and returns a unique version:
 * e.g. "video.mp4" -> "video (1).mp4" -> "video (2).mp4"
 */
async function getUniqueFilenameInDir(
  dirHandle: FileSystemDirectoryHandle,
  targetFilename: string,
): Promise<{ filename: string; fileHandle: FileSystemFileHandle }> {
  const parts = targetFilename.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()}` : '';
  const baseName = parts.join('.');

  let counter = 0;
  let candidate = targetFilename;

  while (counter < 500) {
    candidate = counter === 0 ? `${baseName}${ext}` : `${baseName} (${counter})${ext}`;
    try {
      // Check if file exists by trying to open it in read mode
      await dirHandle.getFileHandle(candidate, { create: false });
      // If it succeeded, it exists! Increment counter and try next
      counter++;
    } catch {
      // If getFileHandle threw NotFoundError, the name is available!
      const newFileHandle = await dirHandle.getFileHandle(candidate, { create: true });
      return { filename: candidate, fileHandle: newFileHandle };
    }
  }

  // Fallback
  const fallback = `${baseName}_${Date.now()}${ext}`;
  const fallbackHandle = await dirHandle.getFileHandle(fallback, { create: true });
  return { filename: fallback, fileHandle: fallbackHandle };
}

/**
 * Requests the user to choose or confirm a dedicated folder (e.g. Downloads/My 4K Downloader)
 */
export async function promptChooseDownloadDirectory(): Promise<{
  success: boolean;
  folderName?: string;
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      error: 'Direct folder selection is not supported in this browser. Downloads will save to your system Downloads folder.',
    };
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'm4k_download_folder',
      mode: 'readwrite',
      startIn: 'downloads',
    });

    if (dirHandle) {
      await setStoredHandle(dirHandle);
      return { success: true, folderName: dirHandle.name };
    }
    return { success: false, error: 'No directory was chosen.' };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, error: 'Folder selection was cancelled.' };
    }
    return { success: false, error: err?.message || 'Could not select folder.' };
  }
}

/**
 * Retrieves the currently active custom download folder name if configured
 */
export async function getActiveDownloadDirectoryName(): Promise<string | null> {
  if (!isFileSystemAccessSupported()) return null;
  const handle = await getStoredHandle();
  if (!handle) return null;
  return handle.name;
}

/**
 * Resets saved download folder handle back to browser default
 */
export async function resetDownloadDirectory(): Promise<void> {
  await setStoredHandle(null);
}

/**
 * Primary download delivery function:
 * 1. If File System Access API is active and authorized: Streams directly to the selected folder,
 *    handling duplicate naming ("video (1).mp4") and writing bytes smoothly.
 * 2. Otherwise: Uses browser native <a> trigger to save in default Downloads.
 */
export async function saveFileToDevice(
  downloadUrl: string,
  rawFilename: string,
  onProgress?: (percent: number) => void,
): Promise<{
  success: boolean;
  method: 'fsa' | 'native';
  savedFilename: string;
  folderName?: string;
  error?: string;
}> {
  const safeName = sanitizeFilename(rawFilename);

  // Attempt File System Access API if previously configured or available
  if (isFileSystemAccessSupported()) {
    try {
      const dirHandle = await getStoredHandle();
      if (dirHandle) {
        // Verify or request permission
        let hasPerm = false;
        try {
          const status = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
          if (status === 'granted') {
            hasPerm = true;
          } else {
            const reqStatus = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
            hasPerm = reqStatus === 'granted';
          }
        } catch {
          hasPerm = false;
        }

        if (hasPerm) {
          // Fetch the stream with Range/resumable capabilities
          const res = await fetch(downloadUrl);
          if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
          }

          const { filename: finalName, fileHandle } = await getUniqueFilenameInDir(dirHandle, safeName);
          const writable = await (fileHandle as any).createWritable();

          if (res.body && typeof res.body.getReader === 'function') {
            const reader = res.body.getReader();
            const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
            let received = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                await writable.write(value);
                received += value.length;
                if (contentLength > 0 && onProgress) {
                  onProgress(Math.min(100, Math.round((received / contentLength) * 100)));
                }
              }
            }
            await writable.close();

            return {
              success: true,
              method: 'fsa',
              savedFilename: finalName,
              folderName: dirHandle.name,
            };
          } else {
            // Fallback blob write
            const blob = await res.blob();
            await writable.write(blob);
            await writable.close();
            return {
              success: true,
              method: 'fsa',
              savedFilename: finalName,
              folderName: dirHandle.name,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[DownloadFolder] FSA save failed, falling back to native download:', err);
    }
  }

  // Native Browser Download Fallback
  try {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = safeName;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1500);

    return {
      success: true,
      method: 'native',
      savedFilename: safeName,
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'native',
      savedFilename: safeName,
      error: err?.message || 'Failed to trigger download.',
    };
  }
}
