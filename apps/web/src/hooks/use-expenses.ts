import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlQuery, graphqlMutate } from '@/lib/graphql/core';

const GET_EXPENSE_CATEGORIES = `
  query GetExpenseCategories {
    expenseCategories {
      id
      name
      description
    }
  }
`;

const GET_EXPENSES = `
  query GetExpenses($categoryId: String, $status: String, $page: Int, $limit: Int) {
    expenses(categoryId: $categoryId, status: $status, page: $page, limit: $limit) {
      items {
        id
        amount
        date
        description
        paymentMethod
        referenceNo
        status
        category {
          id
          name
        }
      }
      total
      page
      totalPages
    }
  }
`;

const GET_EXPENSE_STATS = `
  query GetExpenseStats {
    expenseStats {
      totalExpenses
      thisMonthExpenses
      prevMonthExpenses
      categoryWiseExpenses {
        categoryId
        categoryName
        amount
      }
    }
  }
`;

const CREATE_EXPENSE_CATEGORY = `
  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {
    createExpenseCategory(input: $input) {
      id
      name
    }
  }
`;

const CREATE_EXPENSE = `
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
      amount
    }
  }
`;

const UPDATE_EXPENSE = `
  mutation UpdateExpense($id: String!, $input: CreateExpenseInput!) {
    updateExpense(id: $id, input: $input) {
      id
      amount
    }
  }
`;

const DELETE_EXPENSE = `
  mutation DeleteExpense($id: String!) {
    deleteExpense(id: $id)
  }
`;

export function useExpenses(filters: any = {}) {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => graphqlQuery<{ expenseCategories: any[] }>(GET_EXPENSE_CATEGORIES),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => graphqlQuery<{ expenses: { items: any[]; total: number; page: number; totalPages: number } }>(GET_EXPENSES, filters),
  });

  const statsQuery = useQuery({
    queryKey: ['expense-stats'],
    queryFn: () => graphqlQuery<{ expenseStats: any }>(GET_EXPENSE_STATS),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (input: any) => graphqlMutate(CREATE_EXPENSE_CATEGORY, { input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense-categories'] }),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (input: any) => graphqlMutate(CREATE_EXPENSE, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      graphqlMutate(UPDATE_EXPENSE, { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => graphqlMutate(DELETE_EXPENSE, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    },
  });

  return {
    categories: categoriesQuery.data?.expenseCategories || [],
    expenses: expensesQuery.data?.expenses?.items || [],
    pagination: {
      total: expensesQuery.data?.expenses?.total || 0,
      page: expensesQuery.data?.expenses?.page || 1,
      totalPages: expensesQuery.data?.expenses?.totalPages || 1,
    },
    stats: statsQuery.data?.expenseStats,
    isLoading: categoriesQuery.isLoading || expensesQuery.isLoading || statsQuery.isLoading,
    createCategory: createCategoryMutation.mutateAsync,
    createExpense: createExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    isCreatingExpense: createExpenseMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
  };
}
