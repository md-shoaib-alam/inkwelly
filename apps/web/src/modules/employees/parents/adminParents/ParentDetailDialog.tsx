"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  User,
  Sparkles,
  Users,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import { ParentInfo, getAvatarColor, getInitials } from "./types";

interface ParentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent: ParentInfo | null;
  onLinkClick?: (parent: ParentInfo) => void;
}

export function ParentDetailDialog({
  open,
  onOpenChange,
  parent,
  onLinkClick,
}: ParentDetailDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!parent) return null;

  const handleCopy = (text: string, fieldName: string) => {
    copyToClipboard(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none bg-card shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        {/* Profile Card Header Info */}
        <div className="px-6 pt-6 pb-5 border-b shrink-0 relative">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-4 pr-8">
            Parent Profile
          </div>

          <div className="flex flex-row items-center gap-4 text-left">
            {/* Avatar Circle */}
            <div className="size-16 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl font-bold shadow-md shrink-0">
              {getInitials(parent.name)}
            </div>

            <div className="flex-1 space-y-1 py-0.5 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground tracking-tight text-left truncate">
                {parent.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Parent details and linked children profile.
              </DialogDescription>
              <div className="flex flex-wrap items-center justify-start gap-2">
                <Badge variant="secondary" className="bg-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-medium">
                  Parent / Guardian
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details Body Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="size-3.5 text-emerald-600" />
              Contact Details
            </h3>
            <div className="space-y-3">
              {/* Parent Login ID */}
              {parent.username && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <User className="size-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase leading-none">Parent Login ID</p>
                      <p className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-300 truncate mt-1">{parent.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-emerald-600 hover:text-emerald-700"
                      onClick={() => handleCopy(parent.username || '', 'Parent ID')}
                    >
                      {copiedField === 'Parent ID' ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Mail className="size-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase leading-none">Email Address</p>
                    <p className="text-sm font-semibold text-foreground truncate mt-1">{parent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-emerald-600"
                    onClick={() => handleCopy(parent.email, 'Email')}
                  >
                    {copiedField === 'Email' ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Phone className="size-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase leading-none">Phone Number</p>
                    <p className="text-sm font-semibold text-foreground truncate mt-1">{parent.phone || "—"}</p>
                  </div>
                </div>
                {parent.phone && parent.phone !== "—" && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-emerald-600"
                      onClick={() => handleCopy(parent.phone || '', 'Phone')}
                    >
                      {copiedField === 'Phone' ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Occupation */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                <Briefcase className="size-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase leading-none">Occupation</p>
                  <p className="text-sm font-semibold text-foreground truncate mt-1">{parent.occupation || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Linked Children Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5 text-emerald-600" />
                Linked Children ({parent.children.length})
              </h3>
              {onLinkClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7.5 text-[10px] sm:text-[11px] border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 rounded-b-sm gap-1.5 font-semibold"
                  onClick={() => {
                    onOpenChange(false);
                    onLinkClick(parent);
                  }}
                >
                  <LinkIcon className="size-3" />
                  <span>Link Child</span>
                </Button>
              )}
            </div>

            {parent.children.length === 0 ? (
              <div className="border border-dashed border-muted p-6 rounded-xl text-center">
                <GraduationCap className="size-6 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground font-medium">No children linked to this parent</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parent.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {child.gender === "male" ? "👦" : "👧"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {child.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {child.className || "Unassigned"} • Roll {child.rollNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-secondary/20 border-t flex justify-end shrink-0">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/10"
            onClick={() => onOpenChange(false)}
          >
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
