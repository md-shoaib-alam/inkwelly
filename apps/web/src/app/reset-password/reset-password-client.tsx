'use client';

import { useState } from 'react';
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
        <CheckCircle2 className="size-8 text-emerald-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Email Sent!</h2>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-[260px]">
        A secure reset link has been sent to{' '}
        <span className="font-semibold text-slate-800">{email}</span>
      </p>
      <Button asChild className="w-full h-10 mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 gap-2 cursor-pointer">
        <Link href="/"><ArrowLeft className="size-4" />Return to Login</Link>
      </Button>
      <button
        type="button"
        onClick={() => setIsSuccess(false)}
        className="mt-3 text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
      >
        Didn't receive the email? Try again
      </button>
    </div>
  );

  /* ── Card: Form State ── */
  const formCard = (
    <div className="px-7 xl:px-8 py-8">
      {/* Mail icon centered */}
      <div className="flex justify-center mb-4">
        <div className="size-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
          <Mail className="size-6 text-blue-600" />
        </div>
      </div>

      {/* Title & subtitle centered */}
      <div className="text-center mb-5">
        <h2 className="text-xl xl:text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="reset-email" className="text-xs font-semibold text-slate-700">Email Address</Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="size-4" />
            </div>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email address"
              className="pl-10 h-10 xl:h-11 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Send Reset Link */}
        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full h-10 xl:h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-500/25 gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 className="size-4 animate-spin" /><span>Sending link…</span></>
          ) : (
            <span>Send Reset Link</span>
          )}
        </Button>
      </form>

      {/* OR divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-slate-400 font-semibold text-[11px] uppercase">OR</span></div>
      </div>

      {/* Reset via Phone */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 xl:h-11 rounded-xl border-blue-200/80 bg-white hover:bg-blue-50/50 text-blue-600 font-semibold text-xs gap-2 transition-all cursor-pointer shadow-2xs"
      >
        <Phone className="size-3.5" />
        <span>Reset via Phone</span>
      </Button>

      {/* Bottom sign in link */}
      <p className="mt-4 text-center text-xs text-slate-500">
        Remember your password?{' '}
        <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );

  return (
    <div
      className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#d0ecff] text-slate-900 flex flex-col relative selection:bg-blue-500 selection:text-white overflow-x-hidden lg:overflow-hidden"
      suppressHydrationWarning
    >
      {/* Desktop background */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none select-none">
        <Image src="/assets/login-illustration-desktop.avif" alt="School Background" fill priority unoptimized className="object-cover object-top" sizes="100vw" />
      </div>

      {/* Mobile background */}
      <div className="lg:hidden fixed inset-0 z-0 pointer-events-none select-none bg-[#cbe9fe]">
        <Image src="/assets/loginmobile.avif" alt="School Mobile Background" fill priority unoptimized className="object-cover object-bottom" sizes="100vw" />
      </div>

      {/* ─── MOBILE / TABLET ─── */}
      <div className="lg:hidden relative z-10 w-full min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6">
        {/* Top bar: return button at top-right */}
        <div className="w-full flex items-center justify-end shrink-0">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white/90 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/70 shadow-sm hover:text-blue-600 hover:bg-white transition-colors">
            <ArrowLeft className="size-3.5 sm:size-4" />
            Back to login
          </Link>
        </div>

        {/* Brand */}
        <div className="w-full flex flex-col items-center text-center mt-2 sm:mt-4 mb-3 sm:mb-5">
          <div className="size-18 sm:size-22 md:size-24 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-[2.5px] sm:border-[3px] border-white bg-white shrink-0 mb-2 sm:mb-3">
            <Image src="/test.webp" alt="ParentLink School App" width={96} height={96} priority className="size-full object-cover scale-[1.28]" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-slate-900">School</span>
            <span className="text-blue-600">SaaS</span>
          </h1>
        </div>

        {/* Card with Glassmorphic Backdrop Card */}
        <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] mx-auto mt-1 sm:mt-2 mb-3 sm:mb-4">
          {/* Glassmorphic card behind mobile card (subtle) */}
          <div className="absolute -inset-2 sm:-inset-2.5 rounded-[32px] sm:rounded-[36px] bg-white/30 backdrop-blur-md border border-white/60 shadow-xl shadow-sky-950/10 pointer-events-none" />

          {/* Foreground Card */}
          <div className="relative z-10 w-full rounded-[26px] sm:rounded-[30px] bg-white border border-slate-100 shadow-xl shadow-sky-950/10 backdrop-blur-xs overflow-hidden">
            {isSuccess ? successCard : formCard}
          </div>
        </div>

        {/* Tablet Stat Card (shown on tablet md screens, hidden on phone) */}
        <div className="hidden md:grid grid-cols-3 items-center divide-x divide-white/60 w-full max-w-[420px] rounded-2xl bg-white/35 backdrop-blur-md border border-white/60 shadow-lg shadow-black/10 py-3 px-2 mb-4">
          <div className="flex items-center justify-center gap-2 px-1.5">
            <div className="size-8 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs"><Users className="size-4" /></div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 leading-none">1000+</div>
              <div className="text-[10px] text-slate-600 mt-0.5 font-semibold truncate">Happy Students</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 px-1.5">
            <div className="size-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-xs"><School className="size-4" /></div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 leading-none">50+</div>
              <div className="text-[10px] text-slate-600 mt-0.5 font-semibold truncate">Schools Trust</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 px-1.5">
            <div className="size-8 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs"><Star className="size-4 fill-amber-400 text-amber-400" /></div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 leading-none">4.8</div>
              <div className="text-[10px] text-slate-600 mt-0.5 font-semibold truncate">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Bottom Spacer revealing school illustration */}
        <div className="w-full h-[80px] sm:h-[100px] md:h-[120px] pointer-events-none shrink-0" />

        {/* Mobile / Tablet Footer */}
        <footer className="w-full text-center pb-2 text-[10px] sm:text-xs text-white font-medium drop-shadow-sm shrink-0 mt-auto">
          © {new Date().getFullYear()} SchoolSaaS. All rights reserved.
        </footer>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="hidden lg:flex flex-col h-full relative z-10 w-full">
        {/* Header: return button at top-right */}
        <header className="w-full px-8 lg:px-12 xl:px-16 2xl:pl-16 2xl:pr-8 pt-4 lg:pt-5 2xl:pt-6 flex items-center justify-end shrink-0">
          <div className="w-full max-w-[1920px] 2xl:max-w-none mx-auto flex items-center justify-end">
            <Link href="/" className="group inline-flex items-center gap-1.5 text-xs 2xl:text-sm font-semibold text-slate-700 bg-white/90 px-4 2xl:px-5 py-2 2xl:py-2.5 rounded-full border border-white/70 shadow-md hover:text-blue-600 hover:bg-white transition-colors cursor-pointer">
              <ArrowLeft className="size-3.5 2xl:size-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to login
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-stretch px-8 lg:px-12 xl:px-16 2xl:pl-16 2xl:pr-8 py-3 2xl:py-5 w-full min-h-0">
          <div className="w-full max-w-[1920px] 2xl:max-w-none mx-auto flex items-stretch justify-between gap-8 xl:gap-12 2xl:gap-16 relative">

            {/* Left — info panel & stat card */}
            <div className="flex flex-col max-w-[480px] xl:max-w-[520px] 2xl:max-w-[560px] self-stretch pt-0">
              {/* Logo */}
              <div className="mb-4 2xl:mb-5">
                <div className="size-24 2xl:size-28 rounded-3xl 2xl:rounded-4xl overflow-hidden shadow-xl border-[3px] border-white bg-white shrink-0">
                  <Image src="/test.webp" alt="ParentLink School App" width={112} height={112} priority className="size-full object-cover scale-[1.28]" />
                </div>
              </div>

              <h2 className="text-base lg:text-lg 2xl:text-xl font-bold text-slate-800 tracking-tight">Welcome to</h2>
              <h1 className="text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight mt-0.5">
                <span className="text-slate-900">School</span>
                <span className="text-blue-600">SaaS</span>
              </h1>

              {/* Stat Card — pinned to bottom, glassmorphism (shown on normal devices, hidden on 2xl) */}
              <div className="2xl:hidden flex items-center gap-6 xl:gap-7 px-6 xl:px-7 py-3.5 xl:py-4 rounded-2xl bg-white/30 backdrop-blur-md border border-white/60 shadow-lg shadow-black/10 w-fit mt-auto mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Users className="size-5" /></div>
                  <div>
                    <div className="text-sm font-black text-slate-900 leading-none">1000+</div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">Happy Students</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/60" />
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><School className="size-5" /></div>
                  <div>
                    <div className="text-sm font-black text-slate-900 leading-none">50+</div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">Schools Trust Us</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/60" />
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0 shadow-sm"><Star className="size-5 fill-amber-400 text-amber-400" /></div>
                  <div>
                    <div className="text-sm font-black text-slate-900 leading-none">4.8</div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">User Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Forgot Password Card (vertically centered top to bottom, near plane on 2xl) */}
            <div className="w-full max-w-[390px] xl:max-w-[420px] 2xl:max-w-[450px] shrink-0 self-center 2xl:ml-auto 2xl:mr-14">
              <div className="relative w-full">
                {/* Glassmorphism card behind forgot password card (decreased height) */}
                <div className="absolute -top-4 -bottom-4 -left-2.5 -right-2.5 xl:-top-5 xl:-bottom-5 2xl:-top-6 2xl:-bottom-6 xl:-left-3 xl:-right-3 rounded-[36px] xl:rounded-[38px] bg-white/35 backdrop-blur-md border border-white/60 shadow-2xl shadow-sky-950/15 pointer-events-none" />

                {/* Foreground Forgot Password Card */}
                <div className="relative z-10 rounded-[32px] bg-white border border-slate-200/70 shadow-xl shadow-slate-300/30 w-full overflow-hidden">
                  {isSuccess ? successCard : formCard}
                </div>
              </div>
            </div>

            {/* Stat Card — pinned to bottom-right on 2xl+ screens only with crisp white background */}
            <div className="hidden 2xl:flex absolute bottom-1 2xl:bottom-2 right-0 items-center gap-6 xl:gap-7 2xl:gap-8 px-6 xl:px-7 2xl:px-8 py-3.5 xl:py-4 rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-900/10 w-fit">
              <div className="flex items-center gap-3">
                <div className="size-10 2xl:size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs"><Users className="size-5 2xl:size-5.5" /></div>
                <div>
                  <div className="text-sm 2xl:text-base font-black text-slate-900 leading-none">1000+</div>
                  <div className="text-xs 2xl:text-sm text-slate-500 mt-0.5 font-medium">Happy Students</div>
                </div>
              </div>
              <div className="h-8 2xl:h-9 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="size-10 2xl:size-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs"><School className="size-5 2xl:size-5.5" /></div>
                <div>
                  <div className="text-sm 2xl:text-base font-black text-slate-900 leading-none">50+</div>
                  <div className="text-xs 2xl:text-sm text-slate-500 mt-0.5 font-medium">Schools Trust Us</div>
                </div>
              </div>
              <div className="h-8 2xl:h-9 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="size-10 2xl:size-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs"><Star className="size-5 2xl:size-5.5 fill-amber-400 text-amber-400" /></div>
                <div>
                  <div className="text-sm 2xl:text-base font-black text-slate-900 leading-none">4.8</div>
                  <div className="text-xs 2xl:text-sm text-slate-500 mt-0.5 font-medium">User Satisfaction</div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-2 2xl:py-3 text-[10px] 2xl:text-xs text-white/80 shrink-0">
          © {new Date().getFullYear()} SchoolSaaS. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
