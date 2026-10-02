'use client';

import React from 'react';

interface PlatformRowProps {
  onSelectPlatform?: (platform: string, sampleUrl: string) => void;
}

export const PlatformRow: React.FC<PlatformRowProps> = ({ onSelectPlatform }) => {
  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube',
      badge: '4K / 8K',
      sampleUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      glowShadow: '0 12px 28px -4px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.35)',
      activeBorder: 'hover:border-red-500/60',
      badgeBg: 'bg-red-50 text-red-600 border-red-200',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="yt-glow" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FF3B30" />
              <stop offset="65%" stopColor="#E60000" />
              <stop offset="100%" stopColor="#990000" />
            </radialGradient>
            <linearGradient id="yt-spec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="yt-triangle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <filter id="yt-3d-shadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>
          <rect x="5" y="11" width="54" height="42" rx="14" fill="url(#yt-glow)" filter="url(#yt-3d-shadow)" />
          <path d="M 18 53 C 8 53 5 49 5 40 L 5 43 C 5 51 11 53 18 53 L 46 53 C 53 53 59 51 59 43 L 59 40 C 59 49 55 53 46 53 Z" fill="#660000" opacity="0.6" />
          <path d="M 7 21 C 7 15 12 12 19 12 L 45 12 C 52 12 57 15 57 21 C 46 25 18 25 7 21 Z" fill="url(#yt-spec)" />
          <path d="M 27 24 L 43 32 L 27 40 Z" fill="url(#yt-triangle)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      badge: 'Reels / Post',
      sampleUrl: 'https://www.instagram.com/reel/C3xL98aP123/',
      glowShadow: '0 12px 28px -4px rgba(225, 48, 108, 0.5), 0 0 20px rgba(250, 126, 30, 0.35)',
      activeBorder: 'hover:border-pink-500/60',
      badgeBg: 'bg-pink-50 text-pink-600 border-pink-200',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ig-sunset" cx="25%" cy="105%" r="115%">
              <stop offset="0%" stopColor="#FFDD55" />
              <stop offset="15%" stopColor="#FF543E" />
              <stop offset="45%" stopColor="#C837AB" />
              <stop offset="85%" stopColor="#5B51D8" />
              <stop offset="100%" stopColor="#3B3298" />
            </radialGradient>
            <linearGradient id="ig-spec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter id="ig-3d-shadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>
          <rect x="7" y="7" width="50" height="50" rx="15" fill="url(#ig-sunset)" filter="url(#ig-3d-shadow)" />
          <path d="M 21 57 C 10 57 7 53 7 45 L 7 47 C 7 55 12 57 21 57 L 43 57 C 52 57 57 55 57 47 L 57 45 C 57 53 54 57 43 57 Z" fill="#201550" opacity="0.6" />
          <path d="M 9 19 C 9 13 14 8 22 8 L 42 8 C 50 8 55 13 55 19 C 44 24 20 24 9 19 Z" fill="url(#ig-spec)" />
          <rect x="16" y="16" width="32" height="32" rx="9" stroke="#FFFFFF" strokeWidth="3.2" fill="none" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
          <circle cx="32" cy="32" r="8" stroke="#FFFFFF" strokeWidth="3.2" fill="none" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
          <circle cx="41" cy="23" r="2.2" fill="#FFFFFF" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
        </svg>
      ),
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      badge: 'No Watermark',
      sampleUrl: 'https://www.tiktok.com/@creator/video/7192837465',
      glowShadow: '0 12px 28px -4px rgba(0, 242, 254, 0.5), 0 0 20px rgba(254, 9, 121, 0.4)',
      activeBorder: 'hover:border-cyan-400/60',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="tt-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="tt-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="tt-spec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter id="tt-cyan-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="-1.5" dy="-1.5" stdDeviation="1.5" floodColor="#00F2FE" floodOpacity="0.9" />
            </filter>
            <filter id="tt-pink-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="1.5" dy="1.5" stdDeviation="1.5" floodColor="#FE0979" floodOpacity="0.9" />
            </filter>
          </defs>
          <rect x="7" y="7" width="50" height="50" rx="15" fill="url(#tt-bg)" stroke="url(#tt-rim)" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
          <path d="M 9 19 C 9 13 14 8 22 8 L 42 8 C 50 8 55 13 55 19 C 44 23 20 23 9 19 Z" fill="url(#tt-spec)" />
          <path d="M 33 16 L 39 16 C 40 21 44 25 49 26 L 49 31 C 45 31 41 29 38 26 L 38 39 C 38 44.5 33.5 49 28 49 C 22.5 49 18 44.5 18 39 C 18 33.5 22.5 29 28 29 C 29 29 30 29.2 31 29.6 L 31 35 C 30.2 34.6 29.2 34.4 28 34.4 C 25.5 34.4 23.4 36.5 23.4 39 C 23.4 41.5 25.5 43.6 28 43.6 C 30.5 43.6 32.6 41.5 32.6 39 L 32.6 16 Z" fill="#00F2FE" transform="translate(-1.8, -1.8)" opacity="0.95" filter="url(#tt-cyan-glow)" />
          <path d="M 33 16 L 39 16 C 40 21 44 25 49 26 L 49 31 C 45 31 41 29 38 26 L 38 39 C 38 44.5 33.5 49 28 49 C 22.5 49 18 44.5 18 39 C 18 33.5 22.5 29 28 29 C 29 29 30 29.2 31 29.6 L 31 35 C 30.2 34.6 29.2 34.4 28 34.4 C 25.5 34.4 23.4 36.5 23.4 39 C 23.4 41.5 25.5 43.6 28 43.6 C 30.5 43.6 32.6 41.5 32.6 39 L 32.6 16 Z" fill="#FE0979" transform="translate(1.8, 1.8)" opacity="0.95" filter="url(#tt-pink-glow)" />
          <path d="M 33 16 L 39 16 C 40 21 44 25 49 26 L 49 31 C 45 31 41 29 38 26 L 38 39 C 38 44.5 33.5 49 28 49 C 22.5 49 18 44.5 18 39 C 18 33.5 22.5 29 28 29 C 29 29 30 29.2 31 29.6 L 31 35 C 30.2 34.6 29.2 34.4 28 34.4 C 25.5 34.4 23.4 36.5 23.4 39 C 23.4 41.5 25.5 43.6 28 43.6 C 30.5 43.6 32.6 41.5 32.6 39 L 32.6 16 Z" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      badge: 'Watch / HD',
      sampleUrl: 'https://www.facebook.com/watch?v=123456789',
      glowShadow: '0 12px 28px -4px rgba(24, 119, 242, 0.5), 0 0 20px rgba(24, 119, 242, 0.35)',
      activeBorder: 'hover:border-blue-500/60',
      badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="fb-blue" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2E8BFF" />
              <stop offset="60%" stopColor="#1877F2" />
              <stop offset="100%" stopColor="#0B57C2" />
            </radialGradient>
            <linearGradient id="fb-spec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter id="fb-3d-shadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>
          <circle cx="32" cy="32" r="25" fill="url(#fb-blue)" filter="url(#fb-3d-shadow)" />
          <path d="M 13 43 C 17 53 26 57 32 57 C 38 57 47 53 51 43 C 45 51 38 54 32 54 C 26 54 19 51 13 43 Z" fill="#043275" opacity="0.6" />
          <ellipse cx="32" cy="18" rx="17" ry="7.5" fill="url(#fb-spec)" />
          <path d="M 37 20 L 33 20 C 30 20 28 22 28 25 L 28 29 L 24 29 L 24 35 L 28 35 L 28 50 L 35 50 L 35 35 L 40 35 L 41 29 L 35 29 L 35 26 C 35 25 36 24 37 24 L 41 24 L 41 20 Z" fill="#FFFFFF" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      badge: 'HD Video',
      sampleUrl: 'https://x.com/tech_insider/status/17892345678',
      glowShadow: '0 12px 28px -4px rgba(255, 255, 255, 0.4), 0 0 20px rgba(148, 163, 184, 0.4)',
      activeBorder: 'hover:border-slate-500/60',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="x-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A2D34" />
              <stop offset="40%" stopColor="#14171A" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="x-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#657786" />
              <stop offset="100%" stopColor="#1B1F24" />
            </linearGradient>
            <linearGradient id="x-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="x-spec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="7" y="7" width="50" height="50" rx="15" fill="url(#x-bg)" stroke="url(#x-rim)" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
          <path d="M 9 19 C 9 13 14 8 22 8 L 42 8 C 50 8 55 13 55 19 C 44 23 20 23 9 19 Z" fill="url(#x-spec)" />
          <path d="M 37.6 19 L 46 19 L 33.8 33.1 L 48.3 45 L 41.5 45 L 31.4 36.4 L 21.3 45 L 16 45 L 29.1 30.1 L 15.2 19 L 22.3 19 L 31.5 26.6 Z M 35.8 41.8 L 39.8 41.8 L 25.4 22.2 L 21.4 22.2 Z" fill="url(#x-chrome)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
        </svg>
      ),
    },
    {
      id: 'spotify',
      name: 'Spotify',
      badge: '320kbps MP3',
      sampleUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      glowShadow: '0 12px 28px -4px rgba(30, 215, 96, 0.5), 0 0 20px rgba(30, 215, 96, 0.35)',
      activeBorder: 'hover:border-emerald-500/60',
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sp-green" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1FF268" />
              <stop offset="60%" stopColor="#1ED760" />
              <stop offset="100%" stopColor="#159C44" />
            </radialGradient>
            <linearGradient id="sp-spec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter id="sp-3d-shadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>
          <circle cx="32" cy="32" r="25" fill="url(#sp-green)" filter="url(#sp-3d-shadow)" />
          <path d="M 13 43 C 17 53 26 57 32 57 C 38 57 47 53 51 43 C 45 51 38 54 32 54 C 26 54 19 51 13 43 Z" fill="#0D6B2D" opacity="0.6" />
          <ellipse cx="32" cy="18" rx="17" ry="7.5" fill="url(#sp-spec)" />
          <path d="M 20 25 C 27 22.5 37 23.5 44 28" stroke="#121212" strokeWidth="3.8" strokeLinecap="round" filter="drop-shadow(0 1px 1px rgba(255,255,255,0.4))" />
          <path d="M 22 32 C 28 30 36 30.8 42 34.5" stroke="#121212" strokeWidth="3.2" strokeLinecap="round" filter="drop-shadow(0 1px 1px rgba(255,255,255,0.4))" />
          <path d="M 24 39 C 29 37.5 35 38 40 41" stroke="#121212" strokeWidth="2.6" strokeLinecap="round" filter="drop-shadow(0 1px 1px rgba(255,255,255,0.4))" />
        </svg>
      ),
    },
  ];

  return (
    <div id="platforms" className="w-full py-8">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#CBD5E1]" />
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1.5">
          <span>⚡</span> Supported 3D Fast Grab
        </span>
        <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#CBD5E1]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 max-w-4xl mx-auto px-2">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPlatform && onSelectPlatform(p.name, p.sampleUrl)}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2.5 active:scale-95 cursor-pointer focus:outline-none ${p.activeBorder}`}
          >
            {/* Ambient 3D Neon Glow floor */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
              style={{
                boxShadow: p.glowShadow,
              }}
            />

            {/* 3D Realistic Icon */}
            <div className="mb-2.5 filter drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300">
              {p.icon}
            </div>

            {/* Platform Name */}
            <span className="text-xs font-bold text-[#0F172A] group-hover:text-black transition-colors font-poppins">
              {p.name}
            </span>

            {/* Small Spec Tag */}
            <span className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.badgeBg} transition-transform duration-200 group-hover:scale-105`}>
              {p.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
