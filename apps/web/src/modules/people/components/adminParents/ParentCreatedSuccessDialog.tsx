"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Copy,
  CheckCircle2,
  ExternalLink,
  Mail,
  Share2,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Plus,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import { getInitials } from "./types";

export interface ParentCreatedData {
  id?: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  username: string;
  password?: string;
}

interface ParentCreatedSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ParentCreatedData | null;
  onAddAnother?: () => void;
  onViewProfile?: (parentId: string) => void;
}

export function ParentCreatedSuccessDialog({
  open,
  onOpenChange,
  data,
  onAddAnother,
  onViewProfile,
}: ParentCreatedSuccessDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!data) return null;

  const loginId = data.username || "—";
  const password = data.password || "changeme123";

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCopyBoth = () => {
    const text = `Parent Portal Login Details:\nParent Login ID: ${loginId}\nPassword: ${password}\nLogin Portal: ${window.location.origin}/login`;
    copyToClipboard(text);
    setCopiedField("both");
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Login ID and Password copied to clipboard");
  };

  const handleShareWhatsApp = () => {
    const message = `Hello ${data.name},\nHere are your Parent Portal login credentials:\n\nParent Login ID: ${loginId}\nPassword: ${password}\nPortal: ${window.location.origin}/login\n\nPlease keep these credentials secure.`;
    const cleanPhone = (data.phone || "").replace(/\D/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("Your School Parent Portal Login Credentials");
    const body = encodeURIComponent(
      `Dear ${data.name},\n\nYour parent account has been successfully created. Here are your login credentials:\n\nParent Login ID: ${loginId}\nPassword: ${password}\nPortal URL: ${window.location.origin}/login\n\nBest regards,\nSchool Administration`
    );
    window.location.href = `mailto:${data.email || ""}?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:w-[92vw] sm:max-w-2xl md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header with Mint Confetti Aura & Success Badge */}
        <div className="relative px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors z-20"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-start gap-4 pr-6">
            {/* Green Success Check Icon Badge */}
            <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Check className="size-6 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Parent Account Created Successfully!
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                The parent has been added to the system. You can now share the login credentials with them to access the parent portal.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-4 overscroll-contain touch-pan-y"
          data-lenis-prevent
        >
          {/* Card 1: Parent Summary Profile Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Soft Mint Initials Avatar */}
              <div className="size-14 sm:size-16 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/50">
                {getInitials(data.name)}
              </div>

              <div className="space-y-0.5 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {data.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {data.relationship || "Parent"}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {data.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400 shrink-0" />
                      {data.phone.startsWith("+") ? data.phone : `+91 ${data.phone}`}
                    </span>
                  )}
                  {data.email && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 text-slate-400 shrink-0" />
                      {data.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {onViewProfile && data.id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewProfile(data.id!)}
                className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 gap-2 shrink-0 self-start sm:self-center"
              >
                <ExternalLink className="size-3.5 text-emerald-600" />
                View Parent Profile
              </Button>
            )}
          </div>

          {/* Card 2: Login Credentials Section */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">🔗</span>
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Login Credentials
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 -mt-2">
              Share these credentials with the parent to access the parent portal.
            </p>

            {/* Inputs Box matching the screenshot */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Parent Login ID */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                    Parent Login ID
                  </span>
                  <div className="flex items-center h-10 px-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 tracking-wide select-all">
                      {loginId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(loginId, "Login ID")}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy Login ID"
                    >
                      {copiedField === "Login ID" ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                    Password
                  </span>
                  <div className="flex items-center h-10 px-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 tracking-wide select-all">
                      {showPassword ? password : "••••••••"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(password, "Password")}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy Password"
                      >
                        {copiedField === "Password" ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sharing Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                type="button"
                onClick={handleShareWhatsApp}
                className="h-10 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                <Share2 className="size-4" />
                Share via WhatsApp
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleShareEmail}
                className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 gap-2"
              >
                <Mail className="size-4 text-emerald-600" />
                Share via Email
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyBoth}
                className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 gap-2"
              >
                {copiedField === "both" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4 text-slate-500" />
                )}
                {copiedField === "both" ? "Copied Both!" : "Copy Both"}
              </Button>
            </div>
          </div>

          {/* Card 3: Important Notes Notice Box */}
          <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-xs text-slate-700 dark:text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-300">
              <Info className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
              Important Notes
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-zinc-400 text-[11px] sm:text-xs leading-relaxed">
              <li>This login ID and password allows the parent to access the parent portal.</li>
              <li>You can share these credentials via WhatsApp or Email using the buttons above.</li>
              <li>The parent can change their password after first login.</li>
              <li>If needed, you can reset the password anytime from the parent's profile.</li>
            </ul>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 sm:px-8 py-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (onAddAnother) onAddAnother();
            }}
            className="text-xs font-semibold text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl px-4 h-10 gap-1.5"
          >
            <Plus className="size-4 text-slate-500" />
            Add Another Parent
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl px-6 h-10 gap-1.5 shadow-sm"
          >
            <Plus className="size-4" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
