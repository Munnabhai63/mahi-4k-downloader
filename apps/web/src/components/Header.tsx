'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Play,
  History,
  Download,
  Settings,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@turbograb/ui';
import { translations, Locale } from '@/lib/i18n';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [lang, setLang] = useState<Locale>('EN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  const t = translations[lang] || translations.EN;

  const navLinks = [
    { href: '/', label: t.nav.downloader, icon: null },
    { href: '/downloads', label: t.nav.active, icon: Download },
    { href: '/history', label: t.nav.history, icon: History },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center shadow-md shadow-[#16A34A]/20 group-hover:scale-105 transition-transform duration-200">
            <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-[#0F172A] font-poppins">
                My <span className="text-[#16A34A]">4K</span> Downloader
              </span>
              <span className="text-[10px] bg-[#DCFCE7] text-[#16A34A] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-[#64748B] font-semibold -mt-0.5 tracking-wide hidden xs:block">
              Fast Video & Audio Engine
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#64748B]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors flex items-center gap-1.5 py-1 ${
                  isActive ? 'text-[#16A34A] font-semibold' : 'hover:text-[#0F172A]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions Desktop */}
        <div className="flex items-center gap-2.5">

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

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0FDF4] border border-[#86EFAC]/50 text-xs font-bold text-[#16A34A] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span>{lang === 'HI' ? '100% मुफ़्त • कोई लॉगिन नहीं' : '100% Free • No Sign-in'}</span>
          </div>

          <Link href="/#paste-bar" className="hidden sm:inline-flex">
            <Button
              variant="primary"
              size="sm"
              className="rounded-full px-4 text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs cursor-pointer"
            >
              {t.nav.newGrab}
            </Button>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#475569] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] md:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F0FDF4] text-[#16A34A]'
                      : 'text-[#475569] hover:bg-[#F8FAF9]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex flex-col gap-2">
            <Link href="/#paste-bar" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="sm" className="w-full text-xs font-bold bg-[#16A34A] text-white">
                {t.nav.newGrab} (100% Free)
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
