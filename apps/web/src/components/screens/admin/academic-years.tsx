"use client";

import { useState } from "react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  Layers,
  Users
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";

function getUpcomingCount(academicYears: any[]): number {
  const now = new Date();
  return academicYears.filter((y: any) => new Date(y.startDate) > now).length;
}

function formatSessionDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return "N/A";
  return format(parsed, "MMM dd, yyyy");
}

export function AcademicYearsScreen() {
  const { 
    academicYears, 
    isLoading, 
    createAcademicYear, 
    updateAcademicYear, 
    deleteAcademicYear, 
    setCurrentAcademicYear,
    isCreating,
    isUpdating,
    isDeleting
  } = useAcademicYears();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "active",
    isCurrent: false
  });

  const handleOpenDialog = (year: any = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        name: year.name,
        startDate: year.startDate,
        endDate: year.endDate,
        status: year.status,
        isCurrent: year.isCurrent
      });
    } else {
      setEditingYear(null);
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        status: "active",
        isCurrent: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error("Start Date and End Date are required");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    try {
      if (editingYear) {
        await updateAcademicYear({ id: editingYear.id, input: formData });
        toast.success("Academic year updated successfully");
      } else {
        await createAcademicYear(formData);
        toast.success("Academic year created successfully");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save academic year");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this academic year?")) {
      try {
        await deleteAcademicYear(id);
        toast.success("Academic year deleted");
      } catch (error) {
        toast.error("Failed to delete academic year");
      }
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await setCurrentAcademicYear(id);
      toast.success("Current academic year updated");
    } catch (error) {
      toast.error("Failed to set current academic year");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="size-10 sm:size-12 shrink-0 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CalendarDays className="size-5 sm:size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Academic Years
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Manage your school's academic sessions and current year settings.
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
              <Plus className="size-4 mr-2" />
              Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[425px] rounded-2xl border-blue-100 dark:border-blue-900/50 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingYear ? "Edit Academic Year" : "New Academic Year"}</DialogTitle>
              <DialogDescription>
                Set the name and dates for the academic session.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. 2024-2025" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <DatePicker 
                    date={parseLocalDate(formData.startDate)}
                    onChange={(d) => {
                      const formatted = formatLocalDate(d);
                      const currentEnd = parseLocalDate(formData.endDate);
                      const newEnd = d && currentEnd && d > currentEnd ? formatted : formData.endDate;
                      setFormData({ ...formData, startDate: formatted, endDate: newEnd });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <DatePicker 
                    date={parseLocalDate(formData.endDate)}
                    onChange={(d) => setFormData({ ...formData, endDate: formatLocalDate(d) })}
                    disabled={(d) => {
                      const start = parseLocalDate(formData.startDate);
                      return start ? d < start : false;
                    }}
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {isCreating || isUpdating ? "Saving..." : (editingYear ? "Update Year" : "Create Year")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats / Info */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-10 shrink-0 rounded-xl sm:rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <ShieldCheck className="size-4 sm:size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 truncate">Current Session</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100 truncate">
                  {academicYears.find((y: any) => y.isCurrent)?.name || "Not Set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-10 shrink-0 rounded-xl sm:rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle2 className="size-4 sm:size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">Active Sessions</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {academicYears.filter((y: any) => y.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-10 shrink-0 rounded-xl sm:rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Clock className="size-4 sm:size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 truncate">Upcoming Sessions</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-900 dark:text-amber-100" suppressHydrationWarning>
                  {getUpcomingCount(academicYears)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content: Mobile Cards & Desktop Table */}
      {isLoading ? (
        <div className="space-y-4">
          {/* Mobile Loading Skeleton (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-28 rounded" />
                      {i === 1 && <Skeleton className="h-4 w-14 rounded-full" />}
                    </div>
                    <Skeleton className="h-3.5 w-44 rounded" />
                  </div>
                  <Skeleton className="size-8 rounded-md" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table Loading Skeleton (md+) */}
          <Card className="hidden md:block overflow-hidden border-violet-100 dark:border-violet-900/30 shadow-md">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-card">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="size-8 rounded-md ml-auto" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : academicYears.length === 0 ? (
        <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
          <div className="flex flex-col items-center text-center px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10 max-w-xl mx-auto">
            <div className="relative w-48 h-36 sm:w-60 sm:h-44 mb-3">
              <Image
                src="/assets/admin/acdmicyearcenter.avif"
                alt="No Academic Years"
                fill
                priority
                className="object-contain"
              />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2">
              No academic years found
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-md">
              Create your first academic year to start managing sessions, classes, exams and other academic activities.
            </p>

            <Button
              onClick={() => handleOpenDialog()}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus className="size-4 mr-1.5" />
              Create your first session
            </Button>
          </div>

          {/* Bottom Features Info Bar */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 sm:px-10 sm:py-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {/* Feature 1 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3.5 p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border sm:border-0 border-zinc-200/70 dark:border-zinc-800 shadow-xs sm:shadow-none">
                <div className="size-9 sm:size-11 rounded-full sm:rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Set current session</p>
                  <p className="hidden sm:block text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Mark an academic year as current</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3.5 p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border sm:border-0 border-zinc-200/70 dark:border-zinc-800 shadow-xs sm:shadow-none">
                <div className="size-9 sm:size-11 rounded-full sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Layers className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Manage multiple years</p>
                  <p className="hidden sm:block text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Keep track of past and future sessions</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3.5 p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border sm:border-0 border-zinc-200/70 dark:border-zinc-800 shadow-xs sm:shadow-none">
                <div className="size-9 sm:size-11 rounded-full sm:rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Users className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Connect with classes</p>
                  <p className="hidden sm:block text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Assign classes, subjects and timetable</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (visible on md and below) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {academicYears.map((year: any) => (
              <Card key={year.id} className="p-4 border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                {year.isCurrent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                )}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{year.name}</span>
                      {year.isCurrent && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] px-1.5 py-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                      {formatSessionDate(year.startDate)} - {formatSessionDate(year.endDate)}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 -mr-1">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleOpenDialog(year)}>
                        <Edit2 className="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSetCurrent(year.id)} disabled={year.isCurrent}>
                        <CheckCircle2 className="size-4 mr-2" />
                        Make Current
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(year.id)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <Badge variant={year.status === "active" ? "default" : "secondary"} className={`text-[11px] capitalize ${year.status === "active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}>
                    {year.status}
                  </Badge>
                  {!year.isCurrent ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSetCurrent(year.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-blue-600"
                    >
                      Set as Current
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Active Session
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table (hidden on mobile, visible md and up) */}
          <Card className="hidden md:block overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Table>
              <TableHeader className="bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Session Name</TableHead>
                  <TableHead className="font-semibold">Start Date</TableHead>
                  <TableHead className="font-semibold">End Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Current</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicYears.map((year: any) => (
                  <TableRow key={year.id} className="hover:bg-transparent transition-colors">
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell suppressHydrationWarning>{formatSessionDate(year.startDate)}</TableCell>
                    <TableCell suppressHydrationWarning>{formatSessionDate(year.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant={year.status === "active" ? "default" : "secondary"} className={year.status === "active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                        {year.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {year.isCurrent ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                          <CheckCircle2 className="size-4" />
                          <span>Current</span>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSetCurrent(year.id)}
                          className="text-xs text-muted-foreground hover:text-blue-600"
                        >
                          Set as Current
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleOpenDialog(year)}>
                            <Edit2 className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetCurrent(year.id)} disabled={year.isCurrent}>
                            <CheckCircle2 className="size-4 mr-2" />
                            Make Current
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(year.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
