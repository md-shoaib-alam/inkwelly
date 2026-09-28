import React from "react";
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
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Tenant } from "./types";

interface AdminTenantDialogProps {
  adminOpen: boolean;
  onAdminOpenChange: (open: boolean) => void;
  targetTenant: Tenant | null;
  adminFormData: any;
  setAdminFormData: any;
  showAdminPassword: boolean;
  setShowAdminPassword: (show: boolean) => void;
  onCreateAdmin: () => void;
  submitting: boolean;
}

export function AdminTenantDialog({
  adminOpen,
  onAdminOpenChange,
  targetTenant,
  adminFormData,
  setAdminFormData,
  showAdminPassword,
  setShowAdminPassword,
  onCreateAdmin,
  submitting,
}: AdminTenantDialogProps) {
  return (
    <Dialog open={adminOpen} onOpenChange={onAdminOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-xl">
            <ShieldCheck className="size-5 text-violet-600" />
            Create School Admin
          </DialogTitle>
          <DialogDescription>
            Set up the administrative account for{" "}
            <span className="text-foreground font-semibold">
              {targetTenant?.name}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Full Name
            </Label>
            <Input
              placeholder="e.g. Dr. Jane Smith"
              value={adminFormData.name}
              onChange={(e) =>
                setAdminFormData((prev: any) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Email Address
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
              <Input
                type="email"
                placeholder="admin@school.com"
                className="pl-11 h-11 rounded-xl"
                value={adminFormData.email}
                onChange={(e) =>
                  setAdminFormData((prev: any) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Phone Number (Optional)
            </Label>
            <div className="relative group">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
              <Input
                placeholder="+1 (555) 000-0000"
                className="pl-11 h-11 rounded-xl"
                value={adminFormData.phone}
                onChange={(e) =>
                  setAdminFormData((prev: any) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Initial Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
              <Input
                type={showAdminPassword ? "text" : "password"}
                placeholder="Create a secure password"
                className="pl-11 pr-11 h-11 rounded-xl"
                value={adminFormData.password}
                onChange={(e) =>
                  setAdminFormData((prev: any) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
              >
                {showAdminPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onAdminOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl min-w-[140px]"
            onClick={onCreateAdmin}
            disabled={
              submitting ||
              !adminFormData.name ||
              !adminFormData.email ||
              !adminFormData.password
            }
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Create Admin"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
