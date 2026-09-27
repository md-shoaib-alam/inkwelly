'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  QrCode,
  Camera,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface TeacherQRScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess?: () => void;
  todayStr: string;
}

const READER_ELEMENT_ID = 'teacher-qr-reader';

export function TeacherQRScanModal({
  open,
  onOpenChange,
  onScanSuccess,
  todayStr,
}: TeacherQRScanModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'code'>('camera');
  const [manualCode, setManualCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    userName: string;
    action: string;
    time: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const shouldBeRunningRef = useRef<boolean>(false);

  // Process the QR token payload or 6-digit code with backend
  const handleVerify = useCallback(
    async (payload: { qrData?: string; code?: string }) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const res = await apiFetch('/api/staff-attendance/qr/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            date: todayStr,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Trigger light haptic vibration if supported
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 60, 40]);
          }

          setScanResult({
            userName: data.userName,
            action: data.action === 'check_in' ? 'Checked In' : 'Checked Out',
            time: data.time,
          });

          toast.success(data.action === 'check_in' ? 'Attendance marked successfully' : 'Checked out successfully', {
            description: `Time: ${data.time} (IST)`,
          });

          onScanSuccess?.();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('schoolsaas_attendance_updated'));
          }
        } else {
          const rawErr = data.error || 'Failed to record attendance via QR code';
          const isAlreadyMarked =
            data.code === 'ATTENDANCE_ALREADY_MARKED' ||
            rawErr.toLowerCase().includes('attendance is already marked') ||
            rawErr.toLowerCase().includes('already checked in');

          const cleanMsg = isAlreadyMarked
            ? 'Your attendance is already marked for today.'
            : rawErr;
          toast.error(cleanMsg);
          // Re-enable camera scanning after brief delay if error
          setTimeout(() => {
            setIsSubmitting(false);
          }, 1500);
          return;
        }
      } catch {
        toast.error('Network error scanning QR code');
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, todayStr, onScanSuccess]
  );

  const handleVerifyRef = useRef(handleVerify);
  handleVerifyRef.current = handleVerify;

  // Explicitly kill all active video/audio tracks in the DOM so the browser shuts off camera hardware
  const killMediaTracks = useCallback(() => {
    try {
      const container = document.getElementById(READER_ELEMENT_ID);
      if (container) {
        const videos = container.querySelectorAll('video');
        videos.forEach((video) => {
          // Neutralize html5-qrcode's internal onabort/onerror listeners so stopping doesn't throw
          video.onabort = null;
          video.onerror = null;
          video.onpause = null;

          const stream = video.srcObject as MediaStream | null;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
                track.enabled = false;
              } catch {}
            });
          }
          video.srcObject = null;
        });
      }
    } catch {}
  }, []);

  // Stop camera helper - instantly releases media tracks and camera hardware
  const stopCamera = useCallback(async () => {
    try {
      const container = document.getElementById(READER_ELEMENT_ID);
      if (container) {
        container.querySelectorAll('video').forEach((video) => {
          video.onabort = null;
          video.onerror = null;
          video.onpause = null;
        });
      }
    } catch {}

    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {}
      try {
        scanner.clear();
      } catch {}
    }
    killMediaTracks();
    setCameraStarted(false);
  }, [killMediaTracks]);

  // Start camera helper
  const startCamera = useCallback(async () => {
    if (!shouldBeRunningRef.current) return;
    setCameraError(null);

    try {
      // Ensure any old instance and media stream is completely terminated
      await stopCamera();

      // Check if user closed modal while awaiting previous stop
      if (!shouldBeRunningRef.current) return;

      const container = document.getElementById(READER_ELEMENT_ID);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(READER_ELEMENT_ID);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxEdge = Math.floor(minEdge * 0.75);
          return {
            width: Math.min(qrboxEdge, 250),
            height: Math.min(qrboxEdge, 250),
          };
        },
        aspectRatio: 1.0,
      };

      // Auto-detect cameras: phones use back/rear camera; laptops/PCs use built-in webcam
      let cameraConfig: any = { facingMode: 'environment' };
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCam = devices.find((d) => /back|rear|environment/i.test(d.label));
          cameraConfig = backCam ? backCam.id : devices[0].id;
        }
      } catch {
        cameraConfig = { facingMode: 'environment' };
      }

      await html5QrCode.start(
        cameraConfig,
        config,
        async (decodedText) => {
          // On QR code detected, stop camera immediately before processing
          shouldBeRunningRef.current = false;
          await stopCamera();
          handleVerifyRef.current({ qrData: decodedText });
        },
        () => {
          // Frame scanner callback
        }
      );

      // If user closed the modal while camera was initializing
      if (!shouldBeRunningRef.current) {
        await stopCamera();
        return;
      }

      setCameraStarted(true);
    } catch (err: any) {
      if (!shouldBeRunningRef.current) return;
      console.warn('Camera start error:', err);
      setCameraError(
        err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings or use the 6-digit code below.'
          : 'Unable to start camera on this device. You can enter the 6-digit code displayed on the screen.'
      );
      setCameraStarted(false);
    }
  }, [stopCamera, killMediaTracks]);

  // Manage camera lifecycle based on modal open state and active tab
  useEffect(() => {
    if (open && activeTab === 'camera' && !scanResult) {
      shouldBeRunningRef.current = true;
      const timer = setTimeout(() => {
        startCamera();
      }, 250);
      return () => {
        clearTimeout(timer);
        shouldBeRunningRef.current = false;
        stopCamera();
      };
    } else {
      shouldBeRunningRef.current = false;
      stopCamera();
    }
  }, [open, activeTab, scanResult, startCamera, stopCamera]);

  // Immediate cleanup when open changes to false or on unmount
  useEffect(() => {
    if (!open) {
      shouldBeRunningRef.current = false;
      setScanResult(null);
      setManualCode('');
      setCameraError(null);
      stopCamera();
    }
    return () => {
      shouldBeRunningRef.current = false;
      try {
        const container = document.getElementById(READER_ELEMENT_ID);
        if (container) {
          container.querySelectorAll('video').forEach((v) => {
            v.onabort = null;
            v.onerror = null;
            v.onpause = null;
          });
        }
      } catch {}
      killMediaTracks();
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, [open, stopCamera, killMediaTracks]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Please enter the 6-digit code from the attendance screen');
      return;
    }
    handleVerify({ code: manualCode.trim().replace(/\s+/g, '') });
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      shouldBeRunningRef.current = false;
      stopCamera();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-md p-0 overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 sm:size-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                <QrCode className="size-4 sm:size-5 text-white" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white leading-tight">
                Scan Attendance QR
              </DialogTitle>
              <DialogDescription className="sr-only">
                Scan live school attendance QR code
              </DialogDescription>
            </div>

            {/* Right Side: Close Cross Button */}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="size-7 sm:size-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shrink-0"
              aria-label="Close dialog"
            >
              <X className="size-3.5 sm:size-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          {!scanResult && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/20 backdrop-blur-md mt-3">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Camera className="size-3.5" />
                <span>Camera Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <KeyRound className="size-3.5" />
                <span>6-Digit Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          {scanResult ? (
            /* Success State */
            <div className="py-6 text-center space-y-4">
              <div className="size-16 sm:size-18 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                <CheckCircle2 className="size-9 sm:size-10 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  {scanResult.action} Confirmed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Recorded for <strong className="text-slate-800 dark:text-zinc-200">{scanResult.userName}</strong>
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <Clock className="size-4" />
                <span>Time: {scanResult.time} (IST)</span>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => handleClose(false)}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm h-10 shadow-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* Camera Scanner Tab */
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-200 dark:border-zinc-800 aspect-square flex items-center justify-center">
                {/* HTML5 QR Code Mount Element */}
                <div id={READER_ELEMENT_ID} className="w-full h-full" />

                {/* Viewfinder Overlay Frame */}
                {cameraStarted && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="size-48 sm:size-52 rounded-2xl border-2 border-dashed border-blue-400/90 shadow-2xl relative">
                      <div className="absolute top-0 left-0 size-4 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 size-4 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 size-4 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 size-4 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                    </div>
                  </div>
                )}

                {/* Camera Loading or Error Overlay */}
                {!cameraStarted && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-900/80">
                    <Loader2 className="size-8 animate-spin text-blue-500" />
                    <span className="text-xs font-semibold">Starting camera...</span>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center bg-slate-900 text-slate-300 gap-2.5">
                    <AlertCircle className="size-8 text-amber-400 shrink-0" />
                    <p className="text-xs leading-relaxed text-slate-300">{cameraError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('code')}
                      className="rounded-xl text-xs font-semibold mt-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      <KeyRound className="size-3.5 mr-1" />
                      Use 6-Digit Code Instead
                    </Button>
                  </div>
                )}

                {isSubmitting && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white gap-2 backdrop-blur-xs">
                    <Loader2 className="size-9 animate-spin text-emerald-400" />
                    <span className="text-xs font-bold">Verifying Token...</span>
                  </div>
                )}
              </div>

              <p className="text-center text-[11px] text-slate-500 dark:text-zinc-400">
                Hold phone steady over the QR code on the admin screen
              </p>
            </div>
          ) : (
            /* 6-Digit Manual Code Tab */
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5 text-center">
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Enter the 6-digit code shown beneath the QR code:
                </p>
                <Input
                  type="text"
                  maxLength={7}
                  placeholder="e.g. 849 201"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="h-12 text-center text-xl sm:text-2xl font-mono tracking-widest font-black rounded-2xl"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || manualCode.trim().length < 6}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm gap-1.5 shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="size-3.5" />
                    <span>Punch In with Code</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
