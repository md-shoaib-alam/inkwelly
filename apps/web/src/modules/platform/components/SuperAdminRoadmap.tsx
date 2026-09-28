"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  ListTodo, 
  Info,
  Clock,
  CheckCircle2,
  GitBranch,
  FileText,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface UpcomingFeature {
  id: string;
  title: string;
  description: string;
  category: "starter" | "standard" | "premium";
  targetRelease: string;
  status: "Planned" | "In Progress" | "Testing" | "Completed";
  todos: Array<{ id: string; text: string; completed: boolean }>;
  notes?: string;
}

export function RoadmapPanel() {
  const [features, setFeatures] = useState<UpcomingFeature[]>([]);

  // Load from localStorage with migration helper
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("super-admin-roadmap-features");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const migrated = parsed.map((item: any) => {
            let cat = item.category;
            if (cat === "core") cat = "starter";
            if (cat === "beta" || cat === "standard+") cat = "standard";
            if (cat === "enterprise" || cat === "premium+") cat = "premium";
            
            let notes = item.notes || "";
            if (notes.includes("Enterprise")) {
              notes = notes.replace(/Enterprise/g, "Premium");
            }
            if (notes.includes("Starter Pack")) {
              notes = notes.replace(/Starter Pack/g, "Starter");
            }
            return {
              ...item,
              category: cat as "starter" | "standard" | "premium",
              notes: notes || undefined
            };
          });
          setFeatures(migrated);
          localStorage.setItem("super-admin-roadmap-features", JSON.stringify(migrated));
        } catch (e) {
          console.error("Failed to load roadmap features", e);
        }
      } else {
        const defaultRoadmap: UpcomingFeature[] = [
          {
            id: "rm-1",
            title: "Multi-Tenant Zoom API Integration",
            description: "Seamless synchronization of online classes with Zoom, auto-generating links in timetables.",
            category: "standard",
            targetRelease: "Q3 2026",
            status: "In Progress",
            todos: [
              { id: "t1", text: "Register Elysia server Webhook listener", completed: true },
              { id: "t2", text: "Map OAuth client per tenant context", completed: false },
              { id: "t3", text: "Design frontend schedule dialog components", completed: false }
            ],
            notes: "Starter Plan: Excluded. Standard: Limit to 1 classroom. Premium: Unlimited Zoom syncs."
          },
          {
            id: "rm-2",
            title: "Smart Fee Installments Scheduler",
            description: "Configure custom milestone payments and auto-debit templates for parents.",
            category: "premium",
            targetRelease: "Q4 2026",
            status: "Planned",
            todos: [
              { id: "t4", text: "Integrate Stripe subscription scheduler hooks", completed: false },
              { id: "t5", text: "Draft fee installment collection agreement PDF templates", completed: false }
            ],
            notes: "Exclusively for Premium Schools using custom payment rails."
          }
        ];
        setFeatures(defaultRoadmap);
        localStorage.setItem("super-admin-roadmap-features", JSON.stringify(defaultRoadmap));
      }
    }
  }, []);

  const saveFeatures = (updated: UpcomingFeature[]) => {
    setFeatures(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("super-admin-roadmap-features", JSON.stringify(updated));
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"starter" | "standard" | "premium">("starter");
  const [newTarget, setNewTarget] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({ "rm-2": true });
  const [newTodoTexts, setNewTodoTexts] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warning("Please specify a feature title.");
      return;
    }

    const newItem: UpcomingFeature = {
      id: `rm-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || "No description provided.",
      category: newCategory,
      targetRelease: newTarget.trim() || "TBD",
      status: "Planned",
      todos: [],
      notes: newNotes.trim() || undefined
    };

    const updated = [newItem, ...features];
    saveFeatures(updated);
    toast.success(`Feature "${newItem.title}" added to your Roadmap!`);

    setNewTitle("");
    setNewDesc("");
    setNewCategory("starter");
    setNewTarget("");
    setNewNotes("");
    setShowAddForm(false);
    
    setExpandedIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleDeleteFeature = (id: string) => {
    const updated = features.filter(f => f.id !== id);
    saveFeatures(updated);
    toast.success("Roadmap feature removed.");
  };

  const handleStatusChange = (id: string, newStatus: UpcomingFeature["status"]) => {
    const updated = features.map(f => f.id === id ? { ...f, status: newStatus } : f);
    saveFeatures(updated);
    toast.info(`Status updated: ${newStatus}`);
  };

  const handleAddTodo = (featureId: string) => {
    const todoText = newTodoTexts[featureId] || "";
    if (!todoText.trim()) return;

    const updated = features.map(f => {
      if (f.id !== featureId) return f;
      return {
        ...f,
        todos: [
          ...f.todos,
          { id: `todo-${Date.now()}`, text: todoText.trim(), completed: false }
        ]
      };
    });

    saveFeatures(updated);
    setNewTodoTexts(prev => ({ ...prev, [featureId]: "" }));
  };

  const handleToggleTodo = (featureId: string, todoId: string) => {
    const updated = features.map(f => {
      if (f.id !== featureId) return f;
      return {
        ...f,
        todos: f.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t)
      };
    });
    saveFeatures(updated);
  };

  const handleDeleteTodo = (featureId: string, todoId: string) => {
    const updated = features.map(f => {
      if (f.id !== featureId) return f;
      return {
        ...f,
        todos: f.todos.filter(t => t.id !== todoId)
      };
    });
    saveFeatures(updated);
  };

  const handleNotesChange = (featureId: string, text: string) => {
    const updated = features.map(f => f.id === featureId ? { ...f, notes: text } : f);
    saveFeatures(updated);
  };

  const getStatusBadge = (status: UpcomingFeature["status"]) => {
    switch (status) {
      case "Planned":
        return <Badge variant="outline" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-medium text-xs rounded px-2.5 py-0.5 border border-zinc-200 dark:border-zinc-700">Planned</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="bg-amber-50 hover:bg-amber-100/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 font-medium text-xs rounded px-2.5 py-0.5 border border-amber-200 dark:border-amber-900/50 flex items-center gap-1"><Clock className="size-3" /> In Progress</Badge>;
      case "Testing":
        return <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-medium text-xs rounded px-2.5 py-0.5 border border-blue-200 dark:border-blue-900/50">Testing</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-emerald-50 hover:bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-medium text-xs rounded px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1"><CheckCircle2 className="size-3" /> Completed</Badge>;
    }
  };

  const getCategoryBadge = (cat: UpcomingFeature["category"]) => {
    switch (cat) {
      case "starter":
        return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold text-xs px-2 py-0.5 rounded">Starter</Badge>;
      case "standard":
        return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-semibold text-xs px-2 py-0.5 rounded">Standard</Badge>;
      case "premium":
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-semibold text-xs px-2 py-0.5 rounded">Premium</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Standard Corporate Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-xs text-left">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ListTodo className="size-5 text-teal-600" />
            Product Roadmap
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            Manage future capabilities, map tier limits, and track implementation checklists.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs gap-1.5 font-semibold text-xs px-3 h-8.5 rounded-md transition-colors"
        >
          {showAddForm ? "Close Form" : <><Plus className="size-4" /> Add Roadmap Feature</>}
        </Button>
      </div>

      {/* Add New Feature Form Panel */}
      {showAddForm && (
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-5">
            <form onSubmit={handleAddFeature} className="space-y-4">
              <div className="flex items-center gap-2 mb-1 text-left">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Create Roadmap Capability</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="title" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">Feature Title</Label>
                  <Input 
                    id="title"
                    placeholder="e.g. Dynamic Timetable Conflict Detector"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 h-9.5 rounded-md text-xs font-medium focus-visible:ring-1 focus-visible:ring-teal-500"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="target" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">Target Release</Label>
                  <Input 
                    id="target"
                    placeholder="e.g. Q3 2026, July 2026"
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 h-9.5 rounded-md text-xs font-medium focus-visible:ring-1 focus-visible:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="desc" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="What capability does this introduce to schools?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="min-h-[75px] text-xs font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">Target Plan Placement</Label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
                    <SelectTrigger className="h-9.5 rounded-md border border-zinc-200 dark:border-zinc-800 font-semibold bg-zinc-50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                      <SelectItem value="starter" className="text-xs font-medium py-2">Starter Plan</SelectItem>
                      <SelectItem value="standard" className="text-xs font-medium py-2">Standard Plan</SelectItem>
                      <SelectItem value="premium" className="text-xs font-medium py-2">Premium Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="notes" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">Starter Pack Entitlement Notes</Label>
                  <Input 
                    id="notes"
                    placeholder="Starter: Excluded. Standard: 1 classroom. Premium: Unlimited."
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 h-9.5 rounded-md text-xs font-medium focus-visible:ring-1 focus-visible:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="h-8.5 px-4 rounded-md font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white h-8.5 px-5 rounded-md font-semibold shadow-xs"
                >
                  Create Feature
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Features List Section */}
      <div className="space-y-4">
        {features.length === 0 ? (
          <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent py-16 text-center shadow-none rounded-lg">
            <CardContent className="flex flex-col items-center gap-3">
              <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                <ListTodo className="size-5 text-zinc-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">No Roadmap Features</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Click the button at the top to draft your first product capability.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          features.map((item) => {
            const isExpanded = expandedIds[item.id] || false;
            const completedTodos = item.todos.filter(t => t.completed).length;
            const totalTodos = item.todos.length;
            const progressVal = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

            return (
              <Card 
                key={item.id}
                className={cn(
                  "overflow-hidden transition-colors rounded-lg border bg-card shadow-xs",
                  isExpanded 
                    ? "border-teal-500/60 dark:border-teal-500/40 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Header Left Info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="shrink-0">
                        {getCategoryBadge(item.category)}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">{item.title}</h4>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 leading-relaxed line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Header Right Actions */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800">
                        <Calendar className="size-3.5 text-zinc-400" />
                        Target: <span className="text-zinc-900 dark:text-white font-bold">{item.targetRelease}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(item.id)}
                        className={cn(
                          "size-8 rounded border border-border transition-colors",
                          isExpanded && "border-teal-500 text-teal-600 dark:text-teal-400"
                        )}
                        title={isExpanded ? "Collapse checklist" : "Expand checklist"}
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    </div>

                  </div>

                  {/* Checklist Summary (when collapsed) */}
                  {!isExpanded && totalTodos > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center gap-4">
                      <Progress value={progressVal} className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-950" style={{ transform: "translateY(1px)" }} />
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0 font-mono">
                        {completedTodos}/{totalTodos} Tasks ({Math.round(progressVal)}%)
                      </span>
                    </div>
                  )}

                  {/* Expanded Checklist & Notes Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-left">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Columns: Todo checklist */}
                        <div className="lg:col-span-2 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                              <ListTodo className="size-3.5 text-teal-600" /> Checklist & Tasks
                            </h5>
                            {totalTodos > 0 && (
                              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 font-mono">
                                {Math.round(progressVal)}% Done
                              </span>
                            )}
                          </div>

                          {totalTodos > 0 && (
                            <Progress value={progressVal} className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-950" />
                          )}

                          {/* Todo Items list */}
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {item.todos.length === 0 ? (
                              <p className="text-xs text-zinc-400 italic py-3 text-left">No checklists added yet. Draft task lists below!</p>
                            ) : (
                              item.todos.map((todo) => (
                                <div 
                                  key={todo.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-md border transition-colors group/todo",
                                    todo.completed 
                                      ? "bg-zinc-50/50 dark:bg-zinc-950/10 border-transparent text-zinc-400 dark:text-zinc-500 line-through opacity-70" 
                                      : "bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                                  )}
                                >
                                  <button
                                    onClick={() => handleToggleTodo(item.id, todo.id)}
                                    className="flex items-center gap-2.5 text-left font-medium text-xs cursor-pointer select-none flex-1 min-w-0"
                                  >
                                    <Checkbox
                                      checked={todo.completed}
                                      onCheckedChange={() => handleToggleTodo(item.id, todo.id)}
                                      className="shrink-0"
                                    />
                                    <span className="truncate leading-relaxed font-semibold text-xs">{todo.text}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTodo(item.id, todo.id)}
                                    className="opacity-0 group-hover/todo:opacity-100 text-zinc-300 hover:text-red-500 size-6 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add Todo input */}
                          <div className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-md">
                            <Input 
                              placeholder="Add checklist task (e.g. Map parent context)..."
                              value={newTodoTexts[item.id] || ""}
                              onChange={e => setNewTodoTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTodo(item.id);
                                }
                              }}
                              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-xs font-medium shadow-none focus-visible:border-none focus-visible:outline-none"
                            />
                            <Button 
                              onClick={() => handleAddTodo(item.id)}
                              size="sm"
                              className="bg-teal-600 hover:bg-teal-700 text-white rounded h-7.5 text-xs font-semibold cursor-pointer px-3 shrink-0"
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Right Column: Roadmap Notes & Status dropdown select */}
                        <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between text-left">
                          
                          <div className="space-y-4">
                            {/* Status settings using flat Dropdown Select */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 opacity-90">
                                <GitBranch className="size-3.5" /> Roadmap Status
                              </Label>
                              <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v as any)}>
                                <SelectTrigger className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 font-semibold bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "size-2 rounded-full",
                                      item.status === "Planned" && "bg-zinc-400 dark:bg-zinc-500",
                                      item.status === "In Progress" && "bg-amber-500",
                                      item.status === "Testing" && "bg-blue-500",
                                      item.status === "Completed" && "bg-emerald-500"
                                    )} />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                  <SelectItem value="Planned" className="text-xs font-medium py-2">Planned</SelectItem>
                                  <SelectItem value="In Progress" className="text-xs font-medium py-2">In Progress</SelectItem>
                                  <SelectItem value="Testing" className="text-xs font-medium py-2">Testing</SelectItem>
                                  <SelectItem value="Completed" className="text-xs font-medium py-2">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Custom plan notes / details */}
                            <div className="space-y-1.5">
                              <Label htmlFor={`notes-${item.id}`} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 opacity-90">
                                <FileText className="size-3.5" /> Entitlements & Plan Notes
                              </Label>
                              <Textarea
                                id={`notes-${item.id}`}
                                value={item.notes || ""}
                                onChange={e => handleNotesChange(item.id, e.target.value)}
                                placeholder="Starter: Excluded. Standard: 1 classroom. Premium: Unlimited."
                                className="min-h-[85px] text-xs font-medium leading-relaxed resize-none"
                              />
                            </div>
                          </div>

                          {/* Delete roadmap feature */}
                          <div className="pt-3.5 flex justify-between items-center text-xs font-medium text-muted-foreground border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-4">
                            <span>Ref: {item.id}</span>
                            <button
                              onClick={() => handleDeleteFeature(item.id)}
                              className="text-red-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                            >
                              <Trash2 className="size-3.5" /> Delete Feature
                            </button>
                          </div>

                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pro tip card info */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-start gap-3 text-left">
        <Info className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Sandbox Roadmap Orchestration</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Toggling status or updating plan notes inside the Product Roadmap is strictly for dashboard planning and task checklists. It will not trigger live database locks, allowing you to orchestrate limits safely before shipping features.
          </p>
        </div>
      </div>
      
    </div>
  );
}

