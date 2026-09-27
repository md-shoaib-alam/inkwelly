"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useAppStore, STORAGE_KEYS } from "@/store/use-app-store";
import {
  User,
  Palette,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sub-components
import { ProfileHero } from "./profile/ProfileHero";
import { ProfileDetails } from "./profile/ProfileDetails";
import { SecuritySettings } from "./profile/SecuritySettings";
import { QuickActions } from "./profile/QuickActions";
import { EditProfileDialog } from "./profile/EditProfileDialog";
import { copyToClipboard } from "@/lib/utils";

export function UserProfileScreen() {
  const { push, replace } = useRouter();
  const { theme, setTheme } = useTheme();
  const { currentUser, currentTenantName, currentTenantSlug, logout } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCopy = (text: string, field: string) => {
    copyToClipboard(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopySchoolUrl = () => {
    if (typeof window === "undefined" || !currentUser) return;
    const slug = currentTenantSlug || currentUser.tenantSlug || "";
    const url = `${window.location.origin}/${slug}`;
    
    copyToClipboard(url);
    setCopiedField("SchoolUrl");
    toast.success("School portal URL copied!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getSchoolUrl = () => {
    if (typeof window === "undefined" || !currentUser) return "";
    const slug = currentTenantSlug || currentUser.tenantSlug || "";
    return `${window.location.origin}/${slug}`;
  };

  const handleLogout = () => {
    logout();
    replace("/");
    toast.success("Successfully logged out");
  };

  const handlePasswordChange = () => {
    window.dispatchEvent(new CustomEvent("open-change-password"));
  };

  const handleOpenEdit = () => {
    setEditName(currentUser?.name || "");
    setEditPhone(currentUser?.phone || "");
    setEditAddress(currentUser?.address || "");
    setEditAvatar(currentUser?.avatar || "");
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name cannot be empty!");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone,
          address: editAddress,
          avatar: editAvatar,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      const updatedUser = { ...currentUser!, ...(data.user ?? {}) };
      useAppStore.setState({ currentUser: updatedUser });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        localStorage.removeItem("schoolsaas_profile_cache_time");
      }

      setIsEditOpen(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file is too large! Please choose a file smaller than 2MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result as string);
      toast.success("Profile photo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHero 
        user={currentUser}
        initials={initials}
        onEditClick={handleOpenEdit}
        tenantName={currentTenantName}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-100/80 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30 backdrop-blur-md h-12 shadow-sm">
              <TabsTrigger 
                value="overview" 
                className="rounded-xl font-bold text-xs sm:text-sm gap-2 transition-all duration-200 hover:text-emerald-600 dark:hover:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <User className="size-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-xl font-bold text-xs sm:text-sm gap-2 transition-all duration-200 hover:text-emerald-600 dark:hover:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <Palette className="size-4" />
                Security & Themes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 focus-visible:outline-none">
              <ProfileDetails 
                user={currentUser}
                onCopy={handleCopy}
                copiedField={copiedField}
                onEditClick={handleOpenEdit}
                onCopySchoolUrl={handleCopySchoolUrl}
                getSchoolUrl={getSchoolUrl}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-4 focus-visible:outline-none">
              <SecuritySettings 
                theme={theme}
                setTheme={setTheme}
                onPasswordChange={handlePasswordChange}
                userRole={currentUser.role}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6 lg:mt-[52px]">
          <QuickActions 
            role={currentUser.role}
            onPasswordChange={handlePasswordChange}
            onLogout={handleLogout}
            onSubscriptionClick={() => push(currentUser.role === "admin" ? "school-subscription" : "subscription")}
          />
        </div>
      </div>

      <EditProfileDialog 
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        initials={initials}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editAddress={editAddress}
        setEditAddress={setEditAddress}
        editAvatar={editAvatar}
        setEditAvatar={setEditAvatar}
        onFileChange={handleFileChange}
        onSave={handleSaveProfile}
        saving={savingProfile}
      />
    </div>
  );
}
