import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { AdminRecord, AdminFormData } from "./types";

interface AdminDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAdmin: AdminRecord | null;
  formData: AdminFormData;
  setFormData: (data: AdminFormData) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  isFormValid: boolean;
}

export function AdminDialogs({
  open,
  onOpenChange,
  editingAdmin,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  onSubmit,
  submitting,
  isFormValid,
}: AdminDialogsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="size-6 text-teal-600 dark:text-teal-400" />
            {editingAdmin ? "Edit Super Admin" : "Add New Super Admin"}
          </DialogTitle>
          <DialogDescription>
            {editingAdmin
              ? `Update the account details for ${editingAdmin.name}.`
              : "Provision a new platform administrator with full system access."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Full Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="sa-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Full Name
            </Label>
            <Input
              id="sa-name"
              className="h-11 rounded-xl"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. James Wilson"
            />
          </div>

          {/* Email (only for creating) */}
          {!editingAdmin && (
            <div className="grid gap-1.5">
              <Label htmlFor="sa-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Email Address
              </Label>
              <Input
                id="sa-email"
                type="email"
                className="h-11 rounded-xl"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@schoolsaas.com"
              />
            </div>
          )}

          {/* Password */}
          <div className="grid gap-1.5">
            <Label htmlFor="sa-password" className="text-xs font-medium text-muted-foreground ml-1 flex items-center justify-between">
              <span>
                {editingAdmin ? "Change Password" : "Password"}
                {!editingAdmin && <span className="text-red-500 ml-0.5">*</span>}
              </span>
              {editingAdmin && (
                <span className="text-xs font-medium lowercase text-muted-foreground">
                  (optional)
                </span>
              )}
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-teal-600 transition-colors" />
              <Input
                id="sa-password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={
                  editingAdmin
                    ? "Leave blank to keep current"
                    : "Minimum 6 characters"
                }
                className="pl-11 pr-11 h-11 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {!editingAdmin && formData.password && formData.password.length < 6 && (
              <p className="text-xs text-amber-600 font-medium ml-1">
                Security: Too Short
              </p>
            )}
          </div>

          {/* Active toggle */}
          {editingAdmin && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-muted-foreground/5">
              <Checkbox
                id="sa-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <div className="grid gap-0.5">
                <Label htmlFor="sa-active" className="text-sm font-bold cursor-pointer">
                  Account Enabled
                </Label>
                <p className="text-xs text-muted-foreground">
                  When disabled, this admin cannot log in.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl min-w-[140px] shadow-lg shadow-teal-100 dark:shadow-none"
            onClick={onSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : editingAdmin ? (
              "Update Admin"
            ) : (
              "Create Admin"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
