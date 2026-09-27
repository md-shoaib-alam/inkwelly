"use client";

import { useState, useReducer, useRef } from "react";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/use-expenses";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatLocalDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CategoryDialog } from "./expenses/CategoryDialog";
import { ExpenseDialog } from "./expenses/ExpenseDialog";
import { StatsCards } from "./expenses/StatsCards";
import { ExpensesTable } from "./expenses/ExpensesTable";

interface FilterState {
  page: number;
  limit: number;
  categoryId: string | null;
  status: string | null;
}

interface ExpenseState {
  filters: FilterState;
  isExpenseDialogOpen: boolean;
  isCategoryDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  editingExpense: any | null;
}

type ExpenseAction =
  | { type: "SET_FILTERS"; filters: FilterState }
  | { type: "SET_EXPENSE_DIALOG"; open: boolean; expense?: any }
  | { type: "SET_CATEGORY_DIALOG"; open: boolean }
  | { type: "SET_DELETE_DIALOG"; open: boolean };

function expenseReducer(state: ExpenseState, action: ExpenseAction): ExpenseState {
  switch (action.type) {
    case "SET_FILTERS":
      return { ...state, filters: action.filters };
    case "SET_EXPENSE_DIALOG":
      return {
        ...state,
        isExpenseDialogOpen: action.open,
        editingExpense: action.expense ?? null,
      };
    case "SET_CATEGORY_DIALOG":
      return { ...state, isCategoryDialogOpen: action.open };
    case "SET_DELETE_DIALOG":
      return { ...state, isDeleteDialogOpen: action.open };
    default:
      return state;
  }
}

const initialState: ExpenseState = {
  filters: { page: 1, limit: 10, categoryId: null, status: null },
  isExpenseDialogOpen: false,
  isCategoryDialogOpen: false,
  isDeleteDialogOpen: false,
  editingExpense: null,
};

export function ExpensesScreen() {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const {
    filters,
    isExpenseDialogOpen,
    isCategoryDialogOpen,
    isDeleteDialogOpen,
    editingExpense,
  } = state;

  const expenseToDeleteRef = useRef<string | null>(null);

  const {
    expenses,
    categories,
    stats,
    isLoading,
    createCategory,
    createExpense,
    updateExpense,
    deleteExpense,
    isCreatingExpense,
    isCreatingCategory,
  } = useExpenses(filters);

  const handleOpenExpense = (expense: any = null) => {
    dispatch({ type: "SET_EXPENSE_DIALOG", open: true, expense });
  };

  const handleExpenseSubmit = async (form: any) => {
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
      };
      if (editingExpense) {
        await updateExpense({ id: editingExpense.id, input: payload });
        toast.success("Expense updated successfully");
      } else {
        await createExpense(payload);
        toast.success("Expense added successfully");
      }
      dispatch({ type: "SET_EXPENSE_DIALOG", open: false });
    } catch (err) {
      toast.error("Failed to save expense");
    }
  };

  const handleCategorySubmit = async (form: {
    name: string;
    description: string;
  }) => {
    try {
      await createCategory(form);
      toast.success("Category added successfully");
      dispatch({ type: "SET_CATEGORY_DIALOG", open: false });
    } catch (err) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteExpense = (id: string) => {
    expenseToDeleteRef.current = id;
    dispatch({ type: "SET_DELETE_DIALOG", open: true });
  };

  const confirmDeleteExpense = async () => {
    const id = expenseToDeleteRef.current;
    if (!id) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch (err) {
      toast.error("Failed to delete expense");
    } finally {
      dispatch({ type: "SET_DELETE_DIALOG", open: false });
      expenseToDeleteRef.current = null;
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiFetch("/api/exports?type=expenses", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses_${formatLocalDate(new Date())}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Expenses exported to Excel successfully");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Wallet className="size-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Expenses
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage school expenditures and categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CategoryDialog
            open={isCategoryDialogOpen}
            onOpenChange={(open) => dispatch({ type: "SET_CATEGORY_DIALOG", open })}
            onSubmit={handleCategorySubmit}
            isCreating={isCreatingCategory}
          />

          <Button
            onClick={() => handleOpenExpense()}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20"
          >
            <Plus className="size-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters & Table */}
      <ExpensesTable
        expenses={expenses}
        categories={categories}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={(f: FilterState) => dispatch({ type: "SET_FILTERS", filters: f })}
        onEdit={handleOpenExpense}
        onDelete={handleDeleteExpense}
        onExport={handleExport}
      />

      {/* Expense Modal */}
      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={(open) => dispatch({ type: "SET_EXPENSE_DIALOG", open })}
        editingExpense={editingExpense}
        categories={categories}
        onSubmit={handleExpenseSubmit}
        isSaving={isCreatingExpense}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => dispatch({ type: "SET_DELETE_DIALOG", open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              expense record from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
