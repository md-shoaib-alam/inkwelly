'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';
import { createLoginChallenge, pollLoginChallenge } from '@/lib/api';
import { applySession } from '../lib/apply-session';
import { Button } from '@/components/ui/button';

const POLL_MS = 2000;

type PanelState = 'starting' | 'live' | 'expired' | 'consumed' | 'unavailable';

/**
 * A separate panel, never a second login form: it only ever hands a finished session to
 * applySession(). Regenerating a challenge is always a human press — an unattended login
 * page must not mint a code, poll it 45 times, expire and repeat.
 */
export function ScanToSignInPanel() {
  const [state, setState] = useState<PanelState>('starting');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [shared, setShared] = useState(false);
  const [reason, setReason] = useState<'expired' | 'shared-changed'>('expired');
  // The create call must not re-fire when the checkbox changes, so the value it sends
  // lives in a ref and is absent from the effect's dependency list.
  const sharedRef = useRef(shared);
  sharedRef.current = shared;

  const start = useCallback(async () => {
    setState('starting');
    setQrSrc('');
    setCode('');
    setChallengeId(null);
    try {
      const challenge = await createLoginChallenge(sharedRef.current);
      setCode(challenge.code);
      setQrSrc(await QRCode.toDataURL(`inkwelly://login?c=${challenge.challengeId}&k=${challenge.code}`, { width: 200, margin: 1 }));
      setChallengeId(challenge.challengeId);
      setState('live');
    } catch {
      setState('unavailable');
    }
  }, []);

  // One create per mount. React's dev-mode StrictMode runs the effect mount → unmount →
  // mount on the same instance, which measured as two POSTs for one page load; the second
  // run is refused here so "one create per mount" holds in dev as well as in production.
  // A genuine remount gets a fresh ref, and a fresh code is always a human press.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    if (state !== 'live' || !challengeId) return;
    let cancelled = false;

    const tick = async () => {
      // A login page left in a background tab stays silent.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const result = await pollLoginChallenge(challengeId);
        if (cancelled) return;
        if (result.status === 'approved') {
          applySession(
            { token: result.token, refreshToken: result.refreshToken, user: result.user },
            { shared: sharedRef.current },
          );
          return;
        }
        if (result.status === 'expired') { setState('expired'); return; }
        if (result.status === 'consumed') { setState('consumed'); return; }
      } catch {
        // Transient poll failure: keep polling. The challenge dies on its own TTL.
      }
    };

    const timer = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [state, challengeId]);

  const showNewCode = () => { setReason('expired'); void start(); };

  const toggleShared = (next: boolean) => {
    setShared(next);
    sharedRef.current = next;
    // Automatically regenerate a fresh QR challenge for the newly toggled shared mode
    void start();
  };

  const isExpired = state !== 'live' && state !== 'starting';
  const blocked = state === 'unavailable';

  return (
    <div className="flex flex-col gap-4">
      {/* Eyebrow */}
      <div className="lg-card-eyebrow">
        HAVE THE APP?
      </div>

      {/* Headline */}
      <h3 className="text-[22px] font-black text-[#14312a] leading-tight">
        Scan to <em className="not-italic text-[#b97f1f]">sign in.</em>
      </h3>

      <p className="text-xs text-[#4c5f58] -mt-2">
        No OTP to wait for. Your phone confirms it&apos;s you.
      </p>

      {/* QR code box with corner brackets & glass expired overlay */}
      <div className="relative inline-flex self-center my-1">
        {/* Amber Corner brackets - 4 L-shaped corner marks */}
        <div className="absolute -top-2 -left-2 w-5 h-5 border-t-[2.5px] border-l-[2.5px] border-amber-400 rounded-tl-md pointer-events-none z-10" />
        <div className="absolute -top-2 -right-2 w-5 h-5 border-t-[2.5px] border-r-[2.5px] border-amber-400 rounded-tr-md pointer-events-none z-10" />
        <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-[2.5px] border-l-[2.5px] border-amber-400 rounded-bl-md pointer-events-none z-10" />
        <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-[2.5px] border-r-[2.5px] border-amber-400 rounded-br-md pointer-events-none z-10" />

        <div className={`lg-qr-plate ${isExpired ? 'is-expired' : 'is-waiting'}`}>
          {state === 'starting' && (
            <Loader2 className="size-6 animate-spin text-amber-500 z-10" />
          )}

          {qrSrc ? (
            <img
              src={qrSrc}
              alt="Sign-in QR code"
              className="rounded-lg select-none"
            />
          ) : (
            state !== 'starting' && (
              <div className="w-[176px] h-[176px] bg-slate-100/80 rounded-lg" />
            )
          )}

          {/* Frosted Glass Overlay on Expired/Unavailable */}
          {isExpired && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 text-center bg-white/20 backdrop-blur-[2.5px] rounded-[16px]">
              <p className="text-[13px] font-bold text-slate-800 tracking-tight mb-2">
                {blocked
                  ? 'Scan sign-in unavailable'
                  : reason === 'shared-changed'
                    ? 'Setting changed'
                    : 'Code expired'}
              </p>
              {!blocked ? (
                <button
                  type="button"
                  onClick={showNewCode}
                  className="lg-qr-reload"
                >
                  <span>Show a new code</span>
                </button>
              ) : (
                <p className="text-[10px] text-slate-600">
                  Please use credentials.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Steps */}
      <ol className="lg-qr-steps">
        <li className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200/80 text-xs font-bold text-amber-600 shadow-2xs">
            1
          </span>
          <span className="text-[#334b43]">
            Open the <strong className="font-bold text-[#14312a]">Inkwelly app</strong> on your phone
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200/80 text-xs font-bold text-amber-600 shadow-2xs">
            2
          </span>
          <span className="text-[#334b43]">
            Tap <strong className="font-bold text-[#14312a]">Sign in on web</strong>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200/80 text-xs font-bold text-amber-600 shadow-2xs">
            3
          </span>
          <span className="text-[#334b43]">
            Point it at this code and confirm
          </span>
        </li>
      </ol>

      {/* Code box with label (hidden when expired) */}
      {!isExpired && (
        <div className="lg-qr-code">
          <span className="text-xs text-[#334b43] text-left leading-tight">
            Camera not working? Enter<br />in the app
          </span>
          <span className="lg-qr-code-value">
            {code || '••••••'}
          </span>
        </div>
      )}

      {/* Shared computer checkbox */}
      <label className="lg-qr-shared">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => toggleShared(e.target.checked)}
        />
        <span className="text-[12px] leading-tight text-slate-800">
          <span className="font-semibold text-[#14312a]">This is a shared computer</span>
          <br />
          <em className="text-[11.5px] not-italic text-[#4c5f58] block mt-[1px] leading-[1.35]">
            Signs out after 12 hours and leaves nothing on this machine.
          </em>
        </span>
      </label>
    </div>
  );
}
