"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAppStore, type UserRole } from "@/store/use-app-store";
import { setCookie } from "@/lib/cookies";
import { SESSION_EXPIRY_DAYS } from "@/store/app-store/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  Phone,
  School,
  ArrowRight,
  Headphones,
  Globe,
  ChevronDown,
  ChevronRight,
  Users,
  BookOpen,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { loginWithElysia, setRefreshToken } from "@/lib/api";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAppStore();

  const [loginMode, setLoginMode] = useState<"email" | "id">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

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
        const userData = data.user;
        const token = data.token;
        if (token) { localStorage.setItem("school_token", token); setCookie("school_token", token, SESSION_EXPIRY_DAYS); }
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        login({
          id: userData.id, name: userData.name, email: userData.email,
          role: userData.role as UserRole, avatar: userData.avatar,
          tenantId: userData.tenantId, tenantSlug: userData.tenantSlug,
          tenantName: userData.tenantName, tenantLogo: userData.tenantLogo || null,
          customRole: userData.customRole || null,
        });
        const tenantId = userData.tenantSlug || userData.tenantId;
        window.location.href = tenantId ? `/${tenantId}/dashboard` : "/dashboard";
        return `Welcome back, ${userData.name}!`;
      },
      error: (err: any) => { setLoading(false); return err.message || "Authentication failed"; },
    });

    try { await loginPromise; } catch { /* handled by toast */ } finally { setLoading(false); }
  };

  const renderForm = () => (
    <form onSubmit={handleLogin} className="space-y-3 xl:space-y-3.5">
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
        <ChevronRight className="size-4 text-slate-400 shrink-0" />
      </div>
    </form>
  );

  return (
    <div
      className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#d0ecff] text-slate-900 flex flex-col relative selection:bg-blue-500 selection:text-white overflow-x-hidden lg:overflow-hidden"
      suppressHydrationWarning
    >
      {/* Desktop background */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none select-none">
        <Image
          src="/assets/login-illustration-desktop.avif"
          alt="Scenic School Background"
          fill priority unoptimized
          className="object-cover object-top"
          sizes="100vw"
        />
      </div>

      {/* Mobile background */}
      <div className="lg:hidden fixed inset-0 z-0 pointer-events-none select-none bg-[#cbe9fe]">
        <Image
          src="/assets/loginmobile.avif"
          alt="School Mobile Background"
          fill priority unoptimized
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>

      {/* ─── MOBILE / TABLET ─── */}
      <div className="lg:hidden relative z-10 w-full min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6">

        {/* Brand Header */}
        <div className="w-full flex flex-col items-center text-center mt-2 sm:mt-4 mb-3 sm:mb-5">
          <div className="size-18 sm:size-22 md:size-24 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-[2.5px] sm:border-[3px] border-white bg-white shrink-0 mb-2 sm:mb-3">
            <Image src="/test.webp" alt="ParentLink School App" width={96} height={96} priority className="size-full object-cover scale-[1.28]" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-slate-900">School</span>
            <span className="text-blue-600">SaaS</span>
          </h1>
        </div>

        {/* Floating Card with Glassmorphic Frame */}
        <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] mx-auto mt-1 sm:mt-2 mb-3 sm:mb-4 rounded-[32px] sm:rounded-[36px] md:rounded-[40px] bg-white/35 backdrop-blur-md border border-white/60 shadow-xl shadow-sky-950/10 p-2 sm:p-2.5 md:p-3 pt-4 sm:pt-5 md:pt-6 pb-2.5 sm:pb-3 md:pb-3.5">
          {/* Heading displayed directly on the frosted glass */}
          <div className="text-center mb-2.5 sm:mb-3 md:mb-3.5">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Login to your account
            </h2>
          </div>

          {/* Foreground Card */}
          <div className="w-full rounded-[24px] sm:rounded-[28px] md:rounded-[30px] bg-white border border-slate-100 shadow-xl shadow-sky-950/10 px-4.5 sm:px-6 md:px-7 py-4 sm:py-5 md:py-6 backdrop-blur-xs">
            {renderForm()}
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

        {/* Mobile / Tablet Copyright Footer */}
        <footer className="w-full text-center pb-2 text-[10px] sm:text-xs text-white font-medium drop-shadow-sm shrink-0 mt-auto">
          © {new Date().getFullYear()} SchoolSaaS. All rights reserved.
        </footer>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="hidden lg:flex flex-col h-full relative z-10 w-full">
        {/* Header */}
        <header className="w-full px-8 lg:px-12 xl:px-16 2xl:pl-16 2xl:pr-8 pt-4 lg:pt-5 2xl:pt-6 flex items-center justify-end shrink-0">
          <div className="w-full max-w-[1920px] 2xl:max-w-none mx-auto flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8.5 2xl:h-9.5 px-3 2xl:px-4 rounded-full border-white/70 bg-white/90 text-xs 2xl:text-sm font-medium text-slate-700 gap-1.5 shadow-md hover:bg-white cursor-pointer">
                  <Globe className="size-3.5 2xl:size-4 text-slate-500" />
                  <span>{selectedLanguage}</span>
                  <ChevronDown className="size-3 2xl:size-3.5 text-slate-400 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl min-w-[120px]">
                <DropdownMenuItem onClick={() => setSelectedLanguage("English")} className="text-xs font-medium cursor-pointer">English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedLanguage("Urdu")} className="text-xs font-medium cursor-pointer">اردو (Urdu)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedLanguage("Arabic")} className="text-xs font-medium cursor-pointer">العربية (Arabic)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-stretch px-8 lg:px-12 xl:px-16 2xl:pl-16 2xl:pr-8 py-3 2xl:py-5 w-full min-h-0">
          <div className="w-full max-w-[1920px] 2xl:max-w-none mx-auto flex items-stretch justify-between gap-8 xl:gap-12 2xl:gap-16 relative">

            {/* Left — branding, features, stat card pinned to bottom on normal devices */}
            <div className="flex flex-col max-w-[480px] xl:max-w-[520px] 2xl:max-w-[560px] self-stretch pt-0">
              {/* Logo */}
              <div className="mb-4 2xl:mb-5">
                <div className="size-24 2xl:size-28 rounded-3xl 2xl:rounded-4xl overflow-hidden shadow-xl border-[3px] border-white bg-white shrink-0">
                  <Image src="/test.webp" alt="ParentLink School App" width={112} height={112} priority className="size-full object-cover scale-[1.28]" />
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-base lg:text-lg 2xl:text-xl font-bold text-slate-800 tracking-tight">Welcome to</h2>
              <h1 className="text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight mt-0.5">
                <span className="text-slate-900">School</span>
                <span className="text-blue-600">SaaS</span>
              </h1>

              {/* Feature Pills — glassmorphism */}
              <div className="flex items-center gap-2.5 2xl:gap-3 mt-4 2xl:mt-5 flex-wrap">
                <div className="flex items-center gap-2.5 2xl:gap-3 px-4 py-2 2xl:px-5 2xl:py-2.5 rounded-2xl bg-white/30 backdrop-blur-md border border-white/60 shadow-md shadow-black/5">
                  <div className="size-7 2xl:size-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs"><Users className="size-3.5 2xl:size-4" /></div>
                  <span className="text-xs 2xl:text-sm font-bold text-slate-800">Better Communication</span>
                </div>
                <div className="flex items-center gap-2.5 2xl:gap-3 px-4 py-2 2xl:px-5 2xl:py-2.5 rounded-2xl bg-white/30 backdrop-blur-md border border-white/60 shadow-md shadow-black/5">
                  <div className="size-7 2xl:size-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 shadow-xs"><BookOpen className="size-3.5 2xl:size-4" /></div>
                  <span className="text-xs 2xl:text-sm font-bold text-slate-800">Smarter Administration</span>
                </div>
                <div className="flex items-center gap-2.5 2xl:gap-3 px-4 py-2 2xl:px-5 2xl:py-2.5 rounded-2xl bg-white/30 backdrop-blur-md border border-white/60 shadow-md shadow-black/5">
                  <div className="size-7 2xl:size-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs"><ShieldCheck className="size-3.5 2xl:size-4" /></div>
                  <span className="text-xs 2xl:text-sm font-bold text-slate-800">Safer & More Organized</span>
                </div>
              </div>

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

            {/* Right — Outer Glassmorphic Card (vertically centered top to bottom, near plane on 2xl) */}
            <div className="w-full max-w-[390px] xl:max-w-[420px] 2xl:max-w-[450px] shrink-0 self-center 2xl:ml-auto 2xl:mr-14">
              <div className="relative w-full rounded-[38px] xl:rounded-[42px] bg-white/35 backdrop-blur-md border border-white/60 shadow-2xl shadow-sky-950/15 p-2.5 sm:p-3 pt-5 xl:pt-6 2xl:pt-7 pb-3 xl:pb-3.5 2xl:pb-4">
                {/* Heading displayed directly on the frosted glass */}
                <div className="text-center mb-3.5 xl:mb-4 2xl:mb-5">
                  <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-black tracking-tight text-slate-900">
                    Login to your account
                  </h2>
                </div>

                {/* Inner White Form Card */}
                <div className="rounded-[30px] bg-white border border-slate-200/70 shadow-xl shadow-slate-300/30 p-6 xl:p-7 2xl:p-8 w-full">
                  {renderForm()}
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
