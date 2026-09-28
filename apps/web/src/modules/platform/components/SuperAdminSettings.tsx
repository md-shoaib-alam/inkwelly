"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useReducer } from "react";
import { Globe, Settings, Save, Loader2, ShieldAlert, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type State = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  loading: boolean;
  savingAll: boolean;
  savingMaintenance: boolean;
  defaultLanguage: string;
  defaultCurrency: string;
};

type Action =
  | { type: 'SET_DATA'; payload: Partial<State> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING_ALL'; payload: boolean }
  | { type: 'SET_SAVING_MAINTENANCE'; payload: boolean }
  | { type: 'SET_PLATFORM_NAME'; payload: string }
  | { type: 'SET_SUPPORT_EMAIL'; payload: string }
  | { type: 'SET_MAINTENANCE_MODE'; payload: boolean }
  | { type: 'SET_MAINTENANCE_MESSAGE'; payload: string }
  | { type: 'SET_DEFAULT_LANGUAGE'; payload: string }
  | { type: 'SET_DEFAULT_CURRENCY'; payload: string };

const initialState: State = {
  platformName: "SchoolSaaS",
  supportEmail: "support@schoolsaas.com",
  maintenanceMode: false,
  maintenanceMessage: "Our platform is currently undergoing scheduled maintenance. We will be back shortly. Thank you for your patience!",
  loading: true,
  savingAll: false,
  savingMaintenance: false,
  defaultLanguage: "en",
  defaultCurrency: "usd",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVING_ALL':
      return { ...state, savingAll: action.payload };
    case 'SET_SAVING_MAINTENANCE':
      return { ...state, savingMaintenance: action.payload };
    case 'SET_PLATFORM_NAME':
      return { ...state, platformName: action.payload };
    case 'SET_SUPPORT_EMAIL':
      return { ...state, supportEmail: action.payload };
    case 'SET_MAINTENANCE_MODE':
      return { ...state, maintenanceMode: action.payload };
    case 'SET_MAINTENANCE_MESSAGE':
      return { ...state, maintenanceMessage: action.payload };
    case 'SET_DEFAULT_LANGUAGE':
      return { ...state, defaultLanguage: action.payload };
    case 'SET_DEFAULT_CURRENCY':
      return { ...state, defaultCurrency: action.payload };
    default:
      return state;
  }
}

export function SuperAdminSettings() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    platformName,
    supportEmail,
    maintenanceMode,
    maintenanceMessage,
    loading,
    savingAll,
    savingMaintenance,
    defaultLanguage,
    defaultCurrency,
  } = state;

  // Fetch platform settings from DB on mount
  useEffect(() => {
    const fetchSettings = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const res = await apiFetch("/api/platform-settings/all");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const updates: Partial<State> = {};
            data.forEach((setting: { key: string; value: string }) => {
              switch (setting.key) {
                case "platform_name":
                  if (setting.value) updates.platformName = setting.value;
                  break;
                case "support_email":
                  if (setting.value) updates.supportEmail = setting.value;
                  break;
                case "default_language":
                  if (setting.value) updates.defaultLanguage = setting.value;
                  break;
                case "default_currency":
                  if (setting.value) updates.defaultCurrency = setting.value;
                  break;
                case "maintenance_mode":
                  updates.maintenanceMode = setting.value === "true";
                  break;
                case "maintenance_message":
                  if (setting.value) updates.maintenanceMessage = setting.value;
                  break;
              }
            });
            dispatch({ type: 'SET_DATA', payload: updates });
          }
        }
      } catch {
        toast.error("Failed to load platform settings from database");
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    fetchSettings();
  }, []);

  const handleMaintenanceToggle = async (enabled: boolean) => {
    dispatch({ type: 'SET_SAVING_MAINTENANCE', payload: true });
    try {
      const res = await apiFetch("/api/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "maintenance_mode", value: String(enabled) }),
      });
      if (res.ok) {
        dispatch({ type: 'SET_MAINTENANCE_MODE', payload: enabled });
        toast.success(enabled ? "Maintenance mode activated" : "Maintenance mode deactivated");
      } else {
        toast.error("Failed to update maintenance status");
      }
    } catch {
      toast.error("Failed to connect to platform API");
    } finally {
      dispatch({ type: 'SET_SAVING_MAINTENANCE', payload: false });
    }
  };

  const handleSaveAll = async () => {
    dispatch({ type: 'SET_SAVING_ALL', payload: true });
    try {
      const settingsToSave = [
        { key: "platform_name", value: platformName },
        { key: "support_email", value: supportEmail },
        { key: "default_language", value: defaultLanguage },
        { key: "default_currency", value: defaultCurrency },
        { key: "maintenance_message", value: maintenanceMessage }
      ];

      await Promise.all(
        settingsToSave.map((s) =>
          apiFetch("/api/platform-settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          })
        )
      );

      toast.success("Settings saved successfully!", {
        description: "All configuration values have been written to the database.",
      });
    } catch {
      toast.error("Error saving platform configurations");
    } finally {
      dispatch({ type: 'SET_SAVING_ALL', payload: false });
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-8">
      <HeaderBanner />

      {/* General Preferences Card */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-2xs space-y-5 sm:space-y-6">
        {/* Card Header matching screenshot */}
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="size-8 sm:size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Globe className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight">
              General Preferences
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
              Core platform configuration that affects branding and display across all school tenants.
            </p>
          </div>
        </div>

        {/* 2-Column Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Platform Name */}
          <div className="space-y-1.5">
            <Label htmlFor="platform-name" className="text-xs font-bold text-foreground">
              Platform Name
            </Label>
            <Input
              id="platform-name"
              value={platformName}
              onChange={(e) => dispatch({ type: 'SET_PLATFORM_NAME', payload: e.target.value })}
              placeholder="e.g. SchoolConnect"
              className="h-10 text-xs rounded-xl bg-background border-border"
            />
            <p className="text-[11px] text-muted-foreground">
              Displayed on the sidebar, header, and browser document title.
            </p>
          </div>

          {/* Support Contact Email */}
          <div className="space-y-1.5">
            <Label htmlFor="support-email" className="text-xs font-bold text-foreground">
              Support Contact Email
            </Label>
            <Input
              id="support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => dispatch({ type: 'SET_SUPPORT_EMAIL', payload: e.target.value })}
              placeholder="e.g. support@schoolsaas.com"
              className="h-10 text-xs rounded-xl bg-background border-border"
            />
            <p className="text-[11px] text-muted-foreground">
              Primary support reference address visible to tenants and administrators.
            </p>
          </div>

          {/* Default System Language */}
          <div className="space-y-1.5">
            <Label htmlFor="default-language" className="text-xs font-bold text-foreground">
              Default System Language
            </Label>
            <Select
              value={defaultLanguage}
              onValueChange={(v) => dispatch({ type: 'SET_DEFAULT_LANGUAGE', payload: v })}
            >
              <SelectTrigger className="w-full h-10 text-xs rounded-xl bg-background border-border" id="default-language">
                <SelectValue placeholder="Select platform default language" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="en">English (US)</SelectItem>
                <SelectItem value="es">Spanish (Español)</SelectItem>
                <SelectItem value="fr">French (Français)</SelectItem>
                <SelectItem value="de">German (Deutsch)</SelectItem>
                <SelectItem value="ar">Arabic (العربية)</SelectItem>
                <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              The initial localization scheme (fallback locale) for new tenants.
            </p>
          </div>

          {/* Default Platform Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="default-currency" className="text-xs font-bold text-foreground">
              Default Platform Currency
            </Label>
            <Select
              value={defaultCurrency}
              onValueChange={(v) => dispatch({ type: 'SET_DEFAULT_CURRENCY', payload: v })}
            >
              <SelectTrigger className="w-full h-10 text-xs rounded-xl bg-background border-border" id="default-currency">
                <SelectValue placeholder="Select platform currency" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="usd">USD ($) - US Dollar</SelectItem>
                <SelectItem value="eur">EUR (€) - Euro</SelectItem>
                <SelectItem value="gbp">GBP (£) - British Pound</SelectItem>
                <SelectItem value="inr">INR (₹) - Indian Rupee</SelectItem>
                <SelectItem value="aud">AUD (A$) - Australian Dollar</SelectItem>
                <SelectItem value="cad">CAD (C$) - Canadian Dollar</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Global currency fallback used for subscriptions (later checkout billing).
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/80 w-full" />

        {/* Maintenance Mode Sub-card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-xs sm:text-sm font-bold text-foreground block">
                System Maintenance Mode
              </Label>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                When enabled, all non-super-admin portals will display a start and maintenance message.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Switch
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
                disabled={savingMaintenance}
                className="cursor-pointer"
              />
              <span className="text-xs font-semibold text-muted-foreground hidden xs:inline min-w-14">
                {maintenanceMode ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          {maintenanceMode && (
            <div className="mt-4 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Maintenance Mode is currently active
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-0.5">
                    School administrators, teachers, parents, and students are temporarily blocked from their dashboards.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="maintenance-message" className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Maintenance Notice Text
                </Label>
                <Textarea
                  id="maintenance-message"
                  value={maintenanceMessage}
                  onChange={(e) => dispatch({ type: 'SET_MAINTENANCE_MESSAGE', payload: e.target.value })}
                  placeholder="e.g. System upgrade in progress. Back online in 20 minutes."
                  className="min-h-[90px] text-xs rounded-xl border-amber-200 dark:border-amber-900 focus-visible:ring-amber-500 dark:bg-zinc-900 bg-white leading-relaxed"
                />
                <p className="text-[11px] text-amber-600/90 dark:text-amber-400">
                  This message will render directly on the block screen for all public portals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Save Bar matching screenshot */}
      <StickySaveBar onSave={handleSaveAll} saving={savingAll} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-8">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="size-10 rounded-xl shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
      </div>

      {/* General Preferences Card Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-2xs space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Maintenance Card Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* Save Bar Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <Skeleton className="h-4 w-52 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

function HeaderBanner() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      {/* Title & Description with Cog Icon */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-muted/60 dark:bg-muted/40 border border-border flex items-center justify-center shrink-0 text-foreground shadow-2xs">
          <Settings className="size-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
            Configure global platform branding, regional standards, and maintenance states.
          </p>
        </div>
      </div>

      {/* Breadcrumb matching screenshot */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/super-admin" className="hover:text-foreground transition-colors">
          <Home className="size-3.5" />
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <span className="font-medium text-muted-foreground">Platform Settings</span>
      </div>
    </div>
  );
}

interface StickySaveBarProps {
  onSave: () => void;
  saving: boolean;
}

function StickySaveBar({ onSave, saving }: StickySaveBarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
        <div className="size-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
        <span>Changes will be instantly synced to the database.</span>
      </div>
      <Button
        onClick={onSave}
        disabled={saving}
        className="w-full sm:w-auto h-10 px-5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-2xs cursor-pointer transition-colors"
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="size-4" />
            <span>Save Settings</span>
          </>
        )}
      </Button>
    </div>
  );
}
