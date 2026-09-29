"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Columns3 } from "lucide-react";
import { COLUMN_GROUPS, ROSTER_COLUMNS } from "./columns";

interface ColumnsPopoverProps {
  visible: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function ColumnsPopover({ visible, onChange }: ColumnsPopoverProps) {
  const toggleable = ROSTER_COLUMNS.filter((c) => !c.alwaysOn).map((c) => c.key);
  const allOn = toggleable.every((k) => visible.has(k));

  const toggle = (key: string) => {
    const next = new Set(visible);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const toggleAll = () => {
    if (allOn) {
      const next = new Set(ROSTER_COLUMNS.filter((c) => c.alwaysOn).map((c) => c.key));
      onChange(next);
    } else {
      onChange(new Set(ROSTER_COLUMNS.map((c) => c.key)));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-[12.5px] font-medium inline-flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Columns3 className="size-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Columns</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0 rounded-xl">
        <div className="px-4 pt-3.5 pb-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Toggle columns</div>
          <div className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Show or hide table columns</div>
        </div>
        <div className="border-t border-slate-100 dark:border-zinc-800" />
        {/* Radix needs a definite height: a max-h here left the viewport unscrollable. */}
        <ScrollArea className="h-[420px] px-2 py-2">
          <label className="flex items-center gap-2.5 rounded-md px-2 py-2 mb-1 cursor-pointer text-[13px] font-medium text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60">
            <Checkbox
              checked={allOn}
              onCheckedChange={toggleAll}
              className="size-[15px]"
            />
            <span>Select all</span>
          </label>
          <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
          {COLUMN_GROUPS.map((group) => (
            <div key={group} className="mb-1">
              <div className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
                {group}
              </div>
              {ROSTER_COLUMNS.filter((c) => c.group === group).map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] ${
                    col.alwaysOn
                      ? "cursor-not-allowed text-slate-300 dark:text-zinc-700"
                      : "cursor-pointer text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <Checkbox
                    checked={visible.has(col.key)}
                    disabled={col.alwaysOn}
                    onCheckedChange={() => toggle(col.key)}
                    className="size-[15px]"
                  />
                  <span className="flex-1 truncate">{col.label}</span>
                </label>
              ))}
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
