import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  UserRound, 
  Mail, 
  Phone 
} from "lucide-react";
import { StaffFormData, StaffRecord, PlatformRole } from "./types";

interface StaffDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStaff: StaffRecord | null;
  formData: StaffFormData;
  setFormData: (data: StaffFormData) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  roles: PlatformRole[];
  onSubmit: () => void;
  submitting: boolean;
  isFormValid: boolean;
}

export function StaffDialogs({
  open,
  onOpenChange,
  editingStaff,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  roles,
  onSubmit,
  submitting,
  isFormValid,
}: StaffDialogsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-2">
        <DialogHeader>
          <div className="size-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4">
            <Shield className="size-6 text-teal-600 dark:text-teal-400" />
          </div>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {editingStaff ? "Edit Staff Member" : "Add Platform Staff"}
          </DialogTitle>
          <DialogDescription className="font-medium text-sm">
            {editingStaff
              ? "Update personnel details and system permissions."
              : "Create a new platform account with role-based access."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff-name" className="text-xs font-medium text-muted-foreground ml-1">Full Name</Label>
            <div className="relative">
              <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
              <Input
                id="staff-name"
                className="pl-11 h-11 rounded-xl border-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter member name"
              />
            </div>
          </div>

          {!editingStaff && (
            <div className="space-y-2">
              <Label htmlFor="staff-email" className="text-xs font-medium text-muted-foreground ml-1">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                <Input
                  id="staff-email"
                  type="email"
                  className="pl-11 h-11 rounded-xl border-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 font-bold"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@schoolsaas.com"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="staff-password" className="text-xs font-medium text-muted-foreground ml-1">
              {editingStaff ? "New Password (Optional)" : "Security Password"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
              <Input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                className="pl-11 pr-11 h-11 rounded-xl border-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 font-bold"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingStaff ? "Leave blank to keep current" : "Minimum 6 characters"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-phone" className="text-xs font-medium text-muted-foreground ml-1">Contact Number</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
              <Input
                id="staff-phone"
                className="pl-11 h-11 rounded-xl border-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 font-bold"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground ml-1">System Role Assignment</Label>
            <Select
              value={formData.platformRoleId}
              onValueChange={(v) => setFormData({ ...formData, platformRoleId: v })}
            >
              <SelectTrigger className="h-11 rounded-xl border-2 font-bold">
                <SelectValue placeholder="Assign a role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id} className="text-xs font-medium py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: role.color }} />
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {editingStaff && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent">
              <Checkbox
                id="staff-active"
                className="rounded-md border-2"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
              />
              <Label htmlFor="staff-active" className="text-xs font-medium cursor-pointer select-none">
                Account Active
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" className="rounded-xl font-bold" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-lg px-8"
            onClick={onSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (editingStaff ? "Update Member" : "Create Account")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
