import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from "sonner";
import type { FeeCategory, FeeStructure, FeeConcession, FeeReceipt, FeeItem } from '@/components/screens/admin/fees/types';

// ── Categories ─────────────────────────────────────────────────────────────

export function useFeeCategories(mode?: 'min') {
  return useQuery<FeeCategory[]>({
    queryKey: ['fee-categories', mode],
    queryFn: () => api.get('/fee-categories', { params: { mode } })
  });
}

export function useCreateFeeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any, FeeCategory>('/fee-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-categories'] });
      toast.success('Fee category created!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create category')
  });
}

// ── Structures ─────────────────────────────────────────────────────────────

export function useFeeStructures() {
  return useQuery<FeeStructure[]>({
    queryKey: ['fee-structures'],
    queryFn: () => api.get('/fee-structures')
  });
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any, FeeStructure>('/fee-structures', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      toast.success('Fee structure added!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add structure')
  });
}

// ── Concessions ────────────────────────────────────────────────────────────

export function useFeeConcessions(studentId?: string) {
  return useQuery<FeeConcession[]>({
    queryKey: ['fee-concessions', studentId],
    queryFn: () => api.get('/fee-concessions', { params: { studentId } })
  });
}

export function useCreateFeeConcession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any, FeeConcession>('/fee-concessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-concessions'] });
      toast.success('Concession added successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add concession')
  });
}

// ── Receipts & Payments ────────────────────────────────────────────────────

export function useFeeReceipts(options: { 
  studentId?: string; 
  classId?: string;
  search?: string; 
  fromDate?: string; 
  toDate?: string; 
  page?: number; 
  limit?: number; 
  mode?: string;
} = {}) {
  return useQuery<{ items: any[]; total: number; totalPages: number }>({
    queryKey: ['fee-receipts', options],
    queryFn: () => api.get('/fee-receipts', { params: options })
  });
}

export function useCreateFeeReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any, FeeReceipt>('/fee-receipts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Payment processed successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Payment failed')
  });
}

// ── Assignment ─────────────────────────────────────────────────────────────

export interface FeeAssignmentData {
  students: {
    id: string;
    name: string;
    rollNumber: string;
    isAssigned: boolean;
    isPaid: boolean;
    hasTransport: boolean;
  }[];
  totalStudents: number;
  assignedCount: number;
  paidCount: number;
}

export function useFeeAssignment(classId: string, feeCategoryId: string, academicYear: string) {
  return useQuery<FeeAssignmentData>({
    queryKey: ['fee-assign', classId, feeCategoryId, academicYear],
    queryFn: () => api.get('/fee-assign', { params: { classId, feeCategoryId, academicYear } }),
    enabled: !!classId && !!feeCategoryId && !!academicYear
  });
}

function useExecuteFeeAssign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any, any>('/fee-assign', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-assign'] });
      toast.success('Fee assignment updated!');
    },
    onError: (err: any) => toast.error(err.message || 'Assignment failed')
  });
}
