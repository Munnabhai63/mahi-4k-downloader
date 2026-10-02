'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, ArrowLeft, Lock, Mail, User, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button, Card, Badge } from '@turbograb/ui';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      localStorage.setItem('turbograb_token', data.accessToken);
      localStorage.setItem('turbograb_user', JSON.stringify(data.user));

      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Card className="p-8 bg-white border-[#E2E8F0] shadow-[0_8px_32px_rgba(22,163,74,0.08)]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center mx-auto shadow-md shadow-[#16A34A]/20 mb-3">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] font-poppins">
              Create your account
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Badge variant="mint" size="sm" className="font-semibold text-xs">
                <Sparkles className="w-3 h-3 inline mr-1 text-[#16A34A]" />
                Generous Free Student Plan Included
              </Badge>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Sharma"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(22,163,74,0.25)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Free Account</span>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-[11px] text-[#64748B] leading-relaxed">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-[#16A34A] underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#16A34A] underline">Privacy Policy</Link>.
          </p>

          <div className="mt-6 pt-4 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#16A34A] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
