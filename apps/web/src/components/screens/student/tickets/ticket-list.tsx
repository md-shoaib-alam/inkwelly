import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Tag, Clock, Eye, Ticket } from "lucide-react";
import {
  TicketItem,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  getCategoryLabel,
  formatDate,
} from "./types";

interface TicketListProps {
  tickets: TicketItem[];
  onOpenDetail: (ticketId: string) => void;
}

export function TicketList({ tickets, onOpenDetail }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-16 text-center">
          <Ticket className="size-12 mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            No tickets yet
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Submit a ticket if you need help from the school
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-zinc-100 dark:border-zinc-800"
          onClick={() => onOpenDetail(ticket.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                    {ticket.title}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
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
                    className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    {getCategoryLabel(ticket.category)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {ticket._count.messages} message
                      {ticket._count.messages !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" />
                      {getCategoryLabel(ticket.category)}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(ticket.id);
                }}
              >
                <Eye className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
