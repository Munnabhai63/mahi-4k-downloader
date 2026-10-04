'use client';

import React from 'react';

interface PlatformRowProps {
  onSelectPlatform?: (platform: string, sampleUrl: string) => void;
}

export const PlatformRow: React.FC<PlatformRowProps> = ({ onSelectPlatform }) => {
  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      badge: 'Fast Web',
      badgeType: 'fast-web',
      sampleUrl: 'https://www.facebook.com/watch?v=10153231379946729',
      glowShadow: '0 12px 28px -4px rgba(24, 119, 242, 0.5), 0 0 20px rgba(24, 119, 242, 0.35)',
      activeBorder: 'hover:border-blue-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      id: 'dailymotion',
      name: 'Dailymotion',
      badge: 'Fast Web',
      badgeType: 'fast-web',
      sampleUrl: 'https://www.dailymotion.com/video/x8o0rbs',
      glowShadow: '0 12px 28px -4px rgba(0, 102, 221, 0.45), 0 0 20px rgba(0, 102, 221, 0.3)',
      activeBorder: 'hover:border-sky-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="dm-grad" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#0066DD" />
              <stop offset="100%" stopColor="#002F6C" />
            </radialGradient>
          </defs>
          <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#dm-grad)" />
          <text x="32" y="42" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="bold" fontFamily="sans-serif">d</text>
        </svg>
      ),
    },
    {
      id: 'archive',
      name: 'Archive.org',
      badge: 'Fast Web',
      badgeType: 'fast-web',
      sampleUrl: 'https://archive.org/details/Popeye_forPresident',
      glowShadow: '0 12px 28px -4px rgba(100, 116, 139, 0.4), 0 0 20px rgba(100, 116, 139, 0.25)',
      activeBorder: 'hover:border-slate-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#334155" />
          <path d="M 16 26 L 48 26 L 48 46 L 16 46 Z M 20 20 L 44 20 L 48 24 L 16 24 Z" fill="#F8FAFC" />
          <path d="M 23 28 L 27 28 L 27 44 L 23 44 Z M 30 28 L 34 28 L 34 44 L 30 44 Z M 37 28 L 41 28 L 41 44 L 37 44 Z" fill="#334155" />
        </svg>
      ),
    },
    {
      id: 'direct',
      name: 'Direct Media',
      badge: 'Fast Web',
      badgeType: 'fast-web',
      sampleUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      glowShadow: '0 12px 28px -4px rgba(22, 163, 74, 0.45), 0 0 20px rgba(22, 163, 74, 0.3)',
      activeBorder: 'hover:border-emerald-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#16A34A" />
          <circle cx="32" cy="32" r="16" stroke="#FFFFFF" strokeWidth="3" />
          <path d="M 28 24 L 40 32 L 28 40 Z" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      id: 'vimeo',
      name: 'Vimeo',
      badge: 'Conditional',
      badgeType: 'conditional',
      sampleUrl: 'https://vimeo.com/76979871',
      glowShadow: '0 12px 28px -4px rgba(26, 183, 234, 0.4), 0 0 20px rgba(26, 183, 234, 0.25)',
      activeBorder: 'hover:border-cyan-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#1AB7EA" />
          <path d="M 45 22 C 44 26 39 36 34 36 C 30 36 29 27 26 23 C 24 19 21 21 19 22 L 18 24 C 21 21 24 20 27 25 C 29 30 31 43 36 43 C 43 43 49 29 49 22 Z" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      id: 'reddit',
      name: 'Reddit',
      badge: 'Partial',
      badgeType: 'partial',
      sampleUrl: 'https://www.reddit.com/r/NatureIsFuckingLit/comments/sample',
      glowShadow: '0 12px 28px -4px rgba(255, 69, 0, 0.4), 0 0 20px rgba(255, 69, 0, 0.25)',
      activeBorder: 'hover:border-orange-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="24" fill="#FF4500" />
          <circle cx="32" cy="32" r="14" fill="#FFFFFF" />
          <circle cx="26" cy="31" r="2.5" fill="#FF4500" />
          <circle cx="38" cy="31" r="2.5" fill="#FF4500" />
          <path d="M 27 36 C 29 39 35 39 37 36" stroke="#FF4500" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X/Twitter',
      badge: 'API / Limited',
      badgeType: 'limited',
      sampleUrl: 'https://x.com/Twitter/status/1274062719266185217',
      glowShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.4), 0 0 20px rgba(15, 23, 42, 0.25)',
      activeBorder: 'hover:border-slate-600/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#000000" />
          <path d="M 37.6 19 L 46 19 L 33.8 33.1 L 48.3 45 L 41.5 45 L 31.4 36.4 L 21.3 45 L 16 45 L 29.1 30.1 L 15.2 19 L 22.3 19 L 31.5 26.6 Z M 35.8 41.8 L 39.8 41.8 L 25.4 22.2 L 21.4 22.2 Z" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      name: 'YouTube',
      badge: '4K Desktop',
      badgeType: 'desktop-app',
      sampleUrl: 'https://www.youtube.com/watch?v=1ZyIS1QAG68',
      glowShadow: '0 12px 28px -4px rgba(220, 38, 38, 0.45), 0 0 20px rgba(220, 38, 38, 0.3)',
      activeBorder: 'hover:border-red-500/60',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="14" width="48" height="36" rx="12" fill="#DC2626" />
          <path d="M 27 24 L 41 32 L 27 40 Z" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      badge: 'Web Unsupported',
      badgeType: 'unsupported',
      sampleUrl: 'https://www.instagram.com/reel/C8t1M2UvQ6-/',
      glowShadow: '0 12px 28px -4px rgba(225, 48, 108, 0.3), 0 0 20px rgba(225, 48, 108, 0.2)',
      activeBorder: 'hover:border-pink-400/50',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110 opacity-75 group-hover:opacity-100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#E1306C" />
          <rect x="18" y="18" width="28" height="28" rx="8" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="32" cy="32" r="7" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="40" cy="24" r="2" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      badge: 'Web Unsupported',
      badgeType: 'unsupported',
      sampleUrl: 'https://www.tiktok.com/@tiktok/video/7106594312292453678',
      glowShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)',
      activeBorder: 'hover:border-slate-500/50',
      icon: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110 opacity-75 group-hover:opacity-100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#0F172A" />
          <path d="M 33 18 L 38 18 C 39 22 42 25 46 26 L 46 30 C 43 30 40 28 37 26 L 37 38 C 37 43 33 46 28 46 C 23 46 19 42 19 37 C 19 32 23 28 28 28 C 29 28 30 28.2 31 28.5 L 31 33 C 30 32.7 29 32.5 28 32.5 C 26 32.5 24 34.5 24 37 C 24 39.5 26 41.5 28 41.5 C 30 41.5 32 39.5 32 37 L 32 18 Z" fill="#00F2FE" transform="translate(-1, -1)" opacity="0.9" />
          <path d="M 33 18 L 38 18 C 39 22 42 25 46 26 L 46 30 C 43 30 40 28 37 26 L 37 38 C 37 43 33 46 28 46 C 23 46 19 42 19 37 C 19 32 23 28 28 28 C 29 28 30 28.2 31 28.5 L 31 33 C 30 32.7 29 32.5 28 32.5 C 26 32.5 24 34.5 24 37 C 24 39.5 26 41.5 28 41.5 C 30 41.5 32 39.5 32 37 L 32 18 Z" fill="#FE0979" transform="translate(1, 1)" opacity="0.9" />
          <path d="M 33 18 L 38 18 C 39 22 42 25 46 26 L 46 30 C 43 30 40 28 37 26 L 37 38 C 37 43 33 46 28 46 C 23 46 19 42 19 37 C 19 32 23 28 28 28 C 29 28 30 28.2 31 28.5 L 31 33 C 30 32.7 29 32.5 28 32.5 C 26 32.5 24 34.5 24 37 C 24 39.5 26 41.5 28 41.5 C 30 41.5 32 39.5 32 37 L 32 18 Z" fill="#FFFFFF" />
        </svg>
      ),
    },
  ];

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'fast-web':
        return 'text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC]';
      case 'desktop-app':
        return 'text-emerald-800 bg-emerald-50 border border-emerald-300 font-bold';
      case 'conditional':
        return 'text-amber-800 bg-amber-50 border border-amber-200';
      case 'partial':
        return 'text-orange-800 bg-orange-50 border border-orange-200';
      case 'limited':
        return 'text-indigo-800 bg-indigo-50 border border-indigo-200';
      case 'unsupported':
      default:
        return 'text-slate-600 bg-slate-100 border border-slate-200';
    }
  };

  return (
    <div id="platforms" className="w-full py-8">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#CBD5E1]" />
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1.5">
          <span>⚡</span> Platform Status & Compatibility
        </span>
        <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#CBD5E1]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-5xl mx-auto px-2">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPlatform && onSelectPlatform(p.name, p.sampleUrl)}
            className={`group relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 active:scale-95 cursor-pointer focus:outline-none ${p.activeBorder}`}
          >
            {/* Ambient Neon Glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
              style={{
                boxShadow: p.glowShadow,
              }}
            />

            {/* Icon */}
            <div className="mb-2 filter drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300">
              {p.icon}
            </div>

            {/* Platform Name */}
            <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors font-poppins text-center truncate w-full">
              {p.name}
            </span>

            {/* Web capability badge */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 shrink-0 ${getBadgeStyle(p.badgeType)}`}>
              {p.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
