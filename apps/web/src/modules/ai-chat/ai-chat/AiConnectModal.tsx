"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export type AiConnectModalProps = {
  open: boolean;
  onClose: () => void;
  onConnect?: () => void;
  title?: string;
  description?: string;
  features?: string[];
  ctaLabel?: string;
  skipLabel?: string;
};

/* Tailwind has no built-in keyframes for these, so they live here (only 4 lines).
   Or move them into tailwind.config -> theme.extend.keyframes if you prefer. */
const KEYFRAMES = `
@keyframes ac-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ac-pop { from { transform: translateY(24px) scale(.94); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes ac-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes ac-travel { 0% { left: 0; opacity: 0 } 15%,85% { opacity: 1 } 100% { left: calc(100% - 7px); opacity: 0 } }
`;

const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";

const FEATURE_ICONS: ReactNode[] = [
  <path key="a" d="M4 5h11v8H9l-3 3v-3H4zM18 9h2v8h-2v3l-3-3h-5v-2" />,
  <g key="b"><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M16 7l3 3M14 9l2 2" /></g>,
  <path key="c" d="M8 4h10v13a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2v-1h9v1M8 4v12M11 8h4M11 12h4" />,
];

const FLOAT = "animate-[ac-float_3.6s_ease-in-out_infinite] motion-reduce:animate-none";

export default function AiConnectModal({
  open,
  onClose,
  onConnect,
  title = "AI Connect",
  description = "Your school's live data, inside the AI assistants your team already uses.",
  features = ["Ask in ChatGPT or Claude", "Access you control", "Every question logged"],
  ctaLabel = "Open AI Connect",
  skipLabel = "Not now",
}: AiConnectModalProps) {
  const gradId = "gem-" + useId().replace(/:/g, "");
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ctaRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const providers: ReactNode[] = [
    <svg key="gpt" viewBox="0 0 24 24" className="h-6 w-6 fill-[#111]"><path d={OPENAI_PATH} /></svg>,
    <svg key="claude" viewBox="0 0 32 32" className="h-6 w-6 stroke-[#d9704b]" strokeWidth="2.6" strokeLinecap="round">
      <g transform="translate(16 16)">
        {RAYS.map((deg) => <path key={deg} d="M0 -3 L0 -13" transform={`rotate(${deg})`} />)}
      </g>
    </svg>,
    <svg key="gem" viewBox="0 0 32 32" className="h-6 w-6">
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" /><stop offset=".5" stopColor="#9b72cb" /><stop offset="1" stopColor="#ee5a6f" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradId})`} d="M16 2C16.8 10.2 21.8 15.2 30 16 21.8 16.8 16.8 21.8 16 30 15.2 21.8 10.2 16.8 2 16 10.2 15.2 15.2 10.2 16 2Z" />
    </svg>,
    <svg key="pplx" viewBox="0 0 32 32" className="h-6 w-6 stroke-[#111]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="9.5" /><path d="M7 25L25 7" />
    </svg>,
  ];

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-connect-title"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        className="fixed inset-0 z-50 grid animate-[ac-fade_.25s_ease_both] place-items-center bg-slate-900/50 p-4 text-gray-900 backdrop-blur-[2px] motion-reduce:animate-none"
      >
        {/* card: 420 x 441, padding 36 24 24 */}
        <div className="relative min-h-[441px] w-[420px] max-w-full animate-[ac-pop_.5s_cubic-bezier(.2,1.2,.3,1)_both] overflow-hidden rounded-[32px] bg-white px-6 pb-6 pt-9 text-center shadow-[0_30px_80px_rgba(15,23,42,.3)] motion-reduce:animate-none">
          {/* mint glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[150px] bg-[radial-gradient(ellipse_at_50%_0%,#c9f7ec_0%,rgba(201,247,236,.35)_50%,rgba(255,255,255,0)_85%)]" />

          <div className="relative">
            {/* hero */}
            <div className="flex items-center justify-center gap-3">
              <div className={`grid h-[60px] w-[60px] place-items-center rounded-[18px] bg-white shadow-[0_4px_16px_rgba(15,148,136,.15)] ${FLOAT}`}>
                <svg viewBox="0 0 24 24" className="h-[30px] w-[30px] fill-[#0f9488]" aria-hidden="true">
                  <path d="M10 2h4v6.1l5.3-3.1 2 3.5-5.3 3 5.3 3.1-2 3.4-5.3-3V22h-4v-6.1l-5.3 3.1-2-3.5L8 12.4 2.7 9.3l2-3.4L10 8.9z" />
                </svg>
              </div>

              <div aria-hidden="true" className="relative h-0.5 w-[52px] rounded-sm bg-gradient-to-r from-transparent via-[#bfe9e2] to-transparent">
                <span className="absolute left-0 top-1/2 -mt-[3.5px] h-[7px] w-[7px] animate-[ac-travel_2.2s_ease-in-out_infinite] rounded-full bg-[#0f9488] shadow-[0_0_0_3px_rgba(15,148,136,.18)] motion-reduce:left-1/2 motion-reduce:animate-none" />
              </div>

              <div aria-hidden="true" className="flex rounded-[20px] bg-white px-1.5 py-1 shadow-[0_4px_16px_rgba(15,148,136,.12)]">
                {providers.map((icon, i) => (
                  <span
                    key={i}
                    style={{ animationDelay: `${i * 0.25}s` }}
                    className={`-ml-[3px] grid h-10 w-10 place-items-center rounded-full bg-white first:ml-0 ${FLOAT}`}
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>

            <h2 id="ai-connect-title" className="mb-[7px] mt-[23px] text-xl font-semibold leading-7 tracking-tight">
              {title}
            </h2>
            <p className="mx-auto max-w-[320px] text-[15px] leading-[22px] text-gray-600">{description}</p>

            <div className="mb-7 mt-[22px] flex flex-wrap justify-center gap-2">
              {features.map((label, i) => (
                <span key={label} className="inline-flex h-8 items-center gap-2 rounded-full border border-[#e5e9ef] bg-white px-3.5 text-[13px] text-gray-800">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[#0f9488]" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                  </svg>
                  {label}
                </span>
              ))}
            </div>

            <button
              ref={ctaRef}
              onClick={onConnect}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0f9488] text-[15px] font-medium text-white transition hover:bg-[#0b7d73] active:scale-[.985] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#0f9488]/45"
            >
              {ctaLabel}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] transition-transform group-hover:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            <button
              onClick={onClose}
              className="mx-auto mt-1.5 block h-9 px-4 text-sm text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#0f9488]/45"
            >
              {skipLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
