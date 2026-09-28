"use client";

import React from "react";
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
import { AlertTriangle } from "lucide-react";

interface ConfirmFinalizeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmFinalizeDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: ConfirmFinalizeDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500 fill-amber-500/10" /> Finalize Assessment?
          </AlertDialogTitle>
          <AlertDialogDescription className="py-1 text-sm">
            Once you mark this assessment as complete, all student scores will be locked and finalized. You will not be able to edit or save changes to the grades in the future. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={onConfirm}
          >
            Yes, Finalize it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
