'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { listSessions, revokeAllSessions, revokeSession, type SignedInDevice } from '@/lib/api';

function remaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours} hours`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
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
      // denyAllRefreshTokens bumps users.updatedAt, which invalidates access tokens
      // immediately — this browser really is signed out now.
      window.location.href = '/login';
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign out your devices');
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Signed-in devices</DialogTitle>
          <DialogDescription>
            Every machine signed in to this account. Signing one out stops it renewing; the
            session it already holds ends within 15 minutes.
          </DialogDescription>
        </DialogHeader>

        {loading && devices.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
        ) : devices.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">No other devices are signed in.</p>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {devices.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {d.browser} · {d.device}{d.current ? ' — this device' : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.ip ?? 'no address'} · signed in {new Date(d.signedInAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">last seen {new Date(d.lastSeenAt).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">
                    {d.isShared ? 'Shared computer · ' : ''}expires in {remaining(d.expiresAt)}
                    {d.known ? '' : ' · recorded before device tracking'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-red-600"
                  disabled={busy !== null}
                  onClick={() => void revokeOne(d)}
                >
                  {busy === d.id
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : d.current ? 'Sign out of this browser' : 'Sign out'}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {devices.length > 0 && (
          <Button variant="outline" className="text-red-600" disabled={busy !== null} onClick={() => void revokeAll()}>
            {busy === 'all' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Sign out of all devices
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
