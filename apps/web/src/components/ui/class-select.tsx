"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useClassesInfinite } from "@/lib/graphql/hooks/academic.hooks";
import { useAppStore } from "@/store/use-app-store";

interface ClassSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  showAllOption?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  classes?: { id: string; name: string; section: string }[];
  isLoading?: boolean;
}

export function ClassSelect({
  value,
  onValueChange,
  showAllOption = false,
  className = "",
  placeholder = "Select class",
  disabled = false,
  classes: customClasses,
  isLoading = false,
}: ClassSelectProps) {
  const [open, setOpen] = useState(false);
  const { currentTenantId } = useAppStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isFetchingNext,
  } = useClassesInfinite(!customClasses ? (currentTenantId || undefined) : undefined, { limit: 20 });

  const classes = useMemo(() => {
    if (customClasses) return customClasses;
    return data?.pages.flatMap((page) => page.classes) || [];
  }, [data, customClasses]);

  const isFetchingNextPage = customClasses ? isLoading : isFetchingNext;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (customClasses || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && fetchNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [customClasses, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const selectedClass = useMemo(() => {
    if (value === "all") return "All Classes";
    const found = classes.find((c) => c.id === value);
    return found ? `${found.name}-${found.section}` : null;
  }, [value, classes]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={`justify-between font-normal text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${className}`}
        >
          <span className="truncate">{selectedClass || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl" 
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <ScrollArea className="h-64 p-1">
          {showAllOption && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onValueChange("all");
                setOpen(false);
              }}
              onClick={() => {
                onValueChange("all");
                setOpen(false);
              }}
              className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">All Classes</span>
              {value === "all" && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
            </button>
          )}

          {classes.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground text-center">No classes found.</div>
          ) : (
            <>
              {classes.map((c, index) => (
                <button
                  key={`${c.id}-${index}`}
                  ref={index === classes.length - 1 ? lastElementRef : null}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onValueChange(c.id);
                    setOpen(false);
                  }}
                  onClick={() => {
                    onValueChange(c.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {c.name}-{c.section}
                  </span>
                  {value === c.id && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                </button>
              ))}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center p-2 text-muted-foreground gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="text-xs">Loading more...</span>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
