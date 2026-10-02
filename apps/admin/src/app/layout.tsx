import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TurboGrab Admin Console',
  description: 'Operations, Analytics, User Management & DMCA Moderation',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAF9] text-[#0F172A]">{children}</body>
    </html>
  );
}
