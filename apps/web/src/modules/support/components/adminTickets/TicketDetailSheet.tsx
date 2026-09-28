"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  ROLE_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  TICKET_STATUSES,
} from "./constants";
import { formatDate, formatDateTime, getCategoryLabel, getInitials } from "./helpers";
import type { StaffMember, TicketDetail } from "./types";

interface TicketDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: TicketDetail | null;
  loading: boolean;
  staffList: StaffMember[];
  editStatus: string;
  setEditStatus: (v: string) => void;
  editPriority: string;
  setEditPriority: (v: string) => void;
  editAssignee: string;
  setEditAssignee: (v: string) => void;
  updatingTicket: boolean;
  onUpdateTicket: () => void;
  replyMessage: string;
  setReplyMessage: (v: string) => void;
  sendingReply: boolean;
  onReply: () => void;
}

export function TicketDetailSheet({
  open,
  onOpenChange,
  ticket,
  loading,
  staffList,
  editStatus,
  setEditStatus,
  editPriority,
  setEditPriority,
  editAssignee,
  setEditAssignee,
  updatingTicket,
  onUpdateTicket,
  replyMessage,
  setReplyMessage,
  sendingReply,
  onReply,
}: TicketDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>Ticket Details</SheetTitle>
          <SheetDescription>
            {ticket
              ? `#${ticket.id.slice(-6).toUpperCase()} - ${formatDate(ticket.createdAt)}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-emerald-500" />
          </div>
        ) : ticket ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Ticket Info */}
            <div className="p-4 space-y-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {ticket.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${STATUS_COLORS[ticket.status] || ""}`}
                >
                  {STATUS_LABELS[ticket.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${PRIORITY_COLORS[ticket.priority] || ""}`}
                >
                  {PRIORITY_LABELS[ticket.priority]}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  {getCategoryLabel(ticket.category)}
                </Badge>
              </div>

              {/* Admin Edit Controls */}
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Admin Controls
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TICKET_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Priority</Label>
                    <Select
                      value={editPriority}
                      onValueChange={setEditPriority}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Assignee</Label>
                    <Select
                      value={editAssignee}
                      onValueChange={setEditAssignee}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staffList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onUpdateTicket}
                  disabled={updatingTicket}
                >
                  {updatingTicket && (
                    <Loader2 className="size-3.5 mr-1 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="px-4 py-2 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Conversation ({ticket.messages?.length || 0} messages)
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {(!ticket.messages || ticket.messages.length === 0) && (
                    <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                      <MessageSquare className="size-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">
                        Start the conversation with a reply
                      </p>
                    </div>
                  )}
                  {ticket.messages?.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="size-8 shrink-0 mt-0.5">
                        <AvatarFallback
                          className={`text-[10px] ${
                            ROLE_COLORS[msg.author?.role || "student"] ||
                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {msg.author ? getInitials(msg.author.name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {msg.author?.name || "Unknown"}
                          </span>
                          {msg.author?.role && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                ROLE_COLORS[msg.author.role] || ""
                              }`}
                            >
                              {msg.author.role}
                            </Badge>
                          )}
                          <span className="text-[11px] text-zinc-400">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              {ticket.status !== "closed" && (
                <div className="p-4 border-t bg-white dark:bg-zinc-900">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[60px] max-h-[120px] resize-none text-sm"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          onReply();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-zinc-400">
                      Press Ctrl+Enter to send
                    </span>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={onReply}
                      disabled={sendingReply || !replyMessage.trim()}
                    >
                      {sendingReply ? (
                        <Loader2 className="size-3.5 mr-1 animate-spin" />
                      ) : (
                        <Send className="size-3.5 mr-1" />
                      )}
                      Reply
                    </Button>
                  </div>
                </div>
              )}

              {ticket.status === "closed" && (
                <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-900">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    This ticket is closed. No further replies can be sent.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
