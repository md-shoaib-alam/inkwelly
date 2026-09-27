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
import { Separator } from "@/components/ui/separator";
import { Tenant, TenantFormData } from "./types";
import {
  LogoUploadSection,
  SubscriptionSection,
} from "./CreateTenantDialogComponents";

interface CreateTenantDialogProps {
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  formData: TenantFormData;
  setFormData: React.Dispatch<React.SetStateAction<TenantFormData>>;
  autoSlug: boolean;
  setAutoSlug: (auto: boolean) => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function CreateTenantDialog({
  formOpen,
  onFormOpenChange,
  editingTenant,
  formData,
  setFormData,
  autoSlug,
  setAutoSlug,
  onNameChange,
  onSubmit,
  submitting,
}: CreateTenantDialogProps) {
  const [uploadProgress, dispatchProgress] = React.useReducer((state: number, action: "reset" | "tick") => {
    if (action === "reset") return 0;
    if (state >= 95) return state;
    const next = state + Math.random() * 20;
    return next > 95 ? 95 : next;
  }, 0);

  // Simulated upload progress when submitting
  React.useEffect(() => {
    if (!submitting) {
      dispatchProgress("reset");
      return;
    }

    const intervalId = setInterval(() => {
      dispatchProgress("tick");
    }, 200);
    
    return () => clearInterval(intervalId);
  }, [submitting]);

  return (
    <Dialog open={formOpen} onOpenChange={onFormOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingTenant ? "Edit School" : "Create New School"}
          </DialogTitle>
          <DialogDescription>
            {editingTenant
              ? "Update the configuration for this institution."
              : "Provision a new school instance on the platform."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              General Information
            </h4>

            {/* Logo & Basic Details */}
            <LogoUploadSection
              formData={formData}
              setFormData={setFormData}
              submitting={submitting}
              uploadProgress={uploadProgress}
              onNameChange={onNameChange}
              autoSlug={autoSlug}
              setAutoSlug={setAutoSlug}
            />
          </div>

          <Separator />

          {/* Plan & Limits */}
          <SubscriptionSection formData={formData} setFormData={setFormData} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onFormOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={onSubmit}
            disabled={
              submitting || !formData.name.trim() || !formData.slug.trim()
            }
          >
            {submitting
              ? "Saving…"
              : editingTenant
                ? "Update School"
                : "Create School"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
