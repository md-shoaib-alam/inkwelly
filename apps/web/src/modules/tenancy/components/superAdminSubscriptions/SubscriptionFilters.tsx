import { Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function SubscriptionFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SubscriptionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      {/* Full-width search — always on its own row on mobile */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by parent name, email or transaction ID..."
          className="pl-9 h-9 text-xs rounded-lg border bg-background placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Status + Export — same row on mobile, inline on desktop */}
      <div className="flex gap-2 items-center">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="flex-1 sm:w-[140px] h-9 text-xs rounded-lg">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="active" className="text-xs">Active</SelectItem>
            <SelectItem value="none" className="text-xs">No Plan</SelectItem>
            <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
            <SelectItem value="expired" className="text-xs">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="h-9 px-4 text-xs font-medium rounded-lg gap-1.5 shrink-0"
        >
          <Download className="size-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}
