"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  Mail,
  Phone,
  Briefcase,
  Baby,
  Pencil,
  Link as LinkIcon,
  Trash2,
  GraduationCap,
  Unlink,
  Link2,
} from "lucide-react";
import { ParentInfo, getAvatarColor, getInitials } from "./types";

interface ParentCardProps {
  parent: ParentInfo;
  linking: boolean;
  onEdit: (parent: ParentInfo) => void;
  onDelete: (id: string) => void;
  onLinkOpen: (parent: ParentInfo) => void;
  onUnlinkChild: (parentId: string, childId: string) => void;
  onView: (parent: ParentInfo) => void;
}

export function ParentCard({
  parent,
  linking,
  onEdit,
  onDelete,
  onLinkOpen,
  onUnlinkChild,
  onView,
}: ParentCardProps) {
  return (
    <Card 
      className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-800/50 cursor-pointer"
      onClick={() => onView(parent)}
    >
      <CardContent className="p-5">
        {/* Parent Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback
                className={`${getAvatarColor(parent.name)} text-white text-sm font-semibold`}
              >
                {getInitials(parent.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate" title={parent.name}>
                {parent.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <Mail className="size-3 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate block flex-1 min-w-0" title={parent.email}>
                  {parent.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(parent);
              }}
              title="Edit"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onLinkOpen(parent);
              }}
              title="Link Child"
            >
              <LinkIcon className="size-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/40"
                  title="Delete"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Parent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {parent.name}? Their
                    children will be unlinked but not deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(parent.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Parent Details */}
        <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-300 mb-4">
          {parent.phone && (
            <span className="flex items-center gap-1">
              <Phone className="size-3" /> {parent.phone}
            </span>
          )}
          {parent.occupation && (
            <span className="flex items-center gap-1">
              <Briefcase className="size-3" /> {parent.occupation}
            </span>
          )}
        </div>

        {/* Children */}
        <Separator className="mb-3" />
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
              <Baby className="size-3" /> Children ({parent.children.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7.5 text-[10px] sm:text-[11px] border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 rounded-md shrink-0 gap-1.5 font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                onLinkOpen(parent);
              }}
            >
              <LinkIcon className="size-3" />
              <span>Link Child</span>
            </Button>
          </div>

          {parent.children.length === 0 ? (
            <div 
              className="text-center py-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <GraduationCap className="size-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No children linked yet
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkOpen(parent);
                }}
              >
                <Link2 className="size-3 mr-1" /> Link a Child
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {parent.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {child.gender === "male" ? "👦" : "👧"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {child.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {child.className} • Roll {child.rollNumber}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-rose-600/80 hover:text-rose-900 hover:bg-rose-100/50 dark:text-rose-400/80 dark:hover:text-rose-200 dark:hover:bg-rose-950/40 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlinkChild(parent.id, child.id);
                    }}
                    disabled={linking}
                    title="Unlink"
                  >
                    <Unlink className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
