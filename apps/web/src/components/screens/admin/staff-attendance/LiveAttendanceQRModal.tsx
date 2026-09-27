'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  RotateCw,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Wifi,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, getValidTokenOrRefresh } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface LiveAttendanceQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

// Fallback ring total before the server responds; the real value comes from the API.
const DEFAULT_QR_TTL_SECONDS = 120;

export function LiveAttendanceQRModal({
  open,
  onOpenChange,
  title = 'Live Attendance QR Code',
}: LiveAttendanceQRModalProps) {
  const queryClient = useQueryClient();
  const [qrSvg, setQrSvg] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_QR_TTL_SECONDS);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentScans, setRecentScans] = useState<Array<any>>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rotatingRef = useRef<boolean>(false);
  // Absolute expiry on the SERVER clock + the offset between server and device clocks,
  // so the countdown can't drift and rotation happens exactly when the QR dies.
  const qrExpiresAtRef = useRef<number>(0);
  // Total TTL reported by the server — the ring is drawn against this, so a server-side
  // TTL change doesn't need a matching client change.
  const qrTotalSecondsRef = useRef<number>(DEFAULT_QR_TTL_SECONDS);
  const serverOffsetRef = useRef<number>(0);
  const lastScanTimestampRef = useRef<number>(0);
  const scanPrimedRef = useRef<boolean>(false);
  const openRef = useRef<boolean>(false);
  const sessionRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const serverNow = useCallback(() => Date.now() + serverOffsetRef.current, []);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Web Audio chime on successful scan
  const playScanDing = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext not allowed or muted
    }
  }, []);

  // Fetch or generate active QR code
  const fetchActiveQR = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `/api/staff-attendance/qr/active${forceRefresh ? '?refresh=true' : ''}`
      );
      if (!res.ok) {
        toast.error('Failed to generate attendance QR code');
        return;
      }
      const data = await res.json();
      if (data.success && data.qrData) {
        // Sync the local countdown to the server clock
        if (typeof data.serverTime === 'number') {
          serverOffsetRef.current = data.serverTime - Date.now();
        }
        if (typeof data.totalSeconds === 'number') {
          qrTotalSecondsRef.current = data.totalSeconds;
        }
        if (typeof data.expiresAt === 'number') {
          qrExpiresAtRef.current = data.expiresAt;
          setSecondsLeft(Math.max(1, Math.ceil((data.expiresAt - serverNow()) / 1000)));
        } else {
          setSecondsLeft(data.remainingSeconds || qrTotalSecondsRef.current);
        }
        setCode(data.code || '');

        // Generate clean SVG string for crisp vector rendering
        const svgString = await QRCode.toString(data.qrData, {
          type: 'svg',
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrSvg(svgString);
      }
    } catch {
      toast.error('Network error loading QR code');
    } finally {
      setLoading(false);
    }
  }, [serverNow]);

  const handleStatus = useCallback(
    (data: any) => {
      if (typeof data.serverTime === 'number') {
        serverOffsetRef.current = data.serverTime - Date.now();
      }
      if (data.recentScans) {
        setRecentScans(data.recentScans);
      }

      const incomingTs = data.lastScan?.timestamp ?? 0;

      // First response of this kiosk session only records where we are — an old scan
      // must never ding or rotate the QR just because the modal was reopened.
      if (!scanPrimedRef.current) {
        scanPrimedRef.current = true;
        lastScanTimestampRef.current = incomingTs;
        return;
      }

      if (data.lastScan && incomingTs > lastScanTimestampRef.current) {
        lastScanTimestampRef.current = incomingTs;
        playScanDing();
        toast.success(`${data.lastScan.userName} marked ${data.lastScan.action} at ${data.lastScan.time}`);

        // Instantly refresh the admin table in the background so marked status turns green!
        queryClient.invalidateQueries({ queryKey: ['staff-attendance'] });

        // The token was burned by the teacher — mint a fresh one right away.
        if (!rotatingRef.current) {
          rotatingRef.current = true;
          fetchActiveQR(true).finally(() => {
            rotatingRef.current = false;
          });
        }
      }
    },
    [playScanDing, fetchActiveQR, queryClient]
  );

  // Long-poll: each request parks on the server until a teacher scans (or ~20s passes),
  // so a scan is seen instantly with a fraction of the requests.
  // `session` guarantees a stale loop (React StrictMode remount) can't keep polling.
  const statusLoop = useCallback(async (session: number) => {
    while (openRef.current && sessionRef.current === session) {
      // Never hold a request open for a screen nobody is looking at
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        await delay(5000);
        continue;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const url = `/api/staff-attendance/qr/status?since=${lastScanTimestampRef.current}&wait=20`;

      try {
        let res = await apiFetch(url, { signal: controller.signal });

        // The kiosk outlives the 15-minute access token — refresh silently, then retry once
        if (res.status === 401) {
          try {
            await getValidTokenOrRefresh();
          } catch {
            return; // session gone; forceLogout already redirected
          }
          res = await apiFetch(url, { signal: controller.signal });
        }

        if (res.ok) {
          handleStatus(await res.json());
        } else if (!controller.signal.aborted) {
          await delay(3000); // server hiccup — brief backoff, then poll again
        }
      } catch {
        // Aborted (modal closed) or the proxy cut the hold short
        if (!controller.signal.aborted) await delay(3000);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    }
  }, [handleStatus]);

  // Main lifecycle when dialog is open
  useEffect(() => {
    if (!open) return;

    // Fresh kiosk session: forget the previous session's scans
    const session = ++sessionRef.current;
    scanPrimedRef.current = false;
    lastScanTimestampRef.current = 0;
    openRef.current = true;

    fetchActiveQR();

    // 1s tick drives the countdown ring off the server expiry (no network calls)
    timerRef.current = setInterval(() => {
      if (qrExpiresAtRef.current === 0) return; // QR not loaded yet — keep the initial value
      const remainingMs = qrExpiresAtRef.current - serverNow();
      if (remainingMs <= 0) {
        setSecondsLeft(0);
        if (!rotatingRef.current) {
          rotatingRef.current = true;
          fetchActiveQR(true).finally(() => {
            rotatingRef.current = false;
          });
        }
      } else {
        setSecondsLeft(Math.max(1, Math.ceil(remainingMs / 1000)));
      }
    }, 1000);

    void statusLoop(session);

    // Screen unlocked / tab focused again: pick up any rotation we slept through
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void fetchActiveQR();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      openRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      queryClient.invalidateQueries({ queryKey: ['staff-attendance'] });
    };
  }, [open, fetchActiveQR, statusLoop, serverNow, queryClient]);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Backup code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const progressPercent = Math.min(100, (secondsLeft / qrTotalSecondsRef.current) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'p-0 overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 transition-[width,height,max-width,max-height,border-radius] duration-300 ease-out',
          isFullscreen
            ? '!fixed !z-50 !w-screen !h-screen !max-w-none !max-h-none !rounded-none flex flex-col justify-between overflow-y-auto'
            : 'sm:max-w-md md:max-w-lg max-h-[92vh] flex flex-col rounded-3xl'
        )}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-5 pb-3 sm:pb-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white relative shrink-0">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="size-8 sm:size-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                <QrCode className="size-4 sm:size-5 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight truncate">
                  <span className="hidden sm:inline">{title}</span>
                  <span className="sm:hidden">Attendance QR</span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Live attendance QR code for staff check-in
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 h-7.5 sm:h-8 w-7.5 sm:w-auto p-0 sm:px-2.5 rounded-xl text-xs gap-1.5 cursor-pointer border border-white/20 bg-white/10 shrink-0"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </Button>

              <Badge className="bg-white/15 hover:bg-white/20 text-white border-white/20 text-[10px] sm:text-[11px] font-semibold gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 shrink-0">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live Kiosk</span>
                <span className="sm:hidden">Live</span>
              </Badge>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="size-7.5 sm:size-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shrink-0"
                aria-label="Close dialog"
              >
                <X className="size-3.5 sm:size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Content: QR Code Card */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-3.5">
          <div className="flex flex-col items-center justify-center text-center">
            {/* QR Card Container */}
            <div className="relative p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute top-2 left-2 size-3.5 border-t-2 border-l-2 border-blue-600 dark:border-blue-400 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-2 right-2 size-3.5 border-t-2 border-r-2 border-blue-600 dark:border-blue-400 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-2 left-2 size-3.5 border-b-2 border-l-2 border-blue-600 dark:border-blue-400 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-2 right-2 size-3.5 border-b-2 border-r-2 border-blue-600 dark:border-blue-400 rounded-br-lg pointer-events-none" />

              {/* QR Image Box */}
              <div
                className={cn(
                  'bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden',
                  // Small devices keep the fixed sizes; fullscreen is a wall-mounted kiosk,
                  // so the QR scales with the viewport (capped) instead of freezing at md:size-96.
                  isFullscreen ? 'size-[min(72vmin,600px)]' : 'size-48 sm:size-56'
                )}
              >
                {loading && !qrSvg ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <RotateCw className="size-7 animate-spin text-blue-600" />
                    <span className="text-xs font-semibold">Generating Token...</span>
                  </div>
                ) : (
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                )}
              </div>

              {/* Rotating Expiry Countdown */}
              <div className="mt-2.5 flex items-center justify-center gap-2 w-full">
                <div className="relative size-5 shrink-0">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-zinc-700"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={secondsLeft <= 5 ? 'text-rose-500' : 'text-blue-600'}
                      strokeDasharray={`${progressPercent}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Auto-rotates in <strong className="text-blue-600 dark:text-blue-400">{secondsLeft}s</strong>
                </span>
              </div>
            </div>

            {/* 6-Digit Manual Backup Code */}
            <div className="mt-2.5 flex items-center gap-2 p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Backup Code:
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-widest text-slate-900 dark:text-zinc-100">
                {code ? `${code.slice(0, 3)} ${code.slice(3)}` : '------'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="size-6 sm:size-7 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Real-time Scan Feed */}
          {recentScans.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-2.5 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Recent Live Scans</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Live Feed</span>
              </div>
              <div className="space-y-1.5 max-h-20 overflow-y-auto">
                {recentScans.slice(0, 3).map((item, i) => (
                  <div
                    key={`${item.userId}-${item.timestamp}-${i}`}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {item.userName}
                      </span>
                    </div>
                    <Badge className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                      {item.action} &bull; {item.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Live session active</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActiveQR(true)}
              disabled={loading}
              className="rounded-xl text-xs font-semibold gap-1.5 h-8 px-3"
            >
              <RotateCw className={loading ? 'size-3.5 animate-spin' : 'size-3.5'} />
              <span>Regenerate</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
