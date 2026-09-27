"use client";

import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useTenantMetadata } from "@/lib/graphql/hooks/platform.hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Crown, 
  Calendar, 
  Users, 
  UserPlus, 
  School, 
  Heart,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Settings
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useRouter, useParams } from "next/navigation";
import React from "react";
import { SchoolPlan } from "@/lib/billing-constants";

export function SchoolSubscriptionScreen() {
  const { currentTenantId } = useAppStore();
  const { data: detailData, isLoading } = useTenantMetadata(currentTenantId || "");

  const { push } = useRouter();
  const { slug } = useParams();
  const [isAutoPay, setIsAutoPay] = useState(true);

  const tenant = detailData?.tenant;

  const planInfo = React.useMemo(() => {
    if (!tenant?.plan) return { name: "Starter Plan", license: "Starter License" };
    const planId = tenant.plan.toLowerCase();
    if (planId === "basic") {
      return { name: "Starter Plan", license: "Starter License" };
    }
    if (planId === "standard") {
      return { name: "Growth Plan", license: "Growth License" };
    }
    if (planId === "premium") {
      return { name: "Institution Plan", license: "Institution License" };
    }
    return { name: `${tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} Plan`, license: "School License" };
  }, [tenant?.plan]);

  const formattedStartDate = React.useMemo(() => {
    if (!tenant?.startDate) return "";
    try {
      return format(new Date(tenant.startDate), "MMM d, yyyy");
    } catch (e) {
      return tenant.startDate || "";
    }
  }, [tenant]);

  const formattedEndDate = React.useMemo(() => {
    if (!tenant?.endDate) return "Permanent";
    try {
      return format(new Date(tenant.endDate), "MMM d, yyyy");
    } catch (e) {
      return tenant.endDate;
    }
  }, [tenant]);

  if (isLoading) {
    return <div className="p-8 text-center font-bold text-violet-600 animate-pulse">Loading subscription details...</div>;
  }

  if (!tenant) {
    return <div className="p-8 text-center text-muted-foreground">Could not load subscription information.</div>;
  }

  const now = new Date();
  const expiry = tenant.endDate ? new Date(tenant.endDate) : null;
  const daysRemaining = expiry ? differenceInDays(expiry, now) : null;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const usageStats = [
    { 
      label: "Students", 
      icon: <Users className="size-4" />, 
      current: tenant.studentCount || 0, 
      max: tenant.maxStudents,
      color: "bg-blue-500"
    },
    { 
      label: "Teachers", 
      icon: <UserPlus className="size-4" />, 
      current: tenant.teacherCount || 0, 
      max: tenant.maxTeachers,
      color: "bg-emerald-500"
    },
    { 
      label: "Parents", 
      icon: <Heart className="size-4" />, 
      current: tenant.parentCount || 0, 
      max: tenant.maxParents,
      color: "bg-rose-500"
    },
    { 
      label: "Classes", 
      icon: <School className="size-4" />, 
      current: tenant.maxClasses > 0 ? (tenant._count?.classes || 0) : 0, 
      max: tenant.maxClasses,
      color: "bg-amber-500"
    },
  ];


  const handleToggleAutoPay = (checked: boolean) => {
    setIsAutoPay(checked);
    toast.success(checked ? "Auto-renewal enabled" : "Auto-renewal disabled", {
      description: checked 
        ? "Your plan will now automatically renew on the 1st of each month." 
        : "You will need to manually renew your plan before it expires."
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-14 sm:size-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden shrink-0">
            <img src={tenant.logo || "/test.webp"} alt={tenant.name} className="size-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Subscription</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Monitor your school's plan, limits, and usage.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            size="sm"
            className="w-full sm:w-auto gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 dark:shadow-none transition-all hover:scale-105 rounded-xl h-10 px-6"
            onClick={() => push(`/${slug}/manage-plan`)}
          >
            <ArrowUpCircle className="size-4" />
            Manage Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-sm bg-gradient-to-br from-violet-600 to-violet-700 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors" />
          <CardContent className="p-8 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 capitalize text-xs font-bold tracking-wide">
                  {planInfo.name}
                </Badge>
                <div>
                  <h3 className="text-2xl sm:text-4xl font-semibold tracking-tight">{tenant.name}</h3>
                  <p className="opacity-80 mt-1 font-medium text-sm sm:text-lg">{planInfo.license}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-2 sm:pt-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase tracking-widest font-black">Subscription Start</p>
                      <p className="font-bold text-base sm:text-lg" suppressHydrationWarning>{formattedStartDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase tracking-widest font-black">Next Renewal</p>
                      <p className="font-bold text-base sm:text-lg" suppressHydrationWarning>{formattedEndDate}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="size-16 sm:size-28 rounded-2xl sm:rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-sm overflow-hidden">
                  <img 
                    src={tenant.logo || "/test.webp"} 
                    alt={tenant.name} 
                    className="size-full object-cover" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="size-5 text-violet-600" />
              Quick Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge className={cn(
                "px-3 py-1 rounded-full",
                tenant.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'
              )}>
                {tenant.status.toUpperCase()}
              </Badge>
            </div>
            <div className="pt-2 space-y-4">
              <div className="text-center p-4 rounded-2xl border-2 border-violet-50 dark:border-violet-900/30">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Time Remaining</p>
                <p className={`text-4xl font-black mt-2 ${isExpired ? 'text-rose-500' : 'text-violet-600 dark:text-violet-400'}`} suppressHydrationWarning>
                  {daysRemaining !== null ? (isExpired ? "Expired" : `${daysRemaining}d`) : "∞"}
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <CreditCard className="size-4 text-violet-600" />
                      Auto-Renewal
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                      {isAutoPay ? "Secured" : "Manual"}
                    </p>
                  </div>
                  <Switch checked={isAutoPay} disabled className="opacity-100 data-[state=checked]:bg-emerald-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm overflow-hidden border-t-4 border-t-violet-600">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Building2 className="size-5 text-violet-600" />
              Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {usageStats.map((stat) => {
              const percentage = Math.min(100, (stat.current / stat.max) * 100);
              return (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg", stat.color.replace('bg-', 'bg-') + '/10')}>
                        {React.cloneElement(stat.icon as React.ReactElement<any>, { 
                          className: cn("size-4", stat.color.replace('bg-', 'text-')) 
                        })}
                      </div>
                      <span className="font-bold">{stat.label}</span>
                    </div>
                    <span className="text-muted-foreground text-xs font-mono font-bold">
                      {stat.current.toLocaleString()} / {stat.max.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2.5 rounded-full" indicatorClassName={stat.color} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden border-t-4 border-t-emerald-500">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-500" />
              Active Privileges
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Unlimited Staff Management",
                "Advanced Fee Collection",
                "Custom Exam Report Cards",
                "Teacher & Student Attendance",
                "Support Ticket System",
                "Academic Year History",
                "Mobile App Sync",
                "Cloud Storage"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all">
                  <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="size-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}


function Building2({ className }: { className?: string }) {
  return <School className={className} />;
}
