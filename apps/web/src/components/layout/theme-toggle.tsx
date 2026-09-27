"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="icon" className="size-8.5 sm:size-9 shrink-0">
        <Sun className="size-[18px] sm:size-[18px]" />
      </Button>
    );
  }

  const currentTheme = resolvedTheme || theme;

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="size-8.5 sm:size-9 shrink-0 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100/80 dark:hover:bg-zinc-800 shadow-2xs transition-all cursor-pointer"
    >
      {currentTheme === "dark" ? (
        <Moon className="size-4 text-blue-400 transition-transform hover:-rotate-12" />
      ) : (
        <Sun className="size-4 text-amber-500 transition-transform hover:rotate-45" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
