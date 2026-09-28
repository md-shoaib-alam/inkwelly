"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface NoticeDialogsProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  form: any;
  setForm: (v: any) => void;
  onCreate: () => void;
  creating: boolean;

  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editForm: any;
  setEditForm: (v: any) => void;
  onEdit: () => void;
  updating: boolean;
}

function NoticeFormFields({ value, onChange }: any) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor={`${value.id ? 'edit' : 'create'}-title`}>Title</Label>
        <Input
          id={`${value.id ? 'edit' : 'create'}-title`}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Notice title"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${value.id ? 'edit' : 'create'}-content`}>Content</Label>
        <Textarea
          id={`${value.id ? 'edit' : 'create'}-content`}
          value={value.content}
          onChange={(e) => onChange({ ...value, content: e.target.value })}
          placeholder="Write your notice here..."
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Priority</Label>
          <Select
            value={value.priority}
            onValueChange={(v) => onChange({ ...value, priority: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Target Audience</Label>
          <Select
            value={value.targetRole}
            onValueChange={(v) => onChange({ ...value, targetRole: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function NoticeDialogs({
  createOpen, setCreateOpen, form, setForm, onCreate, creating,
  editOpen, setEditOpen, editForm, setEditForm, onEdit, updating,
}: NoticeDialogsProps) {
  return (
    <>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Notice</DialogTitle>
            <DialogDescription>Write a new notice for the school community</DialogDescription>
          </DialogHeader>
          <NoticeFormFields value={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onCreate} disabled={creating || !form.title || !form.content}>
              {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
              {creating ? "Creating..." : "Create Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>Update the notice content and settings</DialogDescription>
          </DialogHeader>
          <NoticeFormFields value={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onEdit} disabled={updating || !editForm.title || !editForm.content}>
              {updating && <Loader2 className="size-4 mr-2 animate-spin" />}
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
