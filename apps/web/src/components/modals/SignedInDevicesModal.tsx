'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Monitor, Smartphone, ShieldCheck, LogOut, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { listSessions, revokeAllSessions, revokeSession, type SignedInDevice } from '@/lib/api';

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
  const days = Math.floor(ms / 86_400_000);
  return days === 1 ? '1 d ago' : `${days} d ago`;
}

function DeviceIcon({ device, browser }: { device: string; browser: string }) {
  const isMobile = /android|iphone|ipad|mobile/i.test(device) || /safari|chrome/i.test(browser) && /mobile/i.test(device);
  return isMobile ? <Smartphone className="size-5 text-slate-500" /> : <Monitor className="size-5 text-slate-500" />;
}

export function SignedInDevicesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [devices, setDevices] = useState<SignedInDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDevices(await listSessions());
    } catch (err) {
      toast.error((err as Error).message || 'Could not load your signed-in devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);

  const revokeOne = async (d: SignedInDevice) => {
    setBusy(d.id);
    try {
      const { revoked } = await revokeSession(d.id);
      if (revoked === 0) toast.error('That device is no longer signed in');
      else if (d.current) toast.success('This browser will be signed out within 15 minutes');
      else toast.success('Device signed out');
      await refresh();
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign that device out');
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    setBusy('all');
    try {
      await revokeAllSessions();
      onOpenChange(false);
      window.location.href = '/login';
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign out your devices');
      setBusy(null);
    }
  };

  const currentDevice = devices.find(d => d.current);
  const activeCount = devices.length;
  const lastSignIn = currentDevice ? timeAgo(currentDevice.signedInAt) : '—';
  const thisDeviceLabel = currentDevice ? `${currentDevice.browser} on ${currentDevice.device}` : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-slate-900">Security & devices</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Review where you're signed in and manage your account security.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Card */}
        <div className="mx-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Your account is secure</p>
              <p className="text-xs text-slate-500">Nothing needs your attention right now.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Active devices</p>
              <p className="text-lg font-semibold text-slate-900">{activeCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Last sign-in</p>
              <p className="text-lg font-semibold text-slate-900">{lastSignIn}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">This device</p>
              <p className="text-base font-semibold text-slate-900 truncate">{thisDeviceLabel}</p>
            </div>
          </div>
        </div>

        {/* Active Devices Section */}
        <div className="px-6 pb-6">
          {loading && devices.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
          ) : devices.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">No devices are signed in.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Active devices</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{activeCount} active</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium"
                  disabled={busy !== null || activeCount <= 1}
                  onClick={() => void revokeAll()}
                >
                  {busy === 'all' ? <Loader2 className="mr-1 size-3 animate-spin" /> : <LogOut className="mr-1 size-3" />}
                  Log out other devices
                </Button>
              </div>

              <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
                {devices.map((d) => (
                  <li
                    key={d.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      d.current
                        ? 'border-amber-400 bg-amber-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <DeviceIcon device={d.device} browser={d.browser} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {d.browser} · {d.device}
                        </p>
                        {d.current && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                            <ShieldCheck className="size-2.5" /> This device
                          </span>
                        )}
                        {d.isShared && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <QrCode className="size-2.5" /> Scanned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.ip ?? 'no address'} · {timeAgo(d.lastSeenAt)}
                      </p>
                    </div>
                    {!d.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium"
                        disabled={busy !== null}
                        onClick={() => void revokeOne(d)}
                      >
                        {busy === d.id ? <Loader2 className="size-3.5 animate-spin" /> : 'Log out'}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
