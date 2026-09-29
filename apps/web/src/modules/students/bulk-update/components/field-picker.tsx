"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlidersHorizontal, Languages } from "lucide-react";
import { BULK_FIELDS, FIELD_GROUPS, type BulkField } from "../fields";

interface FieldPickerProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

function FieldRow({
  field,
  checked,
  onToggle,
}: {
  field: BulkField;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] ${
        field.disabled
          ? "cursor-not-allowed text-slate-300 dark:text-zinc-700"
          : "cursor-pointer text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
      }`}
    >
      <Checkbox
        checked={checked}
        disabled={field.disabled}
        onCheckedChange={onToggle}
        className="size-[15px]"
      />
      <span className="flex-1 truncate">{field.label}</span>
      {["text", "tel", "email"].includes(field.kind) && !field.disabled && (
        <Languages className="size-3.5 text-slate-400 shrink-0" />
      )}
    </label>
  );
}

export function FieldPicker({ selected, onChange }: FieldPickerProps) {
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const toggleGroup = (group: string) => {
    const keys = BULK_FIELDS.filter((f) => f.group === group && !f.disabled).map((f) => f.key);
    const allOn = keys.every((k) => selected.has(k));
    const next = new Set(selected);
    for (const k of keys) {
      if (allOn) next.delete(k);
      else next.add(k);
    }
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-medium shadow-2xs"
        >
          <SlidersHorizontal className="size-4 mr-2 text-slate-500" />
          Select fields
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-0 rounded-xl">
        <ScrollArea className="max-h-[420px] px-2 py-2">
          {FIELD_GROUPS.map((group) => {
            const fields = BULK_FIELDS.filter((f) => f.group === group);
            const editable = fields.filter((f) => !f.disabled);
            const allOn = editable.length > 0 && editable.every((f) => selected.has(f.key));
            return (
              <div key={group} className="mb-1">
                <div className="flex items-center justify-between px-2 pt-2 pb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
                    {group}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                  >
                    {allOn ? "Deselect all" : "Select all"}
                  </button>
                </div>
                {fields.map((field) => (
                  <FieldRow
                    key={field.key}
                    field={field}
                    checked={selected.has(field.key)}
                    onToggle={() => toggle(field.key)}
                  />
                ))}
              </div>
            );
          })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
