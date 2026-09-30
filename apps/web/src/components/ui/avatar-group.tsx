"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AvatarItem {
  src?: string;
  alt?: string;
  name?: string;
  label?: string; // used interchangeably with name
  className?: string; // student's class, e.g. "Class 2nd - A"
  sublabel?: string; // used interchangeably with className
  initials?: string;
  bgColor?: string;
  textColor?: string;
}

export interface AvatarGroupProps {
  avatars: AvatarItem[];
  maxVisible?: number;
  size?: number;
  overlap?: number;
  className?: string;
}

const PALETTES = [
  { bg: "bg-[#D1FAE5] dark:bg-emerald-950/80", text: "text-[#065F46] dark:text-emerald-300" }, // Mint (ZK style)
  { bg: "bg-[#E0F2FE] dark:bg-sky-950/80", text: "text-[#0369A1] dark:text-sky-300" },       // Sky (AF style)
  { bg: "bg-[#CCFBF1] dark:bg-teal-950/80", text: "text-[#0F766E] dark:text-teal-300" },     // Teal (IM style)
  { bg: "bg-[#FEF3C7] dark:bg-amber-950/80", text: "text-[#92400E] dark:text-amber-300" },   // Amber
  { bg: "bg-[#F3E8FF] dark:bg-purple-950/80", text: "text-[#6B21A8] dark:text-purple-300" }, // Purple
  { bg: "bg-[#FFE4E6] dark:bg-rose-950/80", text: "text-[#9F1239] dark:text-rose-300" },     // Rose
];

function getInitials(name?: string, fallback = "ST"): string {
  if (!name) return fallback;

  // Handle "Student #abcde" or "Student 1"
  if (name.toLowerCase().startsWith("student")) {
    const numOrId = name.replace(/student\s*#?/i, "").trim();
    if (numOrId) {
      if (/^\d+$/.test(numOrId)) return `S${numOrId}`;
      const clean = numOrId.replace(/[^a-zA-Z0-9]/g, "");
      if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
      if (clean.length === 1) return `S${clean.toUpperCase()}`;
    }
    return fallback;
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].replace(/[^a-zA-Z0-9]/g, "");
    const last = parts[parts.length - 1].replace(/[^a-zA-Z0-9]/g, "");
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first.length >= 2) return first.slice(0, 2).toUpperCase();
  }

  const clean = name.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
  return clean.toUpperCase() || fallback;
}

function getPaletteIndex(name: string, idx: number) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash + idx) % PALETTES.length;
}

const AvatarGroup = ({
  avatars,
  maxVisible = 5,
  size = 28,
  overlap,
  className,
}: AvatarGroupProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const visibleAvatars = avatars.slice(0, maxVisible);
  const extraCount = avatars.length - maxVisible;

  // Controlled overlap (~32% of diameter) so circles are clean and readable
  const actualOverlap = overlap ?? Math.round(size * 0.32);

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center">
        {visibleAvatars.map((avatar, idx) => {
          const isHovered = hoveredIdx === idx;
          const marginLeft = idx === 0 ? 0 : -actualOverlap;
          const displayName = avatar.name || avatar.label || `Student ${idx + 1}`;
          const displayClass = avatar.className || avatar.sublabel;
          const initials = avatar.initials || getInitials(displayName, `S${idx + 1}`);
          const palette = PALETTES[getPaletteIndex(displayName, idx)];

          // Consistent left-to-right stacking (left circles above right circles)
          // On hover, pop to zIndex 50 with gentle lift and subtle scale
          const baseZ = visibleAvatars.length - idx + 10;
          const zIndex = isHovered ? 50 : baseZ;

          return (
            <div
              key={idx}
              className="border-2 border-white dark:border-zinc-900 rounded-full bg-white dark:bg-zinc-900 relative flex items-center justify-center shrink-0 cursor-pointer select-none ring-1 ring-black/5"
              style={{
                width: size,
                height: size,
                zIndex,
                marginLeft,
                transition:
                  "transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)",
                transform: isHovered
                  ? "translateY(-2px) scale(1.08)"
                  : "translateY(0) scale(1)",
                boxShadow: isHovered
                  ? "0 6px 16px -2px rgba(0,0,0,0.25)"
                  : "0 1px 2px 0 rgba(0,0,0,0.05)",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {avatar.src ? (
                <img
                  src={avatar.src}
                  alt={avatar.alt || displayName}
                  width={size}
                  height={size}
                  className="rounded-full object-cover w-full h-full"
                  draggable={false}
                />
              ) : (
                <div
                  className={cn(
                    "w-full h-full rounded-full flex items-center justify-center font-bold tracking-tight",
                    palette.bg,
                    palette.text
                  )}
                  style={{ fontSize: Math.max(9, size * 0.36) }}
                >
                  {initials}
                </div>
              )}

              {/* Compact, sleek tooltip right above the avatar */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="tooltip"
                    initial={{ x: "-50%", y: 4, opacity: 0, scale: 0.92 }}
                    animate={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
                    exit={{ x: "-50%", y: 4, opacity: 0, scale: 0.92 }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 28,
                    }}
                    className="absolute z-[100] px-2.5 py-1 bg-[#0F172A] dark:bg-white text-white dark:text-slate-900 rounded-lg shadow-xl dark:shadow-2xl dark:shadow-black/50 pointer-events-none flex flex-col items-start border border-slate-800/80 dark:border-slate-200/80 min-w-max"
                    style={{
                      bottom: size + 4,
                      left: "50%",
                    }}
                  >
                    <span className="text-[11.5px] font-semibold text-white dark:text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                      {displayName}
                    </span>
                    {displayClass && (
                      <span className="text-[10px] font-normal text-[#94A3B8] dark:text-slate-500 leading-tight tracking-normal whitespace-nowrap mt-0.5">
                        {displayClass}
                      </span>
                    )}
                    {/* Tooltip pointer caret pointing down towards the avatar */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[0.5px] w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#0F172A] dark:border-t-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {extraCount > 0 && (
          <div
            className="relative flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold border-2 border-white dark:border-zinc-900 rounded-full shrink-0 shadow-2xs ring-1 ring-black/5"
            style={{
              width: size,
              height: size,
              marginLeft: -actualOverlap,
              zIndex: 10,
              fontSize: Math.max(9, size * 0.34),
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
};

export { AvatarGroup };
export default AvatarGroup;
