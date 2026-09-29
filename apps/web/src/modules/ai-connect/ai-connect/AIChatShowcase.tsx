"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Mic,
  AudioLines,
  ArrowUp,
  Database,
  Wrench,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types + data                                                               */
/* -------------------------------------------------------------------------- */

export type Provider = "chatgpt" | "claude" | "grok";

export interface Scenario {
  provider: Provider;
  name: string;
  model: string;
  modelChip?: string;
  subtitle: string;
  userMessage: string;
  tool: string;
  reply: string;
  // Custom structured content matching user design
  kind?: "chatgpt_collection" | "claude_dues" | "grok_birthdays";
}

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    provider: "claude",
    name: "Claude",
    model: "Claude Sonnet 4.5",
    modelChip: "Sonnet 4.5",
    subtitle: "Fee desk · Priya Sharma",
    userMessage: "Which students have pending fees over ₹10,000?",
    tool: "fees.pending",
    reply: "23 students have dues above ₹10,000 — ₹3.4L outstanding.",
    kind: "claude_dues",
  },
  {
    provider: "chatgpt",
    name: "ChatGPT",
    model: "GPT-5",
    subtitle: "Principal's office · R. K. Verma",
    userMessage: "Aaj kitna collection hua?",
    tool: "fees.collectionSummary",
    reply: "Today's collection so far:",
    kind: "chatgpt_collection",
  },
  {
    provider: "grok",
    name: "Grok",
    model: "Grok 4",
    subtitle: "Exam cell · S. Nair",
    userMessage: "List students with birthdays this week.",
    tool: "students.lookup",
    reply: "5 students have birthdays this week.",
    kind: "grok_birthdays",
  },
];

/* -------------------------------------------------------------------------- */
/* Themes                                                                     */
/* -------------------------------------------------------------------------- */

interface Theme {
  bg: string;
  border: string;
  divider: string;
  bubble: string;
  bubbleBorder: string;
  text: string;
  title: string;
  body: string;
  muted: string;
  icon: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  composerBg: string;
  composerBorder: string;
  chipBorder: string;
  sendBg: string;
  sendColor: string;
  avatarBg: string;
  avatarBorder: string;
  cardRadius: string;
  composerRadius: string;
  sendRadius: string;
  chip: "tools" | "model";
  audio: boolean;
  placeholder: string;
  shadow: string;
}

const THEMES: Record<Provider, Theme> = {
  chatgpt: {
    bg: "#ffffff",
    border: "#e5e7eb",
    divider: "#f3f4f6",
    bubble: "#f3f4f6",
    bubbleBorder: "transparent",
    text: "#111827",
    title: "#111827",
    body: "#374151",
    muted: "#6b7280",
    icon: "#10a37f",
    accent: "#10a37f",
    badgeBg: "#ecfdf5",
    badgeText: "#047857",
    composerBg: "#ffffff",
    composerBorder: "#e5e7eb",
    chipBorder: "#e5e7eb",
    sendBg: "#0d0d0d",
    sendColor: "#ffffff",
    avatarBg: "#ffffff",
    avatarBorder: "#e5e7eb",
    cardRadius: "16px",
    composerRadius: "18px",
    sendRadius: "50%",
    chip: "tools",
    audio: true,
    placeholder: "Ask anything",
    shadow: "0 12px 30px -18px rgba(15,23,42,0.28)",
  },
  claude: {
    bg: "#faf7f2",
    border: "#ece5dc",
    divider: "#efeae3",
    bubble: "#ffffff",
    bubbleBorder: "#e7ded2",
    text: "#2b2621",
    title: "#2b2621",
    body: "#3d362f",
    muted: "#7d7367",
    icon: "#c96442",
    accent: "#c96442",
    badgeBg: "#f3ede3",
    badgeText: "#6e6354",
    composerBg: "#ffffff",
    composerBorder: "#e4dbce",
    chipBorder: "#dfd5c6",
    sendBg: "#c96442",
    sendColor: "#ffffff",
    avatarBg: "#fbf8f4",
    avatarBorder: "#ebd8cd",
    cardRadius: "16px",
    composerRadius: "18px",
    sendRadius: "10px",
    chip: "model",
    audio: false,
    placeholder: "Reply to Claude...",
    shadow: "0 12px 30px -18px rgba(43,38,33,0.22)",
  },
  grok: {
    bg: "#0a0a0a",
    border: "#222222",
    divider: "#1c1c1c",
    bubble: "#1f1f1f",
    bubbleBorder: "#2a2a2a",
    text: "#f5f5f5",
    title: "#ffffff",
    body: "#e5e5e5",
    muted: "#888888",
    icon: "#ffffff",
    accent: "#ffffff",
    badgeBg: "#064e3b",
    badgeText: "#34d399",
    composerBg: "#121212",
    composerBorder: "#262626",
    chipBorder: "#2a2a2a",
    sendBg: "#ffffff",
    sendColor: "#000000",
    avatarBg: "#ffffff",
    avatarBorder: "#ffffff",
    cardRadius: "16px",
    composerRadius: "18px",
    sendRadius: "50%",
    chip: "tools",
    audio: false,
    placeholder: "Ask Grok anything",
    shadow: "0 18px 40px -20px rgba(0,0,0,0.55)",
  },
};

const COLOR_VARS = [
  "bg",
  "border",
  "divider",
  "bubble",
  "bubbleBorder",
  "text",
  "title",
  "body",
  "muted",
  "icon",
  "accent",
  "badgeBg",
  "badgeText",
  "composerBg",
  "composerBorder",
  "chipBorder",
  "sendBg",
  "sendColor",
  "avatarBg",
  "avatarBorder",
] as const;

const LENGTH_VARS = ["cardRadius", "composerRadius", "sendRadius"] as const;

const cssName = (k: string) => "--aic-" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const v = (k: (typeof COLOR_VARS)[number] | (typeof LENGTH_VARS)[number]) => `var(${cssName(k)})`;

function themeVars(t: Theme): React.CSSProperties {
  const out: Record<string, string> = {};
  [...COLOR_VARS, ...LENGTH_VARS].forEach((k) => {
    out[cssName(k)] = t[k];
  });
  return out as React.CSSProperties;
}

const EASE = "cubic-bezier(.4,0,.2,1)";
const THEME_MS = 800;

/* -------------------------------------------------------------------------- */
/* Logos                                                                      */
/* -------------------------------------------------------------------------- */

export function ClaudeMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => i * 30).map((deg, i) => (
        <line
          key={deg}
          x1="12"
          y1="12"
          x2="12"
          y2={i % 2 === 0 ? 2.5 : 4.5}
          stroke="#d9734e"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

export function GrokMark({ size = 18, color = "#0a0a0a" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7.5" />
      <path d="M5 20 19 4" />
    </svg>
  );
}

export function ChatGPTMark({ size = 20, fill = "#0d0d0d" }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" />
    </svg>
  );
}

function ProviderLogo({ provider }: { provider: Provider }) {
  if (provider === "claude") return <ClaudeMark size={20} />;
  if (provider === "grok") return <GrokMark size={18} color="#0a0a0a" />;
  return <ChatGPTMark size={20} />;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export interface AIChatShowcaseProps {
  scenarios?: Scenario[];
  loop?: boolean;
  height?: number | string;
  className?: string;
}

export default function AIChatShowcase({
  scenarios = DEFAULT_SCENARIOS,
  loop = true,
  height = 346,
  className,
}: AIChatShowcaseProps) {
  const [idx, setIdx] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [inCount, setInCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [sent, setSent] = useState(false);
  const [toolShown, setToolShown] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scenario = scenarios[idx] ?? scenarios[0];
  const t = THEMES[scenario.provider];
  const typed = scenario.userMessage.slice(0, inCount);

  useEffect(() => {
    let cancelled = false;

    const wait = async (ms: number) => {
      await new Promise((r) => setTimeout(r, ms));
      if (cancelled) throw new Error("cancelled");
    };

    async function run() {
      try {
        let i = idx;
        while (!cancelled) {
          setIdx(i);
          const s = scenarios[i];

          // Reset step
          setSent(false);
          setToolShown(false);
          setShowReply(false);
          setInCount(0);
          setContentVisible(true);
          await wait(300);

          // 1. Type user prompt into composer
          setTyping(true);
          for (let c = 1; c <= s.userMessage.length; c++) {
            setInCount(c);
            await wait(22);
          }
          setTyping(false);
          await wait(350);

          // 2. Send prompt as message bubble
          setSent(true);
          setInCount(0);
          await wait(450);

          // 3. Show tool call
          setToolShown(true);
          await wait(750);

          // 4. Reveal assistant response
          setShowReply(true);
          await wait(4200);

          // 5. Next assistant handover
          if (i === scenarios.length - 1 && !loop) return;
          setContentVisible(false);
          await wait(400);
          i = (i + 1) % scenarios.length;
        }
      } catch {
        /* unmounted */
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [scenarios, loop]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!sent && !toolShown && !showReply) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const timer = setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [idx, sent, toolShown, showReply]);

  const fade: React.CSSProperties = {
    opacity: contentVisible ? 1 : 0,
    transition: "opacity .35s ease",
  };

  const themeTransition = [
    ...COLOR_VARS.map((k) => cssName(k)),
    ...LENGTH_VARS.map((k) => cssName(k)),
    "box-shadow",
    "background-color",
    "border-color",
  ]
    .map((p) => `${p} ${THEME_MS}ms ${EASE}`)
    .join(", ");

  return (
    <div
      className={className}
      style={{
        ...themeVars(t),
        height,
        width: "100%",
        borderRadius: v("cardRadius"),
        overflow: "hidden",
        background: v("bg"),
        border: `1px solid ${v("border")}`,
        boxShadow: t.shadow,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: v("text"),
        transition: themeTransition,
      }}
    >
      <style>{`
        .aic-hide-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .aic-hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${v("divider")}`, transition: `border-color ${THEME_MS}ms ${EASE}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", ...fade }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: v("avatarBg"),
              border: `1px solid ${v("avatarBorder")}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
            }}
          >
            <ProviderLogo provider={scenario.provider} />
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: v("title") }}>
              {scenario.name}{" "}
              <span style={{ fontWeight: 400, fontSize: 12, color: v("muted") }}>
                · {scenario.model}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: v("muted"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {scenario.subtitle}
            </div>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: v("badgeText"),
              background: v("badgeBg"),
              borderRadius: 99,
              padding: "4px 10px",
            }}
          >
            <Lock size={11} strokeWidth={2.2} />
            read-only
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="aic-hide-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "smooth",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          ...fade,
        }}
      >
        {/* User Prompt */}
        {sent && (
          <div
            style={{
              alignSelf: "flex-end",
              background: v("bubble"),
              border: `1px solid ${v("bubbleBorder")}`,
              color: v("text"),
              fontSize: 13,
              lineHeight: 1.45,
              padding: "8px 14px",
              borderRadius: "14px",
              maxWidth: "88%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            {scenario.userMessage}
          </div>
        )}

        {/* Tool Chip */}
        {toolShown && (
          <div style={{ alignSelf: "flex-start" }}>
            {scenario.provider === "claude" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px 4px 8px",
                  borderRadius: 999,
                  background: "#FAF7F4",
                  border: "1px solid #EFEAE4",
                  fontSize: 12,
                  color: "#3D362F",
                }}
              >
                <Wrench size={13} color="#C96442" />
                <span style={{ fontWeight: 500, fontFamily: "monospace", fontSize: 11.5 }}>
                  {scenario.tool}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#C96442",
                    background: "#F3EDE3",
                    padding: "1px 6px",
                    borderRadius: 99,
                  }}
                >
                  read-only
                </span>
                <ChevronRight size={13} color="#9C9286" />
              </div>
            )}

            {scenario.provider === "grok" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px 4px 8px",
                  borderRadius: 999,
                  background: "#18181A",
                  border: "1px solid #2B2B30",
                  fontSize: 12,
                  color: "#E4E4E7",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#38BDF8" }} />
                <span style={{ fontWeight: 500, fontFamily: "monospace", fontSize: 11.5 }}>
                  {scenario.tool}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#34D399",
                    background: "#064E3B",
                    padding: "1px 6px",
                    borderRadius: 99,
                  }}
                >
                  read-only
                </span>
              </div>
            )}

            {scenario.provider === "chatgpt" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#4B5563",
                }}
              >
                <Database size={13} color="#6B7280" />
                <span>
                  Reading <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{scenario.tool}</span>
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#047857",
                    background: "#ECFDF5",
                    padding: "1px 6px",
                    borderRadius: 99,
                  }}
                >
                  read-only
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reply Body with custom structured widgets */}
        {showReply && (
          <div style={{ alignSelf: "flex-start", width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: v("body") }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {scenario.provider === "claude" && <ClaudeMark size={15} />}
                {scenario.provider === "grok" && <GrokMark size={14} color="#ffffff" />}
                {scenario.provider === "chatgpt" && <ChatGPTMark size={15} />}
              </span>
              <span>{scenario.reply}</span>
            </div>

            {/* Structured Claude Card */}
            {scenario.kind === "claude_dues" && (
              <div
                style={{
                  marginTop: 4,
                  borderRadius: 12,
                  background: "#FFFFFF",
                  border: "1px solid #EFEAE4",
                  overflow: "hidden",
                  width: "100%",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderBottom: "1px solid #F3EFEA",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>Aarav Sharma</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748B", background: "#F1EBE4", padding: "1px 7px", borderRadius: 5 }}>
                      VIII-B
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>₹14,500</span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>Diya Patel</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748B", background: "#F1EBE4", padding: "1px 7px", borderRadius: 5 }}>
                      X-A
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>₹12,200</span>
                  </div>
                </div>
              </div>
            )}

            {/* Structured ChatGPT Stat Card */}
            {scenario.kind === "chatgpt_collection" && (
              <div
                style={{
                  marginTop: 4,
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#059669",
                    letterSpacing: "-0.02em",
                    fontFamily: "var(--font-lexend), Inter, sans-serif",
                  }}
                >
                  ₹1,84,500
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>
                  62 payments · Cash ₹42,000 · Online ₹1,42,500
                </div>
              </div>
            )}

            {/* Structured Grok Card */}
            {scenario.kind === "grok_birthdays" && (
              <div
                style={{
                  marginTop: 4,
                  borderRadius: 12,
                  background: "#18181B",
                  border: "1px solid #27272A",
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderBottom: "1px solid #27272A",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#F4F4F5" }}>Ishaan Kapoor</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#A1A1AA", background: "#27272A", padding: "1px 7px", borderRadius: 5 }}>
                      VI-B
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#34D399" }}>Mon · 12</span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#F4F4F5" }}>Meera Shah</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#A1A1AA", background: "#27272A", padding: "1px 7px", borderRadius: 5 }}>
                      III-A
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#34D399" }}>Wed · 9</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        style={{
          padding: "10px 12px 12px",
          borderTop: `1px solid ${v("divider")}`,
          transition: `border-color ${THEME_MS}ms ${EASE}`,
        }}
      >
        <div
          style={{
            background: v("composerBg"),
            border: `1px solid ${v("composerBorder")}`,
            borderRadius: v("composerRadius"),
            padding: "10px 12px 8px",
          }}
        >
          <div style={{ fontSize: 13.5, minHeight: 20, padding: "0 4px 8px", color: inCount > 0 ? v("text") : v("muted"), ...fade }}>
            {typing ? typed : inCount > 0 ? typed : t.placeholder}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: `1px solid ${v("chipBorder")}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: v("muted"),
                }}
              >
                <Plus size={14} />
              </span>

              {t.chip === "model" && scenario.modelChip && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: v("muted"),
                    padding: "3px 8px",
                    borderRadius: 99,
                    border: `1px solid ${v("chipBorder")}`,
                  }}
                >
                  <ChevronDown size={12} />
                  {scenario.modelChip}
                </span>
              )}

              {t.chip === "tools" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 500,
                    color: v("muted"),
                    padding: "3px 8px",
                    borderRadius: 99,
                    border: `1px solid ${v("chipBorder")}`,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="9" x2="20" y2="9" />
                    <line x1="4" y1="15" x2="20" y2="15" />
                    <line x1="10" y1="3" x2="10" y2="21" />
                    <line x1="16" y1="3" x2="16" y2="21" />
                  </svg>
                  Tools
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: v("muted"), display: "flex", alignItems: "center" }}>
                <Mic size={15} />
              </span>
              {t.audio && (
                <span style={{ color: v("muted"), display: "flex", alignItems: "center" }}>
                  <AudioLines size={15} />
                </span>
              )}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: v("sendRadius"),
                  background: v("sendBg"),
                  color: v("sendColor"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowUp size={16} strokeWidth={2.4} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}