"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  Phone,
  ArrowRight,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { loginWithElysia } from "@/lib/api";
import { applySession } from "../lib/apply-session";
import { ScanToSignInPanel } from "./ScanToSignInPanel";

export function LoginScreen() {
  const router = useRouter();

  const [loginMode, setLoginMode] = useState<"email" | "id">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("remembered_login_identifier");
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = email.trim();

    if (!identifier || !password.trim()) {
      toast.error(
        loginMode === "email"
          ? "Please enter your Email address and password"
          : "Please enter your School ID/Phone and password"
      );
      return;
    }

    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    if (loginMode === "id" && isEmailFormat) { toast.error("Invalid School ID or Phone format"); return; }
    if (loginMode === "email" && !isEmailFormat) { toast.error("Please enter a valid email address."); return; }

    setLoading(true);

    if (typeof window !== "undefined") {
      if (rememberMe) localStorage.setItem("remembered_login_identifier", identifier);
      else localStorage.removeItem("remembered_login_identifier");
    }

    const loginPromise = loginWithElysia(identifier, password.trim());

    toast.promise(loginPromise, {
      loading: "Authenticating...",
      success: (data) => {
        applySession(data);
        return `Welcome back, ${data.user.name}!`;
      },
      error: (err: any) => { setLoading(false); return err.message || "Authentication failed"; },
    });

    try { await loginPromise; } catch { /* handled by toast */ } finally { setLoading(false); }
  };

  const renderCredentialsForm = () => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Eyebrow */}
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b97f1f] mb-1">
          SCHOOL PORTAL
        </p>

        {/* Headline */}
        <h2 className="text-2xl font-black text-[#14312a] mb-1 tracking-tight">
          Welcome <span className="text-[#b97f1f]">back.</span>
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-[#4c5f58] mb-5 leading-relaxed">
          Enter your credentials to access your school portal.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5 flex-1">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="login-identifier" className="text-xs font-semibold text-[#14312a]">
              {loginMode === "email" ? "Email Address" : "Mobile number / School ID"}
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {loginMode === "email" ? <Mail className="size-4" /> : <Phone className="size-4" />}
              </div>
              <Input
                id="login-identifier"
                type={loginMode === "email" ? "email" : "text"}
                placeholder={loginMode === "email" ? "Enter your email address" : "10-digit number or ID"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 text-xs sm:text-sm bg-[#faf7ed]/50 border-[#14312a24] rounded-xl focus-visible:ring-2 focus-visible:ring-amber-500 placeholder:text-slate-400 text-[#14312a]"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="login-password" className="text-xs font-semibold text-[#14312a]">Password</Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="size-4" />
              </div>
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 text-xs sm:text-sm bg-[#faf7ed]/50 border-[#14312a24] rounded-xl focus-visible:ring-2 focus-visible:ring-amber-500 placeholder:text-slate-400 text-[#14312a]"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
                className="size-3.5 rounded border-slate-300 data-[state=checked]:bg-[#b97f1f] data-[state=checked]:border-[#b97f1f]"
              />
              <Label htmlFor="remember-me" className="text-xs text-[#4c5f58] cursor-pointer font-medium">Remember me</Label>
            </div>
            <button
              type="button"
              onClick={() => router.push("/reset-password")}
              className="text-xs font-semibold text-[#b97f1f] hover:text-[#976413] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary Gold Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn gold w-full h-[49px] flex items-center justify-center gap-2 text-[15px] font-bold mt-4"
          >
            {loading ? (
              <><Loader2 className="size-4.5 animate-spin" /><span>Authenticating...</span></>
            ) : (
              <><span>Sign In</span><ArrowRight className="size-4.5" /></>
            )}
          </button>

          <div className="relative my-2 py-0.5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/80" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-slate-400 font-bold text-[10px] tracking-wider uppercase">OR</span></div>
          </div>

          {/* Ghost Secondary Button */}
          <button
            type="button"
            onClick={() => { setLoginMode(loginMode === "email" ? "id" : "email"); setEmail(""); }}
            className="btn ghost w-full h-[46px] flex items-center justify-center gap-2 text-[14px] font-semibold"
          >
            {loginMode === "email" ? (
              <><Phone className="size-4" /><span>Login by School ID / Phone</span></>
            ) : (
              <><Mail className="size-4" /><span>Login by Email Address</span></>
            )}
          </button>

          <p className="text-[11.5px] text-slate-500 text-center mt-3">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="font-semibold text-[#b97f1f] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-[#b97f1f] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="inkwelly-login selection:bg-teal-500 selection:text-white">
      {/* Top Brand Logo Header */}
      <div className="mb-6 flex items-center justify-center gap-2 select-none">
        {/* Inkwelly icon mark (asterisk / flower badge) */}
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

      {/* Centered Split Card (780px wide on desktop, 370px on mobile) */}
      <div className="lg-card-split relative w-full max-w-[780px] bg-white rounded-[22px] shadow-2xl shadow-emerald-950/60 overflow-hidden border border-white/20">
        {/* Two-column layout (stacks credentials first on mobile, then OR divider, then QR panel) */}
        <div className="flex flex-col lg:grid lg:grid-cols-[356px_1fr] relative">
          {/* Left panel on desktop / Bottom panel on mobile: Scan to sign in */}
          <aside className="lg-qr-panel order-2 lg:order-1 relative">
            <ScanToSignInPanel />
          </aside>

          {/* Central OR divider circle badge (positioned centrally between columns on desktop, and between stacked cards on mobile) */}
          <div className="lg:absolute left-[356px] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center pointer-events-none self-center -my-4 lg:my-0">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              OR
            </span>
          </div>

          {/* Right panel on desktop / Top panel on mobile: Credentials form (lg-form-col) */}
          <section className="lg-form-col order-1 lg:order-2">
            {renderCredentialsForm()}
          </section>
        </div>
      </div>

      {/* Trouble Signing In & Help Box matching div.lg-help */}
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
