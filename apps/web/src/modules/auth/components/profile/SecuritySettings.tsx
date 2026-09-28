"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Laptop, Lock, KeyRound, PanelLeftOpen, PanelLeftClose, LayoutDashboard, Zap } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

interface SecuritySettingsProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  onPasswordChange: () => void;
  userRole: string;
}

export function SecuritySettings({ theme, setTheme, onPasswordChange, userRole }: SecuritySettingsProps) {
  const { setSidebarOpen } = useAppStore();
  const [sidebarPref, setSidebarPref] = useState<string>("disabled");
  const [dashboardPref, setDashboardPref] = useState<string>("comprehensive");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sPref = localStorage.getItem("schoolsaas_staff_sidebar_preference");
      setSidebarPref(sPref || "disabled");

      const dPref = localStorage.getItem("schoolsaas_dashboard_layout_preference");
      setDashboardPref(dPref || (userRole === "staff" ? "minimal" : "comprehensive"));
    }
  }, [userRole]);

  const handleSidebarPrefChange = (pref: string) => {
    setSidebarPref(pref);
    if (typeof window !== "undefined") {
      localStorage.setItem("schoolsaas_staff_sidebar_preference", pref);
      window.dispatchEvent(new CustomEvent("schoolsaas_staff_sidebar_pref_changed", { detail: pref }));
    }
    setSidebarOpen(pref === "enabled");
  };

  const handleDashboardPrefChange = (pref: string) => {
    setDashboardPref(pref);
    if (typeof window !== "undefined") {
      localStorage.setItem("schoolsaas_dashboard_layout_preference", pref);
      window.dispatchEvent(new CustomEvent("schoolsaas_dashboard_layout_pref_changed", { detail: pref }));
    }
  };

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Preferences & Security</CardTitle>
        <CardDescription>Customize your workspace themes and lock down credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appearance Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold">Workspace Appearance Mode</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Select a premium color scheme tailored for maximum comfort.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
            >
              <Sun className="size-5 text-amber-500" />
              <span className="text-xs">Light Theme</span>
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
            >
              <Moon className="size-5 text-blue-400" />
              <span className="text-xs">Dark Theme</span>
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
              className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
            >
              <Laptop className="size-5 text-zinc-500" />
              <span className="text-xs">System Default</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Preference Section (For Admin, Teacher, and Parent) */}
        {(userRole === "admin" || userRole === "teacher" || userRole === "parent") && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold">Dashboard Style Preference</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose the layout style of your homepage dashboard.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant={dashboardPref === "comprehensive" ? "default" : "outline"}
                  onClick={() => handleDashboardPrefChange("comprehensive")}
                  className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
                >
                  <LayoutDashboard className="size-5 text-violet-500" />
                  <div className="text-center">
                    <p className="text-xs">Comprehensive</p>
                    <p className="text-[10px] opacity-75 font-normal">Analytics, stats & widgets</p>
                  </div>
                </Button>
                <Button
                  variant={dashboardPref === "minimal" ? "default" : "outline"}
                  onClick={() => handleDashboardPrefChange("minimal")}
                  className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
                >
                  <Zap className="size-5 text-amber-500" />
                  <div className="text-center">
                    <p className="text-xs">Minimal (Quick Actions)</p>
                    <p className="text-[10px] opacity-75 font-normal">Fast, clean action grid</p>
                  </div>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Sidebar Preference Section for Staff */}
        {userRole === "staff" && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold">Sidebar Mode Preference</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose if you want the navigation sidebar open or minimized by default.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant={sidebarPref === "disabled" ? "default" : "outline"}
                  onClick={() => handleSidebarPrefChange("disabled")}
                  className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
                >
                  <PanelLeftClose className="size-5 text-indigo-500" />
                  <div className="text-center">
                    <p className="text-xs">Minimize Sidebar (Default)</p>
                    <p className="text-[10px] opacity-75 font-normal">More workspace area</p>
                  </div>
                </Button>
                <Button
                  variant={sidebarPref === "enabled" ? "default" : "outline"}
                  onClick={() => handleSidebarPrefChange("enabled")}
                  className="h-auto py-4 min-h-[5rem] px-3 flex flex-col gap-2 rounded-xl justify-center items-center font-bold"
                >
                  <PanelLeftOpen className="size-5 text-emerald-500" />
                  <div className="text-center">
                    <p className="text-xs">Expand Sidebar</p>
                    <p className="text-[10px] opacity-75 font-normal">Keep links visible</p>
                  </div>
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-orange-500" />
              <h4 className="text-sm font-semibold">Account Access Code</h4>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Secure password used to authenticate your login sessions. Update regularly to prevent breach.
            </p>
          </div>
          <Button
            onClick={onPasswordChange}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center gap-2"
          >
            <KeyRound className="size-4" /> Change Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
