"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (category: { name: string; description: string }) => Promise<void>;
  isCreating: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isCreating
}: CategoryDialogProps) {
  const [form, setForm] = useState({
    name: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({ name: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-rose-200 hover:bg-rose-50 dark:border-rose-800">
          <Tag className="size-4 mr-2" />
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense Category</DialogTitle>
          <DialogDescription>Create a new category to group your expenses.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Utilities, Stationery" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description" 
            />
          </div>
          <Button type="submit" className="w-full bg-rose-600" disabled={isCreating}>
            {isCreating ? "Adding..." : "Add Category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
