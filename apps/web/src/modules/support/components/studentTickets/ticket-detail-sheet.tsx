import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  TicketDetail,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  ROLE_COLORS,
  getInitials,
  formatDate,
  formatDateTime,
  getCategoryLabel,
} from "./types";

interface TicketDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: TicketDetail | null;
  loading: boolean;
  currentUserId?: string;
  onSendReply: (message: string) => Promise<void>;
}

export function TicketDetailSheet({
  open,
  onOpenChange,
  ticket,
  loading,
  currentUserId,
  onSendReply,
}: TicketDetailSheetProps) {
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;
    setSendingReply(true);
    try {
      await onSendReply(replyMessage.trim());
      setReplyMessage("");
    } finally {
      setSendingReply(false);
    }
  };

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
            <Loader2 className="size-8 animate-spin text-violet-500" />
          </div>
        ) : ticket ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Ticket Info */}
            <div className="p-4 space-y-3 border-b">
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

              {ticket.assignee && (
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Assigned to:
                  </span>
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[9px] bg-violet-100 text-violet-700">
                      {getInitials(ticket.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {ticket.assignee.name}
                  </span>
                </div>
              )}

              <Separator />
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
                        Our team will review your ticket soon
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
                          {msg.author?.id === currentUserId && (
                            <span className="text-[9px] text-violet-500 font-medium">
                              (You)
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
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
                          handleReplySubmit();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      Press Ctrl+Enter to send
                    </span>
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={handleReplySubmit}
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
