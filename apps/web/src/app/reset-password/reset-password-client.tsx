'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ArrowRight,
  Phone,
  Users,
  Star,
  School,
} from 'lucide-react';
import Link from 'next/link';
import { useRequestPasswordReset } from '@/lib/graphql/hooks';
import { toast } from 'sonner';

export default function ResetPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const resetMutation = useRequestPasswordReset();
  const isLoading = resetMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await resetMutation.mutateAsync(email);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error('The email address you entered is not registered in our system.');
    }
  };



  /* ── Card: Success State ── */
  const successCard = (
    <div className="flex flex-col items-center text-center px-7 xl:px-8 py-8">
      <div className="size-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 shadow-sm">
        <CheckCircle2 className="size-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-black text-[#14312a] tracking-tight">Email Sent!</h2>
      <p className="mt-2 text-xs text-[#4c5f58] leading-relaxed max-w-[280px]">
        A secure password reset link has been sent to{' '}
        <span className="font-bold text-[#14312a]">{email}</span>
      </p>
      <button
        type="button"
        onClick={() => router.push('/')}
        className="btn gold w-full h-[46px] mt-6 flex items-center justify-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="size-4" />
        <span>Return to Login</span>
      </button>
      <button
        type="button"
        onClick={() => setIsSuccess(false)}
        className="mt-3.5 text-xs text-[#b97f1f] hover:underline font-semibold transition-colors cursor-pointer"
      >
        Didn&apos;t receive the email? Try again
      </button>
    </div>
  );

  /* ── Card: Form State ── */
  const formCard = (
    <div className="px-7 xl:px-8 py-8">
      {/* Mail icon centered */}
      <div className="flex justify-center mb-4">
        <div className="size-14 rounded-full bg-[#f9dd86]/20 border border-[#f9dd86]/40 flex items-center justify-center shadow-xs">
          <Mail className="size-6 text-[#b97f1f]" />
        </div>
      </div>

      {/* Eyebrow & Title */}
      <div className="text-center mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b97f1f] mb-1">
          PASSWORD RECOVERY
        </p>
        <h2 className="text-2xl font-black text-[#14312a] tracking-tight">
          Forgot <span className="text-[#b97f1f]">Password?</span>
        </h2>
        <p className="mt-2 text-xs text-[#4c5f58] leading-relaxed max-w-[260px] mx-auto">
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="reset-email" className="text-xs font-semibold text-[#14312a]">Email Address</Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="size-4" />
            </div>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email address"
              className="pl-10 h-11 text-xs sm:text-sm bg-[#faf7ed]/50 border-[#14312a24] rounded-xl focus-visible:ring-2 focus-visible:ring-amber-500 placeholder:text-slate-400 text-[#14312a]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Send Reset Link */}
        <button
          type="submit"
          disabled={isLoading || !email}
          className="btn gold w-full h-[49px] flex items-center justify-center gap-2 text-[15px] font-bold mt-4 disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 className="size-4.5 animate-spin" /><span>Sending link…</span></>
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>

      {/* Bottom sign in link */}
      <p className="mt-5 text-center text-xs text-[#4c5f58]">
        Remember your password?{' '}
        <Link href="/" className="font-bold text-[#b97f1f] hover:underline transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );

  return (
    <div className="inkwelly-login selection:bg-teal-500 selection:text-white">
      {/* Top Brand Logo Header */}
      <div className="mb-6 flex items-center justify-center gap-2 select-none">
        <div className="flex items-center gap-2 text-white">
          <svg
            className="size-6 text-[#2dd4bf]"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.636l2.571-2.571a1.5 1.5 0 1 1 2.122 2.121L15.621 9.257H19.25a1.5 1.5 0 1 1 0 3h-3.629l2.571 2.571a1.5 1.5 0 1 1-2.121 2.122L13.5 14.379v3.621a1.5 1.5 0 1 1-3 0v-3.621l-2.571 2.571a1.5 1.5 0 1 1-2.122-2.121L8.379 12.257H4.75a1.5 1.5 0 1 1 0-3h3.629L5.808 6.686a1.5 1.5 0 1 1 2.121-2.122L10.5 7.136V3.5A1.5 1.5 0 0 1 12 2z" />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-white font-sans">
            inkwelly
          </span>
        </div>
      </div>

      {/* Centered Card */}
      <div className="relative w-full max-w-[440px] bg-white rounded-[22px] shadow-2xl shadow-emerald-950/60 overflow-hidden border border-white/20">
        {isSuccess ? successCard : formCard}
      </div>

      {/* Trouble Signing In & Help Box */}
      <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-[424px]">
        <div className="lg-help w-full">
          <div className="text-left">
            <div className="text-xs font-bold text-slate-200">Trouble signing in?</div>
            <div className="text-[11px] text-slate-400 mt-0.5">We usually reply within 5 minutes.</div>
          </div>
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-900/50 hover:bg-emerald-800/80 border border-emerald-700/50 text-xs font-semibold text-emerald-200 transition-colors"
          >
            <Phone className="size-3.5" />
            <span>Chat with us</span>
          </a>
        </div>

        {/* Footer Contact Details */}
        <div className="flex items-center gap-4 text-[11px] text-emerald-200/60 font-medium">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3" /> +91 92035 10698
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3" /> hello@inkwelly.com
          </span>
        </div>
      </div>
    </div>
  );
}
