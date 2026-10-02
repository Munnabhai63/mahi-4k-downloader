'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, History, Download, Settings, User, LogOut, Globe } from 'lucide-react';
import { Button } from '@turbograb/ui';
import { translations, Locale } from '@/lib/i18n';

export const Header: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [lang, setLang] = useState<Locale>('EN');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('turbograb_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserEmail(parsed.email || null);
        } catch {}
      }
      const savedLang = localStorage.getItem('turbograb_lang') as Locale;
      if (savedLang && (savedLang === 'EN' || savedLang === 'HI')) setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const next: Locale = lang === 'EN' ? 'HI' : 'EN';
    setLang(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('turbograb_lang', next);
      window.dispatchEvent(new Event('turbograb_lang_change'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('turbograb_token');
    localStorage.removeItem('turbograb_user');
    setUserEmail(null);
    window.location.reload();
  };

  const t = translations[lang] || translations.EN;

  return (
    <header className="sticky top-0 z-40 w-full glass-header bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center shadow-md shadow-[#16A34A]/20 group-hover:scale-105 transition-transform duration-200">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[#0F172A] font-poppins">
                My <span className="text-[#16A34A]">4K</span> Downloader
              </span>
              <span className="text-[10px] bg-[#DCFCE7] text-[#16A34A] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                Free
              </span>
            </div>
            <span className="text-[10px] text-[#64748B] font-semibold -mt-0.5 tracking-wide">
              Fast Video & Audio Downloader
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#64748B]">
          <Link href="/" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5">
            {t.nav.downloader}
          </Link>
          <Link href="/downloads" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            {t.nav.active}
          </Link>
          <Link href="/history" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5">
            <History className="w-4 h-4" />
            {t.nav.history}
          </Link>
          <Link href="/settings" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            {t.nav.settings}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={toggleLanguage}
            title="Switch Language"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#64748B] hover:text-[#16A34A] bg-[#F8FAF9] hover:bg-[#F0FDF4] border border-[#E2E8F0] rounded-full transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </button>

          {userEmail ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] border border-[#16A34A]/20 rounded-full text-xs font-semibold text-[#16A34A]">
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{userEmail}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-[#64748B] hover:text-red-600 px-2"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-semibold">
                {t.nav.signIn}
              </Button>
            </Link>
          )}

          <Link href="/#paste-bar">
            <Button variant="primary" size="sm" className="rounded-full px-4 text-xs font-semibold">
              {t.nav.newGrab}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
