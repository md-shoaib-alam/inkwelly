"use client";

import { useState } from "react";
import { LayoutGrid, ArrowRight, ChevronRight, Headphones, FileText, FileCode2, Shield, Eye } from "lucide-react";
import { ROLE_TEMPLATES } from "./types";
import { cn } from "@/lib/utils";

interface RoleTemplatesProps {
  onSelectTemplate: (template: (typeof ROLE_TEMPLATES)[0]) => void;
  isMobileTab?: boolean;
}

function getTemplateIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("support")) return <Headphones className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("bill")) return <FileText className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("moderator") || lower.includes("content")) return <FileCode2 className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("secur")) return <Shield className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("read") || lower.includes("view")) return <Eye className="size-4 sm:size-4.5 stroke-[2.2]" />;
  return <Shield className="size-4 sm:size-4.5 stroke-[2.2]" />;
}

function getTemplateIconBoxStyle(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("support")) return "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-100 dark:border-blue-900/40";
  if (lower.includes("bill")) return "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900/40";
  if (lower.includes("moderator") || lower.includes("content")) return "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-100 dark:border-purple-900/40";
  if (lower.includes("secur")) return "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-100 dark:border-rose-900/40";
  if (lower.includes("read") || lower.includes("view")) return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40";
  return "bg-muted text-muted-foreground border-border";
}

function getTemplateBadgeStyle(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("support")) return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40";
  if (lower.includes("bill")) return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40";
  if (lower.includes("moderator") || lower.includes("content")) return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40";
  if (lower.includes("secur")) return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40";
  if (lower.includes("read") || lower.includes("view")) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40";
  return "bg-muted text-foreground border border-border";
}

export function RoleTemplates({ onSelectTemplate, isMobileTab = false }: RoleTemplatesProps) {
  const [showAll, setShowAll] = useState(true);

  const displayedTemplates = showAll ? ROLE_TEMPLATES : ROLE_TEMPLATES.slice(0, 6);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden p-3.5 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/80 dark:border-blue-900/40 shrink-0">
            <LayoutGrid className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground leading-tight">
              Role Templates
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Pre-configured roles: click to create
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{showAll ? "Show Less" : "View All"}</span>
          <ChevronRight className={cn("size-3.5 transition-transform", showAll && "rotate-90")} />
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {displayedTemplates.map((template) => {
          const permCount = Object.values(template.permissions).flat().length;

          return (
            <div
              key={template.name}
              onClick={() => onSelectTemplate(template)}
              className="group relative flex items-center justify-between rounded-xl border border-border bg-card hover:border-blue-200 dark:hover:border-blue-800/60 hover:bg-muted/40 transition-all cursor-pointer p-2.5 sm:p-3"
            >
              {/* Left Side: Icon + Details */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                <div
                  className={cn(
                    "size-8.5 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs transition-transform group-hover:scale-105",
                    getTemplateIconBoxStyle(template.name)
                  )}
                >
                  {getTemplateIcon(template.name)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-foreground truncate">
                    {template.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Right Side: Badge + Action Button */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-tight shrink-0 whitespace-nowrap",
                    getTemplateBadgeStyle(template.name)
                  )}
                >
                  {permCount} Perms
                </span>

                {/* Desktop: Use Template button */}
                <button
                  type="button"
                  tabIndex={-1}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-[11px] font-semibold shadow-2xs group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pointer-events-none"
                >
                  <span>Use</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Mobile: Chevron Right */}
                <div className="sm:hidden text-muted-foreground pl-0.5">
                  <ChevronRight className="size-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
