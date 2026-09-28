"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAppStore } from "@/store/use-app-store";
import { LogOut } from "lucide-react";

export function NotFoundScreen() {
  const { push } = useRouter();
  const { logout, isLoggedIn } = useAppStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const goHome = () => {
    push("/");
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between py-12 px-6 bg-[#FDF3D8] dark:bg-[#141310] transition-colors duration-300">
      
      {/* Top Section: Recreated Premium Logo */}
      <div className="w-full flex justify-center animate-[fade-down_0.8s_ease-out_forwards]">
        <div className="relative w-64 h-20 transition-transform duration-300 hover:scale-102">
          <Image
            src="/logo.svg"
            alt="School Aura Logo"
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            className="object-contain dark:invert-[0.05]"
            priority
          />
        </div>
      </div>

      {/* Middle Section: SVG Illustration */}
      <div className="flex-1 flex items-center justify-center my-8 w-full max-w-4xl animate-[scale-in_0.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        <div className="relative w-full aspect-[300/108] max-h-[55vh]">
          <Image
            src="/404 page.svg"
            alt="404 - Page Not Found"
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Bottom Section: Action Buttons */}
      <div className="w-full flex flex-col items-center gap-6 animate-[fade-up_0.8s_ease-out_0.2s_forwards] opacity-0">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={goHome}
            className="bg-[#FAA21B] hover:bg-[#E08D10] text-[#412137] dark:text-[#25101E] font-bold text-sm sm:text-base py-3 px-10 rounded-full shadow-[0_4px_14px_rgba(250,162,27,0.35)] hover:shadow-[0_6px_20px_rgba(250,162,27,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Back to Home
          </button>

          {mounted && isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-sm py-3 px-8 rounded-full border border-zinc-200 dark:border-zinc-800 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          )}
        </div>

        {/* Subtle Supporting Footer Text */}
        <p className="text-xs font-medium text-[#BD695B] dark:text-[#A8584B] tracking-wide">
          School Aura OS &middot; If you think this is an error, please contact your administrator.
        </p>
      </div>

      {/* Inline styles for modern micro-animations */}
      <style>{`
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
