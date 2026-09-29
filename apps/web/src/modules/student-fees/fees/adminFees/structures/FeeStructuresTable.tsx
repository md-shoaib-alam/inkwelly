"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Layers, Users, Pencil, Trash2 } from "lucide-react";
import type { FeeStructure } from "../types";

interface FeeStructuresTableProps {
  loading: boolean;
  filtered: FeeStructure[];
  canEdit: boolean;
  canDelete: boolean;
  onAssign: (s: FeeStructure) => void;
  onEdit: (s: FeeStructure) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}

export function FeeStructuresTable({
  loading,
  filtered,
  canEdit,
  canDelete,
  onAssign,
  onEdit,
  onDelete,
  deleting,
}: FeeStructuresTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fee Structures</CardTitle>
        <CardDescription>{filtered.length} structures found</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 h-12">Category</TableHead>
                  <TableHead className="h-12">Class</TableHead>
                  <TableHead className="hidden sm:table-cell h-12">Amount</TableHead>
                  <TableHead className="hidden md:table-cell h-12">Academic Year</TableHead>
                  <TableHead className="text-center h-12">Assign</TableHead>
                  {(canEdit || canDelete) && <TableHead className="w-28 text-center h-12">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Layers className="size-10 mx-auto mb-2 opacity-30" />
                      <p>No fee structures found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(s => (
                    <TableRow key={s.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{s.feeCategoryName}</span>
                          <span className="text-xs text-muted-foreground">({s.feeCategoryCode})</span>
                          {s.feeCategoryStatus === 'inactive' && (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-0 h-5 px-1.5 text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="font-normal">{s.className}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-semibold text-emerald-600 dark:text-emerald-400 py-4">₹{s.amount.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-4">{s.academicYear}</TableCell>
                      <TableCell className="text-center py-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2 text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed" 
                          onClick={() => onAssign(s)}
                          disabled={s.feeCategoryStatus === 'inactive'}
                          title={s.feeCategoryStatus === 'inactive' ? 'Cannot assign fees under inactive category' : 'Assign to students'}
                        >
                          <Users className="size-3.5" />
                          <span className="hidden sm:inline">Assign</span>
                        </Button>
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && <Button variant="ghost" size="icon" className="size-7 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => onEdit(s)}><Pencil className="size-3.5" /></Button>}
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="size-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
                                    <AlertDialogDescription>Delete the {s.feeCategoryName} structure for {s.className}? This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(s.id)} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
