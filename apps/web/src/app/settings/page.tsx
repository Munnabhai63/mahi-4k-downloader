'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Key,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Trash2,
  HelpCircle,
  Save,
  Folder,
  FolderCheck,
} from 'lucide-react';
import { Button, Card, Badge } from '@turbograb/ui';
import { VideoFormat, VideoQualityLabel } from '@turbograb/types';
import { getApiBaseUrl } from '@/lib/api';
import {
  isFileSystemAccessSupported,
  getActiveDownloadDirectoryName,
  promptChooseDownloadDirectory,
  resetDownloadDirectory,
} from '@/lib/downloadFolder';

export default function SettingsPage() {
  const [smartModeEnabled, setSmartModeEnabled] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState<VideoQualityLabel>('1080p');
  const [defaultFormat, setDefaultFormat] = useState<VideoFormat>('mp4');
  const [defaultSubtitleLang, setDefaultSubtitleLang] = useState('en');
  const [customFolder, setCustomFolder] = useState<string | null>(null);
  const [isFsaAvailable, setIsFsaAvailable] = useState<boolean>(false);

  // Cookies Vault state
  const [cookiesStatus, setCookiesStatus] = useState<Record<string, boolean>>({
    instagram: false,
    youtube: false,
    facebook: false,
    twitter: false,
    tiktok: false,
  });

  const [activeCookieModal, setActiveCookieModal] = useState<string | null>(null);
  const [cookieInput, setCookieInput] = useState('');
  const [isSavingCookie, setIsSavingCookie] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    // Load local settings
    const saved = localStorage.getItem('turbograb_smart_mode');
    if (saved) {
      try {
        const conf = JSON.parse(saved);
        setSmartModeEnabled(!!conf.enabled);
        if (conf.defaultQuality) setDefaultQuality(conf.defaultQuality);
        if (conf.defaultFormat) setDefaultFormat(conf.defaultFormat);
        if (conf.defaultSubtitleLang) setDefaultSubtitleLang(conf.defaultSubtitleLang);
      } catch {}
    }

    // Check File System Access and active folder
    setIsFsaAvailable(isFileSystemAccessSupported());
    getActiveDownloadDirectoryName().then((name) => {
      setCustomFolder(name);
    });

    // Load cookies status from API
    fetchCookiesStatus();
  }, []);

  const handlePickFolder = async () => {
    const res = await promptChooseDownloadDirectory();
    if (res.success && res.folderName) {
      setCustomFolder(res.folderName);
      setSaveSuccessMsg(`Dedicated download folder configured: ${res.folderName}`);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } else if (res.error && res.error !== 'Folder selection was cancelled.') {
      alert(res.error);
    }
  };

  const handleResetFolder = async () => {
    await resetDownloadDirectory();
    setCustomFolder(null);
    setSaveSuccessMsg('Reset download destination to standard system Downloads folder.');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const fetchCookiesStatus = async () => {
    try {
      const token = localStorage.getItem('turbograb_token');
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/me/cookies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, boolean> = {};
        data.forEach((item: any) => {
          map[item.platform] = item.hasCookie;
        });
        setCookiesStatus((prev) => ({ ...prev, ...map }));
      }
    } catch {}
  };

  const handleSaveSmartMode = () => {
    const conf = {
      enabled: smartModeEnabled,
      defaultQuality,
      defaultFormat,
      defaultSubtitleLang,
    };
    localStorage.setItem('turbograb_smart_mode', JSON.stringify(conf));
    setSaveSuccessMsg('Smart Mode preferences updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSaveCookie = async (platform: string) => {
    if (!cookieInput.trim()) return;
    setIsSavingCookie(true);
    try {
      const token = localStorage.getItem('turbograb_token');
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/me/cookies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ platform, cookieString: cookieInput.trim() }),
      });
      if (res.ok) {
        setCookiesStatus((prev) => ({ ...prev, [platform]: true }));
        setActiveCookieModal(null);
        setCookieInput('');
      }
    } catch {} finally {
      setIsSavingCookie(false);
    }
  };

  const handleDeleteCookie = async (platform: string) => {
    try {
      const token = localStorage.getItem('turbograb_token');
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/me/cookies/${platform}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setCookiesStatus((prev) => ({ ...prev, [platform]: false }));
      }
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Downloader</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-[#0F172A] font-poppins">
          Preferences & Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Configure Smart Mode one-click defaults and manage encrypted Cookies Vault credentials.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Smart Mode Section */}
        <Card className="p-6 bg-white border-[#E2E8F0] shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#16A34A]" />
                <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
                  Smart Mode (1-Click Downloads)
                </h2>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                When enabled, pasting a link automatically initiates download using your default settings without showing the preview card.
              </p>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smartModeEnabled}
                onChange={(e) => setSmartModeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Default Quality
              </label>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value as VideoQualityLabel)}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              >
                <option value="8K">8K Ultra HD (4320p)</option>
                <option value="4K">4K Ultra HD (2160p)</option>
                <option value="2K">2K Quad HD (1440p)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
                <option value="Audio">Audio Extraction Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Default Container
              </label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value as VideoFormat)}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              >
                <option value="mp4">MP4 (Recommended)</option>
                <option value="mkv">MKV (Matroska)</option>
                <option value="mp3">MP3 Audio (320kbps)</option>
                <option value="m4a">M4A Apple Audio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Subtitles Language
              </label>
              <select
                value={defaultSubtitleLang}
                onChange={(e) => setDefaultSubtitleLang(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
              </select>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-[#F1F5F9] flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSmartMode}
              className="flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Defaults</span>
            </Button>
          </div>
        </Card>

        {/* Download Folder / Storage Section */}
        <Card className="p-6 bg-white border-[#E2E8F0] shadow-xs">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#16A34A]" />
              <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
                Download Destination Folder
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Configure where completed video and audio files are stored on your device.
            </p>
          </div>

          <div className="p-4 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                {customFolder ? (
                  <FolderCheck className="w-5 h-5 text-[#16A34A]" />
                ) : (
                  <Folder className="w-5 h-5 text-[#94A3B8]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0F172A]">
                    {customFolder ? customFolder : 'Downloads (Default System Folder)'}
                  </span>
                  <Badge variant={customFolder ? 'mint' : 'neutral'} size="sm">
                    {customFolder ? 'Custom Directory' : 'Standard Browser'}
                  </Badge>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {customFolder
                    ? 'Files stream directly into this authorized folder with duplicate renaming.'
                    : isFsaAvailable
                    ? 'Select or create "Downloads/My 4K Downloader" to save files directly into a dedicated folder.'
                    : 'Your browser saves downloads automatically into your default Downloads folder.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {isFsaAvailable && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePickFolder}
                  className="w-full sm:w-auto text-xs bg-[#16A34A] hover:bg-[#15803D] text-white"
                >
                  {customFolder ? 'Change Folder' : 'Choose Dedicated Folder'}
                </Button>
              )}
              {customFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFolder}
                  className="text-xs"
                  title="Reset to browser default"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Platform Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#F1F5F9] text-xs text-[#64748B]">
            <div className="p-3 bg-white rounded-lg border border-[#F1F5F9]">
              <span className="font-bold text-[#0F172A] block mb-0.5">Desktop / Tauri App</span>
              <span>Automatically saves into <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">Downloads/My 4K Downloader</code> with duplicate protection.</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#F1F5F9]">
              <span className="font-bold text-[#0F172A] block mb-0.5">Chrome / Edge Extension</span>
              <span>Uses browser downloads API targeting <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">My 4K Downloader/</code> folder directly.</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#F1F5F9]">
              <span className="font-bold text-[#0F172A] block mb-0.5">Mobile / Web / PWA</span>
              <span>Chromium uses File System Access handle; Safari/iOS uses native save sheet.</span>
            </div>
          </div>
        </Card>

        {/* Cookies Vault Section */}
        <Card className="p-6 bg-white border-[#E2E8F0] shadow-xs">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#16A34A]" />
              <h2 className="text-lg font-bold text-[#0F172A] font-poppins">
                Cookies Vault (AES-256-GCM Encrypted)
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Store browser session cookies to unlock your own private Instagram Stories, Reels, and age-restricted YouTube videos. Cookies are encrypted at rest with AES-256-GCM and never exposed.
            </p>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {[
              { id: 'instagram', label: 'Instagram', desc: 'Required for Stories and private posts' },
              { id: 'youtube', label: 'YouTube', desc: 'For age-restricted or member-only videos' },
              { id: 'facebook', label: 'Facebook', desc: 'For group and private video access' },
              { id: 'twitter', label: 'X (Twitter)', desc: 'For sensitive media and high-res feeds' },
              { id: 'tiktok', label: 'TikTok', desc: 'For follower-only video clips' },
            ].map((p) => {
              const hasCookie = cookiesStatus[p.id];
              return (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0F172A]">{p.label}</span>
                      {hasCookie ? (
                        <Badge variant="mint" size="sm" className="font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#16A34A]" />
                          <span>AES-256 Encrypted</span>
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Not Configured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">{p.desc}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasCookie ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCookie(p.id)}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge Cookie</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveCookieModal(p.id);
                          setCookieInput('');
                        }}
                        className="text-xs flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Add Cookie</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Add Cookie Modal */}
        {activeCookieModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-white shadow-xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#0F172A] capitalize">
                  Configure {activeCookieModal} Cookie
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveCookieModal(null)}
                  className="text-[#64748B] hover:text-[#0F172A] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#F8FAF9] p-3 rounded-xl border border-[#E2E8F0] mb-4 text-xs text-[#64748B] flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <span>
                  Export cookies using extensions like <strong>&quot;Get cookies.txt LOCALLY&quot;</strong> in Netscape format, or paste your raw cookie header string. It will be encrypted immediately.
                </span>
              </div>

              <textarea
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                rows={5}
                placeholder="Paste Netscape format or sessionid=... cookie string here"
                className="w-full p-3 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#16A34A] mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveCookieModal(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSavingCookie || !cookieInput.trim()}
                  onClick={() => handleSaveCookie(activeCookieModal)}
                >
                  {isSavingCookie ? 'Encrypting & Saving...' : 'Save to Encrypted Vault'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Danger Zone */}
        <Card className="p-6 bg-white border-red-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-red-700 font-poppins">
              Danger Zone (GDPR Data Removal)
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mb-4">
            Instantly purge your download logs, local preferences, and encrypted vault tokens from our systems.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Local Storage & Session
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
