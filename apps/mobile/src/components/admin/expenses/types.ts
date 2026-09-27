import { api } from '@/lib/api';

export interface CategoryInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ExpenseInfo {
  id: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: string;
  referenceNo?: string;
  status: 'paid' | 'pending' | 'draft';
  category: {
    id: string;
    name: string;
  };
}

export interface ExpenseStats {
  totalExpenses: number;
  thisMonthExpenses: number;
  prevMonthExpenses?: number;
  categoryWiseExpenses: {
    categoryId: string;
    categoryName: string;
    amount: number;
  }[];
}

export const executeGraphQL = async (query: string, variables: any = {}) => {
  const res = (await api.post('/graphql', { query, variables })) as any;
  if (res.errors && res.errors.length > 0) {
    throw new Error(res.errors[0].message || 'GraphQL Error');
  }
  return res.data;
};
