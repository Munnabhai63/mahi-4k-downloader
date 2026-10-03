import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F8FAF9] border-t border-[#E2E8F0] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#16A34A] flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-[#0F172A] font-poppins">
                  My <span className="text-[#16A34A]">4K Downloader</span>
                </span>
                <span className="text-[10px] bg-[#DCFCE7] text-[#16A34A] font-bold px-1.5 py-0.5 rounded uppercase">
                  Free
                </span>
              </div>
            </div>
            <p className="text-sm text-[#64748B] max-w-sm">
              Free, fast, and secure 4K video and MP3 audio downloader. Designed for high-clarity 4K & 1080p saving without ads or interruptions.
            </p>
            {/* Creator Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-extrabold text-[10px]">
                MB
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#0F172A]">Created by Munna Bhai</span>
                <span className="text-[#64748B] text-[11px] block">Official Mahi Project</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-[#64748B]">
              <li><Link href="/" className="hover:text-[#16A34A] transition-colors">Web App</Link></li>
              <li><Link href="/downloads" className="hover:text-[#16A34A] transition-colors">Downloads</Link></li>
              <li><a href="#extension" className="hover:text-[#16A34A] transition-colors">Chrome Extension</a></li>
              <li><a href="#desktop" className="hover:text-[#16A34A] transition-colors">Desktop App (Tauri)</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-4">
              Legal & Safety
            </h4>
            <ul className="space-y-2 text-sm text-[#64748B]">
              <li><Link href="/terms" className="hover:text-[#16A34A] transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#16A34A] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Clean Bottom Attribution */}
        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2 font-medium text-[#475569]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
            <span>High-Speed 4K & MP3 Processing Active</span>
          </div>
          <p className="text-center md:text-right">
            &copy; {new Date().getFullYear()} <strong className="text-[#0F172A]">Mahi 4K Downloader</strong> (Turbo Edition) • Developed by <strong className="text-[#16A34A]">Munna Bhai</strong>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
