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
      setQrSrc(await QRCode.toDataURL(`inkwelly://login?c=${challenge.challengeId}`, { width: 200, margin: 1 }));
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
    // `shared` is stamped on the challenge at create time, so a pending challenge no
    // longer describes what the user just asked for. Stop on the manual regenerate
    // rather than minting a request nobody asked for.
    if (state === 'live') { setReason('shared-changed'); setState('expired'); }
  };

  if (state === 'starting') {
    return (
      <div className="flex h-52 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (state !== 'live') {
    const blocked = state === 'unavailable';
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          {blocked
            ? 'Scan sign-in is unavailable'
            : reason === 'shared-changed'
              ? 'Shared-computer setting changed'
              : 'Code expired'}
        </p>
        <p className="max-w-[28ch] text-xs text-slate-500">
          {blocked
            ? 'Use the password form, or try again in a few minutes.'
            : 'Show a new code and scan it within 90 seconds.'}
        </p>
        {!blocked && <Button size="sm" onClick={showNewCode}>Show a new code</Button>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Eyebrow */}
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        HAVE THE APP?
      </p>

      {/* Headline */}
      <h3 className="text-lg font-semibold text-slate-900">
        Scan to sign in.
      </h3>

      {/* QR code with corner brackets */}
      <div className="relative inline-flex self-center">
        {/* Corner brackets - four L-shaped marks */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-slate-700" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-slate-700" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-slate-700" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-slate-700" />
        
        <img
          src={qrSrc}
          alt="Sign-in QR code"
          className="size-44 rounded-lg border border-slate-200 bg-white p-1"
        />
      </div>

      {/* Steps */}
      <ol className="space-y-1 text-[11px] text-slate-500">
        <li>1  Open the Inkwellly app on your phone</li>
        <li>2  Tap Sign in on web</li>
        <li>3  Point it at this code and confirm</li>
      </ol>

      {/* Code box with label */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <span className="text-xs text-slate-600">Camera not working? Enter in the app</span>
        <span className="font-mono text-lg font-semibold tracking-wider text-slate-900">{code}</span>
      </div>

      {/* Shared computer checkbox */}
      <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => toggleShared(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-[11px] leading-snug text-slate-600">
          <span className="font-medium text-slate-800">This is a shared computer</span>
          <br />
          Reloading the page signs you out.
        </span>
      </label>
    </div>
  );
}
