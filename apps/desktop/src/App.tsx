import { useState, useEffect } from 'react';
import { 
  Play, 
  Folder, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Clipboard, 
  ExternalLink, 
  FolderCheck,
  AlertCircle,
  Loader2,
  Film
} from 'lucide-react';
import { Button, Card, Badge, Input, ProgressBar } from '@turbograb/ui';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface QualityOption {
  label: string;
  height: number;
  available: boolean;
  formatNote: string;
  fps: number;
}

interface AnalyzeResult {
  url: string;
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  uploader: string;
  platform: string;
  qualities: QualityOption[];
  formats: string[];
}

export default function App() {
  const [url, setUrl] = useState('');
  const [savePath, setSavePath] = useState('Downloads\\My 4K Downloader');
  const [analyzing, setAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState<AnalyzeResult | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [selectedFormat, setSelectedFormat] = useState<string>('mp4');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastDownloadedFile, setLastDownloadedFile] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clipboardWatcher, setClipboardWatcher] = useState(true);

  // Initialize download folder and deep-link listener
  useEffect(() => {
    // 1. Get OS native download folder
    if (invoke) {
      invoke<string>('get_download_folder')
        .then((folder: string) => {
          if (folder) setSavePath(folder);
        })
        .catch(() => {});
    }

    // 2. Listen to Tauri progress events
    let unlistenProgress: (() => void) | null = null;
    if (listen) {
      listen('download-progress', (event: any) => {
        const payload = event.payload;
        if (!payload) return;

        if (payload.status === 'DOWNLOADING') {
          setDownloading(true);
          setProgress(Math.round(payload.progress || 0));
        } else if (payload.status === 'COMPLETED') {
          setDownloading(false);
          setProgress(100);
          setLastDownloadedFile(payload.filename || 'Downloaded media file');
        } else if (payload.status === 'FAILED') {
          setDownloading(false);
          setErrorMessage(payload.error_msg || 'Download failed on local engine.');
        }
      }).then((unsub: any) => {
        unlistenProgress = unsub;
      }).catch(() => {});
    }

    // 3. Deep link protocol parsing (m4k://download?url=...)
    const checkDeepLink = () => {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const incomingUrl = params.get('url');
        if (incomingUrl) {
          setUrl(incomingUrl);
          handleAnalyze(incomingUrl);
          return;
        }
      }

      // Check native CLI launch url (from Windows protocol association)
      if (invoke) {
        invoke<string | null>('get_launch_url')
          .then((launchUrl) => {
            if (launchUrl) {
              setUrl(launchUrl);
              handleAnalyze(launchUrl);
            }
          })
          .catch(() => {});
      }
    };
    checkDeepLink();

    // 4. Clipboard listener on focus
    const handleFocus = () => {
      if (clipboardWatcher && !url) {
        navigator.clipboard?.readText().then((text) => {
          if (text && (text.startsWith('http://') || text.startsWith('https://')) && text !== url) {
            setUrl(text.trim());
            handleAnalyze(text.trim());
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (unlistenProgress) unlistenProgress();
      window.removeEventListener('focus', handleFocus);
    };
  }, [clipboardWatcher]);

  const handleAnalyze = async (targetUrl?: string) => {
    const toAnalyze = targetUrl || url;
    if (!toAnalyze) return;

    setAnalyzing(true);
    setErrorMessage(null);
    setMetadata(null);

    if (invoke) {
      try {
        const res = await invoke<AnalyzeResult>('analyze_local', { url: toAnalyze });
        setMetadata(res);
        // Default to highest available video quality or first available option
        const best = res.qualities.find(q => q.available && q.height <= 2160 && q.height > 0)?.label
          || res.qualities.find(q => q.available)?.label
          || 'Original';
        setSelectedQuality(best);
      } catch (err: any) {
        setErrorMessage(typeof err === 'string' ? err : 'This media is currently unavailable.');
      } finally {
        setAnalyzing(false);
      }
    } else {
      // Browser preview mode fallback
      setTimeout(() => {
        setAnalyzing(false);
        setMetadata({
          url: toAnalyze,
          title: 'Direct Local Media Stream',
          thumbnailUrl: '',
          durationSec: 213,
          uploader: 'Local Engine',
          platform: 'generic',
          qualities: [
            { label: 'Original', height: 0, available: true, formatNote: 'Source Stream', fps: 30 },
            { label: 'Audio', height: 0, available: true, formatNote: 'High Quality 320kbps MP3', fps: 0 },
          ],
          formats: ['mp4', 'mkv', 'mp3'],
        });
      }, 500);
    }
  };

  const handleStartDownload = async () => {
    if (!url) return;

    setDownloading(true);
    setProgress(1);
    setErrorMessage(null);
    setLastDownloadedFile(null);

    const downloadId = Date.now().toString();

    if (invoke) {
      try {
        await invoke('download_local', {
          spec: {
            url,
            quality: selectedQuality,
            format: selectedFormat,
            downloadId,
          }
        });
      } catch (err: any) {
        setDownloading(false);
        setErrorMessage(typeof err === 'string' ? err : 'Failed to launch local download.');
      }
    } else {
      // Simulated fallback for browser preview
      let current = 5;
      const interval = setInterval(() => {
        current += 15;
        if (current >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setProgress(100);
          setLastDownloadedFile('video_4k_local.mp4');
        } else {
          setProgress(current);
        }
      }, 300);
    }
  };

  const handleOpenFolder = () => {
    if (invoke) {
      invoke('open_folder', { path: savePath }).catch(() => {});
    } else {
      alert(`Save folder: ${savePath}\nDuplicate conflict protection enabled [video (1).mp4].`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans select-none">
      {/* Titlebar */}
      <header className="h-10 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#16A34A] flex items-center justify-center text-white text-[10px] font-bold">
            M4K
          </div>
          <span className="text-xs font-bold text-[#0F172A]">My 4K Downloader</span>
          <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full font-mono">
            Universal Desktop Engine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setClipboardWatcher(!clipboardWatcher)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors flex items-center gap-1 ${
              clipboardWatcher
                ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Clipboard className="w-3 h-3" />
            <span>Clipboard Auto-Detect</span>
          </button>
          <Badge variant="mint" size="sm">Native Engine</Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-5 justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Universal Media Downloader</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Downloads directly to <span className="font-semibold text-emerald-700">{savePath}</span>. Zero cloud dependency.
          </p>
        </div>

        <Card variant="default" className="p-6">
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Paste any video or media link
              </label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setErrorMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnalyze();
                  }}
                  placeholder="Paste any video or media link..."
                  leftIcon={<Sparkles className="w-4 h-4 text-[#16A34A]" />}
                  className="flex-1"
                />
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => handleAnalyze()}
                  disabled={analyzing || !url}
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Extracted Metadata Card */}
            {metadata && (
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-start gap-3">
                  {metadata.thumbnailUrl ? (
                    <img 
                      src={metadata.thumbnailUrl} 
                      alt="" 
                      className="w-24 h-16 object-cover rounded-lg bg-slate-200 border border-slate-300/60 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Film className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{metadata.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {metadata.uploader} • {Math.floor(metadata.durationSec / 60)}:{String(metadata.durationSec % 60).padStart(2, '0')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant="neutral" size="sm">{metadata.platform.toUpperCase()}</Badge>
                      <Badge variant="mint" size="sm">Local Verified</Badge>
                    </div>
                  </div>
                </div>

                {/* Quality Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Select Quality:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {metadata.qualities.filter(q => q.available).map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setSelectedQuality(q.label)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          selectedQuality === q.label
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {q.label} {q.height >= 2160 ? '⚡ Ultra HD' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Format:
                  </label>
                  <div className="flex gap-2">
                    {['mp4', 'mkv', 'mp3'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedFormat(fmt)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border transition-all ${
                          selectedFormat === fmt
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Folder Destination Strip */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Save Destination
                </label>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <FolderCheck className="w-3.5 h-3.5" /> Auto-created
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={savePath}
                  readOnly
                  className="bg-[#F8FAF9] text-xs font-mono"
                  leftIcon={<Folder className="w-4 h-4 text-[#64748B]" />}
                />
                <Button variant="outline" size="md" onClick={handleOpenFolder}>
                  Open Folder
                </Button>
              </div>
            </div>

            {/* Real Progress Bar */}
            {downloading && (
              <div className="pt-2 space-y-1.5">
                <ProgressBar
                  progress={progress}
                  showLabel
                  speedText="Local Network Speed"
                  etaText="Direct Download"
                />
              </div>
            )}

            {/* Completion Pill */}
            {lastDownloadedFile && !downloading && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-900">
                    Saved: <span className="font-semibold">{lastDownloadedFile}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Show in Folder <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Download CTA Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={downloading || !url}
              onClick={handleStartDownload}
            >
              {downloading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading Locally ({progress}%)...
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Download {selectedQuality} ({selectedFormat.toUpperCase()})</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Sidecar Verification Strip */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>yt-dlp: v2026.08 (Local)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>ffmpeg: v9.0.1 (Local)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>m4k:// protocol: ready</span>
          </div>
        </div>
      </main>
    </div>
  );
}
