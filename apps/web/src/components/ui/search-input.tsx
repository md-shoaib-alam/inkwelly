"use client";

/**
 * SearchInput — production-grade search field.
 *
 * Pattern used by Linear, Vercel, Notion:
 *  - Local state controls the visible input value (instant, zero-latency)
 *  - A debounced effect notifies the parent only after the user pauses
 *  - The parent's state (and therefore API calls) only updates post-debounce
 *  - Result: zero flicker, no focus loss, no redundant DB reads
 */

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export function SearchInput({
  value,
  onChange,
  delay = 400,
  placeholder = "Search...",
  className,
  inputClassName,
  id,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);

  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== prevValue.current) {
        prevValue.current = local;
        onChange(local);
      }
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, delay]);

  const handleClear = () => {
    setLocal("");
    prevValue.current = "";
    onChange("");
  };

  const hasValue = local.length > 0;

  return (
    <div className={cn("relative", className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <Input
        id={id}
        type="text"
        name={id}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="searchbox"
        aria-label={placeholder}
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className={cn(
          "pl-9",
          hasValue ? "pr-8" : "pr-3",
          inputClassName,
        )}
      />
      {hasValue && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "size-5 flex items-center justify-center rounded-full",
            "text-zinc-400 hover:text-emerald-600 dark:text-zinc-500 dark:hover:text-emerald-400",
            "hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          )}
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}