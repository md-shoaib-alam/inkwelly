"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { 
  Bell, 
  Users, 
  Building2, 
  History,
  CheckCircle2,
  Info,
  Send,
  Trash2,
  Loader2,
  Lightbulb,
  Eye,
  Zap,
  RotateCcw,
  Megaphone,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  useTenants, 
  useGraphQLMutation, 
  useGraphQLQuery,
  SEND_GLOBAL_NOTICE,
  PLATFORM_NOTICES,
  DELETE_PLATFORM_NOTICE 
} from "@/lib/graphql/hooks";
import { formatDistanceToNow } from "date-fns";

const getNoticeDistanceToNow = (createdAt: string) => {
  try {
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? "recently" : formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "recently";
  }
};

export function SuperAdminPlatformNotices() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("all_schools");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [sending, setSending] = useState(false);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [showHowItWorksOnMobile, setShowHowItWorksOnMobile] = useState(false);

  const { data: tenantsData } = useTenants({ limit: 100 });
  const tenants = tenantsData?.tenants || [];

  // Fetch Real History
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useGraphQLQuery<{
    platformNotices: Array<{
      id: string;
      title: string;
      content: string;
      target: string;
      isActive: boolean;
      createdAt: string;
    }>
  }>(
    ["platform-notices-history"],
    PLATFORM_NOTICES,
    { limit: 20 }
  );

  const { mutateAsync: sendNotice } = useGraphQLMutation<{ 
    sendGlobalNotice: { success: boolean; message: string } 
  }, any>(SEND_GLOBAL_NOTICE);

  const { mutateAsync: deleteNotice } = useGraphQLMutation<{
    deletePlatformNotice: { success: boolean; message: string }
  }, { id: string }>(DELETE_PLATFORM_NOTICE);

  const handleSend = async () => {
    if (!title || !body) {
      toast.error("Please fill in both title and body");
      return;
    }

    setSending(true);
    try {
      const result = await sendNotice({
        title,
        body,
        target: targetType,
        schoolId: (targetType === 'specific_school' || targetType === 'school_parents') ? selectedSchool : null
      });

      const response = result.sendGlobalNotice;

      if (response.success) {
        toast.success(response.message || "Notice sent successfully");
        setTitle("");
        setBody("");
        refetchHistory();
      } else {
        toast.error(response.message || "Failed to send notice");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while sending notice");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteNotice({ id });
      if (result.deletePlatformNotice.success) {
        toast.success("Notice deleted successfully");
        refetchHistory();
      } else {
        toast.error("Failed to delete notice");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting notice");
    }
  };

  const getTargetLabel = (target: string) => {
    const labels: Record<string, string> = {
      all_schools: "All School Admins",
      specific_school: "Specific School",
      all_parents: "All Parents (Global)",
      school_parents: "School Parents",
      all_super_admins: "All Super Admins",
      everyone: "Everyone (Platform-wide)",
    };
    return labels[target] || target;
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* 1. Top Header Banner matching screenshot */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-blue-50/30 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 border border-amber-100/90 dark:border-amber-900/30 px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-amber-400/15 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-blue-300/15 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Copy */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="size-11 sm:size-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 shadow-2xs">
              <Bell className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                Notices
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
                Send global notices that appear in the platform bar for all users.
              </p>
            </div>
          </div>

          {/* Right illustration / badge widget */}
          <div className="relative flex items-center justify-end shrink-0">
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-border shadow-2xs text-xs font-semibold text-foreground">
              <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Megaphone className="size-3.5" />
              </div>
              <div className="text-left">
                <p className="leading-tight text-xs font-bold text-foreground">Keep everyone informed</p>
                <p className="text-[10px] text-muted-foreground font-normal">with important updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Layout: How it works on top in mobile, then Compose Notice & History */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left 2 Columns: Compose Notice Card (order-2 on mobile, standard on lg) */}
        <div className="order-2 lg:order-1 lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4 sm:space-y-5">
          <div className="space-y-4 sm:space-y-5">
            {/* Header with Edit/Compose icon */}
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
              <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight">Compose Notice</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  Create a message that will be pinned to the top of the platform for targeted users.
                </p>
              </div>
            </div>

            {/* Recipient Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Recipient Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger className="h-9.5 text-xs rounded-xl bg-background border-border">
                    <div className="flex items-center gap-2 truncate">
                      <Users className="size-3.5 text-muted-foreground shrink-0" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all_schools">All School Admins</SelectItem>
                    <SelectItem value="specific_school">Specific School Admins</SelectItem>
                    <SelectItem value="all_parents">All Parents (Global)</SelectItem>
                    <SelectItem value="school_parents">Parents of Specific School</SelectItem>
                    <SelectItem value="all_super_admins">All Super Admins</SelectItem>
                    <SelectItem value="everyone">Everyone (Platform-wide)</SelectItem>
                  </SelectContent>
                </Select>

                {(targetType === 'specific_school' || targetType === 'school_parents') && (
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-background border-border">
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Select a school" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-normal">Select who will see this notice.</p>
            </div>

            {/* Notice Title */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-title" className="text-xs font-semibold text-foreground">Notice Title</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input 
                  id="notice-title" 
                  placeholder="e.g. Platform Update: New Grading System" 
                  maxLength={100}
                  className="pl-9 h-9.5 text-xs rounded-xl bg-background border-border"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-normal">
                <span>Write a clear and concise title.</span>
                <span>{title.length}/100</span>
              </div>
            </div>

            {/* Notice Content */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-body" className="text-xs font-semibold text-foreground">Notice Content</Label>
              <div className="relative">
                <Textarea 
                  id="notice-body" 
                  placeholder="Type the notice details here..." 
                  maxLength={1000}
                  className="min-h-[140px] text-xs rounded-xl bg-background border-border p-3 leading-relaxed"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-normal">
                <span>This message will be shown in the top bar for selected users.</span>
                <span>{body.length}/1000</span>
              </div>
            </div>

            {/* Live Notice Bar Preview Box matching screenshot */}
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-3 sm:p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="size-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">Preview</p>
                    <p className="text-[11px] text-muted-foreground">
                      Your notice will appear at the top of the platform for the selected users after publishing.
                    </p>
                  </div>
                </div>

                {/* The simulated notice chip */}
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-[11px] font-medium text-amber-900 dark:text-amber-200 max-w-sm shrink-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <Bell className="size-3 text-amber-600 shrink-0" />
                    <span className="truncate">{title || "This is a preview of your notice message..."}</span>
                  </div>
                  <X className="size-3 text-amber-700/60 shrink-0 cursor-pointer hover:text-amber-900" />
                </div>
              </div>
            </div>

            {/* Buttons: Reset & Publish */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 px-4 text-xs font-semibold rounded-xl border-border hover:bg-muted cursor-pointer"
                onClick={() => { setTitle(""); setBody(""); }}
              >
                Reset
              </Button>
              <Button 
                size="sm"
                className="h-9 px-4 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-2xs cursor-pointer"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Publish Notice</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: How it works & Notice History */}
        <div className="contents lg:flex lg:flex-col lg:space-y-5">
          {/* How It Works Card (order-1 on Mobile, always on top on mobile; standard column on desktop) */}
          <div className="order-1 lg:order-none rounded-2xl border border-border bg-card px-3.5 py-2.5 sm:p-5 shadow-2xs space-y-2 sm:space-y-4">
            <div 
              onClick={() => setShowHowItWorksOnMobile((prev) => !prev)}
              className="flex items-center justify-between gap-2.5 cursor-pointer lg:cursor-default"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 sm:size-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lightbulb className="size-3.5 sm:size-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-none">How it works</h4>
                  <p className="hidden lg:block text-xs text-muted-foreground mt-1 leading-snug">
                    Platform notices are global and appear in a high-visibility bar at the top of the application for all targeted users.
                  </p>
                </div>
              </div>

              {/* Mobile Show/Hide Dropdown Pill */}
              <div className="flex lg:hidden items-center gap-1.5 text-xs text-muted-foreground font-medium px-2.5 py-1 rounded-xl bg-muted/60 hover:bg-muted transition-colors shrink-0">
                <span>{showHowItWorksOnMobile ? "Hide" : "Show"}</span>
                {showHowItWorksOnMobile ? (
                  <ChevronUp className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Collapsible Features List on Mobile */}
            <div className={`${showHowItWorksOnMobile ? "space-y-3 pt-2 border-t border-border/50 lg:border-t-0" : "hidden lg:block lg:space-y-3 lg:pt-1"}`}>
              {/* Feature 1 */}
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">High Visibility</p>
                  <p className="text-[11px] text-muted-foreground">Appears in the top global bar</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Targeted Users</p>
                  <p className="text-[11px] text-muted-foreground">Send to specific roles or all users</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Real-time Update</p>
                  <p className="text-[11px] text-muted-foreground">Visible immediately after publishing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notice History Card (order-3 on mobile, standard column on desktop) */}
          <div className="order-3 lg:order-none rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <History className="size-3.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Notice History</h4>
              </div>
              <button 
                type="button"
                onClick={() => refetchHistory()}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="space-y-2.5 py-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-border bg-muted/20"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3.5 w-36 rounded-md" />
                      <Skeleton className="size-5 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-48 rounded-md" />
                    <div className="flex items-center gap-2 mt-1">
                      <Skeleton className="h-3 w-16 rounded-md" />
                      <Skeleton className="h-3 w-14 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {(historyData?.platformNotices || []).length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center">
                    <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/40 mb-2">
                      <FileText className="size-6" />
                    </div>
                    <p className="text-xs font-bold text-foreground">No notice history found.</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Published notices will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {historyData?.platformNotices.map((notice) => (
                      <div key={notice.id} className="group relative flex flex-col gap-1 p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-foreground leading-snug truncate pr-6">{notice.title}</p>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button 
                                type="button"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
                                title="Delete Notice"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg font-semibold">Delete Notice</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Are you sure you want to delete <strong className="text-foreground">{notice.title}</strong>? This will remove it from all user dashboards instantly.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-xl text-xs font-medium">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium"
                                  onClick={() => handleDelete(notice.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{notice.content}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border/50">
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="size-2.5" />
                            {getTargetLabel(notice.target)}
                          </span>
                          <span suppressHydrationWarning>
                            {getNoticeDistanceToNow(notice.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

