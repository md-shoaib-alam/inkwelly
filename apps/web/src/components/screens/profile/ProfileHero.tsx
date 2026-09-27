"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Mail, Building2, Clock } from "lucide-react";
import type { AppUser, UserRole } from "@/store/use-app-store";

const roleGradients: Record<UserRole, string> = {
  super_admin: "from-teal-600 via-teal-700 to-teal-800",
  admin: "from-emerald-600 via-emerald-700 to-emerald-800",
  teacher: "from-blue-600 via-blue-700 to-blue-800",
  student: "from-violet-600 via-violet-700 to-violet-800",
  parent: "from-amber-600 via-amber-700 to-amber-800",
  staff: "from-orange-600 via-orange-700 to-orange-800",
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Platform Super Admin",
  admin: "School Administrator",
  teacher: "Faculty Educator",
  student: "Academic Student",
  parent: "Student Guardian",
  staff: "Operations Staff",
};

interface ProfileHeroProps {
  user: AppUser;
  initials: string;
  onEditClick: () => void;
  tenantName: string | null;
}

export function ProfileHero({ user, initials, onEditClick, tenantName }: ProfileHeroProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${roleGradients[user.role]} p-6 md:p-8 text-white shadow-xl`}>
      <div className="absolute -right-20 -top-20 size-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 size-60 rounded-full bg-black/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 z-10">
        <button 
          type="button"
          onClick={onEditClick}
          className="relative group cursor-pointer shrink-0 bg-transparent border-none p-0"
          title="Click to edit profile"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEditClick();
            }
          }}
        >
          <Avatar className="size-24 border-4 border-white/30 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-white/50">
            <AvatarImage src={user.avatar} alt={user.name} className="object-cover animate-in fade-in" />
            <AvatarFallback className="text-3xl font-extrabold bg-white text-zinc-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-4 border-transparent">
            <Camera className="size-5 text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest mt-1">Change</span>
          </div>
          <span className="absolute bottom-1 right-1 flex size-4">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-4 bg-green-500 border-2 border-white"></span>
          </span>
        </button>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
              <p className="text-white/80 font-medium text-sm flex items-center justify-center md:justify-start gap-1.5 mt-1">
                <Mail className="size-3.5" /> {user.email}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs px-3 py-1 font-bold">
                {roleLabels[user.role]}
              </Badge>
              {user.customRole?.name && (
                <Badge variant="secondary" className="bg-rose-500/80 hover:bg-rose-500 text-white border-0 text-xs px-3 py-1 font-bold">
                  Role: {user.customRole.name}
                </Badge>
              )}
            </div>
          </div>

          <Separator className="bg-white/20 my-4" />

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-white/95">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-white/70" />
              <span className="font-semibold">
                School: {user.role === "super_admin" ? "SaaS Platform Management" : tenantName || user.tenantName || "NutKhut School"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-white/70" />
              <span>Verified Account Logged In</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
