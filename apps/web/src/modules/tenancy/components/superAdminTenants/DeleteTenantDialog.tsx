import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tenant } from "./types";

interface DeleteTenantDialogProps {
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  deletingTenant: Tenant | null;
  onDeleteConfirm: () => void;
}

export function DeleteTenantDialog({
  deleteOpen,
  onDeleteOpenChange,
  deletingTenant,
  onDeleteConfirm,
}: DeleteTenantDialogProps) {
  return (
    <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete School</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>{deletingTenant?.name}</strong>? This will permanently
            remove the school and all associated data. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onDeleteOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white border-none"
            onClick={onDeleteConfirm}
          >
            Delete School
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
