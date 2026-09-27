"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SubjectDialogsProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  form: any;
  setForm: (v: any) => void;
  classes: any[];
  teachers: any[];
  onCreate: () => void;
  creating: boolean;

  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editForm: any;
  setEditForm: (v: any) => void;
  onEdit: () => void;
  updating: boolean;

  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  deleteTarget: any;
  onDelete: () => void;
}

function SubjectFormFields({ value, onChange, classes, teachers }: any) {
  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label>Subject Name *</Label>
        <Input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="e.g. Mathematics"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label>Subject Code *</Label>
        <Input
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
          placeholder="e.g. MATH-101"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label>Class *</Label>
        <Select
          value={value.classId}
          onValueChange={(v) => onChange({ ...value, classId: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {(classes || []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} - {c.section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Teacher (optional)</Label>
        <Select
          value={value.teacherId}
          onValueChange={(v) =>
            onChange({ ...value, teacherId: v === "none" ? "" : v })
          }
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="none"
              className="text-muted-foreground italic font-semibold"
            >
              None (Unassigned)
            </SelectItem>
            {(teachers || []).map((t: any) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function SubjectDialogs({
  createOpen, setCreateOpen, form, setForm, classes, teachers, onCreate, creating,
  editOpen, setEditOpen, editForm, setEditForm, onEdit, updating,
  deleteOpen, setDeleteOpen, deleteTarget, onDelete
}: SubjectDialogsProps) {
  return (
    <>
      {/* Create Subject Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Create a new subject and assign it to a class</DialogDescription>
          </DialogHeader>
          <SubjectFormFields value={form} onChange={setForm} classes={classes} teachers={teachers} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={onCreate} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
              {creating ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject details</DialogDescription>
          </DialogHeader>
          <SubjectFormFields value={editForm} onChange={setEditForm} classes={classes} teachers={teachers} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={onEdit} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {updating && <Loader2 className="size-4 mr-2 animate-spin" />}
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
