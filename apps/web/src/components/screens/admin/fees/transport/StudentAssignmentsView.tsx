"use client";
 
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, UserPlus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/shared/pagination";
 
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterX, Eye } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface StudentAssignmentsViewProps {
  loadingAssignments: boolean;
  assignments: any[];
  onAssignClick: () => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isDeleting: boolean;
  selectedRouteId: string | null;
  onRouteFilterChange: (routeId: string | null) => void;
  routes: any[];
  onEditAssignment: (assignment: any) => void;
}

export function StudentAssignmentsView({
  loadingAssignments,
  assignments,
  onAssignClick,
  onDelete,
  deletingId,
  isDeleting,
  selectedRouteId,
  onRouteFilterChange,
  routes,
  onEditAssignment,
}: StudentAssignmentsViewProps) {
  const router = useRouter();
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const filteredAssignments = selectedRouteId
    ? assignments.filter((a) => (a.route?.id || a.routeId) === selectedRouteId)
    : assignments;

  const totalItems = filteredAssignments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const activePage = currentPage > totalPages ? Math.max(1, totalPages) : currentPage;

  const paginatedAssignments = filteredAssignments.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );
 
   return (
     <Card>
       <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            Student Transport List
          </CardTitle>
          <CardDescription>Students subscribed to transport services</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedRouteId || "all"} 
            onValueChange={(val) => onRouteFilterChange(val === "all" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs bg-background">
              <SelectValue placeholder="Filter by Route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              {routes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedRouteId && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => onRouteFilterChange(null)}
              title="Clear Filter"
            >
              <FilterX className="size-4" />
            </Button>
          )}

          <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600" onClick={onAssignClick}>
            <UserPlus className="size-3.5" />
            Assign Student
          </Button>
        </div>
      </CardHeader>
       <CardContent className="p-0">
         {loadingAssignments ? (
           <div className="p-6 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
         ) : (
           <>
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="pl-6 h-12">Student</TableHead>
                     <TableHead className="h-12">Class</TableHead>
                     <TableHead className="h-12">Route</TableHead>
                     <TableHead className="h-12">Start Date</TableHead>
                     <TableHead className="text-right h-12 pr-6">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {paginatedAssignments.length === 0 ? (
                     <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No students assigned to transport</TableCell></TableRow>
                   ) : paginatedAssignments.map((a: any) => (
                     <TableRow key={a.id}>
                       <TableCell className="pl-6 py-4 font-medium text-sm">{a.student?.user?.name || a.studentName || 'Unknown Student'}</TableCell>
                       <TableCell className="py-4 text-xs text-muted-foreground">{a.student?.class?.name}-{a.student?.class?.section || 'N/A'}</TableCell>
                       <TableCell className="py-4 text-sm">{a.route?.name || 'Unknown Route'}</TableCell>
                       <TableCell className="py-4 text-xs">{a.startDate}</TableCell>
                       <TableCell className="py-4 text-right pr-6 flex items-center justify-end gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           className="border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 h-8 font-medium"
                           onClick={() => onEditAssignment(a)}
                         >
                           Edit
                         </Button>

                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 font-medium"
                               disabled={isDeleting}
                             >
                               {isDeleting && deletingId === a.id ? 'Removing...' : 'Remove'}
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to remove transport assignment for {a.student?.user?.name || 'this student'}? This action cannot be undone.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction 
                                 onClick={() => onDelete(a.id)}
                                 className="bg-red-600 hover:bg-red-700 text-white"
                               >
                                 Remove
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
 
             {totalItems > 0 && (
               <div className="px-6 pb-4">
                 <Pagination
                   currentPage={activePage}
                   totalPages={totalPages}
                   totalItems={totalItems}
                   itemsPerPage={itemsPerPage}
                   onPageChange={setCurrentPage}
                   onLimitChange={setItemsPerPage}
                 />
               </div>
             )}
           </>
         )}
       </CardContent>
     </Card>
   );
 }
