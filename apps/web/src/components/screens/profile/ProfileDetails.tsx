"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Shield, Phone, MapPin, Share2, CheckCircle2 } from "lucide-react";
import type { AppUser, UserRole } from "@/store/use-app-store";

const roleQuotes: Record<UserRole, string> = {
  super_admin: "Commanding the platform and steering the digital infrastructure of our schools.",
  admin: "Empowering educators, managing resources, and shaping the future of education.",
  teacher: "Teaching is the greatest act of optimism. Inspiring minds, one class at a time.",
  student: "Knowledge is power. Success is the sum of small efforts, repeated day in and day out.",
  parent: "Supporting children's learning journey and fostering collaboration with the school.",
  staff: "Ensuring operations run smoothly to cultivate an environment of learning excellence.",
};

interface ProfileDetailsProps {
  user: AppUser;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  onEditClick: () => void;
  onCopySchoolUrl: () => void;
  getSchoolUrl: () => string;
}

export function ProfileDetails({
  user,
  onCopy,
  copiedField,
  onEditClick,
  onCopySchoolUrl,
  getSchoolUrl,
}: ProfileDetailsProps) {
  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg font-bold">Profile Details</CardTitle>
          <CardDescription>Personal verified identification records of your school account.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          {user.role === "admin" && (
            <Button
              onClick={onCopySchoolUrl}
              className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-bold rounded-xl text-xs gap-1.5 h-9 w-full sm:w-auto justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-500/25 active:translate-y-0 active:scale-[0.98]"
            >
              <Share2 className="size-3.5" />
              {copiedField === "SchoolUrl" ? "Copied URL!" : "Copy School Portal URL"}
            </Button>
          )}
          <Button 
            onClick={onEditClick} 
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold rounded-xl text-xs gap-1.5 h-9 w-full sm:w-auto justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.98]"
          >
            Edit Profile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl space-y-1 relative group">
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Full Name</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-6">{user.name}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopy(user.name, "Name")}
              className="size-7 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-400/80 dark:hover:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {copiedField === "Name" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          <div className="p-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl space-y-1 relative group">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Email Address</p>
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 font-bold">Verified</Badge>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-6">{user.email}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopy(user.email, "Email")}
              className="size-7 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-400/80 dark:hover:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {copiedField === "Email" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          <div className="p-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Primary Authority Role</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="size-4 text-emerald-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{user.role.replace("_", " ")}</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl space-y-1 relative group">
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Mobile Number</p>
            <div className="flex items-center gap-1.5 mt-0.5 pr-6">
              <Phone className="size-4 text-blue-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {user.phone || "Not set"}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!user.phone}
              onClick={() => onCopy(user.phone || "", "Mobile Number")}
              className="size-7 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-400/80 dark:hover:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {copiedField === "Mobile Number" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          <div className="p-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl space-y-1 relative group md:col-span-2">
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Residential Address</p>
            <div className="flex items-start gap-1.5 mt-0.5 pr-6">
              <MapPin className="size-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-normal">
                {user.address || "Not set"}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!user.address}
              onClick={() => onCopy(user.address || "", "Address")}
              className="size-7 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-400/80 dark:hover:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {copiedField === "Address" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          {user.role !== "super_admin" && (
            <>
              {user.role === "admin" && (
                <div className="p-4 bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/15 rounded-xl space-y-2 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative group">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400">Shareable School Portal URL</p>
                    <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 break-all">
                      {getSchoolUrl()}
                    </p>
                  </div>
                  <Button
                    onClick={onCopySchoolUrl}
                    variant="outline"
                    className="h-8 border-violet-500/25 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg shrink-0 gap-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
                  >
                    {copiedField === "SchoolUrl" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    Copy URL
                  </Button>
                </div>
              )}
              <div className="p-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl space-y-1 relative group">
                <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">School URL Identifier</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-all pr-10">{user.tenantSlug || "N/A"}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCopy(user.tenantSlug || "", "School Identifier")}
                  className="size-10 sm:size-7 absolute right-2 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  {copiedField === "School Identifier" ? <Check className="size-4 sm:size-3.5 text-green-500" /> : <Copy className="size-4 sm:size-3.5" />}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-zinc-900 border border-violet-100 dark:border-violet-950/50 rounded-2xl flex items-start gap-3 mt-6">
          <CheckCircle2 className="size-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-950 dark:text-violet-200">Role Purpose & Duty</p>
            <p className="text-xs text-violet-700 dark:text-violet-300/85 mt-1 leading-relaxed italic">
              &ldquo;{roleQuotes[user.role]}&rdquo;
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
