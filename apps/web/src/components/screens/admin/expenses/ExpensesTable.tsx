"use client";

import { Download, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

function formatExpenseDate(dateStr: string) {
  return format(new Date(dateStr), "MMM dd, yyyy");
}

interface ExpensesTableProps {
  expenses: any[];
  categories: any[];
  isLoading: boolean;
  filters: {
    page: number;
    limit: number;
    categoryId: string | null;
    status: string | null;
  };
  onFilterChange: (filters: any) => void;
  onEdit: (expense: any) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}

export function ExpensesTable({
  expenses,
  categories,
  isLoading,
  filters,
  onFilterChange,
  onEdit,
  onDelete,
  onExport
}: ExpensesTableProps) {
  return (
    <Card className="overflow-hidden border-rose-100 dark:border-rose-900/30 shadow-md">
      <div className="p-4 border-b bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select 
            value={filters.categoryId || "all"} 
            onValueChange={v => onFilterChange({ ...filters, categoryId: v === 'all' ? null : v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.status || "all"} 
            onValueChange={v => onFilterChange({ ...filters, status: v === 'all' ? null : v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableHead className="pl-6">Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                Loading expenses...
              </TableCell>
            </TableRow>
          ) : expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                No expenses recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((e: any) => (
              <TableRow key={e.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/10">
                <TableCell className="font-medium pl-6" suppressHydrationWarning>
                  {formatExpenseDate(e.date)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal border-rose-200 text-rose-700 bg-rose-50/50">
                    {e.category.name}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                <TableCell className="capitalize text-xs text-muted-foreground">
                  {e.paymentMethod}
                </TableCell>
                <TableCell className="font-bold">₹{e.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={e.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}>
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(e)}>
                        <Edit2 className="size-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(e.id)} 
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="size-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
