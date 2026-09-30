"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      className={cn(
        "size-8 shrink-0 rounded-full border transition-colors duration-300 cursor-pointer flex items-center justify-center overflow-hidden",
        isDark
          ? "bg-zinc-900 border-zinc-700 text-white"
          : "bg-white border-slate-200/80 text-slate-800"
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="currentColor"
        aria-hidden="true"
        strokeLinecap="round"
        className="size-[18px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Clip path: slides to hide the sun rays when dark */}
        <defs>
          <clipPath id="theme-toggle-clip">
            <motion.path
              animate={{
                y: isDark ? 10 : 0,
                x: isDark ? -12 : 0,
              }}
              transition={{ ease: "easeInOut", duration: 0.4 }}
              d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
            />
          </clipPath>
        </defs>

        <g clipPath="url(#theme-toggle-clip)">
          {/* Main circle — grows into full moon */}
          <motion.circle
            cx="16"
            cy="16"
            animate={{ r: isDark ? 10 : 8 }}
            transition={{ ease: "easeInOut", duration: 0.4 }}
          />

          {/* Sun rays — rotate & fade out when dark */}
          <motion.g
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            animate={{
              rotate: isDark ? -90 : 0,
              scale: isDark ? 0.4 : 1,
              opacity: isDark ? 0 : 1,
            }}
            style={{ originX: "16px", originY: "16px" }}
            transition={{ ease: "easeInOut", duration: 0.4 }}
          >
            <path d="M16 5.5v-4" />
            <path d="M16 30.5v-4" />
            <path d="M1.5 16h4" />
            <path d="M26.5 16h4" />
            <path d="m23.4 8.6 2.8-2.8" />
            <path d="m5.7 26.3 2.9-2.9" />
            <path d="m5.8 5.8 2.8 2.8" />
            <path d="m23.4 23.4 2.9 2.9" />
          </motion.g>
        </g>
      </svg>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
