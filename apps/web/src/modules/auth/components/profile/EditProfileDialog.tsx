"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from "lucide-react";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
];

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initials: string;
  editName: string;
  setEditName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  editAddress: string;
  setEditAddress: (v: string) => void;
  editAvatar: string;
  setEditAvatar: (v: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (e: React.FormEvent) => void;
  saving?: boolean;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  initials,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  editAddress,
  setEditAddress,
  editAvatar,
  setEditAvatar,
  onFileChange,
  onSave,
  saving,
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl bg-white dark:bg-[#09090b]">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-black tracking-tight">Edit Profile Details</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Modify your personal verified details. Changes reflect instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-5 mt-2">
          <div className="flex flex-col items-center gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl">
            <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Profile Photo</Label>
            
            <div className="relative group">
              <Avatar className="size-20 border-2 border-emerald-500/20 shadow-lg">
                <AvatarImage src={editAvatar} className="object-cover" />
                <AvatarFallback className="text-2xl font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <Camera className="size-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1.5 w-full text-center">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Or choose a premium profile preset</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                {PRESET_AVATARS.map((avatarUrl, idx) => (
                  <button
                    key={avatarUrl}
                    type="button"
                    onClick={() => setEditAvatar(avatarUrl)}
                    className={`size-8 rounded-full overflow-hidden border-2 transition-all ${
                      editAvatar === avatarUrl 
                        ? "border-emerald-500 scale-110 shadow-md" 
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img src={avatarUrl} alt="Preset Avatar" className="size-full object-cover animate-in fade-in" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your full name"
                className="rounded-xl border-zinc-200/80 dark:border-zinc-800/80 h-10 font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-phone" className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Mobile Number</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="rounded-xl border-zinc-200/80 dark:border-zinc-800/80 h-10 font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-address" className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Residential Address</Label>
              <Textarea
                id="edit-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Enter residential address"
                className="rounded-xl border-zinc-200/80 dark:border-zinc-800/80 min-h-[70px] resize-none font-medium text-xs leading-normal"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold rounded-xl text-xs"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
