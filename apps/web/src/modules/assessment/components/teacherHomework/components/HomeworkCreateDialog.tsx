import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Action, State } from "../reducer";

export interface HomeworkCreateDialogProps {
  dialogOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: State["form"];
  subjects: State["subjects"];
  dispatch: React.Dispatch<Action>;
  handleCreate: () => void;
}

export function HomeworkCreateDialog({
  dialogOpen,
  onOpenChange,
  form,
  subjects,
  dispatch,
  handleCreate,
}: HomeworkCreateDialogProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [todayStart, setTodayStart] = useState<Date | null>(null);

  useState(() => {
    // This is safe because it only runs once on mount on client side
    if (typeof window !== "undefined") {
      setTodayStart(new Date(new Date().setHours(0, 0, 0, 0)));
    }
  });

  const uniqueClasses = useMemo(() => {
    const classesMap = new Map();
    subjects.forEach((s) => {
      if (s.classId && typeof s.classId === "string" && s.classId.trim() !== "") {
        if (!classesMap.has(s.classId)) {
          classesMap.set(s.classId, s.className);
        }
      }
    });
    return Array.from(classesMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!form.classId) return [];
    return subjects.filter((s) => s.classId === form.classId && s.id && typeof s.id === "string" && s.id.trim() !== "");
  }, [subjects, form.classId]);

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="size-4 mr-2" /> Create Homework
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Homework</DialogTitle>
          <DialogDescription>
            Fill in the details below to assign new homework to your students.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => dispatch({ type: "SET_FORM", payload: { title: e.target.value } })}
              placeholder="Homework title"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Class *</Label>
              <Select
                value={form.classId}
                onValueChange={(v) => dispatch({ type: "SET_FORM", payload: { classId: v, subjectId: "" } })}
                disabled={uniqueClasses.length === 0}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={uniqueClasses.length === 0 ? "No classes assigned" : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Select
                value={form.subjectId}
                disabled={!form.classId || filteredSubjects.length === 0}
                onValueChange={(v) => dispatch({ type: "SET_FORM", payload: { subjectId: v } })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={!form.classId ? "Select class first" : (filteredSubjects.length === 0 ? "No subjects assigned" : "Select subject")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Due Date *</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-0.5">
                    <CalendarDays className="mr-2 size-4" />
                    {form.dueDate ? format(form.dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.dueDate}
                    onSelect={(date) => {
                      dispatch({ type: "SET_FORM", payload: { dueDate: date } });
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => !!todayStart && date < todayStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label>Submission Mode *</Label>
              <Select
                value={form.mode || "offline"}
                onValueChange={(v) => dispatch({ type: "SET_FORM", payload: { mode: v as any } })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline (Classroom)</SelectItem>
                  <SelectItem value="online" disabled className="text-muted-foreground">
                    Online (🔒 Premium Only)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => dispatch({ type: "SET_FORM", payload: { description: e.target.value } })}
              placeholder="Homework details..."
              className="mt-1.5"
              rows={3}
            />
          </div>
          <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Create Homework
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
