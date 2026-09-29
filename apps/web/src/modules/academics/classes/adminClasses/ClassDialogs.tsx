"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassInfo } from "@/lib/types";

// ==========================================
// Helper Components
// ==========================================

interface ClassFormProps {
  value: {
    name: string;
    section: string;
    grade: string;
    capacity: string;
    classTeacherId?: string;
    id?: string;
  };
  onChange: (v: any) => void;
  enableGradeSelection?: boolean;
  teachers?: any[];
}

function getMappedGradeFromName(name: string): string {
  if (!name) return "";
  const normalized = name.trim().toLowerCase();
  if (normalized === "pre-nursery" || normalized === "prenursery" || normalized === "pre nursery") return "Pre-Nursery";
  if (normalized === "nursery") return "Nursery";
  if (normalized === "lkg") return "LKG";
  if (normalized === "ukg") return "UKG";
  const numMatch = name.match(/\d+/);
  return numMatch ? numMatch[0] : "";
}

function ClassForm({ value, onChange, enableGradeSelection = false, teachers = [] }: ClassFormProps) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Class Name</Label>
          <Select
            value={value.name}
            onValueChange={(v) => {
              const mappedGrade = getMappedGradeFromName(v);
              onChange({
                ...value,
                name: v,
                grade: !enableGradeSelection ? mappedGrade : value.grade,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[
                "Pre-Nursery", "Nursery", "LKG", "UKG",
                "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
                "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
              ].map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Section</Label>
          <Select
            value={value.section}
            onValueChange={(v) => onChange({ ...value, section: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {["A", "B", "C", "D"].map((sec) => (
                <SelectItem key={sec} value={sec}>
                  Section {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {enableGradeSelection && (
        <div className="grid gap-2">
          <Label>Grade</Label>
          <Select
            value={value.grade}
            onValueChange={(v) => onChange({ ...value, grade: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {["Pre-Nursery", "Nursery", "LKG", "UKG"].map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  Grade {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label>Class Teacher</Label>
        <Select
          value={value.classTeacherId || "none"}
          onValueChange={(v) => onChange({ ...value, classTeacherId: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assign a Class Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned / None</SelectItem>
            {teachers.map((teacher: any) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Capacity</Label>
        <Input
          type="number"
          value={value.capacity}
          onChange={(e) => onChange({ ...value, capacity: e.target.value })}
          placeholder="40"
        />
      </div>
    </div>
  );
}

// ==========================================
// Main Dialogs Component
// ==========================================

interface ClassDialogsProps {
  addOpen: boolean;
  setAddOpen: (open: boolean) => void;
  addFormData: any;
  setAddFormData: (data: any) => void;
  adding: boolean;
  onAdd: () => void;

  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editData: any;
  setEditData: (data: any) => void;
  editing: boolean;
  onEdit: () => void;

  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  deleteTarget: ClassInfo | null;
  deleting: boolean;
  onDelete: () => void;

  enableGradeSelection?: boolean;
  teachers?: any[];
}

export function ClassDialogs({
  addOpen, setAddOpen, addFormData, setAddFormData, adding, onAdd,
  editOpen, setEditOpen, editData, setEditData, editing, onEdit,
  deleteOpen, setDeleteOpen, deleteTarget, deleting, onDelete,
  enableGradeSelection = false,
  teachers = [],
}: ClassDialogsProps) {
  return (
    <>
      {/* Add Class Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new class section</DialogDescription>
          </DialogHeader>
          <ClassForm value={addFormData} onChange={setAddFormData} enableGradeSelection={enableGradeSelection} teachers={teachers} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onAdd}
              disabled={adding || !addFormData.name || !addFormData.section || (!enableGradeSelection ? !getMappedGradeFromName(addFormData.name) : !addFormData.grade)}
            >
              {adding && <Loader2 className="size-4 mr-2 animate-spin" />}
              {adding ? "Adding..." : "Add Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class details</DialogDescription>
          </DialogHeader>
          <ClassForm value={editData} onChange={setEditData} enableGradeSelection={enableGradeSelection} teachers={teachers} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onEdit}
              disabled={editing || !editData.name || !editData.section || (!enableGradeSelection ? !getMappedGradeFromName(editData.name) : !editData.grade)}
            >
              {editing && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {deleteTarget?.name} - Section {deleteTarget?.section}
              </strong>
              ? This action cannot be undone and will remove all associated data
              including students, subjects, and attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
