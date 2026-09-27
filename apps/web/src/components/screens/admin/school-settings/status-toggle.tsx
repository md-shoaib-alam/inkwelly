import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Check } from "lucide-react";

interface StatusToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function StatusToggle({ enabled, onToggle }: StatusToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-10 px-4 rounded-xl flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm"
        >
          <span className="text-sm font-normal text-zinc-900 dark:text-zinc-100">
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <Settings className="size-4 text-zinc-400 dark:text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px] rounded-xl p-1.5 border-zinc-200 dark:border-zinc-800">
        <DropdownMenuItem 
          onClick={() => onToggle(true)}
          className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
        >
          <span className="font-normal text-sm">Enabled</span>
          {enabled && <Check className="size-4 text-emerald-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onToggle(false)}
          className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
        >
          <span className="font-normal text-sm">Disabled</span>
          {!enabled && <Check className="size-4 text-emerald-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
