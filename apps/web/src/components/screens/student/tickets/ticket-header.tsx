import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock } from "lucide-react";

interface TicketHeaderProps {
  totalCount: number;
  openCount: number;
  onNewClick: () => void;
}

export function TicketHeader({ totalCount, openCount, onNewClick }: TicketHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            My Tickets
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {totalCount} ticket{totalCount !== 1 ? "s" : ""}
            {openCount > 0 ? ` - ${openCount} active` : ""}
          </p>
        </div>
        {openCount > 0 && (
          <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 gap-1">
            <Clock className="size-3" />
            {openCount} Active
          </Badge>
        )}
      </div>
      <Button
        className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        onClick={onNewClick}
      >
        <Plus className="size-4 mr-2" />
        New Ticket
      </Button>
    </div>
  );
}
