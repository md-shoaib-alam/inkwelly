"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Link as LinkIcon, Eye, MoreVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { avatarColors } from "../teachers/types";
import type { ParentInfo } from "./types";

interface ParentsTableViewProps {
  parents: ParentInfo[];
  onEdit: (p: ParentInfo) => void;
  onDelete: (id: string) => void;
  onLinkOpen: (p: ParentInfo) => void;
  onView: (p: ParentInfo) => void;
}

export function ParentsTableView({
  parents,
  onEdit,
  onDelete,
  onLinkOpen,
  onView,
}: ParentsTableViewProps) {
  return (
    <Card className="shadow-sm border-0 overflow-hidden mb-4">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-3 sm:px-6 py-4">Parent</th>
                <th className="px-3 sm:px-6 py-4 hidden sm:table-cell">Children</th>
                <th className="px-3 sm:px-6 py-4 hidden lg:table-cell">Occupation</th>
                <th className="px-3 sm:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {parents.map((parent, index) => {
                const initials = parent.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const color = avatarColors[index % avatarColors.length];
                return (
                  <tr 
                    key={parent.id} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    onClick={() => onView(parent)}
                  >
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className={`${color} text-white text-[10px] font-bold`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{parent.name}</span>
                          {parent.username && (
                            <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono">ID: {parent.username}</span>
                          )}
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{parent.email}</span>
                          <div className="sm:hidden flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">
                              {parent.children.length} {parent.children.length === 1 ? 'Child' : 'Children'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {parent.children.map((child) => (
                          <Badge key={child.id} variant="secondary" className="text-[10px] py-0">
                            {child.name}
                          </Badge>
                        ))}
                        {parent.children.length === 0 && <span className="text-xs text-zinc-400 italic">None linked</span>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell text-zinc-600 dark:text-zinc-400 font-medium">
                      {parent.occupation || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Desktop Actions (xl and above) */}
                        <div className="hidden xl:flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-zinc-400 hover:text-emerald-600 shrink-0"
                            onClick={() => onView(parent)}
                            title="View Details"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 sm:w-auto gap-1 sm:gap-2 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 p-0 sm:px-3 shrink-0"
                            onClick={() => onLinkOpen(parent)}
                            title="Link Child"
                          >
                            <LinkIcon className="size-3.5" />
                            <span className="hidden sm:inline">Link</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-emerald-600 shrink-0" onClick={() => onEdit(parent)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-red-600 shrink-0" title="Delete">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{parent.name}</strong> and remove their access to the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => { e.stopPropagation(); onDelete(parent.id); }}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete Parent
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Mobile/Tablet Actions (below xl) */}
                        <div className="xl:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => onLinkOpen(parent)} className="cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                <span>Link Child</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onView(parent)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(parent)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit Parent</span>
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <div 
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Record</span>
                                  </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete <strong>{parent.name}</strong> and remove their access to the system.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(parent.id);
                                      }}
                                    >
                                      Delete Parent
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
