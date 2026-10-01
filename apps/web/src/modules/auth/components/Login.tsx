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
    <div className="flex flex-col h-full">
      {/* Eyebrow */}
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
        SCHOOL PORTAL
      </p>

      {/* Headline */}
      <h2 className="text-xl font-bold text-slate-900 mb-1">
        Login to your account
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-slate-600 mb-5">
        Enter your credentials to access your school portal.
      </p>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3 xl:space-y-3.5 flex-1">
        <div className="space-y-1">
          <Label htmlFor="login-identifier" className="text-xs font-semibold text-slate-700">
            {loginMode === "email" ? "Email Address" : "School ID / Mobile Number"}
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {loginMode === "email" ? <Mail className="size-4" /> : <Phone className="size-4" />}
            </div>
            <Input
              id="login-identifier"
              type={loginMode === "email" ? "email" : "text"}
              placeholder={loginMode === "email" ? "Enter your email address" : "Enter School ID or phone"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-10 xl:h-11 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-400"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700">Password</Label>
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
              className="pl-10 pr-10 h-10 xl:h-11 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-400"
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
              className="size-3.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="remember-me" className="text-xs text-slate-600 cursor-pointer font-medium">Remember me</Label>
          </div>
          <button
            type="button"
            onClick={() => router.push("/reset-password")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 xl:h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-500/25 gap-2 transition-all cursor-pointer"
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin" /><span>Authenticating...</span></>
          ) : (
            <><span>Sign In</span><ArrowRight className="size-4" /></>
          )}
        </Button>

        <div className="relative my-1.5 py-0.5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-slate-400 font-semibold text-[11px] uppercase">OR</span></div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => { setLoginMode(loginMode === "email" ? "id" : "email"); setEmail(""); }}
          className="w-full h-9.5 xl:h-10.5 rounded-xl border-blue-200/80 bg-blue-50/40 hover:bg-blue-50/80 text-blue-600 font-semibold text-xs gap-2 transition-all cursor-pointer shadow-2xs"
        >
          {loginMode === "email" ? (
            <><Phone className="size-3.5" /><span>Login by School ID / Phone</span></>
          ) : (
            <><Mail className="size-3.5" /><span>Login by Email Address</span></>
          )}
        </Button>

        <div className="mt-2.5 rounded-xl bg-sky-50 border border-sky-100 p-2.5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Headphones className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 leading-tight">Need help?</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">Contact your school administration.</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center mt-2">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline text-blue-600 hover:text-blue-700">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline text-blue-600 hover:text-blue-700">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Centered card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Two-column grid: QR left, credentials right */}
        <div className="lg:grid lg:grid-cols-2">
          {/* Left column: Scan to sign in panel */}
          <div className="order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-slate-200 p-6 lg:p-8 xl:p-10">
            <ScanToSignInPanel />
          </div>

          {/* Right column: Credentials form */}
          <div className="order-1 lg:order-2 p-6 lg:p-8 xl:p-10">
            {renderCredentialsForm()}
          </div>
        </div>
      </div>
    </div>
  );
}
