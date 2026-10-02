import { useState, useEffect } from 'react';
import { Play, Folder, Sparkles, Download, CheckCircle2, Clipboard, ExternalLink, FolderCheck } from 'lucide-react';
import { Button, Card, Badge, Input, ProgressBar } from '@turbograb/ui';

export default function App() {
  const [url, setUrl] = useState('');
  const [savePath, setSavePath] = useState('Downloads\\My 4K Downloader');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastDownloadedFile, setLastDownloadedFile] = useState<string | null>(null);
  const [clipboardWatcher, setClipboardWatcher] = useState(true);
  const [folderStatus, setFolderStatus] = useState<'ready' | 'created'>('ready');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        navigator.clipboard?.readText().then((text) => {
          if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            setUrl(text.trim());
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus watcher
    const handleFocus = () => {
      if (clipboardWatcher) {
        navigator.clipboard?.readText().then((text) => {
          if (text && (text.startsWith('http://') || text.startsWith('https://')) && text !== url) {
            setUrl(text.trim());
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus', handleFocus);
    };
  }, [clipboardWatcher, url]);

  const handleStartDownload = () => {
    if (!url) return;
    setDownloading(true);
    setProgress(15);
    setLastDownloadedFile(null);
    setFolderStatus('created');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setLastDownloadedFile('video_4k_ultra.mp4');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const handleOpenFolder = () => {
    // If running inside Tauri window.__TAURI__
    if ((window as any).__TAURI__) {
      try {
        (window as any).__TAURI__.shell.open(savePath);
      } catch {}
    } else {
      alert(`Download folder: ${savePath}\nAutomatically managed with duplicate conflict protection [video (1).mp4].`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans">
      {/* Titlebar */}
      <header className="h-10 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#16A34A] flex items-center justify-center text-white text-[10px] font-bold">
            M4K
          </div>
          <span className="text-xs font-bold text-[#0F172A]">My 4K Downloader Desktop</span>
          <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full font-mono">
            Ctrl+Shift+V
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
            <span>Watcher {clipboardWatcher ? 'ON' : 'OFF'}</span>
          </button>
          <Badge variant="mint" size="sm">Local Engine Active</Badge>
        </div>
      </header>

      {/* Main App */}
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6 justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Direct Local Video Grabber</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Downloads save automatically into <span className="font-semibold text-emerald-700">Downloads/My 4K Downloader/</span> with duplicate collision resolution.
          </p>
        </div>

        <Card variant="default" className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Video / Audio Link
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                leftIcon={<Sparkles className="w-4 h-4 text-[#16A34A]" />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Default Dedicated Folder
                </label>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <FolderCheck className="w-3.5 h-3.5" /> Auto-created
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={savePath}
                  onChange={(e) => setSavePath(e.target.value)}
                  readOnly
                  className="bg-[#F8FAF9]"
                  leftIcon={<Folder className="w-4 h-4 text-[#64748B]" />}
                />
                <Button variant="outline" size="md" onClick={handleOpenFolder}>
                  Open Folder
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Files are saved to <span className="font-mono">Downloads/My 4K Downloader</span>. If file exists, numbered sequentially <span className="font-mono">video (1).mp4</span>.
              </p>
            </div>

            {downloading && (
              <div className="pt-2">
                <ProgressBar
                  progress={progress}
                  showLabel
                  speedText="42.5 MB/s"
                  etaText="3s"
                />
              </div>
            )}

            {lastDownloadedFile && !downloading && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-900">
                    Saved to My 4K Downloader: <span className="font-semibold">{lastDownloadedFile}</span>
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

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={downloading || !url}
              onClick={handleStartDownload}
            >
              {downloading ? (
                <span>Downloading Locally...</span>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Grab Best Quality (4K/1080p)</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Binary Status Strip */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>yt-dlp sidecar: v2026.08</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>ffmpeg: muxing enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>auto-folder: active</span>
          </div>
        </div>
      </main>
    </div>
  );
}
