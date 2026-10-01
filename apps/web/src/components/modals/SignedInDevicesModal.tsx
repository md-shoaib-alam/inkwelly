import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Monitor, Smartphone, ShieldCheck, LogOut, QrCode, KeyRound, User, HelpCircle, X, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { listSessions, revokeAllSessions, revokeSession, type SignedInDevice } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
  const days = Math.floor(ms / 86_400_000);
  return days === 1 ? '1 d ago' : `${days} d ago`;
}

function DeviceIcon({ device }: { device: string }) {
  return device === 'Mobile'
    ? <Smartphone className="size-5 text-[#8c6b2d]" />
    : <Monitor className="size-5 text-[#8c6b2d]" />;
}

export function SignedInDevicesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'help'>('security');
  const [devices, setDevices] = useState<SignedInDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Confirmation dialog state: target device or 'all'
  const [confirmTarget, setConfirmTarget] = useState<SignedInDevice | 'all' | null>(null);

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

  // eslint-disable-next-line
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
      setConfirmTarget(null);
    }
  };

  const revokeAll = async () => {
    setBusy('all');
    try {
      await revokeAllSessions();
      setConfirmTarget(null);
      onOpenChange(false);
      window.location.href = '/login';
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign out your devices');
      setBusy(null);
      setConfirmTarget(null);
    }
  };

  const currentDevice = devices.find(d => d.current);
  const activeCount = devices.length;
  const lastSignIn = currentDevice ? timeAgo(currentDevice.signedInAt) : '—';
  const thisDeviceLabel = currentDevice ? `${currentDevice.browser} on ${currentDevice.os}` : '—';
  const otherDevicesCount = devices.filter(d => !d.current).length;

  const userInitials = (currentUser?.name || 'Shoaib')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="iwp-layer iwp-modal" showCloseButton={false}>
          <DialogTitle className="sr-only">Security & devices</DialogTitle>
          <DialogDescription className="sr-only">
            Review where you're signed in and manage your account security.
          </DialogDescription>

          {/* Left Dark Emerald Sidebar (iwp-modal-side) */}
          <aside className="iwp-modal-side">
            {/* User Profile Badge */}
            <div className="iwp-user-badge">
              <div className="iwp-user-avatar">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="size-full rounded-full object-cover" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="iwp-user-name truncate">{currentUser?.name || 'Shoaib'}</div>
                <div className="iwp-user-role">{currentUser?.role || 'ACCOUNT'}</div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="iwp-side-nav">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`iwp-side-tab ${activeTab === 'profile' ? 'is-active' : ''}`}
              >
                <User className="size-4 shrink-0" />
                <span>Edit profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`iwp-side-tab ${activeTab === 'security' ? 'is-active' : ''}`}
              >
                <ShieldCheck className="size-4 shrink-0" />
                <span>Security & devices</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('help')}
                className={`iwp-side-tab ${activeTab === 'help' ? 'is-active' : ''}`}
              >
                <HelpCircle className="size-4 shrink-0" />
                <span>Help & feedback</span>
              </button>
            </nav>
          </aside>

          {/* Right White Content Area (iwp-modal-main) */}
          <main className="iwp-modal-main">
            {/* Close Button matching inspector: button.iwp-close (38px x 38px) */}
            <button
              type="button"
              className="iwp-close"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* Security Pane (div.iwp-pane[data-pane="security"]) */}
            <div className="iwp-pane" data-pane="security">
              {/* Header */}
              <div className="iwp-pane-header">
                <h2 className="iwp-pane-title">Security & devices</h2>
                <p className="iwp-pane-desc">Review where you're signed in and manage your account security.</p>
              </div>

              {/* Security Status Summary Card (div.iwp-security-card) */}
              <div className="iwp-security-card">
                <div className="iwp-status">
                  <div className="iwp-security-shield">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Your account is secure</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Nothing needs your attention right now.</p>
                  </div>
                </div>

                <div className="iwp-metrics-row">
                  <div className="iwp-stat">
                    <div className="iwp-metric-label">ACTIVE DEVICES</div>
                    <div className="iwp-metric-val">{activeCount}</div>
                  </div>
                  <div className="iwp-stat">
                    <div className="iwp-metric-label">LAST SIGN-IN</div>
                    <div className="iwp-metric-val">{lastSignIn}</div>
                  </div>
                  <div className="iwp-stat">
                    <div className="iwp-metric-label">THIS DEVICE</div>
                    <div className="iwp-metric-val truncate">{thisDeviceLabel}</div>
                  </div>
                </div>
              </div>

              {/* Transaction PIN Section (iwp-pin-card) */}
              <div className="iwp-pin-card">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#faf7ed] border border-[#14312a10] text-[#b97f1f]">
                    <Key className="size-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Transaction PIN</h4>
                      <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#8a5d11]">
                        Not set
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      Set up your PIN before collecting fees. You'll be asked for it every time money moves.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toast.info('Transaction PIN setup is coming soon')}
                  className="iwp-btn-pill-action shrink-0"
                >
                  Set up PIN
                </button>
              </div>

              {/* Active Devices Sub-section */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Active devices</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {activeCount} active
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={busy !== null || otherDevicesCount === 0}
                    onClick={() => setConfirmTarget('all')}
                    className="iwp-btn-danger-outline"
                  >
                    {busy === 'all' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <LogOut className="size-3.5 stroke-[2.2]" />
                    )}
                    <span>Log out other devices</span>
                  </button>
                </div>

                {/* Devices List */}
                {loading && devices.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-slate-400" />
                  </div>
                ) : devices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No active devices found.</p>
                ) : (
                  <div className="space-y-3">
                    {devices.map((d) => {
                      const isCurrent = d.current;
                      const isOnline = isCurrent || (Date.now() - new Date(d.lastSeenAt).getTime()) < 300_000;

                      const metaParts: string[] = [d.device];
                      if (d.ip) {
                        metaParts.push(d.ip);
                      }

                      return (
                        <div
                          key={d.id}
                          className={`iwp-device ${
                            isCurrent
                              ? '!border-2 !border-[#edb449] shadow-sm'
                              : ''
                          }`}
                        >
                          {/* Left: Device Icon & Information */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#faf7ed] border border-[#14312a10]">
                              <DeviceIcon device={d.device} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[14px] font-bold text-slate-900 tracking-tight truncate">
                                  {d.browser} on {d.os}
                                </h4>

                                {isCurrent && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f9dd86]/45 text-[11px] font-semibold text-[#8a5d11] border border-[#edb449]/30">
                                    <ShieldCheck className="size-3 text-[#b97f1f]" />
                                    This device
                                  </span>
                                )}

                                {d.isShared && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
                                    <QrCode className="size-3 text-slate-500" />
                                    Scanned
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                                <span>{metaParts.join(' · ')}</span>
                                {isOnline ? (
                                  <>
                                    <span>·</span>
                                    <span className="font-bold text-[#0c382f]">Active now</span>
                                  </>
                                ) : (
                                  <>
                                    <span>·</span>
                                    <span>Last active {timeAgo(d.lastSeenAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Log out action */}
                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => setConfirmTarget(d)}
                              className="shrink-0 text-xs font-bold text-[#a8341f] hover:text-red-700 hover:underline px-2 py-1 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {busy === d.id ? <Loader2 className="size-4 animate-spin" /> : 'Log out'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog matching the user's inspector screenshots */}
      <Dialog open={confirmTarget !== null} onOpenChange={(open) => { if (!open && busy === null) setConfirmTarget(null); }}>
        <DialogContent className="iwp-confirm-dialog" showCloseButton={false}>
          <DialogTitle className="sr-only">Log out device</DialogTitle>
          <DialogDescription className="sr-only">
            Confirm logging out from this device
          </DialogDescription>

          <div className="iwp-confirm-body">
            <div className="iwp-confirm-icon">
              <LogOut className="size-6 stroke-[2.2]" />
            </div>

            <h3 className="iwp-confirm-title">
              {confirmTarget === 'all' ? 'Log out all other devices?' : 'Log out this device?'}
            </h3>

            <p className="iwp-confirm-desc">
              {confirmTarget === 'all'
                ? 'All other devices will be signed out right away — they will lose access the next time they are used.'
                : 'This device will be signed out right away — it loses access the next time it’s used.'}
            </p>
          </div>

          <div className="iwp-confirm-actions">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setConfirmTarget(null)}
              className="iwp-btn-cancel"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                if (confirmTarget === 'all') {
                  void revokeAll();
                } else if (confirmTarget) {
                  void revokeOne(confirmTarget);
                }
              }}
              className="iwp-btn-danger"
            >
              {busy !== null ? <Loader2 className="size-4 animate-spin" /> : 'Log out'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
