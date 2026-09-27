import { PRICE_LOOKUP } from "@/components/screens/parent/subscription/constants";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Crown, Loader2, Star } from "lucide-react";
import { SubscriptionRecord } from "./types";

interface SubscriptionDialogsProps {
  // Create
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  createForm: any;
  setCreateForm: any;
  parents: any[];
  onCreateSubmit: () => void;
  processing: boolean;

  // Edit
  editOpen: SubscriptionRecord | null;
  onEditOpenChange: (sub: SubscriptionRecord | null) => void;
  editForm: any;
  setEditForm: any;
  onEditSubmit: () => void;

  // Extend
  extendOpen: SubscriptionRecord | null;
  onExtendOpenChange: (sub: SubscriptionRecord | null) => void;
  extendDays: string;
  setExtendDays: (days: string) => void;
  onExtendSubmit: () => void;

  // Delete
  deleteOpen: SubscriptionRecord | null;
  onDeleteOpenChange: (sub: SubscriptionRecord | null) => void;
  onDeleteConfirm: () => void;
  deleting: boolean;
}

export function SubscriptionDialogs({
  createOpen,
  onCreateOpenChange,
  createForm,
  setCreateForm,
  parents,
  onCreateSubmit,
  processing,
  editOpen,
  onEditOpenChange,
  editForm,
  setEditForm,
  onEditSubmit,
  extendOpen,
  onExtendOpenChange,
  extendDays,
  setExtendDays,
  onExtendSubmit,
  deleteOpen,
  onDeleteOpenChange,
  onDeleteConfirm,
  deleting,
}: SubscriptionDialogsProps) {
  return (
    <>
      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Setup New Subscription</DialogTitle>
            <DialogDescription>
              Manually create a premium plan for a parent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Parent</Label>
              <Select
                value={createForm.parentId}
                onValueChange={(val) =>
                  setCreateForm((p: any) => ({ ...p, parentId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select
                  value={createForm.planId}
                  onValueChange={(val) => {
                    const selectedPrice = PRICE_LOOKUP[createForm.period || "yearly"]?.[val];
                    setCreateForm((p: any) => ({
                      ...p,
                      planId: val,
                      planName: val.charAt(0).toUpperCase() + val.slice(1),
                      amount: selectedPrice || 0,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={createForm.period}
                  onValueChange={(val) => {
                    const selectedPrice = PRICE_LOOKUP[val]?.[createForm.planId];
                    setCreateForm((p: any) => ({ 
                      ...p, 
                      period: val,
                      amount: selectedPrice || p.amount 
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm((p: any) => ({
                      ...p,
                      amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={createForm.paymentMethod}
                  onValueChange={(val) =>
                    setCreateForm((p: any) => ({ ...p, paymentMethod: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Manual / Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onCreateOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={onCreateSubmit}
              disabled={processing || !createForm.parentId}
            >
              {processing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOpen} onOpenChange={(open) => !open && onEditOpenChange(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Modify existing plan details for {editOpen?.parent?.user?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Select
                  value={editForm.planName.toLowerCase().replace(" plan", "")}
                  onValueChange={(val) => {
                    const currentPeriod = editForm.period || "monthly";
                    const selectedPrice = PRICE_LOOKUP[currentPeriod]?.[val];
                    setEditForm((p: any) => ({
                      ...p,
                      planId: val,
                      planName: val.charAt(0).toUpperCase() + val.slice(1) + " Plan",
                      amount: selectedPrice || 0,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan</SelectItem>
                    <SelectItem value="standard">Standard Plan</SelectItem>
                    <SelectItem value="premium">Premium Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={editForm.period || "monthly"}
                  onValueChange={(val) => {
                    const currentPlanId = editForm.planName.toLowerCase().replace(" plan", "");
                    const selectedPrice = PRICE_LOOKUP[val]?.[currentPlanId];
                        
                    const now = new Date();
                    const startDate = editOpen?.startDate ? new Date(editOpen.startDate) : now;
                    const baseDate = startDate < now ? now : startDate;
                    const newEnd = new Date(baseDate);
                    if (val === "monthly") newEnd.setMonth(newEnd.getMonth() + 1);
                    else if (val === "quarterly") newEnd.setMonth(newEnd.getMonth() + 3);
                    else newEnd.setFullYear(newEnd.getFullYear() + 1);
                        
                    setEditForm((p: any) => ({
                      ...p,
                      period: val,
                      amount: selectedPrice || p.amount,
                      endDate: newEnd.toISOString().split('T')[0],
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) =>
                    setEditForm((p: any) => ({ ...p, status: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <DatePicker
                  date={editForm.endDate ? new Date(editForm.endDate) : undefined}
                  onChange={(date) =>
                    setEditForm((p: any) => ({
                      ...p,
                      endDate: date ? date.toISOString().split('T')[0] : "",
                    }))
                  }
                  className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Auto Renew</Label>
                <Select
                  value={editForm.autoRenew ? "yes" : "no"}
                  onValueChange={(val) =>
                    setEditForm((p: any) => ({ ...p, autoRenew: val === "yes" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Enabled</SelectItem>
                    <SelectItem value="no">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onEditOpenChange(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={onEditSubmit}
              disabled={processing}
            >
              {processing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={!!extendOpen} onOpenChange={(open) => !open && onExtendOpenChange(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
              <CalendarClock className="size-6" />
            </div>
            <DialogTitle>Extend Validity</DialogTitle>
            <DialogDescription>
              Add extra days to the current subscription period for{" "}
              <span className="font-semibold text-foreground">
                {extendOpen?.parent?.user?.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Number of days to add</Label>
              <div className="grid grid-cols-3 gap-2">
                {["30", "90", "365"].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={extendDays === d ? "default" : "outline"}
                    onClick={() => setExtendDays(d)}
                  >
                    {d} Days
                  </Button>
                ))}
              </div>
              <div className="relative mt-2">
                <Input
                  type="number"
                  placeholder="Custom days..."
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium uppercase">
                  Days
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will move the end date forward. The parent will retain all
                current plan benefits.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onExtendOpenChange(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={onExtendSubmit}
              disabled={processing || !extendDays}
            >
              {processing ? "Processing..." : "Confirm Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOpen} onOpenChange={(open) => !open && onDeleteOpenChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription record for{" "}
              <span className="font-bold text-foreground">
                {deleteOpen?.parent?.user?.name}
              </span>
              . The parent will lose all premium access immediately. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-none"
              onClick={onDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
