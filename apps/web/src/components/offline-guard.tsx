"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RotateCw } from "lucide-react";

interface OfflineGuardProps {
  children: React.ReactNode;
}

export function OfflineGuard({ children }: OfflineGuardProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Set initial connection state
    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    // Simulate connection check or ping server
    try {
      await fetch("/api/ping", { method: "HEAD", cache: "no-store" }).catch(() => {});
      if (typeof window !== "undefined") {
        setIsOffline(!window.navigator.onLine);
      }
    } catch (_) {
      // Ignore
    } finally {
      // brief delay to show animation
      setTimeout(() => {
        setIsChecking(false);
      }, 500);
    }
  };

  return (
    <>
      {children}
      {isOffline && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl transition-all duration-300">
            {/* Ambient Background Glow behind the card */}
            <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-30 blur-lg" />

            {/* Offline Icon Wrapper */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <WifiOff className="h-10 w-10 text-red-500 animate-pulse" />
            </div>

            {/* Text details */}
            <h2 className="mb-3 text-2xl font-black tracking-tight text-foreground">
              Connection Lost
            </h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>

            {/* Retry Button */}
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-500 px-6 font-bold text-white transition-all hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
            >
              {isChecking ? (
                <RotateCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
